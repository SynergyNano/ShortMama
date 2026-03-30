"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

interface SubscriptionInfo {
  planId: string;
  planName: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
}

interface SubscriptionCardProps {
  userEmail?: string;
}

export default function SubscriptionCard({ userEmail }: SubscriptionCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetch("/api/user/subscription")
      .then((res) => res.json())
      .then((data) => {
        setIsSubscribed(data.isSubscribed ?? false);
        setSubscription(data.subscription ?? null);
      })
      .catch(() => {
        setIsSubscribed(false);
        setSubscription(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCancelSubscription = async () => {
    if (!confirm("구독을 취소하시겠습니까?\n현재 구독 기간이 끝날 때까지는 서비스를 계속 이용할 수 있습니다.")) {
      return;
    }
    setIsCancelling(true);
    try {
      const res = await fetch("/api/payments/cancel", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        showToast("success", `구독이 취소되었습니다. ${data.serviceUntil ? `${data.serviceUntil}까지 이용 가능합니다.` : ""}`);
        setSubscription((prev) => (prev ? { ...prev, status: "cancelled" } : null));
      } else {
        showToast("error", data.error || "구독 취소에 실패했습니다.");
      }
    } catch {
      showToast("error", "구독 취소 중 오류가 발생했습니다.");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mb-8 flex items-center justify-center py-8">
        <Loader2 size={24} className="animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="mb-8">
      {toast && (
        <div
          className={`fixed top-4 right-4 border rounded-xl p-4 flex gap-3 z-40 shadow-lg bg-white ${
            toast.type === "success" ? "border-violet-200" : "border-red-200"
          }`}
        >
          <AlertCircle
            size={20}
            className={`flex-shrink-0 mt-0.5 ${toast.type === "success" ? "text-violet-600" : "text-red-600"}`}
          />
          <p className={`font-medium ${toast.type === "success" ? "text-violet-900" : "text-red-700"}`}>
            {toast.message}
          </p>
        </div>
      )}

      {isSubscribed && subscription ? (
        <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-200/80 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-zinc-900 mb-3">
                {subscription.planName} 구독 중 ✓
              </h2>
              <div className="space-y-2 text-sm text-zinc-600 mb-4">
                <p>📧 {userEmail}</p>
                {subscription.currentPeriodEnd && (
                  <p>
                    📅{" "}
                    {subscription.status === "cancelled"
                      ? `서비스 종료일: ${subscription.currentPeriodEnd}`
                      : `다음 결제일: ${subscription.currentPeriodEnd}`}
                  </p>
                )}
                {subscription.status === "cancelled" && (
                  <p className="text-amber-700 font-medium">⚠️ 취소된 구독 (기간 만료 후 종료)</p>
                )}
              </div>
            </div>
            <div className="flex gap-3 md:flex-col">
              <Link
                href="/pricing"
                className="px-6 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-semibold shadow-md shadow-violet-900/15 hover:shadow-lg transition-all whitespace-nowrap text-center"
              >
                플랜 변경
              </Link>
              {subscription.status !== "cancelled" && (
                <button
                  onClick={handleCancelSubscription}
                  disabled={isCancelling}
                  className="px-6 py-2 bg-white text-zinc-800 border border-zinc-200 rounded-xl font-semibold hover:bg-zinc-50 transition-all whitespace-nowrap disabled:opacity-50 flex items-center gap-2 justify-center"
                >
                  {isCancelling && <Loader2 size={14} className="animate-spin" />}
                  구독 취소
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-200/80 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-2">
                아직 구독 중이 아닙니다
              </h2>
              <p className="text-zinc-600">
                구독 플랜을 선택하고 서비스를 이용해보세요!
              </p>
            </div>
            <Link
              href="/pricing"
              className="px-8 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-semibold shadow-md shadow-violet-900/15 hover:shadow-lg transition-all whitespace-nowrap text-center"
            >
              구독하기
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
