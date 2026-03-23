"use client";
import type { FC } from "react";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HiOutlineEye, HiOutlineEyeOff, HiCheck } from "react-icons/hi";

const SignUpPage: FC = function () {
  const router = useRouter();
  
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleRegister = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (isSubmitting) return;

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

    // TODO: Wire up actual signUp when available in AuthContext
    await new Promise(resolve => setTimeout(resolve, 800));
    router.push("/");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg)]">
      {/* Top Hero: 40vh */}
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

      {/* Bottom Form Panel: 60vh pulled up to overlap slightly */}
      <div className="flex-1 w-full bg-white rounded-t-3xl -mt-6 z-20 px-6 py-8 flex flex-col shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        <h2 className="font-display text-2xl text-[var(--color-text)] mb-1">创建账号</h2>
        <p className="text-sm text-[var(--color-accent)] mb-6">注册即获得积分，每次购物都有回报</p>

        {error.length > 0 && (
          <div className="mb-4 p-3 text-sm text-[var(--color-danger)] bg-red-50 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={(e) => void handleRegister(e)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-[var(--color-text)]">您的称呼（选填）</label>
            <input
              id="name"
              type="text"
              placeholder="请输入您的名字"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-[56px] px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent outline-none transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-[var(--color-text)]">邮箱地址</label>
            <input
              id="email"
              type="email"
              placeholder="请输入邮箱"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-[56px] px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent outline-none transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-[var(--color-text)]">密码</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="至少8位字符"
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
            <label htmlFor="confirmPassword" className="text-sm font-medium text-[var(--color-text)] flex justify-between">
              确认密码
              {passwordsMatch && <HiCheck className="text-green-500" size={20} />}
            </label>
            <input
              id="confirmPassword"
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
            {passwordsMismatch && (
              <span className="text-sm text-[var(--color-danger)] mt-1">两次密码不一致</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary rounded-xl mt-4"
          >
            {isSubmitting ? "注册中…" : "注册"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full h-[52px] rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] text-sm font-medium flex items-center justify-center mt-3"
          >
            先逛逛，暂不登录
          </button>
        </form>

        <div className="mt-8 flex flex-col items-center gap-4 text-sm mt-auto pb-4">
          <p className="text-[var(--color-muted)]">
            已有账号？{" "}
            <Link href="/authentication/sign-in" className="text-[var(--color-accent)] font-medium">
              立即登录 →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
