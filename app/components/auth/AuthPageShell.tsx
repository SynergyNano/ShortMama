import Link from "next/link";
import type { ReactNode } from "react";

const SUPPORT_EMAIL = "synergynano2026@gmail.com";

type AuthPageShellProps = {
  subtitle: string;
  children: ReactNode;
};

export default function AuthPageShell({ subtitle, children }: AuthPageShellProps) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-violet-100/50 via-purple-50/30 to-white flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute w-[520px] h-[520px] bg-violet-400/25 rounded-full blur-[120px] -top-48 -right-24" />
        <div className="absolute w-[480px] h-[480px] bg-fuchsia-400/20 rounded-full blur-[110px] -bottom-40 -left-20" />
        <div className="absolute w-[360px] h-[360px] bg-purple-300/18 rounded-full blur-[90px] top-1/3 left-1/4" />
      </div>
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.45]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(24,24,27,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(24,24,27,0.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-800 via-purple-600 to-fuchsia-600 mb-2">
            숏마마
          </h1>
          <p className="text-zinc-600 text-base md:text-lg">{subtitle}</p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-zinc-200/90 shadow-xl shadow-zinc-900/[0.06] p-8">
          {children}
        </div>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-xl transition-colors shadow-sm"
          >
            ← 메인으로
          </Link>
        </div>

        <div className="text-center mt-6 text-sm text-zinc-500">
          <p>
            문제가 있으신가요?{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-violet-600 hover:text-violet-700 font-medium transition-colors"
            >
              고객 지원
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
