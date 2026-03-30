"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 mt-12 bg-gradient-to-r from-zinc-50 to-violet-50/40">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 items-center mb-4 text-sm leading-tight justify-center text-zinc-600">
          <Link href="/pricing" className="hover:text-violet-700 transition-colors font-medium">
            요금제
          </Link>
          <span className="text-zinc-300">|</span>

          <Link href="/dashboard" className="hover:text-violet-700 transition-colors font-medium">
            대시보드
          </Link>
          <span className="text-zinc-300">|</span>

          <a href="mailto:synergynano2026@gmail.com" className="hover:text-violet-700 transition-colors font-medium">
            고객문의
          </a>
          <span className="text-zinc-300">|</span>

          <Link href="/" className="hover:text-violet-700 transition-colors font-medium">
            제휴/입점
          </Link>
          <span className="text-zinc-300">|</span>

          <Link href="/terms" className="hover:text-violet-700 transition-colors font-medium">
            이용약관
          </Link>
          <span className="text-zinc-300">|</span>

          <Link href="/privacy" className="hover:text-violet-700 transition-colors font-medium">
            개인정보처리방침
          </Link>
          <span className="text-zinc-300">|</span>

          <Link href="/refund-policy" className="hover:text-violet-700 transition-colors font-medium">
            환불정책
          </Link>
          <span className="text-zinc-300">|</span>

          <Link href="/" className="hover:text-violet-700 transition-colors font-medium">
            공지사항
          </Link>
        </div>

        <div className="border-t border-zinc-200 my-8" />

        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs mb-6 text-zinc-600">
            <div>
              <p className="text-zinc-400 mb-1">상호</p>
              <p className="text-zinc-800 font-medium">씨너지나노 (SYNERGY NANO)</p>
            </div>
            <div>
              <p className="text-zinc-400 mb-1">대표자</p>
              <p className="text-zinc-800 font-medium">권오룡</p>
            </div>
            <div>
              <p className="text-zinc-400 mb-1">사업자등록번호</p>
              <p className="text-zinc-800 font-medium">299-86-03770</p>
            </div>
            <div>
              <p className="text-zinc-400 mb-1">이메일</p>
              <p className="text-zinc-800 font-medium">sinmok84@hanmil.net</p>
            </div>
          </div>

          <p className="text-zinc-500 text-xs leading-relaxed">
            주소: 세종특별자치시 갈매로 363, 405호 |
            <span className="inline-block ml-2">운영시간: 월-금 10:00-18:00 (공휴일 제외)</span>
          </p>
        </div>

        <div className="border-t border-zinc-200 my-6" />

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 text-xs text-zinc-400">
          <p>© 2025 ShortMama. All rights reserved.</p>
          <p>TikTok, Douyin은 각 회사의 상표입니다.</p>
        </div>
      </div>
    </footer>
  );
}
