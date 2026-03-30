import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LoginForm from "@/app/components/auth/LoginForm";
import AuthPageShell from "@/app/components/auth/AuthPageShell";

export const metadata = {
  title: "로그인 | 숏마마",
  description: "숏마마 계정으로 로그인하세요",
};

type Props = { searchParams: Promise<{ error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const session = await auth();
  const resolved = await searchParams;
  const isVerifyRequired = resolved?.error === "verify_required";

  if (session && !isVerifyRequired && session.user?.isVerified !== false) {
    redirect("/dashboard");
  }

  return (
    <AuthPageShell subtitle="계정에 로그인하세요">
      <LoginForm />
      <div className="mt-6 text-center border-t border-zinc-100 pt-6">
        <p className="text-zinc-600">
          계정이 없으신가요?{" "}
          <Link
            href="/auth/signup"
            className="text-violet-600 hover:text-violet-700 font-semibold transition-colors"
          >
            회원가입
          </Link>
        </p>
      </div>
    </AuthPageShell>
  );
}
