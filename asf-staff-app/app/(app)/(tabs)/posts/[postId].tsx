import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { usePostContext } from "@/context/post/PostContext";
import { usePostMediaContext } from "@/context/post/PostMediaContext";
import { C } from "./_lib/postTokens";
import { uploadMedia } from "./_lib/uploadMedia";
import {
  SchedulePickerModal,
  formatScheduleDate,
} from "./_components/SchedulePickerModal";
import { MediaGrid, pickImages } from "./_components/MediaGrid";

// ─── Types ────────────────────────────────────────────────────────────────────
type PostStatus = "draft" | "scheduled" | "published";

const STATUS_OPTIONS: ReadonlyArray<{
  value: PostStatus;
  label: string;
  color: string;
}> = [
  { value: "draft", label: "草稿", color: "#4B5563" },
  { value: "scheduled", label: "已排期", color: "#D97706" },
  { value: "published", label: "已发布", color: "#059669" },
];

// ─── Shared sub-components ────────────────────────────────────────────────────
function SectionLabel({
  text,
}: Readonly<{ text: string }>): React.ReactElement {
  return (
    <Text
      style={{
        fontSize: 12,
        fontWeight: "600",
        color: C.muted,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 8,
      }}
    >
      {text}
    </Text>
  );
}

function FieldRow({
  label,
  first = false,
  children,
}: Readonly<{
  label: string;
  first?: boolean;
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <View
      style={{
        backgroundColor: C.panel,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: C.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <Text
        style={{ fontSize: 15, color: C.text, minWidth: 82, flexShrink: 0 }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PostEditScreen(): React.ReactElement {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { posts, updatePost, deletePost, loading } = usePostContext();
  const { postMedias, createPostMedia, deletePostMedia } = usePostMediaContext();

  const post = useMemo(
    () => posts.find((p) => p.id === postId) ?? null,
    [posts, postId]
  );

  const medias = useMemo(
    () =>
      [...postMedias.filter((m) => m.post_id === postId)].sort(
        (a, b) => (a.arrangement ?? 0) - (b.arrangement ?? 0)
      ),
    [postMedias, postId]
  );

  // ─── Form state ─────────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [caption, setCaption] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [status, setStatus] = useState<PostStatus>("draft");
  const [active, setActive] = useState(false);
  const [timePosts, setTimePosts] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  /** Seed form when the post loads. */
  useEffect(() => {
    if (post === null) return;
    setName(post.name);
    setCaption(post.caption ?? "");
    setCtaText(post.cta_text ?? "");
    const raw = post.status;
    setStatus(
      raw === "published" || raw === "scheduled" || raw === "draft"
        ? raw
        : "draft"
    );
    setActive(post.active);
    setTimePosts(post.time_post === null ? null : new Date(post.time_post));
  }, [post]);

  const isDirty = useMemo<boolean>(() => {
    if (post === null) return false;
    const raw = post.status;
    const savedStatus: PostStatus =
      raw === "published" || raw === "scheduled" || raw === "draft"
        ? raw
        : "draft";
    const savedTime =
      post.time_post === null ? null : new Date(post.time_post).toISOString();
    return (
      name !== post.name ||
      caption !== (post.caption ?? "") ||
      ctaText !== (post.cta_text ?? "") ||
      status !== savedStatus ||
      active !== post.active ||
      (timePosts === null ? null : timePosts.toISOString()) !== savedTime
    );
  }, [post, name, caption, ctaText, status, active, timePosts]);

  const handleSave = useCallback(async (): Promise<void> => {
    if (post === null || postId === undefined) return;
    if (name.trim().length === 0) {
      Alert.alert("验证", "请输入帖子名称。");
      return;
    }
    setSaving(true);
    try {
      await updatePost({
        id: postId,
        name: name.trim(),
        caption: caption.trim().length > 0 ? caption.trim() : null,
        cta_text: ctaText.trim().length > 0 ? ctaText.trim() : null,
        status,
        active,
        time_post: timePosts === null ? null : timePosts.toISOString(),
      });
    } finally {
      setSaving(false);
    }
  }, [post, postId, name, caption, ctaText, status, active, timePosts, updatePost]);

  const handleDelete = useCallback((): void => {
    if (postId === undefined) return;
    Alert.alert(
      "删除帖子",
      `确定要永久删除"${post?.name ?? "此帖子"}"吗？`,
      [
        { text: "取消", style: "cancel" },
        {
          text: "删除",
          style: "destructive",
          onPress: () => {
            setDeleting(true);
            deletePost(postId)
              .then(() => router.back())
              .catch(() => setDeleting(false));
          },
        },
      ]
    );
  }, [postId, post, deletePost, router]);

  const handleAddMedia = useCallback(async (): Promise<void> => {
    if (postId === undefined) return;
    const assets = await pickImages();
    if (assets.length === 0) return;
    setUploading(true);
    try {
      await Promise.all(
        assets.map(async (asset, i) => {
          const { url, category } = await uploadMedia(
            asset.uri,
            postId,
            asset.type ?? undefined
          );
          await createPostMedia({
            post_id: postId,
            media_url: url,
            media_type: category,
            arrangement: medias.length + i,
          });
        })
      );
    } catch (err: unknown) {
      Alert.alert("上传失败", err instanceof Error ? err.message : "上传失败，请重试。");
    } finally {
      setUploading(false);
    }
  }, [postId, medias.length, createPostMedia]);

  const handleRemoveMedia = useCallback(
    (id: number): void => {
      void deletePostMedia(String(id));
    },
    [deletePostMedia]
  );

  // ─── Loading / not-found states ──────────────────────────────────────────────
  const mediaSectionLabel = medias.length > 0 ? `媒体 · ${medias.length}` : "媒体";
  if (loading && post === null) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator color={C.accent} size="large" />
      </SafeAreaView>
    );
  }

  if (post === null) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
        <View
          style={{
            backgroundColor: C.panel,
            borderBottomWidth: 1,
            borderBottomColor: C.border,
            paddingHorizontal: 16,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
          <Text style={{ fontSize: 17, fontWeight: "600", color: C.text }}>
            帖子不存在
          </Text>
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Ionicons name="alert-circle-outline" size={40} color={C.muted} />
          <Text style={{ color: C.muted, marginTop: 12 }}>
            帖子加载失败。
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: C.panel,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Text
          style={{ fontSize: 17, fontWeight: "600", color: C.text, flex: 1, marginHorizontal: 10 }}
          numberOfLines={1}
        >
          {post.name}
        </Text>
        <Pressable
          onPress={() => void handleSave()}
          disabled={!isDirty || saving}
          style={{
            backgroundColor: isDirty ? C.accent : "#E5E7EB",
            borderRadius: 10,
            paddingHorizontal: 16,
            paddingVertical: 8,
            minWidth: 60,
            alignItems: "center",
          }}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: isDirty ? "#FFFFFF" : C.muted,
              }}
            >
              保存
            </Text>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 60 }}>
        {/* ── Details ─────────────────────────────────────────────────── */}
        <SectionLabel text="详情" />
        <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border, backgroundColor: C.panel }}>
          <FieldRow label="名称" first>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="帖子名称"
              placeholderTextColor={C.muted}
              style={{ flex: 1, fontSize: 15, color: C.text, textAlign: "right" }}
            />
          </FieldRow>

          {/* Status chips */}
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: C.border,
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: C.panel,
            }}
          >
            <Text style={{ fontSize: 13, color: C.muted, marginBottom: 10 }}>
              状态
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {STATUS_OPTIONS.map((opt) => {
                const sel = status === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setStatus(opt.value)}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: sel ? opt.color : C.border,
                      backgroundColor: sel ? `${opt.color}18` : C.panel,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: sel ? opt.color : C.muted,
                      }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Active */}
          <FieldRow label="激活">
            <Switch
              value={active}
              onValueChange={setActive}
              trackColor={{ false: C.border, true: "#22C55E" }}
              thumbColor="#FFFFFF"
            />
          </FieldRow>

          {/* Schedule */}
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: C.border,
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              backgroundColor: C.panel,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <Ionicons name="calendar-outline" size={17} color={C.muted} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, color: C.text }}>排期</Text>
                {timePosts !== null && (
                  <Text style={{ fontSize: 12, color: "#6D28D9", marginTop: 2 }}>
                    {formatScheduleDate(timePosts)}
                  </Text>
                )}
              </View>
            </View>
            <Pressable
              onPress={() => setScheduleOpen(true)}
              style={({ pressed }) => ({
                backgroundColor: pressed ? "#E5E7EB" : C.bg,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: C.border,
                paddingHorizontal: 12,
                paddingVertical: 6,
              })}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: C.text }}>
                {timePosts === null ? "设置" : "编辑"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ── Content ─────────────────────────────────────────────────── */}
        <SectionLabel text="内容" />
        <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border, backgroundColor: C.panel }}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ fontSize: 12, color: C.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.3 }}>
              文案
            </Text>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="显示在媒体上的叠加文字…"
              placeholderTextColor={C.muted}
              multiline
              numberOfLines={3}
              style={{ fontSize: 15, color: C.text, minHeight: 72, textAlignVertical: "top" }}
            />
          </View>
          <FieldRow label="行动号召文本">
            <TextInput
              value={ctaText}
              onChangeText={setCtaText}
              placeholder="例: 立即购买"
              placeholderTextColor={C.muted}
              style={{ flex: 1, fontSize: 15, color: C.text, textAlign: "right" }}
            />
          </FieldRow>
        </View>

        {/* ── Media ───────────────────────────────────────────────────── */}
        <SectionLabel text={mediaSectionLabel} />
        <MediaGrid
          medias={medias}
          uploading={uploading}
          onAdd={() => void handleAddMedia()}
          onRemove={handleRemoveMedia}
        />

        {/* ── Info ────────────────────────────────────────────────────── */}
        <SectionLabel text="信息" />
        <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border, backgroundColor: C.panel }}>
          <FieldRow label="创建时间" first>
            <Text style={{ fontSize: 13, color: C.muted }}>
              {new Date(post.created_at).toLocaleString("zh-CN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </FieldRow>
          <FieldRow label="帖子ID">
            <Text style={{ fontSize: 11, color: C.muted }} numberOfLines={1} ellipsizeMode="middle">
              {post.id}
            </Text>
          </FieldRow>
        </View>

        {/* ── Danger Zone ─────────────────────────────────────────────── */}
        <SectionLabel text="危险操作" />
        {/* Use inner View so backgroundColor always renders regardless of pressed state */}
        <Pressable onPress={handleDelete} disabled={deleting} style={({ pressed }) => ({ opacity: pressed || deleting ? 0.7 : 1 })}>
          <View
            style={{
              marginHorizontal: 16,
              backgroundColor: C.danger,
              borderRadius: 14,
              paddingVertical: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>
                  删除帖子
                </Text>
              </>
            )}
          </View>
        </Pressable>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Schedule modal ──────────────────────────────────────────────── */}
      <SchedulePickerModal
        visible={scheduleOpen}
        initial={timePosts}
        onConfirm={(d) => {
          setTimePosts(d);
          setScheduleOpen(false);
        }}
        onClear={() => {
          setTimePosts(null);
          setScheduleOpen(false);
        }}
        onDismiss={() => setScheduleOpen(false)}
      />
    </SafeAreaView>
  );
}
