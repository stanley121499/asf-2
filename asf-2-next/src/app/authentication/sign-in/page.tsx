"use client";
import type { FC } from "react";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";
import { useAuthContext } from "@/context/AuthContext";
import LoadingPage from "@/app/loading";

/**
 * Resolves post-login navigation: prefers `next`, then `returnTo`, then `/`.
 * Rejects open redirects (must start with `/`, not `//`).
 */
function resolvePostAuthRedirect(params: URLSearchParams): string {
  const candidates: Array<string | null> = [params.get("next"), params.get("returnTo")];
  for (const raw of candidates) {
    if (typeof raw !== "string" || raw.length === 0) {
      continue;
    }
    let decoded: string;
    try {
      decoded = decodeURIComponent(raw);
    } catch {
      continue;
    }
    if (!decoded.startsWith("/")) {
      continue;
    }
    if (decoded.startsWith("//")) {
      continue;
    }
    return decoded;
  }
  return "/";
}

const SignInPage: FC = function () {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, user, loading } = useAuthContext();

  const [username, setUsername] = useState<string>("stanley121499@gmail.com");
  const [password, setPassword] = useState<string>("12345678");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const postAuthPath = useMemo<string>(() => resolvePostAuthRedirect(searchParams), [searchParams]);

  const handleLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    const result = await signIn(username, password);

    if (result.error) {
      console.error("Sign in error:", result.error.message);
      let errorMsg = result.error.message;
      if (errorMsg.toLowerCase().includes("invalid login credentials")) {
        errorMsg = "邮箱或密码不正确，请重试";
      } else {
        errorMsg = "登录失败，请重试";
      }
      setError(errorMsg);
      setIsSubmitting(false);
    } else {
      router.push(postAuthPath);
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (user) {
    router.push(postAuthPath);
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg)]">
      {/* Top Hero: 40vh */}
      <div className="relative h-[25vh] w-full bg-[var(--color-bg)] flex flex-col items-center justify-center">
        {/* Absolute back button */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="absolute top-safe-area left-4 top-4 text-[var(--color-text)] hover:text-black transition-colors z-10 font-medium text-sm"
        >
          ← 返回首页
        </button>

        <h1 className="font-display text-4xl text-[var(--color-text)] tracking-widest mb-2 font-black">ASF</h1>
      </div>

      {/* Bottom Form Panel: 60vh pulled up to overlap slightly */}
      <div className="flex-1 w-full bg-white rounded-t-3xl -mt-6 z-20 px-6 py-8 flex flex-col shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        <h2 className="font-display text-2xl text-[var(--color-text)] mb-6">欢迎回来</h2>

        {error.length > 0 && (
          <div className="mb-4 p-3 text-sm text-[var(--color-danger)] bg-red-50 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={(e) => void handleLogin(e)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-[var(--color-text)]">邮箱地址</label>
            <input
              id="email"
              name="email"
              placeholder="请输入邮箱"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-[56px] px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent outline-none transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-[var(--color-text)]">密码</label>
            <div className="relative">
              <input
                id="password"
                name="password"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
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

          <div className="flex justify-end mb-2">
            <Link
              href="/authentication/forgot-password"
              className="text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] cursor-pointer"
            >
              忘记密码？
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary rounded-xl"
          >
            {isSubmitting ? "登录中…" : "登录"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full h-[52px] rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] text-sm font-medium flex items-center justify-center mt-3"
          >
            先逛逛，暂不登录
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-4 text-sm mt-auto pb-4">
          <p className="text-[var(--color-muted)] text-sm">
            还没有账号？{" "}
            <Link href="/authentication/sign-up" className="text-[var(--color-accent)] font-medium">
              立即注册 →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
