import type { Metadata } from "next";
import { SITE_ORIGIN } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "영상 검색 | 숏마마",
  description: "TikTok, Douyin의 인기 있는 영상을 검색하세요.",
  alternates: {
    canonical: `${SITE_ORIGIN}/search`,
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
