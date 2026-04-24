/**
 * 영상 검색 결과 공통 타입
 */
export interface VideoResult {
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
  /** Actor 가 생성한 재생 가능 URL. Railway `/v/<id>?u=...&s=...` 서명 프록시 URL 또는 (레거시) Apify KV 미러 URL. */
  previewVideoUrl?: string;
}

export type Platform = 'tiktok' | 'douyin';
