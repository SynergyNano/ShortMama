import Link from "next/link";
import type { ReactNode } from "react";

type LegalPageLayoutProps = {
  children: ReactNode;
};

export default function LegalPageLayout({ children }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-teal-50/40 via-white to-emerald-50/35">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute w-[520px] h-[520px] bg-teal-400/20 rounded-full blur-[120px] -top-48 -right-24" />
        <div className="absolute w-[480px] h-[480px] bg-emerald-400/15 rounded-full blur-[110px] -bottom-40 -left-20" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-2.5 text-sm font-semibold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-xl transition-colors shadow-sm"
          >
            ← 메인으로
          </Link>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-zinc-200/90 shadow-xl shadow-zinc-900/[0.06] p-8 md:p-12 text-zinc-900 space-y-8">
          {children}
        </div>
      </div>
    </div>
  );
}
