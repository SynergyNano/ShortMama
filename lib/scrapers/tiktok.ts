import { VideoResult } from '@/types/video';
import { fetchWithRetry, fetchPostWithRetry, fetchGetWithRetry } from '@/lib/utils/fetch-with-retry';

/**
 * TikTok 영상 검색 (paul_44/tiktok-search)
 *
 * ✅ 429 Rate Limit 자동 재시도 (Exponential Backoff)
 * - 최대 3회 재시도
 * - 1초, 2초, 4초... 대기
 */
export interface SearchScraperOptions {
  /** 검색 취소 시 run 중단용으로 runId 전달 */
  onRunStarted?: (runId: string) => void;
  /** 수집 대기 중 진행률 (15~70) — UI에 "아직 수집 중" 표시용 */
  onProgress?: (percent: number) => void;
}

export async function searchTikTokVideos(
  query: string,
  limit: number,
  apiKey: string,
  dateRange?: string,
  options?: SearchScraperOptions
): Promise<VideoResult[]> {
  try {
    // Apify API URL path는 `/` 허용 안 함 → `username~actor-name` 포맷 사용
    const actorId = process.env.APIFY_TIKTOK_SEARCH_ACTOR_ID || 'paul_44~tiktok-search';
    const startTime = Date.now();

    // 새 액터 period 매핑 (Form 라벨 그대로)
    const mapPeriod = (uploadPeriod?: string): string => {
      const mapping: Record<string, string> = {
        'all': 'all',
        'yesterday': 'yesterday',
        '7days': '7days',
        '1month': '1month',
        '3months': '3months',
      };
      return mapping[uploadPeriod || '3months'] || '3months';
    };


    // 1️⃣ Run 시작 (429 에러 시 자동 재시도)
    const runRes = await fetchPostWithRetry(
      `https://api.apify.com/v2/acts/${actorId}/runs?token=${apiKey}&maxTotalChargeUsd=5`,
      {
        keyword: query,
        keywords: [],
        // Actor 는 dateRange + maxItems 필드명을 읽음 (main.py _DATE_RANGE_MAP).
        dateRange: mapPeriod(dateRange),
        maxItems: Math.min(limit, 50),
        sortType: 'MOST_LIKED',
        location: 'JP',
        minDurationSec: 0,
        minPlayCount: 0,
        maxConcurrentKeywords: 1,
        startUrls: [],
        disableDataset: true,
        // Apify KV 미러는 OFF — Actor 가 이미 Railway /v/:videoId 서명 프록시 URL 을 previewVideoUrl 에 담아 반환.
        // 전제: Apify Actor env var TIKTOK_VIDEO_PROXY_SECRET = Railway env var VIDEO_PROXY_SECRET (동일 값).
        mirrorVideos: false,
        strictKeywordMatch: false,
      },
      {},
      { maxRetries: 3, initialDelayMs: 1000 }
    );

    const runData = await runRes.json();
    if (!runRes.ok) {
      console.error(`[TikTok] Run creation failed: ${runRes.status}`, runData);
      return [];
    }

    const runId = runData.data.id;
    options?.onRunStarted?.(runId);
    console.log(`[TikTok] ▶ run  runId=${runId}  query="${query}"  dateRange=${mapPeriod(dateRange)}`);

    // 2️⃣ 완료 대기 (Polling with exponential backoff)
    // 체감 속도 개선: 초기 300ms, 상한 2000ms — Actor 완료 후 최대 대기 2s
    let status = 'RUNNING';
    let attempt = 0;
    const maxAttempts = 200;
    let waitTime = 300;
    const maxWaitTime = 2000;

    while ((status === 'RUNNING' || status === 'READY') && attempt < maxAttempts) {
      await new Promise(r => setTimeout(r, waitTime));  // ✅ 루프 시작 시 대기

      const statusRes = await fetchGetWithRetry(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${apiKey}`,
        {},
        { maxRetries: 3, initialDelayMs: 1000 }
      );

      const statusData = await statusRes.json();
      status = statusData.data.status;
      attempt++;

      // 수집 대기 중 진행률 15~70% (완료 전까지 서서히 증가)
      const waitPercent = 15 + Math.floor((55 * attempt) / maxAttempts);
      options?.onProgress?.(Math.min(waitPercent, 70));

      if (status === 'SUCCEEDED') break;
      if (status === 'FAILED' || status === 'ABORTED') {
        console.error(`[TikTok] ✗ run ${status}  runId=${runId}  elapsed=${Date.now() - startTime}ms`);
        return [];
      }

      // 다음 폴링까지 대기 시간 증가 (1.3배씩, 상한 2s)
      waitTime = Math.min(Math.floor(waitTime * 1.3), maxWaitTime);
    }

    if (status !== 'SUCCEEDED') {
      console.error(`[TikTok] ✗ run timeout  status=${status}  pollAttempts=${attempt}  elapsed=${Date.now() - startTime}ms`);
      return [];
    }


    // 3️⃣ 결과 조회 (429 에러 시 자동 재시도)
    const datasetRes = await fetchGetWithRetry(
      `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apiKey}`,
      {},
      { maxRetries: 3, initialDelayMs: 1000 }
    );

    if (!datasetRes.ok) {
      console.error(`[TikTok] ✗ dataset fetch failed  status=${datasetRes.status}  runId=${runId}`);
      return [];
    }

    const dataset = await datasetRes.json();
    if (!Array.isArray(dataset)) {
      console.error(`[TikTok] ✗ invalid dataset  type=${typeof dataset}  runId=${runId}`);
      return [];
    }

    if (dataset.length === 0) {
      console.warn(`[TikTok] ∅ empty dataset  query="${query}"  runId=${runId}  elapsed=${Date.now() - startTime}ms`);
      return [];
    }


    // 결과 변환 (CDN URL 직접 사용, R2 업로드 제거)
    const results = await Promise.all(
      dataset.slice(0, Math.min(limit, 50)).map(async (item: any, index: number) => {
        const hashtags = Array.isArray(item.hashtags)
          ? item.hashtags
              .filter((h: any) => h !== null && h !== undefined)
              .map((h: any) => typeof h === 'string' ? h : (h && h.name ? h.name : h))
          : [];

        // 검색 액터가 반환하는 CDN URL은 v16-webapp-prime.tiktok.com 등
        // Akamai 레벨 차단으로 서버 측 fetch 불가. videoUrl을 비워
        // app/api/download-video/route.ts의 paul_44~tiktok-download-max 폴백이 타도록 함.
        const videoUrl = undefined;
        const webVideoUrl = item.postPage ||
                           (item.channel?.url && item.id ? `${item.channel.url}/video/${item.id}` : undefined) ||
                           undefined;

        // 썸네일 필드 여러 경로 시도
        const tiktokThumbnail = item.video?.thumbnail ||
                         item.video?.cover ||
                         item.thumbnail ||
                         item.image ||
                         item.coverImage ||
                         item.videoCover ||
                         item.dynamicCover ||
                         item.staticCover ||
                         item.imagePost?.imageList?.[0]?.imageUrl ||
                         item.imagePostList?.imageList?.[0]?.imageUrl ||
                         (Array.isArray(item.imageList) && item.imageList[0]?.imageUrl) ||
                         (Array.isArray(item.imagePost) && item.imagePost[0]) ||
                         undefined;

        return {
          id: item.id || `video-${index}`,
          title: item.title || `영상 ${index + 1}`,
          description: item.title || '',
          creator: item.channel?.name || item.channel?.username || 'Unknown',
          creatorUrl: item.channel?.url || undefined,
          followerCount: item.channel?.followers ? parseInt(String(item.channel.followers)) : undefined,
          playCount: parseInt(String(item.views || 0)),
          likeCount: parseInt(String(item.likes || 0)),
          commentCount: parseInt(String(item.comments || 0)),
          shareCount: parseInt(String(item.shares || 0)),
          createTime: item.uploadedAt ? parseInt(String(item.uploadedAt)) * 1000 : Date.now(),
          videoDuration: item.video?.duration ? parseInt(String(item.video.duration)) : 0,
          hashtags: hashtags,
          thumbnail: tiktokThumbnail,
          videoUrl: videoUrl,
          webVideoUrl: webVideoUrl,
          // previewVideoUrl: Actor 가 Railway 프록시 URL(/v/<id>?u=...&s=...) 또는 CDN URL 폴백으로 설정.
          // Railway URL 이면 <video> 태그에서 재생 가능. CDN URL 이면 Akamai 차단으로 재생 실패.
          // 화이트리스트: Railway 도메인 시작 OR Apify KV (과거 미러) 만 허용. CDN URL 은 undefined 처리.
          previewVideoUrl:
            typeof item.previewVideoUrl === 'string' &&
            (item.previewVideoUrl.startsWith('https://proxyapify-production-d4c5.up.railway.app/v/') ||
              item.previewVideoUrl.startsWith('https://api.apify.com/'))
              ? item.previewVideoUrl
              : undefined,
        };
      })
    );

    const withThumb = results.filter(r => !!r.thumbnail).length;
    console.log(`[TikTok] ✓ done  videos=${results.length}/${dataset.length}  thumb=${withThumb}/${results.length}  runId=${runId}  elapsed=${Date.now() - startTime}ms`);

    return results;
  } catch (error) {
    console.error(`[TikTok] ✗ unexpected error:`, error);
    return [];
  }
}
