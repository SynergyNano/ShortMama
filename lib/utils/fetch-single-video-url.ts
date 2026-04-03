import { fetchPostWithRetry, fetchGetWithRetry } from '@/lib/utils/fetch-with-retry';

/**
 * Clockworks TikTok Scraper — pay-per-result (e.g. from $3/1k results on store).
 * Single post: postURLs. Docs: https://apify.com/clockworks/tiktok-scraper
 */
const DEFAULT_TIKTOK_DOWNLOAD_ACTOR_ID = 'clockworks~tiktok-scraper';

function getTiktokDownloadActorId(): string {
  return (
    process.env.APIFY_TIKTOK_DOWNLOAD_ACTOR_ID?.trim() ||
    DEFAULT_TIKTOK_DOWNLOAD_ACTOR_ID
  );
}

interface SingleVideoResult {
  videoUrl?: string;
  webVideoUrl?: string;
  platform: 'tiktok' | 'douyin';
  error?: string;
}

function tiktokVideoPathHint(url: string): string {
  try {
    return new URL(url.trim()).pathname.replace(/\/+$/, '').toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

function pickClockworksRowForUrl(
  rows: Record<string, unknown>[],
  webVideoUrl: string
): Record<string, unknown> | undefined {
  if (rows.length === 0) return undefined;
  if (rows.length === 1) return rows[0];
  const hint = tiktokVideoPathHint(webVideoUrl);
  const match = rows.find((row) => {
    const r = row as Record<string, unknown>;
    const candidates = [r.webVideoUrl, r.submittedVideoUrl, r.inputUrl].filter(
      (u): u is string => typeof u === 'string'
    );
    return candidates.some((u) => tiktokVideoPathHint(u) === hint);
  });
  return match ?? rows[0];
}

/**
 * Clockworks dataset row → direct MP4/CDN URL (and legacy epctex-style fields).
 */
function extractPlayableUrlFromItem(item: Record<string, unknown>): string | undefined {
  const r = item as Record<string, unknown>;

  const candidates: unknown[] = [
    r.videoUrl,
    r.videourl,
    r.downloadUrl,
    r.downloadAddress,
  ];

  if (Array.isArray(r.mediaUrls)) {
    for (const u of r.mediaUrls) {
      candidates.push(u);
    }
  }

  // 주의: videoMeta.subtitleLinks는 VTT/자막 트랙일 수 있어
  // "videoUrl(=MP4/CDN URL)" 후보로 섞으면 WEBVTT 같은 비디오가 아닌 URL이 선택될 수 있습니다.

  const isHttp = (c: unknown): c is string =>
    typeof c === 'string' && c.startsWith('http');

  for (const c of candidates) {
    if (!isHttp(c)) continue;
    if (c.includes('mime_type=video_mp4') || c.includes('/video/tos/')) return c;
  }

  for (const c of candidates) {
    if (isHttp(c)) return c;
  }

  return undefined;
}

/**
 * Resolve a playable CDN URL for a TikTok post page (Apify actor).
 *
 * @param webVideoUrl - The web page URL (e.g., https://www.tiktok.com/@user/video/123456)
 * @param platform - The platform (tiktok, douyin)
 * @param apiKey - API key
 * @returns Object with videoUrl (CDN URL) or error
 */
export async function fetchSingleVideoUrl(
  webVideoUrl: string,
  platform: 'tiktok' | 'douyin',
  apiKey: string
): Promise<SingleVideoResult> {
  if (!apiKey) {
    return { platform, error: 'APIFY_API_KEY not configured' };
  }

  try {
    console.log(`[fetchSingleVideoUrl] Fetching ${platform} video from URL:`, webVideoUrl);

    if (platform !== 'tiktok') {
      return { platform, webVideoUrl, error: `${platform}은 단일 영상 URL 조회를 지원하지 않습니다.` };
    }

    const actorId = getTiktokDownloadActorId();
    console.log(`[fetchSingleVideoUrl] Using actor ${actorId} (postURLs)`);

    const runRes = await fetchPostWithRetry(
      `https://api.apify.com/v2/acts/${actorId}/runs?token=${apiKey}`,
      {
        postURLs: [webVideoUrl],
        scrapeRelatedVideos: false,
        // videoUrl(MP4/CDN)을 안정적으로 얻기 위해 다운로드 활성화
        shouldDownloadVideos: true,
        shouldDownloadCovers: false,
        shouldDownloadSlideshowImages: false,
        shouldDownloadAvatars: false,
        shouldDownloadMusicCovers: false,
        downloadSubtitlesOptions: 'NEVER_DOWNLOAD_SUBTITLES',
        proxyCountryCode: 'None',
      },
      {},
      { maxRetries: 3, initialDelayMs: 1000 }
    );

    const runData = await runRes.json();
    if (!runRes.ok) {
      console.error(
        `[fetchSingleVideoUrl] Actor run failed: ${runRes.status} ${JSON.stringify(runData)}`
      );
      return { platform, webVideoUrl, error: `비디오 다운로드 링크를 가져올 수 없습니다.` };
    }

    const runId = runData.data.id;
    console.log(`[fetchSingleVideoUrl] Actor run started: ${runId}`);

    let status = 'RUNNING';
    let attempt = 0;
    const maxAttempts = 120;
    let waitTime = 500;
    const maxWaitTime = 5000;

    while ((status === 'RUNNING' || status === 'READY') && attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, waitTime));

      const statusRes = await fetchGetWithRetry(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${apiKey}`,
        {},
        { maxRetries: 3, initialDelayMs: 1000 }
      );

      const statusData = await statusRes.json();
      status = statusData.data.status;
      attempt++;

      if (status === 'SUCCEEDED') break;
      if (status === 'FAILED' || status === 'ABORTED') {
        console.error(`[fetchSingleVideoUrl] Actor run failed: ${status}`);
        return { platform, webVideoUrl, error: `비디오 다운로드에 실패했습니다.` };
      }

      waitTime = Math.min(waitTime * 1.5, maxWaitTime);
    }

    if (status !== 'SUCCEEDED') {
      console.error(`[fetchSingleVideoUrl] Actor run timeout`);
      return { platform, webVideoUrl, error: `비디오 처리 시간 초과` };
    }

    const datasetRes = await fetchGetWithRetry(
      `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apiKey}`,
      {},
      { maxRetries: 3, initialDelayMs: 1000 }
    );

    if (!datasetRes.ok) {
      console.error(`[fetchSingleVideoUrl] Dataset fetch failed: ${datasetRes.status}`);
      return { platform, webVideoUrl, error: `비디오 정보를 가져올 수 없습니다.` };
    }

    const dataset = await datasetRes.json();
    if (!Array.isArray(dataset) || dataset.length === 0) {
      console.error(`[fetchSingleVideoUrl] ❌ No results from actor`);
      return { platform, webVideoUrl, error: `비디오를 찾을 수 없습니다. URL이 올바른지 확인해주세요.` };
    }

    const row = pickClockworksRowForUrl(dataset as Record<string, unknown>[], webVideoUrl);
    if (!row) {
      return { platform, webVideoUrl, error: `비디오를 찾을 수 없습니다. URL이 올바른지 확인해주세요.` };
    }

    const videoUrl = extractPlayableUrlFromItem(row);

    if (!videoUrl) {
      console.error(`[fetchSingleVideoUrl] No video URL in response`);
      return { platform, webVideoUrl, error: `비디오 다운로드 링크를 가져올 수 없습니다.` };
    }

    console.log(
      `[fetchSingleVideoUrl] ✅ Video URL extracted: ${videoUrl.substring(0, Math.min(80, videoUrl.length))}`
    );
    return { videoUrl, webVideoUrl, platform };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[fetchSingleVideoUrl] Error:`, errorMsg);
    return { platform, webVideoUrl, error: `비디오를 가져오는 중 오류 발생: ${errorMsg}` };
  }
}
