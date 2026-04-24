import { fetchPostWithRetry, fetchGetWithRetry } from '@/lib/utils/fetch-with-retry';

/**
 * paul_44/tiktok-download-max — single post download actor.
 */
const DEFAULT_TIKTOK_DOWNLOAD_ACTOR_ID = 'paul_44~tiktok-download-max';

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

function pickDatasetRowForUrl(
  rows: Record<string, unknown>[],
  webVideoUrl: string
): Record<string, unknown> | undefined {
  if (rows.length === 0) return undefined;
  if (rows.length === 1) return rows[0];
  const hint = tiktokVideoPathHint(webVideoUrl);
  const match = rows.find((row) => {
    const r = row as Record<string, unknown>;
    const candidates = [r.inputUrl, r.url, r.webVideoUrl, r.submittedVideoUrl].filter(
      (u): u is string => typeof u === 'string'
    );
    return candidates.some((u) => tiktokVideoPathHint(u) === hint);
  });
  return match ?? rows[0];
}

/**
 * paul_44/tiktok-download-max dataset row → playable URL.
 * 우선순위: downloadUrl(Apify KV, Akamai 우회) > cdnUrl > playUrlCandidates[0]
 */
function extractPlayableUrlFromItem(item: Record<string, unknown>): string | undefined {
  const r = item as Record<string, unknown>;

  const isHttp = (c: unknown): c is string =>
    typeof c === 'string' && c.startsWith('http');

  // 1순위: Apify KV store 다운로드 URL (서버에서 fetch 가능)
  if (isHttp(r.downloadUrl)) return r.downloadUrl;

  if (Array.isArray(r.downloadUrls)) {
    for (const u of r.downloadUrls) {
      if (isHttp(u)) return u;
    }
  }

  // 2순위: CDN URL (Akamai 차단 가능성 있음)
  if (isHttp(r.cdnUrl)) return r.cdnUrl;

  // 3순위: playUrlCandidates 후보들
  if (Array.isArray(r.playUrlCandidates)) {
    for (const u of r.playUrlCandidates) {
      if (!isHttp(u)) continue;
      if (u.includes('mime_type=video_mp4') || u.includes('/video/tos/')) return u;
    }
    for (const u of r.playUrlCandidates) {
      if (isHttp(u)) return u;
    }
  }

  // 레거시 필드 fallback
  const legacy = [r.videoUrl, r.videourl, r.downloadAddress];
  for (const c of legacy) {
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
        videoUrls: [webVideoUrl],
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

    const row = pickDatasetRowForUrl(dataset as Record<string, unknown>[], webVideoUrl);
    if (!row) {
      return { platform, webVideoUrl, error: `비디오를 찾을 수 없습니다. URL이 올바른지 확인해주세요.` };
    }

    // downloadStatus가 'success'가 아니면 바로 실패 처리
    const downloadStatus = typeof row.downloadStatus === 'string' ? row.downloadStatus : undefined;
    if (downloadStatus && downloadStatus !== 'success') {
      console.error(`[fetchSingleVideoUrl] downloadStatus=${downloadStatus}`);
      return { platform, webVideoUrl, error: `비디오 다운로드에 실패했습니다 (${downloadStatus}).` };
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
