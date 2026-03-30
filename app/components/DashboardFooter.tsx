"use client";

import Link from "next/link";

export default function DashboardFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 items-center mb-6 text-sm leading-tight justify-center">
          <Link href="/pricing" className="text-gray-600 hover:text-violet-700 transition-colors">
            요금제
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/refund-policy" className="text-gray-600 hover:text-violet-700 transition-colors">
            환불정책
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/terms" className="text-gray-600 hover:text-violet-700 transition-colors">
            이용약관
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/privacy" className="text-gray-600 hover:text-violet-700 transition-colors">
            개인정보처리방침
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/contact" className="text-gray-600 hover:text-violet-700 transition-colors">
            고객센터
          </Link>
        </div>

        <div className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs mb-4">
            <div>
              <p className="text-gray-500 mb-1">상호</p>
              <p className="text-gray-800">씨너지나노 (SYNERGY NANO)</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">대표자</p>
              <p className="text-gray-800">권오룡</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">사업자등록번호</p>
              <p className="text-gray-800">299-86-03770</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">이메일</p>
              <p className="text-gray-800">sinmok84@hanmil.net</p>
            </div>
          </div>

          <p className="text-gray-600 text-xs leading-relaxed">
            주소: 세종특별자치시 갈매로 363, 405호 |
            <span className="inline-block ml-2">운영시간: 월-금 10:00-18:00 (공휴일 제외)</span>
          </p>
        </div>

        <div className="border-t border-gray-200 my-4" />

        <div className="text-xs text-gray-500 text-center">
          <p>© 2025 ShortMama. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
