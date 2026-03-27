"use client";

import Link from "next/link";
import LegalPageLayout from "@/app/components/layout/LegalPageLayout";

const LAST_UPDATED = "2026-02-11";

export default function ContactPage() {
  return (
    <LegalPageLayout>
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold gradient-text">고객센터 / 사업자 정보</h1>
        <p className="text-zinc-600 text-sm">최근 수정일: {LAST_UPDATED}</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-teal-800">1. 고객센터</h2>
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-2 text-zinc-700">
          <p>
            <strong>문의 이메일:</strong>{" "}
            <a
              href="mailto:synergynano2026@gmail.com"
              className="text-teal-600 hover:text-teal-700 font-medium"
            >
              synergynano2026@gmail.com
            </a>
          </p>
          <p>
            <strong>운영시간:</strong> 월-금 10:00 ~ 18:00 (공휴일 제외)
          </p>
          <p className="text-zinc-600 text-sm">
            환불/해지/결제 관련 문의는 이메일로 접수해 주시면 영업일 기준 1-2일 내 회신드립니다.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-teal-800">2. 사업자 정보</h2>
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-zinc-700 text-sm">
          <div>
            <p className="text-zinc-500 text-xs mb-1">상호</p>
            <p className="font-semibold text-zinc-900">씨너지나노 (SYNERGY NANO)</p>
          </div>
          <div>
            <p className="text-zinc-500 text-xs mb-1">대표자</p>
            <p className="font-semibold text-zinc-900">권오룡</p>
          </div>
          <div>
            <p className="text-zinc-500 text-xs mb-1">사업자등록번호</p>
            <p className="font-semibold text-zinc-900">299-86-03770</p>
          </div>
          <div>
            <p className="text-zinc-500 text-xs mb-1">주소</p>
            <p className="font-semibold text-zinc-900">세종특별자치시 갈매로 363, 405호</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-teal-800">3. 정책 문서</h2>
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 flex flex-wrap gap-3 text-sm">
          <Link href="/pricing" className="text-teal-600 hover:text-teal-700 underline underline-offset-4 font-medium">
            요금제/상품 상세
          </Link>
          <Link href="/refund-policy" className="text-teal-600 hover:text-teal-700 underline underline-offset-4 font-medium">
            환불정책
          </Link>
          <Link href="/terms" className="text-teal-600 hover:text-teal-700 underline underline-offset-4 font-medium">
            이용약관
          </Link>
          <Link href="/privacy" className="text-teal-600 hover:text-teal-700 underline underline-offset-4 font-medium">
            개인정보처리방침
          </Link>
        </div>
      </section>
    </LegalPageLayout>
  );
}
