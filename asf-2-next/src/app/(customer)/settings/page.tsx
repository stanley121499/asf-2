"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Button, Avatar, Badge, ToggleSwitch } from "flowbite-react";
import NavbarHome from "@/components/navbar-home";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HiOutlineShoppingBag,
  HiOutlineUser,
  HiOutlineQuestionMarkCircle,
  HiOutlineLogout,
  HiOutlineArrowLeft,
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineHeart,
  HiOutlineLockClosed,
  HiOutlinePhotograph,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineStar,
} from "react-icons/hi";
import { useThemeMode } from "flowbite-react";
import { useAuthContext } from "@/context/AuthContext";
import { usePointsMembership } from "@/context/PointsMembershipContext";
import { supabase } from "@/utils/supabaseClient";
import { FaUser } from "react-icons/fa";

/**
 * Basic runtime validators to satisfy strict typing without using `any` or non-null assertions.
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function getFileContentType(file: File): string {
  return isNonEmptyString(file.type) ? file.type : "application/octet-stream";
}

/**
 * Profile / Settings page for the customer-facing app.
 *
 * Mobile / WebView improvements:
 * - Guest users see a welcoming sign-in prompt instead of a blank form.
 * - A back arrow lets WebView users exit the page without relying on the OS
 *   back gesture, which may be unavailable inside a WebView.
 * - Logout sends the user to the home page ("/") rather than the sign-in
 *   page, so customers are not implied to immediately re-authenticate.
 * - Bottom padding is adjusted for the fixed BottomNavbar + device safe area.
 * - Dark / light mode toggle is surfaced directly in this page via the
 *   Flowbite `useThemeMode` hook, which also persists to localStorage.
 */
const ProfileSettingsPage: React.FC = () => {
  const router = useRouter();

  /** Controls which accordion section is currently expanded. null = all collapsed. */
  const [openSection, setOpenSection] = useState<string | null>(null);

  /**
   * Toggles an accordion section open or closed.
   * If the clicked section is already open, it closes. Otherwise the new section opens
   * and the previously open one closes (only one open at a time).
   */
  const toggleSection = (section: string): void => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const [userPoints, setUserPoints] = useState<number>(0);
  const { user, user_detail, signOut, loading } = useAuthContext();
  const pointsAPI = usePointsMembership();
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [pwCurrent, setPwCurrent] = useState<string>("");
  const [pwNew, setPwNew] = useState<string>("");
  const [pwConfirm, setPwConfirm] = useState<string>("");
  const [pwSaving, setPwSaving] = useState<boolean>(false);

  /** Flowbite theme mode — 'light' | 'dark' | 'auto' */
  const { mode: themeMode, toggleMode } = useThemeMode();
  const isDarkMode = themeMode === "dark";

  // ── Fetch user points ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchUserPoints = async () => {
      if (user?.id) {
        try {
          const pointsRecord = await pointsAPI.getUserPointsByUserId(user.id);
          setUserPoints(pointsRecord?.amount || 0);
        } catch (err) {
          if (process.env.NODE_ENV === "development") {
            console.error("Error fetching user points:", err);
          }
          setUserPoints(0);
        }
      }
    };
    fetchUserPoints();
  }, [user, pointsAPI]);

  // ── Initialize profile form fields from context ────────────────────────
  useEffect(() => {
    const initialEmail: string = typeof user?.email === "string" ? user.email : "";
    setEmail(initialEmail);

    const meta: Record<string, unknown> = (user?.user_metadata as Record<string, unknown>) || {};
    const metaPhone: string = isNonEmptyString(meta["phone"]) ? String(meta["phone"]) : "";
    if (!isNonEmptyString(phone) && isNonEmptyString(metaPhone)) {
      setPhone(metaPhone);
    }

    if (!isNonEmptyString(firstName) && isNonEmptyString(user_detail?.first_name)) {
      setFirstName(String(user_detail?.first_name));
    }
    if (!isNonEmptyString(lastName) && isNonEmptyString(user_detail?.last_name)) {
      setLastName(String(user_detail?.last_name));
    }
    if (!isNonEmptyString(avatarUrl) && isNonEmptyString(user_detail?.profile_image)) {
      setAvatarUrl(String(user_detail?.profile_image));
    }
  }, [user?.id, user?.email, user_detail?.first_name, user_detail?.last_name, user_detail?.profile_image]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayName = useMemo(() => {
    const joined = `${firstName} ${lastName}`.trim();
    return joined.length > 0 ? joined : (email || "");
  }, [firstName, lastName, email]);

  /** Sign out and return to the home page (not the sign-in page). */
  const handleLogout = async (): Promise<void> => {
    await signOut();
    router.push("/");
  };

  // ── Avatar upload ──────────────────────────────────────────────────────
  const onAvatarChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    const file = e.target.files[0];
    setAvatarFile(file);
  };

  const handleUploadAvatar = async (): Promise<void> => {
    if (!user?.id) return;
    if (avatarFile === null) return;
    try {
      const timestamp = Date.now();
      const sanitized = avatarFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `users/${user.id}/${timestamp}-${sanitized}`;
      const { error: uploadError } = await supabase.storage
        .from("medias")
        .upload(path, avatarFile, { contentType: getFileContentType(avatarFile), upsert: false });
      if (uploadError) {
        if (process.env.NODE_ENV === "development") {
          console.error("Avatar upload error:", uploadError.message);
        }
        return;
      }
      const { data: publicData } = supabase.storage.from("medias").getPublicUrl(path);
      const publicUrl: string = publicData?.publicUrl ?? "";
      if (publicUrl.length === 0) return;
      const { error: updateError } = await supabase
        .from("user_details")
        .update({ profile_image: publicUrl })
        .eq("id", user.id)
        .single();
      if (updateError) {
        if (process.env.NODE_ENV === "development") {
          console.error("Updating profile image failed:", updateError.message);
        }
        return;
      }
      setAvatarUrl(publicUrl);
      setAvatarFile(null);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Unexpected avatar upload error:", err);
      }
    }
  };

  // ── Save profile ───────────────────────────────────────────────────────
  const handleSaveProfile = async (): Promise<void> => {
    if (!user?.id) return;
    if (!isNonEmptyString(firstName) || !isNonEmptyString(lastName)) return;
    setSaving(true);
    try {
      const fullDisplayName = `${firstName} ${lastName}`.trim();
      const { error: detailErr } = await supabase
        .from("user_details")
        .update({ first_name: firstName, last_name: lastName })
        .eq("id", user.id)
        .single();
      if (detailErr) {
        if (process.env.NODE_ENV === "development") {
          console.error("Updating user_details failed:", detailErr.message);
        }
        setSaving(false);
        return;
      }
      const { error: authErr } = await supabase.auth.updateUser({
        data: {
          display_name: fullDisplayName,
          first_name: firstName,
          last_name: lastName,
          phone: phone,
        },
      });
      if (authErr) {
        if (process.env.NODE_ENV === "development") {
          console.error("Updating auth user metadata failed:", authErr.message);
        }
        setSaving(false);
        return;
      }
      setFirstName(firstName);
      setLastName(lastName);
      setPhone(phone);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Unexpected save profile error:", err);
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Update password ────────────────────────────────────────────────────
  const handleUpdatePassword = async (): Promise<void> => {
    if (!isNonEmptyString(pwNew) || !isNonEmptyString(pwConfirm)) return;
    if (pwNew !== pwConfirm) return;
    setPwSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwNew });
      if (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Password update error:", error.message);
        }
      } else {
        setPwCurrent("");
        setPwNew("");
        setPwConfirm("");
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Unexpected password update error:", err);
      }
    } finally {
      setPwSaving(false);
    }
  };

  // ── Guest / unauthenticated state ─────────────────────────────────────
  // Show a welcoming sign-in prompt instead of a blank form.
  // On mobile the Settings tab in the bottom nav is a natural entry point
  // for new users to discover the login / register flow.
  if (!loading && !user) {
    return (
      <>
        <NavbarHome />
        <section
          className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6"
          style={{ paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
        >
          {/* Dark / Light mode toggle is always available — even for guests */}
          <div className="w-full max-w-sm mb-6 flex justify-end">
            <button
              type="button"
              onClick={toggleMode}
              aria-label={isDarkMode ? "切换到浅色模式" : "切换到深色模式"}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              {isDarkMode ? (
                <>
                  <HiOutlineSun className="h-5 w-5 text-yellow-400" />
                  <span>浅色模式</span>
                </>
              ) : (
                <>
                  <HiOutlineMoon className="h-5 w-5 text-indigo-500" />
                  <span>深色模式</span>
                </>
              )}
            </button>
          </div>

          <div className="w-full max-w-sm text-center">
            <div className="mb-6 text-gray-200 dark:text-gray-700">
              <FaUser className="w-20 h-20 mx-auto" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              我的资料
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              登录以管理账户、查看订单并赚取积分。
            </p>
            <Link href="/authentication/sign-in?returnTo=%2Fsettings" className="block">
              <Button color="blue" size="lg" className="w-full">
                登录
              </Button>
            </Link>
            <Link href="/"
              className="block mt-4 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 py-2"
            >
              继续浏览
            </Link>
          </div>
        </section>
      </>
    );
  }

  // Show loading skeleton while auth state resolves
  if (loading) {
    return (
      <>
        <NavbarHome />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="animate-pulse space-y-4 w-full max-w-4xl p-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </>
    );
  }

  // ── Authenticated view ─────────────────────────────────────────────────
  return (
    <>
      <NavbarHome />
      <section
        className="min-h-screen bg-gray-100 dark:bg-gray-900"
        style={{ paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {/* ── Top bar with back nav and title ── */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors py-2 pr-2"
            aria-label="返回"
          >
            <HiOutlineArrowLeft className="h-4 w-4" />
            <span>返回</span>
          </button>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">我的资料</span>
          {/* Spacer to keep title visually centred */}
          <div className="w-12" aria-hidden="true" />
        </div>

        <div className="px-4 space-y-4 max-w-lg mx-auto">

          {/* ══ Profile Card ══════════════════════════════════════════════ */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <Avatar
                img={isNonEmptyString(avatarUrl) ? avatarUrl : undefined}
                alt="头像"
                rounded={true}
                size="lg"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-gray-900 dark:text-white truncate">
                {displayName || "用户"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {email || ""}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge color="info" className="text-xs px-2 py-0.5">
                  金牌会员
                </Badge>
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <HiOutlineStar className="h-3.5 w-3.5 text-yellow-400" />
                  {userPoints.toLocaleString()} 积分
                </span>
              </div>
            </div>
          </div>

          {/* ══ 我的账户 ══════════════════════════════════════════════════ */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <p className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              我的账户
            </p>

            {/* Orders row */}
            <Link
              href="/order-details"
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:bg-gray-100 dark:active:bg-gray-600"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <HiOutlineShoppingBag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">
                我的订单
              </span>
              <HiOutlineChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </Link>

            <div className="mx-4 border-t border-gray-100 dark:border-gray-700" />

            {/* Wishlist row — links directly to /wishlist */}
            <Link
              href="/wishlist"
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:bg-gray-100 dark:active:bg-gray-600"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                <HiOutlineHeart className="h-4 w-4 text-red-500 dark:text-red-400" />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">
                我的收藏
              </span>
              <HiOutlineChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </Link>

            <div className="mx-4 border-t border-gray-100 dark:border-gray-700" />

            {/* Points & Membership row */}
            <Link
              href="/goal"
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:bg-gray-100 dark:active:bg-gray-600"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-50 dark:bg-yellow-900/30 flex items-center justify-center">
                <HiOutlineStar className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">
                积分与会员
              </span>
              <HiOutlineChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </Link>
          </div>

          {/* ══ 账户设置 ══════════════════════════════════════════════════ */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <p className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              账户设置
            </p>

            {/* ── Edit Profile accordion ── */}
            <button
              type="button"
              onClick={() => toggleSection("profile")}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:bg-gray-100 dark:active:bg-gray-600 text-left"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                <HiOutlineUser className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">
                编辑个人资料
              </span>
              {openSection === "profile"
                ? <HiOutlineChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                : <HiOutlineChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              }
            </button>
            {openSection === "profile" && (
              <div className="px-4 pb-4 space-y-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700">
                <div className="pt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                      名
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                      姓
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    邮箱
                  </label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    电话号码
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <Button
                  color="blue"
                  size="sm"
                  onClick={() => void handleSaveProfile()}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? "保存中…" : "保存更改"}
                </Button>
              </div>
            )}

            <div className="mx-4 border-t border-gray-100 dark:border-gray-700" />

            {/* ── Change Password accordion ── */}
            <button
              type="button"
              onClick={() => toggleSection("password")}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:bg-gray-100 dark:active:bg-gray-600 text-left"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                <HiOutlineLockClosed className="h-4 w-4 text-orange-500 dark:text-orange-400" />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">
                修改密码
              </span>
              {openSection === "password"
                ? <HiOutlineChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                : <HiOutlineChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              }
            </button>
            {openSection === "password" && (
              <div className="px-4 pb-4 space-y-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700">
                <div className="pt-3">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    当前密码
                  </label>
                  <input
                    type="password"
                    value={pwCurrent}
                    autoComplete="current-password"
                    onChange={(e) => setPwCurrent(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    新密码
                  </label>
                  <input
                    type="password"
                    value={pwNew}
                    autoComplete="new-password"
                    onChange={(e) => setPwNew(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    确认新密码
                  </label>
                  <input
                    type="password"
                    value={pwConfirm}
                    autoComplete="new-password"
                    onChange={(e) => setPwConfirm(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <Button
                  color="blue"
                  size="sm"
                  onClick={() => void handleUpdatePassword()}
                  disabled={pwSaving}
                  className="w-full"
                >
                  {pwSaving ? "更新中…" : "更新密码"}
                </Button>
              </div>
            )}

            <div className="mx-4 border-t border-gray-100 dark:border-gray-700" />

            {/* ── Update Avatar accordion ── */}
            <button
              type="button"
              onClick={() => toggleSection("avatar")}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:bg-gray-100 dark:active:bg-gray-600 text-left"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                <HiOutlinePhotograph className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">
                更换头像
              </span>
              {openSection === "avatar"
                ? <HiOutlineChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                : <HiOutlineChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              }
            </button>
            {openSection === "avatar" && (
              <div className="px-4 pb-4 space-y-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700">
                <div className="pt-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onAvatarChange}
                    className="w-full text-sm text-gray-700 dark:text-gray-300"
                  />
                </div>
                <Button
                  color="blue"
                  size="sm"
                  onClick={() => void handleUploadAvatar()}
                  disabled={avatarFile === null}
                  className="w-full"
                >
                  上传头像
                </Button>
              </div>
            )}
          </div>

          {/* ══ 偏好设置 ══════════════════════════════════════════════════ */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <p className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              偏好设置
            </p>

            {/* Dark mode toggle row — inline toggle, no navigation */}
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                {isDarkMode
                  ? <HiOutlineMoon className="h-4 w-4 text-indigo-400" />
                  : <HiOutlineSun className="h-4 w-4 text-yellow-500" />
                }
              </div>
              <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">
                {isDarkMode ? "深色模式" : "浅色模式"}
              </span>
              <ToggleSwitch
                checked={isDarkMode}
                label=""
                onChange={toggleMode}
                color="blue"
              />
            </div>

            <div className="mx-4 border-t border-gray-100 dark:border-gray-700" />

            {/* Contact support row */}
            <Link
              href="/support-chat"
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:bg-gray-100 dark:active:bg-gray-600"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                <HiOutlineQuestionMarkCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">
                联系客服
              </span>
              <HiOutlineChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </Link>
          </div>

          {/* ══ Logout ════════════════════════════════════════════════════ */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
            {/* Logout — navigates to "/" so user is not forced to re-authenticate immediately */}
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors active:bg-red-100 dark:active:bg-red-900/30 text-left"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                <HiOutlineLogout className="h-4 w-4 text-red-500" />
              </div>
              <span className="flex-1 text-sm font-semibold text-red-500">
                退出登录
              </span>
            </button>
          </div>

        </div>
      </section>
    </>
  );
};

export default ProfileSettingsPage;
