"use client";

import type { FC } from "react";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HiOutlineEye, HiOutlineEyeOff, HiCheck } from "react-icons/hi";
import { supabase } from "@/utils/supabaseClient";

type SessionCheckState = "loading" | "ready" | "invalid";

const ResetPasswordPage: FC = function () {
  const router = useRouter();

  const [sessionCheck, setSessionCheck] = useState<SessionCheckState>("loading");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const passwordsMatch =
    password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  useEffect(() => {
    let cancelled = false;

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (session) {
        setSessionCheck("ready");
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session) {
        setSessionCheck("ready");
      }
    });

    const timer = window.setTimeout(() => {
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (cancelled) return;
        setSessionCheck((prev) => {
          if (prev === "ready") {
            return "ready";
          }
          return session ? "ready" : "invalid";
        });
      });
    }, 1000);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (isSubmitting || sessionCheck !== "ready") return;

    if (passwordsMismatch) {
      setError("两次密码不一致");
      return;
    }

    if (password.length < 8) {
      setError("密码至少8位字符");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      console.error("updateUser password error:", updateError.message);
      setError("重置失败，请重试或重新获取链接");
      setIsSubmitting(false);
      return;
    }

    router.push("/authentication/sign-in");
  };

  if (sessionCheck === "loading") {
    return (
      <div className="flex flex-col min-h-screen bg-[var(--color-bg)]">
        <div className="relative h-[25vh] w-full bg-[var(--color-bg)] flex flex-col items-center justify-center">
          <h1 className="font-display text-4xl text-[var(--color-text)] tracking-widest mb-2 font-black">ASF</h1>
        </div>
        <div className="flex-1 w-full bg-white rounded-t-3xl -mt-6 z-20 px-6 py-8 flex flex-col items-center justify-center shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
          <p className="text-sm text-[var(--color-muted)]">验证链接中…</p>
        </div>
      </div>
    );
  }

  if (sessionCheck === "invalid") {
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
          <h2 className="font-display text-2xl text-[var(--color-text)] mb-4">链接无效或已过期</h2>
          <p className="text-sm text-[var(--color-muted)] mb-6">
            请重新申请重置密码，或返回登录页面。
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/authentication/forgot-password" className="btn-primary rounded-xl text-center">
              重新发送重置链接
            </Link>
            <Link
              href="/authentication/sign-in"
              className="w-full h-[52px] rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] text-sm font-medium flex items-center justify-center"
            >
              返回登录
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
        <h2 className="font-display text-2xl text-[var(--color-text)] mb-6">设置新密码</h2>

        {error.length > 0 ? (
          <div className="mb-4 p-3 text-sm text-[var(--color-danger)] bg-red-50 rounded-lg">
            {error}
          </div>
        ) : null}

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-password" className="text-sm font-medium text-[var(--color-text)]">
              新密码
            </label>
            <div className="relative">
              <input
                id="new-password"
                name="password"
                placeholder="至少8位字符"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-[56px] pl-4 pr-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                {showPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="confirm-new-password"
              className="text-sm font-medium text-[var(--color-text)] flex justify-between"
            >
              确认新密码
              {passwordsMatch ? <HiCheck className="text-green-500" size={20} /> : null}
            </label>
            <input
              id="confirm-new-password"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="再次输入密码"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full h-[56px] px-4 rounded-xl border bg-[var(--color-panel)] text-[var(--color-text)] focus:ring-2 focus:border-transparent outline-none transition-all ${
                passwordsMismatch
                  ? "border-[var(--color-danger)] focus:ring-[var(--color-danger)]"
                  : "border-[var(--color-border)] focus:ring-[var(--color-accent)]"
              }`}
            />
            {passwordsMismatch ? (
              <span className="text-sm text-[var(--color-danger)] mt-1">两次密码不一致</span>
            ) : null}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary rounded-xl mt-2">
            {isSubmitting ? "保存中…" : "保存新密码"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
