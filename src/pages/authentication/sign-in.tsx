/* eslint-disable jsx-a11y/anchor-is-valid */
import { Button, Card, Label, TextInput } from "flowbite-react";
import type { FC } from "react";
import React, { useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { useAuthContext } from "../../context/AuthContext";
import LoadingPage from "../pages/loading";

/**
 * Customer-facing sign-in page.
 *
 * Mobile / WebView improvements:
 * - A visible back arrow lets users exit the page without relying on the OS
 *   back gesture (which may or may not be available inside a WebView).
 * - Reads a `?returnTo=` query-string parameter so after a successful login
 *   the user is sent back to the page they were trying to access, not
 *   always to the admin dashboard.
 * - Uses `type="email"` and `inputMode="email"` so the mobile OS keyboard
 *   shows the @ character shortcut by default.
 * - `autoCapitalize="none"` and `autoCorrect="off"` prevent the mobile
 *   keyboard from mangling email addresses.
 * - `autoComplete` attributes activate native password-manager integration.
 * - The submit button is disabled and shows a spinner while the network
 *   request is in-flight to prevent accidental double-submission on slow
 *   mobile connections.
 */
const SignInPage: FC = function () {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user, loading } = useAuthContext();

  const [username, setUsername] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");
  const [error, setError] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  /**
   * Decode the optional `returnTo` query param.
   * Falls back to "/" (home page) so customers land on the storefront
   * rather than on the admin dashboard.
   */
  const returnTo = useMemo<string>(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get("returnTo");
    if (typeof raw === "string" && raw.length > 0) {
      return decodeURIComponent(raw);
    }
    return "/";
  }, [location.search]);

  /**
   * Handles form submission.
   * Guards against double-submission on slow mobile connections.
   */
  const handleLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    const result = await signIn(username, password);

    if (result.error) {
      console.error("Sign in error:", result.error.message);
      setError(result.error.message);
      // Re-enable the button so the user can try again.
      setIsSubmitting(false);
    } else {
      // Keep the button disabled while navigating to avoid double-nav.
      navigate(returnTo);
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  // Already logged in — redirect to the intended destination.
  if (user) {
    navigate(returnTo);
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 lg:gap-y-12 bg-gray-50 dark:bg-gray-900">

      {/* ── Back / cancel navigation ── */}
      {/* On mobile WebView the OS back gesture is unreliable.
          This visible arrow is the primary escape hatch. */}
      <div className="w-full max-w-[1024px] mb-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors py-2 pr-2"
          aria-label="Go back"
        >
          <HiOutlineArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
      </div>

      {/* ── Brand logo — uses <Link> to avoid a full WebView page reload ── */}
      <Link to="/" className="my-4 flex items-center gap-x-1 lg:my-0">
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
          Sign in to platform
        </h1>

        {/* Inline error message */}
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
            <Label htmlFor="email">Your Username / Email</Label>
            {/*
              type="email" — shows email keyboard with @ key on mobile.
              autoCapitalize="none" — prevents iOS auto-capitalisation.
              autoCorrect="off" — prevents autocorrect mangling addresses.
              autoComplete="username email" — activates password managers.
            */}
            <TextInput
              id="email"
              name="email"
              placeholder="username@example.com"
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
            <Label htmlFor="password">Your password</Label>
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

          {/*
            isProcessing shows Flowbite's built-in spinner.
            disabled prevents the button from being tapped multiple times on
            slow mobile connections.
          */}
          <div className="mb-6">
            <Button
              type="submit"
              className="w-full lg:w-auto"
              disabled={isSubmitting}
              isProcessing={isSubmitting}
            >
              {isSubmitting ? "Signing in…" : "Login to your account"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default SignInPage;
