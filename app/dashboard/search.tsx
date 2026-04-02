"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  memo,
  type MutableRefObject,
  type SyntheticEvent,
} from "react";
import {
  Download,
  Play,
  Heart,
  MessageCircle,
  Share2,
  Info,
  ExternalLink,
  Loader,
  Subtitles,
  Copy,
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  Search as SearchIcon,
  Music2,
  Globe2,
  Languages,
  FileText,
  Lightbulb,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Toast, { type Toast as ToastType } from "@/app/components/Toast/Toast";
import ViewCountFilter from "@/app/components/Filters/ViewCountFilter/ViewCountFilter";
import PeriodFilter from "@/app/components/Filters/PeriodFilter/PeriodFilter";
import EngagementRatioFilter from "@/app/components/Filters/EngagementRatioFilter/EngagementRatioFilter";
import DownloadVideoModal from "@/app/components/DownloadVideoModal/DownloadVideoModal";
import { formatDateWithTime, getRelativeDateString } from "@/lib/dateUtils";
import { formatNumber, formatVideoDuration } from "@/lib/formatters";
import UserDropdown from "@/app/components/UserDropdown/UserDropdown";
import SubscriptionModal from "@/app/components/SubscriptionModal/SubscriptionModal";
import { SearchProgress } from "@/components/SearchProgress";
import { validateKeyword } from "@/lib/utils/validateKeyword";
import "./search.css";

const STORAGE_KEYS = {
  searchHistory: "shortmama-search-history",
  language: "shortmama-language-preference",
} as const;

const SEARCH_TIMING = {
  hoverPlayDelayMs: 200,
  debounceMs: 300,
  pollIntervalMs: 2000,
  warningTimeoutMs: 150000,
  searchTimeoutMs: 180000,
} as const;

/** 첫 화면(약 2~3행)은 즉시 로드, 나머지는 lazy — 스크롤 체감과 대역폭 균형 */
const THUMBNAIL_EAGER_LOAD_COUNT = 12;

type Platform = "tiktok" | "douyin";
type Language = "ko" | "zh" | "en";

interface Video {
  id: string;
  title: string;
  description: string;
  creator: string;
  creatorUrl?: string;
  followerCount?: number;
  playCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createTime: number;
  videoDuration: number;
  hashtags: string[];
  thumbnail?: string;
  videoUrl?: string;
  webVideoUrl?: string;
  _platform?: Platform; // 찜 목록에서 저장 시점 플랫폼 보존용
}

interface FilterState {
  minPlayCount: number;
  maxPlayCount: number | null;
  uploadPeriod: string;
  videoLength: string;
  engagementScore: string[];
}

const LANGUAGE_DETECT_DEBOUNCE_MS = 100;

/** 검색 결과 그리드 — 검색어만 바뀔 때 리렌더 생략 (memo) */
type SearchResultsGridProps = {
  results: Video[];
  platform: Platform;
  playingVideoId: string | null;
  hoveredVideoId: string | null;
  previewVideoUrls: Record<string, string>;
  loadingPreviewId: string | null;
  isBookmarkView: boolean;
  failedThumbnails: Set<string>;
  refreshingThumbnailId: string | null;
  bookmarkedIds: Set<string>;
  downloadingVideoId: string | null;
  extractingSubtitleId: string | null;
  videoRefs: MutableRefObject<Map<string, HTMLVideoElement>>;
  getDisplayThumbnail: (video: Video, plat: Platform) => string | undefined;
  onVideoCardClick: (video: Video) => void;
  onVideoCardMouseEnter: (video: Video) => void;
  onVideoCardMouseLeave: () => void;
  onThumbnailError: (video: Video, e: SyntheticEvent<HTMLImageElement>) => void;
  onRefreshBookmarkThumbnail: (video: Video) => void;
  onCopyUrl: (video: Video) => void;
  onToggleBookmark: (video: Video) => void;
  onDownloadVideo: (video: Video) => void | Promise<void>;
  onExtractSubtitles: (video: Video) => void | Promise<void>;
};

const SearchResultsGrid = memo(function SearchResultsGridInner({
  results,
  platform,
  playingVideoId,
  hoveredVideoId,
  previewVideoUrls,
  loadingPreviewId,
  isBookmarkView,
  failedThumbnails,
  refreshingThumbnailId,
  bookmarkedIds,
  downloadingVideoId,
  extractingSubtitleId,
  videoRefs,
  getDisplayThumbnail,
  onVideoCardClick,
  onVideoCardMouseEnter,
  onVideoCardMouseLeave,
  onThumbnailError,
  onRefreshBookmarkThumbnail,
  onCopyUrl,
  onToggleBookmark,
  onDownloadVideo,
  onExtractSubtitles,
}: SearchResultsGridProps) {
  return (
    <div style={{ width: "100%" }}>
      <div className="results-count">총 {results.length}개의 영상</div>
      <div className="results-grid">
        {results.map((video, index) => (
          <div key={video.id} className="result-card">
            <div
              className="card-thumbnail-container"
              onClick={() => onVideoCardClick(video)}
              onMouseEnter={() => onVideoCardMouseEnter(video)}
              onMouseLeave={onVideoCardMouseLeave}
            >
              {getDisplayThumbnail(video, platform) ? (
                <img
                  src={getDisplayThumbnail(video, platform)!}
                  alt={video.title}
                  className={`card-thumbnail ${playingVideoId === video.id ? "card-thumbnail-hidden" : ""}`}
                  onError={(e) => onThumbnailError(video, e)}
                  loading={index < THUMBNAIL_EAGER_LOAD_COUNT ? "eager" : "lazy"}
                  {...(index === 0 ? { fetchPriority: "high" as const } : {})}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="card-thumbnail-fallback">🎬</div>
              )}

              {(video._platform ?? platform) === "tiktok" && (video.videoUrl || previewVideoUrls[video.id]) && (
                <video
                  ref={(el) => {
                    const m = videoRefs.current;
                    if (el) m.set(video.id, el);
                    else m.delete(video.id);
                  }}
                  className={`card-video-preview${hoveredVideoId === video.id ? "" : " card-video-hidden"}`}
                  src={video.videoUrl || previewVideoUrls[video.id]}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  {...({ referrerPolicy: "no-referrer" } as React.ComponentProps<"video">)}
                />
              )}
              {(video._platform ?? platform) === "tiktok" && loadingPreviewId === video.id && (
                <div className="card-preview-loading">
                  <Loader className="card-action-icon animate-spin" style={{ width: 32, height: 32 }} />
                  <span>미리보기 로딩...</span>
                </div>
              )}

              <div className="card-duration-badge">{formatVideoDuration(video.videoDuration)}</div>

              {video.createTime && <div className="card-date-badge">{getRelativeDateString(new Date(video.createTime))}</div>}

              <div className="card-overlay">
                <div className="card-overlay-creator">
                  <span>@{video.creator}</span>
                  {video.followerCount && (
                    <span style={{ fontSize: "10px", opacity: 0.9 }}>· {formatNumber(video.followerCount)}</span>
                  )}
                </div>
                <div className="card-overlay-title">{video.title}</div>
                <div className="card-overlay-stats">
                  <div className="card-overlay-stat-item">
                    <Play className="card-overlay-stat-icon" />
                    <span>{video.playCount ? formatNumber(video.playCount) : "제공 안 함"}</span>
                  </div>
                  <div className="card-overlay-stat-item">
                    <Heart className="card-overlay-stat-icon" />
                    <span>{formatNumber(video.likeCount)}</span>
                  </div>
                  <div className="card-overlay-stat-item">
                    <MessageCircle className="card-overlay-stat-icon" />
                    <span>{formatNumber(video.commentCount)}</span>
                  </div>
                  <div className="card-overlay-stat-item">
                    <Share2 className="card-overlay-stat-icon" />
                    <span>{formatNumber(video.shareCount)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-actions-vertical">
              {isBookmarkView && failedThumbnails.has(video.id) && (
                <button
                  type="button"
                  className="card-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRefreshBookmarkThumbnail(video);
                  }}
                  disabled={refreshingThumbnailId === video.id}
                  title="썸네일 새로고침"
                >
                  {refreshingThumbnailId === video.id ? (
                    <Loader className="card-action-icon animate-spin" />
                  ) : (
                    <RefreshCw className="card-action-icon" />
                  )}
                  <span className="card-action-label">
                    {refreshingThumbnailId === video.id ? "갱신중" : "새로고침"}
                  </span>
                </button>
              )}

              <button
                type="button"
                className="card-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopyUrl(video);
                }}
                title="URL 복사"
              >
                <Copy className="card-action-icon" />
                <span className="card-action-label">복사</span>
              </button>

              <button
                type="button"
                className="card-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  void onToggleBookmark(video);
                }}
                title={bookmarkedIds.has(video.id) ? "즐겨찾기 해제" : "즐겨찾기 추가"}
              >
                {bookmarkedIds.has(video.id) ? (
                  <BookmarkCheck className="card-action-icon" style={{ color: "#FFD700" }} />
                ) : (
                  <Bookmark className="card-action-icon" />
                )}
                <span className="card-action-label">찜</span>
              </button>

              <button
                type="button"
                className="card-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  void onDownloadVideo(video);
                }}
                disabled={downloadingVideoId === video.id}
                title="다운로드"
              >
                {downloadingVideoId === video.id ? (
                  <Loader className="card-action-icon animate-spin" />
                ) : (
                  <Download className="card-action-icon" />
                )}
                <span className="card-action-label">{downloadingVideoId === video.id ? "준비중" : "다운"}</span>
              </button>

              {((video._platform ?? platform) === "tiktok" || (video._platform ?? platform) === "douyin") && (
                <button
                  type="button"
                  className="card-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    void onExtractSubtitles(video);
                  }}
                  disabled={extractingSubtitleId === video.id}
                  title="자막 추출"
                >
                  {extractingSubtitleId === video.id ? (
                    <Loader className="card-action-icon animate-spin" />
                  ) : (
                    <Subtitles className="card-action-icon" />
                  )}
                  <span className="card-action-label">{extractingSubtitleId === video.id ? "추출중" : "자막"}</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default function Search() {
  const [searchInput, setSearchInput] = useState("");
  const searchInputRef = useRef(searchInput);
  searchInputRef.current = searchInput;
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [isLoading, setIsLoading] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [sortBy, setSortBy] = useState("plays");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isTitleRefreshing, setIsTitleRefreshing] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [error, setError] = useState("");
  const [downloadingVideoId, setDownloadingVideoId] = useState<string | null>(null);
  const [extractingSubtitleId, setExtractingSubtitleId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    minPlayCount: 0,
    maxPlayCount: null,
    uploadPeriod: "all",
    videoLength: "all",
    engagementScore: ["all"],
  });
  const [targetLanguage, setTargetLanguage] = useState<Language>("ko");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedQuery, setTranslatedQuery] = useState<string>("");
  const [detectedLanguage, setDetectedLanguage] = useState<Language | null>(null);
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  /** 미리보기용으로 조회한 비디오 URL (videoId -> url) */
  const [previewVideoUrls, setPreviewVideoUrls] = useState<Record<string, string>>({});
  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null);
  const [failedThumbnails, setFailedThumbnails] = useState<Set<string>>(new Set());
  const [refreshingThumbnailId, setRefreshingThumbnailId] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [isBookmarkView, setIsBookmarkView] = useState(false);
  const [bookmarkVideos, setBookmarkVideos] = useState<Video[]>([]);
  const [isRefreshingAllBookmarks, setIsRefreshingAllBookmarks] = useState(false);
  const [showTranslationPanel, setShowTranslationPanel] = useState(true);
  const [isEngagementPopoverOpen, setIsEngagementPopoverOpen] = useState(false);
  const engagementPopoverRef = useRef<HTMLDivElement>(null);
  const [isViewCountPopoverOpen, setIsViewCountPopoverOpen] = useState(false);
  const viewCountPopoverRef = useRef<HTMLDivElement>(null);
  const [jobStatus, setJobStatus] = useState<{
    jobId: string;
    status: "waiting" | "active" | "delayed" | "paused";
    progress: number;
    queuePosition: number;
    message: string;
    totalQueueSize?: number;
    estimatedWaitSeconds?: number;
  } | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 구독 상태 (null = 로딩 중, true = 구독 중, false = 미구독)
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [subscriptionPlanName, setSubscriptionPlanName] = useState<string | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // 링크 갱신 cooldown 관리 (같은 query에 대해 짧은 시간 내 중복 갱신 방지)
  const recrawlCooldownRef = useRef<Map<string, number>>(new Map());
  // 취소한 jobId — 이미 날아간 폴링 응답이 도착해도 "검색 완료"로 처리하지 않도록 무시
  const cancelledJobIdRef = useRef<string | null>(null);
  const langDetectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * 검색 타임아웃 타이머 정리 (early definition for use in cleanup effect)
   */
  const clearSearchTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
  }, []);

  // Toast 추가 함수
  const addToast = useCallback((type: "success" | "error" | "warning" | "info", message: string, title?: string, duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastType = { id, type, message, title, duration };
    setToasts((prev) => [...prev, newToast]);

    // 자동 제거
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  // 마운트 시 구독 상태 조회
  useEffect(() => {
    fetch('/api/user/subscription')
      .then(r => r.json())
      .then(data => {
        setIsSubscribed(data.isSubscribed ?? false);
        setSubscriptionPlanName(data.subscription?.planName ?? null);
      })
      .catch(() => {
        setIsSubscribed(false);
        setSubscriptionPlanName(null);
      });
  }, []);

  // 마운트 시 북마크 로드
  useEffect(() => {
    fetch('/api/bookmarks')
      .then(r => r.json())
      .then(data => {
        if (data.bookmarks) {
          setBookmarkedIds(new Set(data.bookmarks.map((b: any) => b.videoId)))
        }
      })
      .catch(() => {})
  }, [])

  // URL 복사
  const handleCopyUrl = useCallback((video: Video) => {
    const url = video.webVideoUrl || ''
    navigator.clipboard.writeText(url)
    addToast('success', 'URL이 복사되었습니다', '✅ 복사 완료', 2000)
  }, [addToast])

  // 북마크 토글
  const handleToggleBookmark = useCallback(async (video: Video) => {
    const isBookmarked = bookmarkedIds.has(video.id)
    if (isBookmarked) {
      await fetch(`/api/bookmarks/${video.id}?platform=${video._platform ?? platform}`, { method: 'DELETE' })
      setBookmarkedIds(prev => { const s = new Set(prev); s.delete(video.id); return s })
      setBookmarkVideos(prev => prev.filter(v => v.id !== video.id))
      addToast('info', '즐겨찾기에서 제거되었습니다', '🗑️ 제거', 2000)
    } else {
      if (bookmarkedIds.size >= 50) {
        addToast('warning', '찜 목록은 최대 50개까지 저장할 수 있습니다.', '⚠️ 한도 초과', 3000)
        return
      }
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: video.id, platform, videoData: video })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        addToast('error', data.error || '저장에 실패했습니다.', '❌ 오류', 3000)
        return
      }
      setBookmarkedIds(prev => new Set(prev).add(video.id))
      addToast('success', '즐겨찾기에 저장되었습니다', '⭐ 저장', 2000)
    }
  }, [bookmarkedIds, platform, addToast])

  // 찜 목록 뷰 토글
  const handleToggleBookmarkView = useCallback(async () => {
    if (isBookmarkView) {
      setIsBookmarkView(false);
      return;
    }
    const res = await fetch('/api/bookmarks');
    const data = await res.json();
    if (data.bookmarks) {
      setBookmarkVideos(data.bookmarks.map((b: any) => ({ ...b.videoData, _platform: b.platform } as Video)));
    }
    setIsBookmarkView(true);
  }, [isBookmarkView])

  // 찜 목록 전체 썸네일/프리뷰 새로고침
  const handleRefreshAllBookmarks = useCallback(async () => {
    try {
      setIsRefreshingAllBookmarks(true);

      const res = await fetch("/api/bookmarks/refresh-all", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        addToast("error", data?.error || "전체 새로고침에 실패했습니다.", "❌ 전체 새로고침 실패");
        return;
      }

      const list = Array.isArray(data.bookmarks) ? data.bookmarks : null;
      if (list) {
        setBookmarkVideos(list.map((b: any) => ({ ...b.videoData, _platform: b.platform } as Video)));
        setFailedThumbnails(new Set());
      } else {
        const listRes = await fetch("/api/bookmarks");
        const listData = await listRes.json();
        if (listData.bookmarks) {
          setBookmarkVideos(listData.bookmarks.map((b: any) => ({ ...b.videoData, _platform: b.platform } as Video)));
          setFailedThumbnails(new Set());
        }
      }

      const updated = data.updatedCount ?? 0;
      const failedCount = data.failedCount ?? 0;
      const skippedCount = data.skippedCount ?? 0;
      const msg =
        updated === 0 && failedCount === 0 && skippedCount > 0
          ? "갱신할 항목이 없습니다. 썸네일/비디오 URL이 이미 최신 상태입니다."
          : failedCount > 0
            ? `썸네일/프리뷰 ${updated}개 새로고침 완료 (${failedCount}개 실패)`
            : `썸네일/프리뷰 ${updated}개 새로고침 완료`;
      addToast("success", msg, "🔄 전체 새로고침", 3500);
    } catch (error) {
      console.error("[Search] Refresh all bookmarks error:", error);
      addToast("error", "전체 새로고침 중 오류가 발생했습니다.", "❌ 전체 새로고침 실패");
    } finally {
      setIsRefreshingAllBookmarks(false);
    }
  }, [addToast]);

  // 썸네일 로드 실패 처리 (thumbnail이 객체로 올 수 있어 문자열로만 다룸)
  const handleThumbnailError = useCallback(
    async (video: Video, e: React.SyntheticEvent<HTMLImageElement>) => {
      const raw = video.thumbnail;
      const thumbnailUrl =
        typeof raw === "string" ? raw : raw && typeof raw === "object" && "url" in raw ? (raw as { url: string }).url : "";
      const urlType = thumbnailUrl.includes(".r2.dev")
        ? "R2"
        : thumbnailUrl.includes("tiktokcdn") || thumbnailUrl.includes("douyinpic")
          ? "CDN"
          : "Unknown";

      console.error(`[Frontend] ❌ Thumbnail load failed`, {
        videoId: video.id,
        urlType,
        thumbnailPreview: thumbnailUrl ? thumbnailUrl.substring(0, 60) : "",
        platform,
        creator: video.creator,
      });

      // 폴백: 썸네일 로딩 실패
      setFailedThumbnails((prev) => new Set(prev).add(video.id));
      e.currentTarget.src =
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" font-size="50" fill="%23999"%3E🎬%3C/text%3E%3C/svg%3E';
      e.currentTarget.alt = "썸네일을 불러올 수 없습니다";
    },
    [platform],
  );

  // 찜 목록에서 썸네일만 새로고침 (CDN 만료 대응)
  const handleRefreshBookmarkThumbnail = useCallback(
    async (video: Video) => {
      // 찜 목록 뷰에서만 동작
      if (!isBookmarkView) {
        addToast("info", "썸네일 새로고침은 찜 목록에서만 지원합니다.", "ℹ️ 안내");
        return;
      }

      try {
        setRefreshingThumbnailId(video.id);

        const bookmarkPlatform = video._platform ?? platform;

        const res = await fetch("/api/bookmarks/refresh-thumbnail", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            videoId: video.id,
            platform: bookmarkPlatform,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.thumbnail) {
          const message = data?.error || "새 썸네일을 가져오지 못했습니다.";
          addToast("error", message, "❌ 갱신 실패");
          return;
        }

        // 찜 목록 상태 내 썸네일/프리뷰 URL 교체
        setBookmarkVideos((prev) =>
          prev.map((v) =>
            v.id === video.id
              ? {
                  ...v,
                  thumbnail: data.thumbnail as string,
                  ...(data.videoUrl ? { videoUrl: data.videoUrl as string } : {}),
                }
              : v,
          ),
        );

        if (data.videoUrl) {
          setPreviewVideoUrls((prev) => ({
            ...prev,
            [video.id]: data.videoUrl as string,
          }));
        }

        // 실패 목록에서 제거
        setFailedThumbnails((prev) => {
          const next = new Set(prev);
          next.delete(video.id);
          return next;
        });

        addToast("success", "썸네일을 새로고침했습니다.", "🔄 갱신 완료", 2500);
      } catch (error) {
        console.error("[Search] Refresh bookmark thumbnail error:", error);
        addToast("error", "썸네일 새로고침 중 오류가 발생했습니다.", "❌ 갱신 실패");
      } finally {
        setRefreshingThumbnailId(null);
      }
    },
    [addToast, isBookmarkView, platform],
  );

  /** 표시할 썸네일 URL. API 썸네일 사용 (xhscdn 등 CDN) */
  const getDisplayThumbnail = useCallback((video: Video, plat: Platform): string | undefined => {
    const raw = video.thumbnail;
    const thumbStr =
      typeof raw === "string" ? raw : raw && typeof raw === "object" && "url" in raw ? (raw as { url: string }).url : undefined;
    return thumbStr || undefined;
  }, []);

  const handleTitleClick = () => {
    setIsTitleRefreshing(true);
    setTimeout(() => {
      setIsTitleRefreshing(false);
      window.location.reload();
    }, 600);
  };

  // Douyin은 프리뷰 미지원 → TikTok만 호버 시 재생
  const handleVideoCardMouseEnter = useCallback(
    (video: Video) => {
      setHoveredVideoId(video.id);

      hoverTimeoutRef.current = setTimeout(() => {
        if ((video._platform ?? platform) !== "tiktok") return;
        const el = videoRefs.current.get(video.id);
        if (el) {
          el.preload = "auto";
          el.play().catch(() => {});
        }
        setPlayingVideoId(video.id);
      }, SEARCH_TIMING.hoverPlayDelayMs);
    },
    [platform],
  );

  const handleVideoCardMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (playingVideoId) {
      const el = videoRefs.current.get(playingVideoId);
      if (el) {
        el.pause();
        el.preload = "metadata";
      }
    }
    setHoveredVideoId(null);
    setPlayingVideoId(null);
    setLoadingPreviewId(null);
  }, [playingVideoId]);

  // 카드/썸네일 클릭: 항상 새 탭으로 페이지 열기 (호버로 프리뷰, 클릭으로 이동)
  const handleVideoCardClick = useCallback(
    (video: Video) => {
      if (video.webVideoUrl) {
        window.open(video.webVideoUrl, "_blank", "noopener,noreferrer");
      }
    },
    [],
  );

  // 언어 감지 함수
  const detectLanguage = (text: string): Language => {
    const trimmed = text.trim();

    // 한국어 감지 (한글 유니코드 범위)
    if (/[\u3131-\u314e\u314f-\u3163\uac00-\ud7a3]/g.test(trimmed)) {
      return "ko";
    }

    // 중국어 감지 (중국어 한자 유니코드 범위)
    if (/[\u4e00-\u9fff]/g.test(trimmed)) {
      return "zh";
    }

    // 기본값: 영어
    return "en";
  };

  useEffect(() => {
    return () => {
      clearSearchTimeout();
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [clearSearchTimeout]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.searchHistory);
      if (saved) setSearchHistory(JSON.parse(saved));
    } catch {
      // ignore invalid JSON
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.language);
    if (saved && (saved === "ko" || saved === "zh" || saved === "en")) {
      setTargetLanguage(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.language, targetLanguage);
  }, [targetLanguage]);

  // 검색어 입력 시 언어 감지 — 디바운스로 백스페이스 연타 시 리렌더·정규식 비용 완화
  useEffect(() => {
    if (langDetectTimerRef.current) clearTimeout(langDetectTimerRef.current);
    langDetectTimerRef.current = setTimeout(() => {
      langDetectTimerRef.current = null;
      if (searchInput.trim()) {
        setDetectedLanguage(detectLanguage(searchInput));
        setShowTranslationPanel(true);
      } else {
        setDetectedLanguage(null);
      }
    }, LANGUAGE_DETECT_DEBOUNCE_MS);
    return () => {
      if (langDetectTimerRef.current) clearTimeout(langDetectTimerRef.current);
    };
  }, [searchInput]);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, uploadPeriod: "all" }));
  }, [platform]);

  useEffect(() => {
    if (!filterDrawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFilterDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [filterDrawerOpen]);

  // 인기도 팝오버: 외부 클릭 시 닫기
  useEffect(() => {
    if (!isEngagementPopoverOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (engagementPopoverRef.current && !engagementPopoverRef.current.contains(e.target as Node)) {
        setIsEngagementPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEngagementPopoverOpen]);

  // 조회수 팝오버: 외부 클릭 시 닫기
  useEffect(() => {
    if (!isViewCountPopoverOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (viewCountPopoverRef.current && !viewCountPopoverRef.current.contains(e.target as Node)) {
        setIsViewCountPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isViewCountPopoverOpen]);

  // 영상 필터링 함수
  const filterVideos = (items: Video[], filterState: FilterState) => {
    return items.filter((video) => {
      // 1. 조회수 필터
      if (filterState.minPlayCount > 0 && video.playCount < filterState.minPlayCount) {
        return false;
      }
      if (filterState.maxPlayCount && video.playCount > filterState.maxPlayCount) {
        return false;
      }

      // 2. 업로드 기간 필터 - API에서 이미 필터링됨

      // 3. 영상 길이 필터
      if (filterState.videoLength !== "all") {
        const isShort = video.videoDuration < 20; // 20초 미만
        if (filterState.videoLength === "short" && !isShort) return false;
        if (filterState.videoLength === "long" && isShort) return false;
      }

      // 4. Engagement 점수 필터 (좋아요 + 댓글 + 공유 합산)
      if (filterState.engagementScore.length > 0 && !filterState.engagementScore.includes("all")) {
        const totalEngagement = video.likeCount + video.commentCount + video.shareCount;
        const engagementRatio = video.playCount > 0 ? totalEngagement / video.playCount : 0;

        // 5단계 구분 (TikTok 업계 표준 기준, 2026)
        let level = 1;
        if (engagementRatio >= 0.1)
          level = 5; // 10% 이상 - 최고
        else if (engagementRatio >= 0.06)
          level = 4; // 6~10% - 매우좋음
        else if (engagementRatio >= 0.04)
          level = 3; // 4~6% - 좋음
        else if (engagementRatio >= 0.02) level = 2; // 2~4% - 중간
        // else level = 1; // 2% 미만 - 낮음

        if (!filterState.engagementScore.includes(level.toString())) {
          return false;
        }
      }

      return true;
    });
  };

  // 영상 정렬 함수
  const sortVideos = (items: Video[], sortOption: string) => {
    const sorted = [...items];

    switch (sortOption) {
      case "plays":
        sorted.sort((a, b) => b.playCount - a.playCount);
        break;
      case "likes":
        sorted.sort((a, b) => b.likeCount - a.likeCount);
        break;
      case "comments":
        sorted.sort((a, b) => b.commentCount - a.commentCount);
        break;
      case "recent":
        sorted.sort((a, b) => b.createTime - a.createTime);
        break;
      default:
        sorted.sort((a, b) => b.playCount - a.playCount);
        break;
    }

    return sorted;
  };

  const results = useMemo(() => {
    if (isBookmarkView) {
      return sortVideos(bookmarkVideos, sortBy);
    }
    // 중복 제거 (같은 ID를 가진 영상이 여러 번 나타나는 경우 방지)
    const uniqueVideos = Array.from(new Map(videos.map((video) => [video.id, video])).values());
    const filtered = filterVideos(uniqueVideos, filters);
    return sortVideos(filtered, sortBy);
  }, [videos, filters, sortBy, isBookmarkView, bookmarkVideos]);

  const handleCancelSearch = useCallback(async () => {
    // 취소한 jobId 기록 → 이후 도착하는 폴링 응답은 "검색 완료"로 처리하지 않음
    const jobIdToCancel = jobStatus?.jobId ?? null;
    if (jobIdToCancel) cancelledJobIdRef.current = jobIdToCancel;

    // 타임아웃 타이머 정리
    clearSearchTimeout();

    // 1. HTTP 요청 중단
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      abortControllerRef.current = null;
    }

    // 2. 폴링 중단
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    // 3. 백엔드 취소 API 호출 (스크래핑 작업 중단 + job 제거 + 캐시 삭제)
    if (jobIdToCancel) {
      try {
        await fetch("/api/search/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobId: jobIdToCancel,
            query: searchInputRef.current,
            platform,
            dateRange: filters.uploadPeriod,
          }),
        });
        console.log("[Search] Cancel API 호출 완료 (스크래핑 작업 중단 포함)");
        addToast("info", "검색이 취소되었습니다.", "⏹️ 취소됨");
      } catch (error) {
        console.error("[Search] Cancel API 실패:", error);
        addToast("warning", "취소 요청이 완료되지 않았을 수 있습니다.", "⏹️ 취소");
      }
    }

    // 4. 상태 초기화
    setJobStatus(null);
  }, [clearSearchTimeout, jobStatus?.jobId, platform, filters.uploadPeriod, addToast]);

  /**
   * 자동 타임아웃 처리 (3분 초과)
   */
  const handleAutoTimeout = useCallback(async () => {
    console.log("[Search] Auto timeout after 3 minutes");

    // 기존 취소 로직 재사용 (백엔드 취소 API + 캐시 삭제)
    await handleCancelSearch();

    // 사용자 안내 토스트
    addToast("warning", "검색 시간이 초과되었습니다.\n잠시 후 다시 시도해주세요.", "⏱️ 타임아웃", 5000);

    // 에러 메시지 표시
    setError("검색 시간이 초과되었습니다. 서버 상태를 확인하거나 잠시 후 다시 시도해주세요.");
  }, [handleCancelSearch, addToast]);

  const handleSearch = useCallback(async () => {
    const rawInput = searchInputRef.current;
    // 키워드 검증
    const validation = validateKeyword(rawInput);
    if (!validation.isValid) {
      setError(validation.error || "잘못된 검색어입니다");

      // 🔔 토스트 알람 추가!
      addToast("warning", validation.error || "잘못된 검색어입니다", "⚠️ 입력 오류", 4000);
      return;
    }

    // 이전 검색의 타이머 정리 (추가)
    clearSearchTimeout();

    let searchQuery = validation.sanitized!;
    setTranslatedQuery("");

    // 1. 입력 언어 감지
    const inputLanguage = detectLanguage(rawInput);
    setDetectedLanguage(inputLanguage);

    // 2. 번역이 필요한지 확인 (입력 언어 ≠ 선택 언어)
    const needsTranslation = inputLanguage !== targetLanguage;

    if (needsTranslation) {
      setIsTranslating(true);
      try {
        const translateRes = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: rawInput,
            sourceLanguage: inputLanguage,
            targetLanguage,
          }),
        });

        const translateData = await translateRes.json();

        if (!translateRes.ok) {
          console.error(`[Translation] API Error: ${translateRes.status}`, translateData);
          setError(`번역 실패: ${translateData.error || "알 수 없는 오류"}`);
          throw new Error(translateData.error || `HTTP ${translateRes.status}`);
        }

        if (translateData.success && translateData.translatedText) {
          searchQuery = translateData.translatedText;
          setTranslatedQuery(searchQuery);
        } else {
          console.warn("[Translation] Invalid response:", translateData);
          setError(`번역 실패: 잘못된 응답 형식`);
        }
      } catch (error) {
        console.error("[Translation] Exception:", error);
        setError(`번역 오류: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
      } finally {
        setIsTranslating(false);
      }
    }

    // 검색 히스토리 저장
    const newHistory = [rawInput, ...searchHistory.filter((item) => item !== rawInput)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem(STORAGE_KEYS.searchHistory, JSON.stringify(newHistory));

    // AbortController 생성
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError("");

    // 검색 시 필터/정렬 초기화 (기간은 유지: 같은 키워드+같은 기간이면 캐시 사용, 기간 다르면 새 검색)
    setFilters((prev) => ({
      minPlayCount: 0,
      maxPlayCount: null,
      uploadPeriod: prev.uploadPeriod,
      videoLength: "all",
      engagementScore: ["all"],
    }));
    setSortBy("plays");

    try {
      // 선택한 업로드 기간을 dateRange로 전달 → 캐시 키에 포함되어, 기간이 다르면 새로 검색됨
      const dateRange = filters.uploadPeriod;

      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          platform,
          dateRange,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        const error = new Error(errorData.error || "검색 중 오류가 발생했습니다");
        (error as any).status = response.status;
        (error as any).details = errorData.details;
        throw error;
      }

      const data = await response.json();

      // 캐시 히트 시 즉시 결과 표시
      if (data.status === "completed") {
        setError("");
        setIsLoading(false);

        if (data.data && data.data.length > 0) {
          const urlStats = data.data.reduce(
            (acc: any, video: Video) => {
              const raw = video.thumbnail;
              const thumbnailUrl =
                typeof raw === "string" ? raw : raw && typeof raw === "object" && "url" in raw ? (raw as { url: string }).url : "";
              if (thumbnailUrl.includes(".r2.dev")) acc.r2++;
              else if (thumbnailUrl.includes("tiktokcdn") || thumbnailUrl.includes("douyinpic") || thumbnailUrl.includes("xhscdn"))
                acc.cdn++;
              else acc.unknown++;
              return acc;
            },
            { r2: 0, cdn: 0, unknown: 0 },
          );

          console.log(`[Frontend] 📥 Search results received`, {
            platform,
            query: searchQuery.substring(0, 30),
            videoCount: data.data.length,
            fromCache: data.fromCache,
            urlStats,
          });

          setVideos(data.data);
          addToast("success", "검색 완료!", `${data.data.length}개의 결과를 찾았습니다`);
        } else {
          setVideos([]);
          addToast("info", "결과 없음", "다른 키워드나 필터로 다시 시도해보세요");
        }
      } else if (data.status === "queued") {
        // 큐에 추가됨 - jobId로 진행 상황 추적 가능
        setVideos([]);
        addToast("info", "검색을 시작했습니다");

        // 초기 큐 크기 저장
        const initialQueueSize = data.totalQueueSize || data.queueSize;
        cancelledJobIdRef.current = null; // 새 검색 시작 시 취소 플래그 초기화

        // ========== 타임아웃 타이머 시작 (추가) ==========

        warningTimeoutRef.current = setTimeout(() => {
          if (isLoading) {
            addToast("info", "검색이 오래 걸리고 있습니다.\n30초 후 자동으로 취소됩니다.", "⏳ 잠시만요", 5000);
          }
        }, SEARCH_TIMING.warningTimeoutMs);

        timeoutRef.current = setTimeout(() => {
          handleAutoTimeout();
        }, SEARCH_TIMING.searchTimeoutMs);

        // ================================================

        let consecutivePollErrors = 0;
        const pollInterval = setInterval(async () => {
          const stopPolling = () => {
            clearSearchTimeout();
            clearInterval(pollInterval);
            pollIntervalRef.current = null;
          };

          try {
            const statusRes = await fetch(`/api/search/${data.jobId}`, {
              signal: abortControllerRef.current?.signal,
            });

            if (!statusRes.ok) {
              if (cancelledJobIdRef.current === data.jobId) return;
              let errPayload: { error?: string } = {};
              try {
                errPayload = await statusRes.json();
              } catch {
                /* ignore */
              }
              stopPolling();
              setIsLoading(false);
              setJobStatus(null);
              if (statusRes.status === 404) {
                setError(
                  "검색 작업을 찾을 수 없습니다. 잡이 만료되었거나 서버가 정리했을 수 있습니다. 같은 검색을 다시 시도해 주세요.",
                );
                addToast(
                  "warning",
                  "검색 상태를 불러오지 못했습니다. 같은 키워드로 다시 검색하면 캐시된 결과가 나올 수 있습니다.",
                  "재시도 안내",
                  6000,
                );
              } else {
                const msg =
                  errPayload.error || `상태 조회 실패 (HTTP ${statusRes.status})`;
                setError(msg);
                addToast("error", "검색 상태를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.", "❌ 오류", 5000);
              }
              return;
            }

            consecutivePollErrors = 0;

            const statusData = await statusRes.json();

            // 취소한 job이면 응답 무시 (나중에 도착한 "completed"로 검색 완료 처리하지 않음)
            if (cancelledJobIdRef.current === data.jobId) return;

            // 실시간 상태 업데이트
            if (statusData.status && statusData.queuePosition !== undefined) {
              setJobStatus({
                jobId: data.jobId,
                status: statusData.status as "waiting" | "active" | "delayed" | "paused",
                progress: statusData.progress || 0,
                queuePosition: statusData.queuePosition,
                message: statusData.message || "",
                totalQueueSize: initialQueueSize,
                estimatedWaitSeconds: statusData.estimatedWaitSeconds,
              });
            }

            if (statusData.status === "completed") {
              clearSearchTimeout();
              setIsLoading(false);
              setError("");
              setJobStatus(null);
              clearInterval(pollInterval);
              pollIntervalRef.current = null;

              if (statusData.data && statusData.data.length > 0) {
                const urlStats = statusData.data.reduce(
                  (acc: any, video: Video) => {
                    const raw = video.thumbnail;
                    const thumbnailUrl =
                      typeof raw === "string" ? raw : raw && typeof raw === "object" && "url" in raw ? (raw as { url: string }).url : "";
                    if (thumbnailUrl.includes(".r2.dev")) acc.r2++;
                    else if (thumbnailUrl.includes("tiktokcdn") || thumbnailUrl.includes("douyinpic") || thumbnailUrl.includes("xhscdn"))
                      acc.cdn++;
                    else acc.unknown++;
                    return acc;
                  },
                  { r2: 0, cdn: 0, unknown: 0 },
                );

                console.log(`[Frontend] 📥 Search results received (via polling)`, {
                  platform,
                  query: searchQuery.substring(0, 30),
                  videoCount: statusData.data.length,
                  urlStats,
                });

                setVideos(statusData.data);
                addToast("success", "검색 완료!", `${statusData.data.length}개의 결과를 찾았습니다`);
              } else {
                setVideos([]);
                addToast(
                  "info",
                  "이번 요청에서는 결과 목록이 비어 있습니다. 잠시 후 같은 검색을 다시 하면 캐시에서 불러올 수 있습니다.",
                  "결과 없음",
                  5000,
                );
              }
            } else if (statusData.status === "failed") {
              clearSearchTimeout();
              // 에러 타입에 따라 다른 처리
              const errorMessage = statusData.error || "검색 중 오류가 발생했습니다";
              const errorType = statusData.errorType || "UNKNOWN_ERROR";

              setError(errorMessage);
              setIsLoading(false);
              setJobStatus(null);
              clearInterval(pollInterval);
              pollIntervalRef.current = null;

              // 에러 타입별 토스트 메시지 표시
              if (errorType === "RATE_LIMIT") {
                addToast("warning", "검색 API 할당량이 제한되었습니다. 30초 후 다시 시도해주세요.", "⏳ 잠시만요");
              } else if (errorType === "NETWORK_ERROR") {
                addToast("error", "네트워크 연결을 확인해주세요.", "❌ 연결 오류");
              } else if (errorType === "AUTH_ERROR") {
                addToast("error", "API 인증에 실패했습니다. 관리자에게 연락해주세요.", "❌ 인증 오류");
              } else if (errorType === "APIFY_ERROR") {
                addToast("warning", "검색 서비스가 일시적으로 불안정합니다.\n몇 분 후 다시 시도해주세요.", "🔧 서비스 점검 중");
              } else if (errorType === "NO_RESULTS") {
                addToast("info", "검색어를 바꿔서 다시 시도해보세요.", "🔍 결과 없음");
              } else {
                addToast("error", "검색 중 오류가 발생했습니다.", "❌ 오류");
              }
            }
          } catch (err) {
            if (err instanceof Error && err.name === "AbortError") return;
            console.error("[Poll] Error:", err);
            consecutivePollErrors += 1;
            if (consecutivePollErrors >= 5) {
              stopPolling();
              setIsLoading(false);
              setJobStatus(null);
              setError("검색 상태를 여러 번 불러오지 못했습니다. 네트워크를 확인한 뒤 다시 검색해 주세요.");
              addToast("error", "연결이 불안정합니다. 다시 검색해 주세요.", "네트워크 오류", 5000);
            }
          }
        }, SEARCH_TIMING.pollIntervalMs);

        pollIntervalRef.current = pollInterval;

        // 정리 함수: 폴링 중단
        abortControllerRef.current = new AbortController();
      } else {
        setVideos([]);
        setError(data.error || "검색 결과가 없습니다");
        setIsLoading(false);
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("[Search] 사용자가 검색을 취소했습니다.");
        addToast("info", "검색이 취소되었습니다.", "⏹️ 취소됨");
      } else {
        console.error("검색 오류:", error);

        // 에러 메시지를 사용자 친화적으로 변환
        let userMessage = "검색 중 오류가 발생했습니다.";

        if (error instanceof Error) {
          // 할당량 초과 (429 - 사용자 검색 한도)
          if ((error as any).status === 429 && error.message.includes("일일 검색 한도")) {
            const details = (error as any).details;
            userMessage = `일일 검색 한도를 초과했습니다.\n(${details?.used}/${details?.limit} 사용됨)`;
            addToast("error", `일일 검색 한도를 모두 사용했습니다!\n내일 자정에 리셋됩니다.`, "🔒 한도 초과");
          } else if (error.message.includes("Failed to fetch")) {
            userMessage = "네트워크 연결이 불안정합니다.\n잠시 후 다시 시도해주세요.";
            addToast("warning", "네트워크 연결을 확인해주세요.", "📡 네트워크 오류");
          } else if (error.message.includes("429")) {
            userMessage = "검색 서버가 과부하 상태입니다.\n30초 후 다시 시도해주세요.";
            addToast("warning", "검색 서버가 잠시 혼잡합니다. 30초 후 다시 시도해주세요.", "⏳ 잠시만요");
          } else {
            userMessage = error.message;
          }
        }

        setError(userMessage);
        setVideos([]);
      }
      setIsLoading(false);
    }
  }, [platform, targetLanguage, searchHistory, filters.uploadPeriod, addToast, clearSearchTimeout, handleAutoTimeout]);

  const debouncedSearch = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch();
    }, SEARCH_TIMING.debounceMs);
  }, [handleSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading && !isTranslating) {
      debouncedSearch();
    }
  };

  // 히스토리 항목 클릭 - 검색 입력 필드에만 값 설정
  const handleHistoryClick = useCallback((keyword: string) => {
    setSearchInput(keyword);
  }, []);

  const handleDeleteHistory = useCallback((e: React.MouseEvent, keyword: string) => {
    e.stopPropagation();
    setSearchHistory((prev) => {
      const next = prev.filter((item) => item !== keyword);
      localStorage.setItem(STORAGE_KEYS.searchHistory, JSON.stringify(next));
      return next;
    });
  }, []);

  const handleVideoDownload = () => {
    setIsDownloadModalOpen(true);
  };

  const handleDownloadFromUrl = useCallback(
    async (video: any) => {
      setIsDownloading(true);

      try {
        if (!video.videoUrl) {
          throw new Error("영상 다운로드 정보를 불러올 수 없습니다.");
        }

        const response = await fetch("/api/download-video", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            videoUrl: video.videoUrl,
            videoId: video.id,
            platform,
            webVideoUrl: video.webVideoUrl,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "다운로드 실패");
        }

        // 바이너리 데이터로 다운로드
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${platform}_${video.id}.mp4`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        addToast("success", "영상 다운로드가 완료되었습니다!", "✅ 완료");
        setIsDownloadModalOpen(false);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "다운로드 중 오류가 발생했습니다";
        addToast("error", errorMessage, "❌ 오류");
      } finally {
        setIsDownloading(false);
      }
    },
    [addToast, platform],
  );

  const handleExcelDownload = () => {
    if (results.length === 0) {
      setError("검색 결과가 없습니다");
      return;
    }

    const csvHeader = [
      "제목",
      "크리에이터",
      "팔로워수",
      "게시일시",
      "영상길이",
      "조회수",
      "좋아요",
      "댓글",
      "공유",
      "참여율(%)",
      "설명",
      "해시태그",
      "링크",
    ];
    const csvRows: string[][] = [];

    (results as Video[]).forEach((video) => {
      const engagementRate =
        video.playCount > 0 ? (((video.likeCount + video.commentCount + video.shareCount) / video.playCount) * 100).toFixed(2) : "-";
      const videoDurationStr = formatVideoDuration(video.videoDuration);

      csvRows.push([
        `"${video.title.replace(/"/g, '""')}"`,
        `"${video.creator.replace(/"/g, '""')}"`,
        video.followerCount ? video.followerCount.toString() : "-",
        formatDateWithTime(video.createTime),
        videoDurationStr,
        video.playCount.toString(),
        video.likeCount.toString(),
        video.commentCount.toString(),
        video.shareCount.toString(),
        engagementRate,
        `"${video.description.substring(0, 100).replace(/"/g, '""')}"`,
        `"${video.hashtags.join(", ")}"`,
        `"${video.webVideoUrl || video.videoUrl || ""}"`,
      ]);
    });

    const csv = [csvHeader.join(","), ...csvRows.map((row) => row.join(","))].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${platform}-videos-${new Date().toISOString().split("T")[0]}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 🆕 링크 갱신 트리거 및 완료 대기 (CDN URL 만료 시 자동 갱신)
  const handleRecrawl = useCallback(async (query: string, platform: Platform, dateRange: string): Promise<{ success: boolean; videos?: Video[] }> => {
    try {
      console.log("[Refresh] Starting refresh for:", query, platform, dateRange);
      addToast("info", "링크를 갱신하는 중입니다...", "⏳ 잠시만 기다려주세요", 5000);

      // 갱신 API 호출
      const response = await fetch("/api/recrawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, platform, dateRange }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("[Refresh] API error:", error);
        throw new Error(error.error || "링크 갱신에 실패했습니다");
      }

      const data = await response.json();
      const jobId = data.jobId;

      console.log("[Refresh] Job started:", jobId);

      // Job 상태 폴링 (최대 30초 - Railway 타임아웃 120초 고려)
      const maxAttempts = 15; // 2초 × 15 = 30초
      let attempt = 0;

      while (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // 2초 대기

        const statusRes = await fetch(`/api/search/${jobId}`);
        const statusData = await statusRes.json();

        console.log(`[Refresh] Poll attempt ${attempt + 1}/${maxAttempts}, status:`, statusData.status);

        if (statusData.status === "completed") {
          console.log("[Refresh] ✅ Completed");

          // ✅ 새로운: 최신 비디오 데이터 가져오기
          const freshVideos = statusData.data || [];
          console.log("[Refresh] Fresh videos count:", freshVideos.length);
          console.log("[Refresh] DEBUG: statusData structure:", {
            hasData: !!statusData.data,
            isArray: Array.isArray(freshVideos),
            length: freshVideos.length,
            firstVideoId: freshVideos[0]?.id,
            firstVideoTitle: freshVideos[0]?.title?.substring(0, 50),
          });

          addToast("success", "최신 링크로 갱신되었습니다!", "✅ 완료", 3000);

          return { success: true, videos: freshVideos };
        }

        if (statusData.status === "failed") {
          console.error("[Refresh] Failed:", statusData.error);
          addToast("error", statusData.error || "데이터를 가져오는데 실패했습니다", "❌ 실패", 5000);
          return { success: false };
        }

        attempt++;
      }

      // 타임아웃
      console.warn("[Refresh] Timeout after 30 seconds");
      addToast("warning", "서버가 느리게 응답하고 있습니다. 잠시 후 다시 시도해주세요.", "⏱️ 타임아웃", 5000);
      return { success: false };
    } catch (error) {
      console.error("[Refresh] Error:", error);
      const errorMsg = error instanceof Error ? error.message : "알 수 없는 오류";
      addToast("error", errorMsg, "❌ 오류", 5000);
      return { success: false };
    }
  }, [addToast]);

  // 영상으로 이동: 바로 해당 URL로 새 탭 열기
  const handleOpenVideo = useCallback((video: Video) => {
    if (video.webVideoUrl) {
      window.open(video.webVideoUrl, "_blank", "noopener,noreferrer");
    }
  }, []);

  // 영상 다운로드 (클립보드 복사 + 외부 다운로더 열기)
  const handleDownloadVideo = useCallback(async (video: Video) => {
    if (!video.videoUrl && !video.webVideoUrl) {
      addToast("error", "영상 다운로드 정보를 불러올 수 없습니다.", "❌ 오류");
      return;
    }

    setDownloadingVideoId(video.id);

    try {
      console.log("[Download] API를 통한 다운로드:", video.id);

      const response = await fetch("/api/download-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: video.videoUrl,
          videoId: video.id,
          platform,
          webVideoUrl: video.webVideoUrl,
        }),
      });

      // 🆕 403 에러 시 자동 링크 갱신 후 1회 재시도
      if (response.status === 403) {
        const errorData = await response.json();

        if (errorData.needsRecrawl) {
          console.log("[Download] 403 detected, triggering auto-refresh");

          // ✅ 갱신 cooldown 확인 (같은 검색에 대한 중복 갱신 방지)
          const cacheKey = `${platform}:${searchInputRef.current}:${filters.uploadPeriod}`;
          const lastRecrawlTime = recrawlCooldownRef.current.get(cacheKey);
          const now = Date.now();
          const COOLDOWN_MS = 1 * 60 * 1000; // 1분 (갱신 완료 후 중복 방지용)

          if (lastRecrawlTime && now - lastRecrawlTime < COOLDOWN_MS) {
            const waitSeconds = Math.ceil((COOLDOWN_MS - (now - lastRecrawlTime)) / 1000);
            console.log(`[Download] Refresh cooldown active, wait ${waitSeconds}s more`);
            addToast("warning", `방금 링크 갱신을 시도했습니다. ${waitSeconds}초 후 다시 시도해주세요.`, "⏳ 재시도 필요", 5000);
            setDownloadingVideoId(null);
            return;
          }

          addToast("info", "링크가 만료되어 최신 링크로 갱신 중입니다.", "🔄 링크 갱신", 4000);

          // 링크 갱신 실행 (현재 검색어와 필터 사용)
          // ⚠️ 중요: setDownloadingVideoId(null) 하지 않음 (즉시 재시도 가능하게)
          const result = await handleRecrawl(searchInputRef.current, platform, filters.uploadPeriod);

          if (result.success && result.videos) {
            console.log("[Download] Refresh completed, searching for fresh video data...");
            console.log("[Download] DEBUG: Video matching info:", {
              originalVideoId: video.id,
              freshVideosCount: result.videos.length,
              freshVideoIds: result.videos.slice(0, 3).map((v) => v.id),
              idMatch: result.videos.some((v) => v.id === video.id),
            });

            // ✅ ID로 새 결과에서 같은 비디오 찾기
            const freshVideo = result.videos.find((v) => v.id === video.id);

            if (freshVideo) {
              console.log("[Download] Fresh video found, retrying with new URL");
              recrawlCooldownRef.current.set(cacheKey, Date.now());

              addToast("info", "최신 링크로 다시 다운로드를 시도합니다...", "🔄 다시 시도", 2000);

              setDownloadingVideoId(null);
              await new Promise((resolve) => setTimeout(resolve, 2000));

              // ✅ 최신 video 객체로 재시도
              return handleDownloadVideo(freshVideo);
            } else {
              console.warn("[Download] Video not found in fresh results");
              addToast("warning", "링크 갱신 후 해당 영상을 찾을 수 없습니다.", "⚠️ 경고", 5000);
            }
          } else {
            // 링크 갱신 실패: cooldown 무효화 (더 빨리 재시도 가능하게)
            recrawlCooldownRef.current.delete(cacheKey);

            console.error("[Download] Refresh failed");
            addToast("error", "링크를 갱신하지 못했습니다. 잠시 후 다시 시도해주세요.", "❌ 링크 갱신 실패", 5000);
          }
        } else {
          throw new Error("영상을 불러올 수 없습니다.");
        }
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "다운로드 실패");
      }

      // Blob으로 변환
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // 플랫폼별 파일명 설정
      const filePrefix = platform === "douyin" ? "douyin" : "tiktok";
      link.download = `${filePrefix}_${video.id}.mp4`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log("[Download] ✅ 다운로드 완료:", video.title);
      addToast("success", "영상이 다운로드 폴더에 저장되었습니다", "✅ 다운로드 완료", 3000);
    } catch (error) {
      console.error("[Download] Error:", error);
      const errorMsg = error instanceof Error ? error.message : "알 수 없는 오류";
      addToast("error", errorMsg, "❌ 다운로드 실패", 5000);
    } finally {
      setDownloadingVideoId(null);
    }
  }, [addToast, platform, filters.uploadPeriod, handleRecrawl]);

  // 자막 추출 핸들러 (Whisper AI 사용)
  const handleExtractSubtitles = useCallback(async (video: Video) => {
    if (platform !== "tiktok" && platform !== "douyin") {
      addToast("info", "자막 추출은 TikTok, Douyin만 지원합니다.", "ℹ️ 안내");
      return;
    }

    if (!video.videoUrl && !video.webVideoUrl) {
      addToast("error", "영상 정보를 불러올 수 없습니다.", "❌ 오류");
      return;
    }

    setExtractingSubtitleId(video.id);

    try {
      const response = await fetch("/api/extract-subtitles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: video.videoUrl,
          videoId: video.id,
          platform,
          webVideoUrl: video.webVideoUrl,
          format: "text",
        }),
      });

      // 🆕 403 에러 시 자동 링크 갱신 후 1회 재시도
      if (response.status === 403) {
        const errorData = await response.json();

        if (errorData.needsRecrawl) {
          console.log("[ExtractSubtitles] 403 detected, triggering auto-refresh");

          // ✅ 갱신 cooldown 확인 (5분 이내 중복 갱신 방지)
          const cacheKey = `${platform}:${searchInputRef.current}:${filters.uploadPeriod}`;
          const lastRecrawlTime = recrawlCooldownRef.current.get(cacheKey);
          const now = Date.now();
          const COOLDOWN_MS = 5 * 60 * 1000; // 5분

          if (lastRecrawlTime && now - lastRecrawlTime < COOLDOWN_MS) {
            const waitSeconds = Math.ceil((COOLDOWN_MS - (now - lastRecrawlTime)) / 1000);
            console.log(`[ExtractSubtitles] Refresh cooldown active, wait ${waitSeconds}s more`);
            addToast("warning", `방금 링크 갱신을 시도했습니다. ${waitSeconds}초 후 다시 시도해주세요.`, "⏳ 재시도 필요", 5000);
            setExtractingSubtitleId(null);
            return;
          }

          // Cooldown 시간 기록
          recrawlCooldownRef.current.set(cacheKey, now);

          addToast("info", "링크가 만료되어 최신 링크로 갱신 중입니다.", "🔄 링크 갱신", 4000);

          const result = await handleRecrawl(searchInputRef.current, platform, filters.uploadPeriod);

          if (result.success && result.videos) {
            console.log("[ExtractSubtitles] Refresh completed, searching for fresh video data...");

            // ✅ ID로 새 결과에서 같은 비디오 찾기
            const freshVideo = result.videos.find((v) => v.id === video.id);

            if (freshVideo) {
              console.log("[ExtractSubtitles] Fresh video found, retrying with new URL");

              addToast("info", "최신 링크로 다시 자막 추출을 시도합니다...", "🔄 다시 시도", 2000);

              setExtractingSubtitleId(null);
              await new Promise((resolve) => setTimeout(resolve, 2000));

              // ✅ 최신 video 객체로 재시도
              return handleExtractSubtitles(freshVideo);
            } else {
              console.warn("[ExtractSubtitles] Video not found in fresh results");
              addToast("warning", "링크 갱신 후 해당 영상을 찾을 수 없습니다.", "⚠️ 경고", 5000);
            }
          } else {
            // 링크 갱신 실패
            console.error("[ExtractSubtitles] Refresh failed");
            addToast("error", "링크를 갱신하지 못했습니다. 잠시 후 다시 시도해주세요.", "❌ 링크 갱신 실패", 5000);
          }
        } else {
          throw new Error("영상을 불러올 수 없습니다.");
        }
        return;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "자막 추출 실패");
      }

      // 텍스트 파일 다운로드 (플랫폼별 파일명)
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const filePrefix = platform === "douyin" ? "douyin" : "tiktok";
      link.download = `${filePrefix}_${video.id}_subtitles.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      addToast("success", "자막 파일이 다운로드 폴더에 저장되었습니다", "✅ 자막 추출 완료", 3000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "알 수 없는 오류";
      addToast("error", errorMsg, "❌ 자막 추출 실패", 5000);
    } finally {
      setExtractingSubtitleId(null);
    }
  }, [addToast, platform, filters.uploadPeriod, handleRecrawl]);

  // 영상 상세 페이지 모달 (간단한 버전)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  return (
    <>
      <Toast toasts={toasts} onRemove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} position="top-center" />
      <div className="dashboard-shell">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar-inner">
            <div className="dashboard-topbar-brand">
              <span
                className="dashboard-wordmark"
                onClick={handleTitleClick}
                style={{ cursor: "pointer", transition: "opacity 0.3s", opacity: isTitleRefreshing ? 0.5 : 1 }}
              >
                숏마마
              </span>
              <span className="dashboard-tagline">숏폼 검색·분석</span>
            </div>
            <div className="dashboard-topbar-actions">
              <div className="subscription-status-wrap">
                <button type="button" className="btn-subscription" onClick={() => setShowSubscriptionModal(true)}>
                  구독
                </button>
                <span className={`subscription-status-badge ${isSubscribed && subscriptionPlanName ? "subscribed" : "unsubscribed"}`}>
                  {isSubscribed === null ? "—" : isSubscribed && subscriptionPlanName ? subscriptionPlanName : "미구독 중"}
                </span>
              </div>
              <UserDropdown onOpenSubscription={() => setShowSubscriptionModal(true)} />
            </div>
          </div>
        </header>

        <div className="main-container">
        <div className="workspace-scroll">
        {/* 상단 검색 리본 — 좌측 사이드바 대신 SaaS형 상단 바 */}
        <div className="search-ribbon">
          <div className="search-ribbon-inner">
            <div className="search-ribbon-stack">
              <div className="search-ribbon-search search-ribbon-search--hero">
                <div className="search-container-with-button search-input-group search-ribbon-input search-hero-input">
                  <div className="search-container">
                    <input
                      type="text"
                      className="search-input"
                      placeholder="검색어를 입력하세요"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    {searchHistory.length > 0 && searchInput === "" && (
                      <div className="search-history-dropdown active">
                        {searchHistory.map((keyword) => (
                          <div key={keyword} className="history-item" onClick={() => handleHistoryClick(keyword)}>
                            <span>{keyword}</span>
                            <button type="button" className="history-delete" onClick={(e) => handleDeleteHistory(e, keyword)} title="삭제">
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button type="button" className="btn-search btn-search--inline btn-search--hero" onClick={debouncedSearch} disabled={isTranslating || isLoading}>
                    {isTranslating ? "번역 중" : isLoading ? "검색 중" : "검색"}
                  </button>
                </div>
              </div>

              <div className="ribbon-tray-inner ribbon-tray-inner--single-line" aria-label="검색 소스 및 조건">
                <div className="ribbon-tray-inline-group">
                  <span className="ribbon-inline-label">플랫폼</span>
                  <div className="platform-selector platform-selector--segmented platform-selector--two platform-selector--ribbon platform-selector--inline-row">
                    <label className={`platform-option ${platform === "tiktok" ? "active" : ""}`} onClick={() => setPlatform("tiktok")}>
                      <input type="radio" name="platform" value="tiktok" checked={platform === "tiktok"} onChange={() => setPlatform("tiktok")} style={{ display: "none" }} />
                      <Music2 className="platform-lucide" strokeWidth={2} aria-hidden />
                      <span className="platform-name">TikTok</span>
                    </label>
                    <label className={`platform-option ${platform === "douyin" ? "active" : ""}`} onClick={() => setPlatform("douyin")}>
                      <input type="radio" name="platform" value="douyin" checked={platform === "douyin"} onChange={() => setPlatform("douyin")} style={{ display: "none" }} />
                      <Globe2 className="platform-lucide" strokeWidth={2} aria-hidden />
                      <span className="platform-name">Douyin</span>
                    </label>
                  </div>
                </div>
                <span className="ribbon-tray-vsep" aria-hidden />
                <div className="ribbon-tray-inline-group">
                  <span className="ribbon-inline-label">언어</span>
                  <div className="platform-selector platform-selector--segmented platform-selector--three platform-selector--ribbon platform-selector--inline-row">
                    <label className={`platform-option ${targetLanguage === "ko" ? "active" : ""}`} onClick={() => setTargetLanguage("ko")}>
                      <input type="radio" name="language" value="ko" checked={targetLanguage === "ko"} onChange={() => setTargetLanguage("ko")} style={{ display: "none" }} />
                      <span className="platform-lang-code">KO</span>
                      <span className="platform-name platform-name--inline">한국어</span>
                    </label>
                    <label className={`platform-option ${targetLanguage === "zh" ? "active" : ""}`} onClick={() => setTargetLanguage("zh")}>
                      <input type="radio" name="language" value="zh" checked={targetLanguage === "zh"} onChange={() => setTargetLanguage("zh")} style={{ display: "none" }} />
                      <span className="platform-lang-code">ZH</span>
                      <span className="platform-name platform-name--inline">中文</span>
                    </label>
                    <label className={`platform-option ${targetLanguage === "en" ? "active" : ""}`} onClick={() => setTargetLanguage("en")}>
                      <input type="radio" name="language" value="en" checked={targetLanguage === "en"} onChange={() => setTargetLanguage("en")} style={{ display: "none" }} />
                      <span className="platform-lang-code">EN</span>
                      <span className="platform-name platform-name--inline">영어</span>
                    </label>
                  </div>
                </div>
                <span className="ribbon-tray-vsep" aria-hidden />
                <button
                  type="button"
                  className={`ribbon-filter-btn${filters.uploadPeriod !== "all" ? " ribbon-filter-btn--active" : ""}`}
                  onClick={() => setFilterDrawerOpen(true)}
                  title="기간 등 검색 조건"
                >
                  <SlidersHorizontal size={16} aria-hidden />
                  조건
                  {filters.uploadPeriod !== "all" && <span className="ribbon-filter-dot" />}
                </button>
              </div>
            </div>

            <div className={`douyin-lang-tip douyin-lang-tip--ribbon${platform === "douyin" && targetLanguage !== "zh" ? " douyin-lang-tip--visible" : ""}`}>
              {platform === "douyin" && targetLanguage !== "zh" && (
                <span className="douyin-lang-tip-text">
                  <Lightbulb size={14} className="douyin-lang-tip-icon" aria-hidden />
                  Douyin은 중국어 검색이 더 정확합니다
                </span>
              )}
            </div>

            {showTranslationPanel && (
              <div className="translation-panel translation-panel--ribbon">
                <div className={`translation-panel-original${translatedQuery || isTranslating ? " translation-panel-original--spaced" : ""}`}>
                  <div className="translation-panel-label">
                    <FileText size={12} className="translation-panel-label-icon" aria-hidden />
                    원문 · {detectedLanguage === "ko" ? "한국어" : detectedLanguage === "zh" ? "中文" : "English"}
                  </div>
                  <div className="translation-panel-text">{searchInput}</div>
                </div>

                {isTranslating && (
                  <div className="translation-panel-translating">
                    <Loader className="animate-spin" size={16} aria-hidden />
                    번역 중…
                  </div>
                )}

                {!isTranslating && translatedQuery && translatedQuery !== searchInput && (
                  <>
                    <div className="translation-panel-divider" aria-hidden />
                    <div className="translation-panel-translated">
                      <div className="translation-panel-label translation-panel-label--accent">
                        <Languages size={12} className="translation-panel-label-icon" aria-hidden />
                        번역 · {targetLanguage === "ko" ? "한국어" : targetLanguage === "zh" ? "中文" : "English"}
                      </div>
                      <div className="translation-panel-text">{translatedQuery}</div>
                      <button
                        type="button"
                        className="translation-copy-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(translatedQuery);
                          addToast("success", "번역 결과가 클립보드에 복사되었습니다.", "복사 완료");
                        }}
                      >
                        <Copy size={14} aria-hidden />
                        복사
                      </button>
                    </div>
                  </>
                )}

                {!isTranslating && !translatedQuery && detectedLanguage === targetLanguage && (
                  <div className="translation-panel-info">입력 언어와 검색 언어가 같아 번역을 생략합니다.</div>
                )}

                {!isTranslating && !translatedQuery && detectedLanguage !== targetLanguage && (
                  <div className="translation-panel-pending">검색 시 선택한 언어로 번역한 뒤 결과를 가져옵니다.</div>
                )}
              </div>
            )}

            {error && (
              <div className="ribbon-error-banner" role="alert">
                {error}
              </div>
            )}
          </div>
        </div>

        {filterDrawerOpen && (
          <>
            <button type="button" className="filter-drawer-backdrop" aria-label="닫기" onClick={() => setFilterDrawerOpen(false)} />
            <aside className="filter-drawer" role="dialog" aria-modal="true" aria-labelledby="filter-drawer-title">
              <div className="filter-drawer-header">
                <h2 id="filter-drawer-title" className="filter-drawer-title">
                  검색 조건
                </h2>
                <button type="button" className="filter-drawer-close" onClick={() => setFilterDrawerOpen(false)} aria-label="조건 패널 닫기">
                  <X size={20} strokeWidth={2} />
                </button>
              </div>
              <div className="filter-drawer-body">
                <div className="sidebar-field-label">업로드 기간</div>
                <div className="sidebar-filter-period sidebar-filter-period--drawer">
                  <PeriodFilter
                    value={filters.uploadPeriod}
                    onChange={(value) => setFilters({ ...filters, uploadPeriod: value })}
                    platform={platform}
                  />
                </div>
              </div>
            </aside>
          </>
        )}

        <div className="content content--full">
          <div className={`content-header${isBookmarkView ? " bookmark-view" : ""}`}>
            <div className="content-header-row--top">
              <div className="content-title-block">
                <h1 className={`content-title${isBookmarkView ? " bookmark-view" : ""}`}>
                  {isBookmarkView ? (
                    <>
                      <BookmarkCheck size={20} className="content-title-icon" aria-hidden />
                      찜한 영상
                    </>
                  ) : (
                    "검색 결과"
                  )}
                </h1>
                <p className="content-subtitle">
                  {isBookmarkView ? "저장한 영상만 모아 볼 수 있어요." : "필터와 정렬로 원하는 숏폼만 골라 보세요."}
                </p>
              </div>
            </div>
            <div className="content-toolbar">
            <div className="content-header-row--tools">
              <button className="btn-video-download" onClick={handleVideoDownload}>
                <Download size={16} style={{ display: "inline", marginRight: "4px" }} />
                영상 자막 추출
              </button>
              <button
                className={`btn-bookmarks${isBookmarkView ? " active" : ""}`}
                onClick={handleToggleBookmarkView}
                title="즐겨찾기 목록"
              >
                <Bookmark size={16} style={{ display: "inline", marginRight: "4px" }} />
                찜 목록
              </button>
              {isBookmarkView && (
                <button
                  className="btn-bookmarks"
                  onClick={handleRefreshAllBookmarks}
                  disabled={isRefreshingAllBookmarks}
                  title="찜한 영상 전체 썸네일/프리뷰 새로고침"
                >
                  {isRefreshingAllBookmarks ? (
                    <>
                      <Loader
                        className="card-action-icon animate-spin"
                        style={{ width: 16, height: 16, marginRight: 4, color: "#7c3aed" }}
                      />
                      전체 새로고침 중...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} style={{ display: "inline", marginRight: "4px" }} />
                      전체 새로고침
                    </>
                  )}
                </button>
              )}
              <div ref={viewCountPopoverRef} className="header-filter-popover">
                <button
                  type="button"
                  className={`header-filter-summary${isViewCountPopoverOpen ? " open" : ""}`}
                  onClick={() => setIsViewCountPopoverOpen((prev) => !prev)}
                >
                  조회수{filters.minPlayCount > 0 ? ` (${formatNumber(filters.minPlayCount)}+)` : ""}
                  <span className="header-filter-chevron">▾</span>
                </button>
                {isViewCountPopoverOpen && (
                  <div className="header-filter-dropdown">
                    <div className="header-filter-dropdown-label">조회수</div>
                    <ViewCountFilter
                      minValue={filters.minPlayCount}
                      maxValue={filters.maxPlayCount}
                      onChange={(min, max) => setFilters({ ...filters, minPlayCount: min, maxPlayCount: max })}
                    />
                  </div>
                )}
              </div>
              <select
                className="sort-dropdown header-filter"
                value={filters.videoLength}
                onChange={(e) => setFilters({ ...filters, videoLength: e.target.value })}
                title="영상 길이"
              >
                <option value="all">길이: 전체</option>
                <option value="short">길이: 20초 미만</option>
                <option value="long">길이: 20초 이상</option>
              </select>
              <div ref={engagementPopoverRef} className="header-filter-popover">
                <button
                  type="button"
                  className={`header-filter-summary${isEngagementPopoverOpen ? " open" : ""}`}
                  onClick={() => setIsEngagementPopoverOpen((prev) => !prev)}
                >
                  인기도{filters.engagementScore.length > 0 && !filters.engagementScore.includes("all") ? ` (${filters.engagementScore.length})` : ""}
                  <span className="header-filter-chevron">▾</span>
                </button>
                {isEngagementPopoverOpen && (
                  <div className="header-filter-dropdown">
                    <EngagementRatioFilter
                      selectedValues={filters.engagementScore}
                      onChange={(values) => setFilters({ ...filters, engagementScore: values })}
                    />
                  </div>
                )}
              </div>
              <select className="sort-dropdown" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="plays">조회수순</option>
                <option value="likes">좋아요순</option>
                <option value="comments">댓글순</option>
                <option value="recent">최신순</option>
              </select>
              <button type="button" className="btn-excel" onClick={handleExcelDownload}>
                <Download size={16} style={{ display: "inline", marginRight: "4px" }} />
                엑셀
              </button>
            </div>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: isLoading || results.length === 0 ? "center" : "flex-start",
              justifyContent: "center",
              overflowY: "auto",
            }}
          >
            {isLoading ? (
              <div style={{ width: "100%", maxWidth: "600px" }}>
                <SearchProgress
                  isSearching={isLoading}
                  onCancel={handleCancelSearch}
                  jobStatus={jobStatus?.status}
                  realProgress={jobStatus?.progress}
                  queuePosition={jobStatus?.queuePosition}
                  totalQueueSize={jobStatus?.totalQueueSize}
                  statusMessage={jobStatus?.message}
                  estimatedWaitSeconds={jobStatus?.estimatedWaitSeconds}
                />
              </div>
            ) : results.length === 0 ? (
              <div className="dashboard-empty-state">
                <div className="dashboard-empty-icon-wrap">
                  <SearchIcon className="dashboard-empty-icon" strokeWidth={1.5} aria-hidden />
                </div>
                <p className="dashboard-empty-title">
                  {isBookmarkView ? "찜한 영상이 없습니다" : error ? "검색 결과가 없습니다" : "검색어를 입력하여 시작하세요"}
                </p>
                <p className="dashboard-empty-desc">
                  {isBookmarkView ? "영상 카드의 ☆ 버튼으로 찜할 수 있습니다" : error ? "다른 키워드나 필터로 다시 시도해보세요" : "관심있는 콘텐츠를 찾아보세요"}
                </p>
              </div>
            ) : (
              <SearchResultsGrid
                results={results as Video[]}
                platform={platform}
                playingVideoId={playingVideoId}
                hoveredVideoId={hoveredVideoId}
                previewVideoUrls={previewVideoUrls}
                loadingPreviewId={loadingPreviewId}
                isBookmarkView={isBookmarkView}
                failedThumbnails={failedThumbnails}
                refreshingThumbnailId={refreshingThumbnailId}
                bookmarkedIds={bookmarkedIds}
                downloadingVideoId={downloadingVideoId}
                extractingSubtitleId={extractingSubtitleId}
                videoRefs={videoRefs}
                getDisplayThumbnail={getDisplayThumbnail}
                onVideoCardClick={handleVideoCardClick}
                onVideoCardMouseEnter={handleVideoCardMouseEnter}
                onVideoCardMouseLeave={handleVideoCardMouseLeave}
                onThumbnailError={handleThumbnailError}
                onRefreshBookmarkThumbnail={handleRefreshBookmarkThumbnail}
                onCopyUrl={handleCopyUrl}
                onToggleBookmark={handleToggleBookmark}
                onDownloadVideo={handleDownloadVideo}
                onExtractSubtitles={handleExtractSubtitles}
              />
            )}
          </div>
        </div>
        </div>
      </div>
      </div>

      {/* 상세 모달 */}
      {selectedVideo && (
        <div className="modal-overlay" onClick={() => setSelectedVideo(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* 스크롤 가능한 콘텐츠 */}
            <div className="modal-scroll">
              {/* 썸네일 */}
              {getDisplayThumbnail(selectedVideo, platform) && (
                <img
                  src={getDisplayThumbnail(selectedVideo, platform)!}
                  alt={selectedVideo.title}
                  onError={(e) => handleThumbnailError(selectedVideo, e)}
                  referrerPolicy="no-referrer"
                  style={{
                    width: "100%",
                    height: "240px",
                    objectFit: "cover",
                    borderRadius: "12px",
                    marginBottom: "16px",
                  }}
                />
              )}

              {/* 제목 */}
              <h2 style={{ margin: "0 0 12px 0", fontSize: "18px", color: "#000000", lineHeight: 1.4 }}>{selectedVideo.title}</h2>

              {/* 크리에이터 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 12px",
                  background: "linear-gradient(135deg, rgba(0, 0, 0, 0.03) 0%, rgba(0, 0, 0, 0.02) 100%)",
                  borderRadius: "10px",
                  marginBottom: "16px",
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                }}
              >
                <span style={{ fontSize: "16px" }}>👤</span>
                <div>
                  <div style={{ fontSize: "11px", color: "#6b6b6b", marginBottom: "2px" }}>크리에이터</div>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a1a" }}>{selectedVideo.creator}</div>
                </div>
              </div>

              {/* 통계 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(0, 0, 0, 0.03) 0%, rgba(0, 0, 0, 0.01) 100%)",
                    padding: "12px",
                    borderRadius: "10px",
                    color: "#000000",
                    border: "1px solid rgba(0, 0, 0, 0.08)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <div style={{ fontSize: "11px", opacity: 0.9, marginBottom: "6px", color: "#6b6b6b" }}>조회수</div>
                  <div style={{ fontSize: "20px", fontWeight: "700" }}>
                    {selectedVideo.playCount ? formatNumber(selectedVideo.playCount) : "제공 안 함"}
                  </div>
                </div>
                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(0, 0, 0, 0.03) 0%, rgba(0, 0, 0, 0.01) 100%)",
                    padding: "12px",
                    borderRadius: "10px",
                    color: "#000000",
                    border: "1px solid rgba(0, 0, 0, 0.08)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <div style={{ fontSize: "11px", opacity: 0.9, marginBottom: "6px", color: "#6b6b6b" }}>좋아요</div>
                  <div style={{ fontSize: "20px", fontWeight: "700" }}>{formatNumber(selectedVideo.likeCount)}</div>
                </div>
                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(0, 0, 0, 0.03) 0%, rgba(0, 0, 0, 0.01) 100%)",
                    padding: "12px",
                    borderRadius: "10px",
                    color: "#000000",
                    border: "1px solid rgba(0, 0, 0, 0.08)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <div style={{ fontSize: "11px", opacity: 0.9, marginBottom: "6px", color: "#6b6b6b" }}>댓글</div>
                  <div style={{ fontSize: "20px", fontWeight: "700" }}>{formatNumber(selectedVideo.commentCount)}</div>
                </div>
                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(0, 0, 0, 0.03) 0%, rgba(0, 0, 0, 0.01) 100%)",
                    padding: "12px",
                    borderRadius: "10px",
                    color: "#000000",
                    border: "1px solid rgba(0, 0, 0, 0.08)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <div style={{ fontSize: "11px", opacity: 0.9, marginBottom: "6px", color: "#6b6b6b" }}>공유</div>
                  <div style={{ fontSize: "20px", fontWeight: "700" }}>{formatNumber(selectedVideo.shareCount)}</div>
                </div>
              </div>

              {/* 해시태그 */}
              {selectedVideo.hashtags.length > 0 && (
                <div style={{ marginBottom: "12px" }}>
                  <strong style={{ display: "block", marginBottom: "8px", fontSize: "12px", color: "#1a1a1a" }}>🏷️ 해시태그</strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {selectedVideo.hashtags.map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: "linear-gradient(135deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.02) 100%)",
                          color: "#1a1a1a",
                          padding: "4px 10px",
                          borderRadius: "16px",
                          fontSize: "11px",
                          fontWeight: "600",
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 하단 고정 버튼 */}
            <div className="modal-footer">
              <button
                onClick={() => setSelectedVideo(null)}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: "transparent",
                  color: "#6b6b6b",
                  border: "1px solid rgba(0, 0, 0, 0.12)",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
                  e.currentTarget.style.color = "#000000";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#6b6b6b";
                }}
              >
                닫기
              </button>
              <button
                onClick={() => {
                  handleOpenVideo(selectedVideo);
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "linear-gradient(135deg, #000000 0%, #1a1a1a 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                }}
              >
                🔗 {platform === "douyin" ? "도우인" : "TikTok"}에서 열기
              </button>
              <button
                onClick={() => {
                  if (selectedVideo) handleDownloadVideo(selectedVideo);
                }}
                disabled={selectedVideo ? downloadingVideoId === selectedVideo.id : true}
                style={{
                  flex: 1,
                  padding: "10px",
                  background:
                    selectedVideo && downloadingVideoId === selectedVideo.id
                      ? "linear-gradient(135deg, #9ca3af 0%, #c0c0c0 100%)"
                      : "linear-gradient(135deg, #6b6b6b 0%, #9ca3af 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: selectedVideo && downloadingVideoId === selectedVideo.id ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                  opacity: selectedVideo && downloadingVideoId === selectedVideo.id ? 0.6 : 1,
                  boxShadow: selectedVideo && downloadingVideoId === selectedVideo.id ? "none" : "0 4px 12px rgba(0, 0, 0, 0.15)",
                }}
              >
                {selectedVideo && downloadingVideoId === selectedVideo.id ? "⏳ 준비 중..." : "⬇️ 다운로드"}
              </button>

              {/* TikTok, Douyin 자막 추출 버튼 */}
              {(platform === "tiktok" || platform === "douyin") && selectedVideo && (
                <button
                  onClick={() => handleExtractSubtitles(selectedVideo)}
                  disabled={extractingSubtitleId === selectedVideo.id}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background:
                      extractingSubtitleId === selectedVideo.id
                        ? "linear-gradient(135deg, #9ca3af 0%, #c0c0c0 100%)"
                        : "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: extractingSubtitleId === selectedVideo.id ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                    opacity: extractingSubtitleId === selectedVideo.id ? 0.6 : 1,
                  }}
                >
                  {extractingSubtitleId === selectedVideo.id ? "⏳ 추출 중..." : "📝 자막 추출"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 영상 자막 추출 모달 */}
      <DownloadVideoModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        onDownload={handleDownloadFromUrl}
        isLoading={isDownloading}
      />

      {/* 구독 결제 모달 */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </>
  );
}
