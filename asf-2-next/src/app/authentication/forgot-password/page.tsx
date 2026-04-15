"use client";

import type { FC } from "react";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { buildPasswordResetRedirectUrl } from "@/utils/appUrl";

const ForgotPasswordPage: FC = function () {
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmed = email.trim();
    if (trimmed.length === 0) {
      setError("请输入邮箱地址");
      return;
    }

    const redirectTo = buildPasswordResetRedirectUrl();
    if (redirectTo === null) {
      setError("应用地址未配置，无法发送重置邮件");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo,
    });

    if (resetError) {
      console.error("resetPasswordForEmail error:", resetError.message);
      setError("发送失败，请稍后重试");
      setIsSubmitting(false);
      return;
    }

    setSuccess(true);
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg)]">
      <div className="relative h-[25vh] w-full bg-[var(--color-bg)] flex flex-col items-center justify-center">
        <button
          type="button"
          onClick={() => router.push("/authentication/sign-in")}
          className="absolute top-safe-area left-4 top-4 text-[var(--color-text)] hover:text-[var(--color-text)] transition-colors z-10 text-sm font-medium"
        >
          ← 返回登录
        </button>

        <h1 className="font-display text-4xl text-[var(--color-text)] tracking-widest mb-2 font-black">ASF</h1>
      </div>

      <div className="flex-1 w-full bg-white rounded-t-3xl -mt-6 z-20 px-6 py-8 flex flex-col shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        <h2 className="font-display text-2xl text-[var(--color-text)] mb-6">忘记密码</h2>

        {success ? (
          <div className="mb-4 p-3 text-sm text-[var(--color-text)] bg-green-50 border border-green-100 rounded-lg">
            请检查您的邮箱，重置密码链接已发送。
          </div>
        ) : null}

        {error.length > 0 && !success ? (
          <div className="mb-4 p-3 text-sm text-[var(--color-danger)] bg-red-50 rounded-lg">
            {error}
          </div>
        ) : null}

        {!success ? (
          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="forgot-email" className="text-sm font-medium text-[var(--color-text)]">
                邮箱地址
              </label>
              <input
                id="forgot-email"
                name="email"
                placeholder="请输入邮箱"
                type="email"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[56px] px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent outline-none transition-all"
              />
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary rounded-xl">
              {isSubmitting ? "发送中…" : "发送重置链接"}
            </button>
          </form>
        ) : null}

        <div className="mt-8 flex flex-col items-center gap-4 text-sm mt-auto pb-4">
          <p className="text-[var(--color-muted)]">
            <Link href="/authentication/sign-in" className="text-[var(--color-accent)] font-medium">
              返回登录 →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
