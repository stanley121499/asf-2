import React, { useState, useEffect, useMemo } from "react";
import { Button, Card, Avatar, Badge, Tooltip, ToggleSwitch } from "flowbite-react";
import NavbarHome from "../../components/navbar-home";
import { Link, useNavigate } from "react-router-dom";
import {
  HiOutlineShoppingBag,
  HiOutlineUser,
  HiOutlineQuestionMarkCircle,
  HiOutlineLogout,
  HiOutlineArrowLeft,
  HiOutlineMoon,
  HiOutlineSun,
} from "react-icons/hi";
import { useThemeMode } from "flowbite-react";
import OrdersList from "./components/OrdersList";
import { useAuthContext } from "../../context/AuthContext";
import { usePointsMembership } from "../../context/PointsMembershipContext";
import { supabase } from "../../utils/supabaseClient";
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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("account");
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
    navigate("/");
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
            <Link to="/authentication/sign-in?returnTo=%2Fsettings" className="block">
              <Button color="blue" size="lg" className="w-full">
                登录
              </Button>
            </Link>
            <Link
              to="/"
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
        className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6"
        style={{ paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="w-full max-w-4xl mx-auto">
          {/* ── Back navigation — primary escape on mobile WebView ── */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors py-2 pr-2"
              aria-label="返回"
            >
              <HiOutlineArrowLeft className="h-4 w-4" />
              <span>返回</span>
            </button>

            {/* ── Dark / Light mode toggle ── */}
            <button
              type="button"
              onClick={toggleMode}
              aria-label={isDarkMode ? "切换到浅色模式" : "切换到深色模式"}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              {isDarkMode ? (
                <>
                  <HiOutlineSun className="h-5 w-5 text-yellow-400" />
                  <span className="hidden sm:inline">浅色模式</span>
                </>
              ) : (
                <>
                  <HiOutlineMoon className="h-5 w-5 text-indigo-500" />
                  <span className="hidden sm:inline">深色模式</span>
                </>
              )}
            </button>
          </div>

          <Card className="w-full p-0 rounded-lg shadow-md dark:bg-gray-800">
            <div className="flex flex-col md:flex-row w-full">
              {/* ── Left sidebar ────────────────────────────────────── */}
              <div className="md:w-1/3 p-6 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700">
                <div className="flex flex-col items-center mb-6">
                  <Avatar
                    img={isNonEmptyString(avatarUrl) ? avatarUrl : undefined}
                    alt="头像"
                    rounded={true}
                    size="xl"
                    className="mb-4"
                  />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    {displayName || "用户"}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {email || ""}
                  </p>
                  <div className="flex items-center mt-1 mb-4">
                    <Badge color="info" className="px-3 py-1.5">
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">金牌会员</span>
                      </div>
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      积分：
                    </span>
                    <Tooltip content="您可以用这些积分兑换折扣">
                      <span className="text-sm text-gray-800 dark:text-white font-semibold">
                        {userPoints.toLocaleString()}
                      </span>
                    </Tooltip>
                  </div>
                </div>

                {/* Navigation Menu */}
                <div className="flex flex-col space-y-2">
                  <Button
                    color={activeTab === "account" ? "blue" : "gray"}
                    className="justify-start"
                    onClick={() => setActiveTab("account")}
                  >
                    <HiOutlineUser className="mr-2 h-5 w-5" />
                    账户
                  </Button>
                  <Button
                    color={activeTab === "orders" ? "blue" : "gray"}
                    className="justify-start"
                    onClick={() => setActiveTab("orders")}
                  >
                    <HiOutlineShoppingBag className="mr-2 h-5 w-5" />
                    订单
                  </Button>
                  <Button
                    color={activeTab === "appearance" ? "blue" : "gray"}
                    className="justify-start"
                    onClick={() => setActiveTab("appearance")}
                  >
                    {isDarkMode ? (
                      <HiOutlineMoon className="mr-2 h-5 w-5" />
                    ) : (
                      <HiOutlineSun className="mr-2 h-5 w-5" />
                    )}
                    外观
                  </Button>
                  <Button
                    color={activeTab === "support" ? "blue" : "gray"}
                    className="justify-start"
                    onClick={() => setActiveTab("support")}
                  >
                    <HiOutlineQuestionMarkCircle className="mr-2 h-5 w-5" />
                    支持
                  </Button>
                  {/* Logout — goes to home page, not sign-in, so the user
                      is not implied to immediately re-authenticate. */}
                  <Button
                    color="red"
                    className="justify-start mt-8"
                    onClick={() => void handleLogout()}
                  >
                    <HiOutlineLogout className="mr-2 h-5 w-5" />
                    退出登录
                  </Button>
                </div>
              </div>

              {/* ── Right content area ───────────────────────────────── */}
              <div className="md:w-2/3 p-6">

                {/* Account tab */}
                {activeTab === "account" && (
                  <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      账户信息
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          名
                        </label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          姓
                        </label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          邮箱
                        </label>
                        <input
                          type="email"
                          value={email}
                          readOnly
                          className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-300 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          电话号码
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </div>
                    <Button color="blue" onClick={() => void handleSaveProfile()} disabled={saving}>
                      {saving ? "保存中…" : "保存更改"}
                    </Button>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        密码
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            当前密码
                          </label>
                          <input
                            type="password"
                            value={pwCurrent}
                            autoComplete="current-password"
                            onChange={(e) => setPwCurrent(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            新密码
                          </label>
                          <input
                            type="password"
                            value={pwNew}
                            autoComplete="new-password"
                            onChange={(e) => setPwNew(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            确认新密码
                          </label>
                          <input
                            type="password"
                            value={pwConfirm}
                            autoComplete="new-password"
                            onChange={(e) => setPwConfirm(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                      </div>
                      <Button
                        color="blue"
                        className="mt-4"
                        onClick={() => void handleUpdatePassword()}
                        disabled={pwSaving}
                      >
                        {pwSaving ? "更新中…" : "更新密码"}
                      </Button>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        头像
                      </h3>
                      <div className="space-y-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={onAvatarChange}
                          className="w-full text-sm text-gray-700 dark:text-gray-300"
                        />
                        <Button
                          color="blue"
                          onClick={() => void handleUploadAvatar()}
                          disabled={!avatarFile}
                        >
                          上传头像
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Orders tab */}
                {activeTab === "orders" && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                      订单历史
                    </h3>
                    <OrdersList />
                  </div>
                )}

                {/* Appearance tab — dark / light mode toggle */}
                {activeTab === "appearance" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      外观
                    </h3>

                    {/* ── Theme toggle card ── */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center gap-3">
                        {isDarkMode ? (
                          <HiOutlineMoon className="h-6 w-6 text-indigo-400" />
                        ) : (
                          <HiOutlineSun className="h-6 w-6 text-yellow-500" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {isDarkMode ? "深色模式" : "浅色模式"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {isDarkMode
                              ? "切换到浅色主题"
                              : "切换到深色主题"}
                          </p>
                        </div>
                      </div>
                      {/* ToggleSwitch from Flowbite — checked = dark mode ON */}
                      <ToggleSwitch
                        checked={isDarkMode}
                        label=""
                        onChange={toggleMode}
                        color="blue"
                      />
                    </div>

                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      您的偏好设置已自动保存，下次打开应用时将恢复。
                    </p>
                  </div>
                )}

                {/* Support tab */}
                {activeTab === "support" && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                      客户支持
                    </h3>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        需要订单帮助、退货或商品咨询？我们的客服团队随时为您服务。
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link to="/support-chat">
                          <Button fullSized color="blue">
                            <HiOutlineQuestionMarkCircle className="mr-2 h-5 w-5" />
                            联系客服
                          </Button>
                        </Link>
                        <a href="mailto:support@example.com">
                          <Button fullSized color="light">
                            邮件支持
                          </Button>
                        </a>
                      </div>

                      <div className="mt-6">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          常见问题
                        </h4>
                        <div className="space-y-2">
                          <Link to="/faq#returns" className="block text-blue-600 hover:underline">
                            如何退货？
                          </Link>
                          <Link to="/faq#shipping" className="block text-blue-600 hover:underline">
                            有哪些配送方式？
                          </Link>
                          <Link to="/faq#payment" className="block text-blue-600 hover:underline">
                            支持哪些支付方式？
                          </Link>
                          <Link to="/faq" className="block text-blue-600 hover:underline mt-2">
                            查看全部常见问题
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
};

export default ProfileSettingsPage;
