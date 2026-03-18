"use client";
/* eslint-disable jsx-a11y/anchor-is-valid */
import { Button, Card, Label, TextInput } from "flowbite-react";
import type { FC } from "react";
import React, { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { useAuthContext } from "@/context/AuthContext";
import LoadingPage from "@/app/loading";

/**
 * Customer-facing sign-in page.
 */
const SignInPage: FC = function () {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, user, loading } = useAuthContext();

  const [username, setUsername] = React.useState<string>("stanley121499@gmail.com");
  const [password, setPassword] = React.useState<string>("12345678");
  const [error, setError] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const returnTo = useMemo<string>(() => {
    const raw = searchParams.get("returnTo");
    if (typeof raw === "string" && raw.length > 0) {
      return decodeURIComponent(raw);
    }
    return "/";
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    const result = await signIn(username, password);

    if (result.error) {
      console.error("Sign in error:", result.error.message);
      setError(result.error.message);
      setIsSubmitting(false);
    } else {
      router.push(returnTo);
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (user) {
    router.push(returnTo);
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 lg:gap-y-12 bg-gray-50 dark:bg-gray-900">

      <div className="w-full max-w-[1024px] mb-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors py-2 pr-2"
          aria-label="返回"
        >
          <HiOutlineArrowLeft className="h-4 w-4" />
          <span>返回</span>
        </button>
      </div>

      <Link href="/" className="my-4 flex items-center gap-x-1 lg:my-0">
        <img alt="Logo" src="/images/logo.svg" className="mr-3 h-10" />
        <span className="self-center whitespace-nowrap text-2xl font-semibold dark:text-white">
          ASF
        </span>
      </Link>

      <Card
        horizontal
        imgSrc="/images/authentication/login.jpg"
        imgAlt=""
        className="w-full md:max-w-[1024px] md:[&>*]:w-full md:[&>*]:p-16 [&>img]:hidden md:[&>img]:w-96 md:[&>img]:p-0 lg:[&>img]:block">

        <h1 className="mb-3 text-2xl font-bold dark:text-white md:text-3xl">
          登录平台
        </h1>

        {error.length > 0 && (
          <div
            role="alert"
            className="mb-6 p-3 text-sm text-center text-red-600 bg-red-50 rounded-lg dark:bg-red-900/30 dark:text-red-400"
          >
            {error}
          </div>
        )}

        <form onSubmit={(e) => void handleLogin(e)}>
          <div className="mb-4 flex flex-col gap-y-3">
            <Label htmlFor="email">邮箱地址</Label>
            <TextInput
              id="email"
              name="email"
              placeholder="请输入邮箱地址"
              type="email"
              // @ts-ignore — standard HTML attributes, not in all Flowbite typings
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="mb-6 flex flex-col gap-y-3">
            <Label htmlFor="password">密码</Label>
            <TextInput
              id="password"
              name="password"
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <Button
              type="submit"
              className="w-full lg:w-auto"
              disabled={isSubmitting}
              isProcessing={isSubmitting}
            >
              {isSubmitting ? "登录中…" : "登录账户"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default SignInPage;

