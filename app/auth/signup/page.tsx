import Link from "next/link";
import SignupForm from "@/app/components/auth/SignupForm";
import AuthPageShell from "@/app/components/auth/AuthPageShell";

export const metadata = {
  title: "회원가입 | 숏마마",
  description: "새 계정을 만들고 숏마마 서비스를 시작하세요",
};

export default function SignupPage() {
  return (
    <AuthPageShell subtitle="새 계정을 만들어 시작하세요">
      <SignupForm />
      <div className="mt-6 text-center border-t border-zinc-100 pt-6">
        <p className="text-zinc-600">
          이미 계정이 있으신가요?{" "}
          <Link
            href="/auth/login"
            className="text-violet-600 hover:text-violet-700 font-semibold transition-colors"
          >
            로그인
          </Link>
        </p>
      </div>
    </AuthPageShell>
  );
}
