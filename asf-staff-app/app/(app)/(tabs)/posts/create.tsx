import { useRouter } from "expo-router";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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
import { pickImages } from "./_components/MediaGrid";
import {
  SchedulePickerModal,
  formatScheduleDate,
} from "./_components/SchedulePickerModal";

// ─── Types ────────────────────────────────────────────────────────────────────
type PostStatus = "draft" | "scheduled" | "published";

interface LocalAsset {
  uri: string;
  type: string | undefined;
}

const STATUS_OPTIONS: ReadonlyArray<{
  value: PostStatus;
  label: string;
  color: string;
  description: string;
}> = [
  { value: "draft", label: "草稿", color: "#4B5563", description: "客户不可见" },
  { value: "scheduled", label: "已排期", color: "#D97706", description: "将在预定时间发布" },
  { value: "published", label: "已发布", color: "#059669", description: "立即在客户端显示" },
];

const THUMB = 90;

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionLabel({ text }: Readonly<{ text: string }>): React.ReactElement {
  return (
    <Text
      style={{
        fontSize: 12,
        fontWeight: "600",
        color: C.muted,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 8,
      }}
    >
      {text}
    </Text>
  );
}

// ─── Post Preview ─────────────────────────────────────────────────────────────
/**
 * Renders a faithful preview of how the post will look on the highlights feed.
 *
 * Layout mirrors the customer app's PostCard:
 *   • Media block — 4:5 portrait ratio (SCREEN_WIDTH * 1.25 in customer app)
 *   • Caption below the image (not overlaid)
 *   • Outlined CTA button below the caption
 */
function PostPreview({
  firstUri,
  caption,
  ctaText,
  name,
}: Readonly<{
  firstUri: string | null;
  caption: string;
  ctaText: string;
  name: string;
}>): React.ReactElement {
  const hasContent =
    firstUri !== null ||
    caption.trim().length > 0 ||
    name.trim().length > 0 ||
    ctaText.trim().length > 0;

  if (!hasContent) {
    return (
      <View
        style={{
          marginHorizontal: 16,
          aspectRatio: 4 / 5,
          borderRadius: 16,
          backgroundColor: "#F3F4F6",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: C.border,
          borderStyle: "dashed",
        }}
      >
        <Ionicons name="image-outline" size={36} color="#C7C7CC" />
        <Text style={{ fontSize: 13, color: "#C7C7CC", marginTop: 8 }}>
          预览将显示在此处
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        marginHorizontal: 16,
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: "#FFFFFF",
      }}
    >
      {/* ── Media — 4:5 ratio, same as customer app highlights ── */}
      <View
        style={{ aspectRatio: 4 / 5, backgroundColor: "#1C1C1E" }}
      >
        {firstUri === null ? (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="image-outline" size={36} color="#555" />
            <Text
              style={{
                fontSize: 13,
                color: "#555",
                marginTop: 8,
              }}
            >
              未选择图片
            </Text>
          </View>
        ) : (
          <Image
            source={{ uri: firstUri }}
            style={{ flex: 1 }}
            contentFit="cover"
          />
        )}
      </View>

      {/* ── Caption — below image, not overlaid ── */}
      {caption.trim().length > 0 && (
        <View style={{ paddingHorizontal: 14, paddingTop: 14 }}>
          <Text
            style={{
              fontSize: 14,
              color: "#1C1C1E",
              lineHeight: 20,
            }}
            numberOfLines={4}
          >
            {caption}
          </Text>
        </View>
      )}

      {/* ── CTA button — outlined, same as customer app ── */}
      {ctaText.trim().length > 0 && (
        <View style={{ paddingHorizontal: 14, paddingVertical: 14 }}>
          <View
            style={{
              height: 48,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#1C1C1E",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{ fontSize: 14, fontWeight: "600", color: "#1C1C1E" }}
            >
              {ctaText}
            </Text>
          </View>
        </View>
      )}

      {/* Spacing when neither caption nor CTA */}
      {caption.trim().length === 0 && ctaText.trim().length === 0 && (
        <View style={{ height: 14 }} />
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PostCreateScreen(): React.ReactElement {
  const router = useRouter();
  const { createPost } = usePostContext();
  const { createPostMedia } = usePostMediaContext();

  const [name, setName] = useState("");
  const [caption, setCaption] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [status, setStatus] = useState<PostStatus>("draft");
  const [timePosts, setTimePosts] = useState<Date | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [localAssets, setLocalAssets] = useState<LocalAsset[]>([]);
  const [saving, setSaving] = useState(false);

  const canCreate = name.trim().length > 0;
  const firstUri = localAssets.length > 0 ? (localAssets[0]?.uri ?? null) : null;
  const mediaSectionLabel = localAssets.length > 0 ? `媒体 · ${localAssets.length}` : "媒体";

  const handlePickImages = async (): Promise<void> => {
    const assets = await pickImages();
    setLocalAssets((prev) => [
      ...prev,
      ...assets.map((a) => ({ uri: a.uri, type: a.type })),
    ]);
  };

  const handleRemoveLocal = (index: number): void => {
    setLocalAssets((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * 1. Creates the post record (including schedule if set).
   * 2. Uploads locally selected assets to Supabase storage.
   * 3. Creates `post_medias` rows for each uploaded asset.
   * 4. Navigates to the edit screen (replace so Back returns to the list).
   */
  const handleCreate = async (): Promise<void> => {
    if (!canCreate) {
      Alert.alert("验证", "请输入帖子名称。");
      return;
    }
    setSaving(true);
    try {
      const created = await createPost({
        name: name.trim(),
        caption: caption.trim().length > 0 ? caption.trim() : null,
        cta_text: ctaText.trim().length > 0 ? ctaText.trim() : null,
        status,
        active: false,
        time_post: timePosts === null ? null : timePosts.toISOString(),
      });

      if (created === undefined) return;

      if (localAssets.length > 0) {
        await Promise.all(
          localAssets.map(async (asset, i) => {
            const { url, category } = await uploadMedia(
              asset.uri,
              created.id,
              asset.type ?? undefined
            );
            await createPostMedia({
              post_id: created.id,
              media_url: url,
              media_type: category,
              arrangement: i,
            });
          })
        );
      }

      router.replace(`/(app)/(tabs)/posts/${created.id}`);
    } catch (err: unknown) {
      Alert.alert("错误", err instanceof Error ? err.message : "操作失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  };

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
          style={{
            fontSize: 17,
            fontWeight: "600",
            color: C.text,
            flex: 1,
            marginHorizontal: 10,
          }}
        >
          新建帖子
        </Text>
        <Pressable
          onPress={() => void handleCreate()}
          disabled={!canCreate || saving}
        >
          <View
            style={{
              backgroundColor: canCreate ? C.accent : "#E5E7EB",
              borderRadius: 10,
              paddingHorizontal: 16,
              paddingVertical: 8,
              minWidth: 70,
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
                  color: canCreate ? "#FFFFFF" : C.muted,
                }}
              >
                创建
              </Text>
            )}
          </View>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 60 }}>
        <SectionLabel text="预览" />
        <PostPreview
          firstUri={firstUri}
          caption={caption}
          ctaText={ctaText}
          name={name}
        />

        {/* ── Details ─────────────────────────────────────────────────── */}
        <SectionLabel text="详情" />
        <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
          {/* Name */}
          <View
            style={{
              backgroundColor: C.panel,
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 15, color: C.text, minWidth: 80, flexShrink: 0 }}>
              名称 *
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="给你的帖子起个名字"
              placeholderTextColor={C.muted}
              autoFocus
              returnKeyType="next"
              style={{ flex: 1, fontSize: 15, color: C.text, textAlign: "right" }}
            />
          </View>

          {/* CTA Text */}
          <View
            style={{
              backgroundColor: C.panel,
              borderTopWidth: 1,
              borderTopColor: C.border,
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 15, color: C.text, minWidth: 80, flexShrink: 0 }}>
              行动号召文本
            </Text>
            <TextInput
              value={ctaText}
              onChangeText={setCtaText}
              placeholder="例: 立即购买"
              placeholderTextColor={C.muted}
              returnKeyType="done"
              style={{ flex: 1, fontSize: 15, color: C.text, textAlign: "right" }}
            />
          </View>

          {/* Schedule */}
          <View
            style={{
              backgroundColor: C.panel,
              borderTopWidth: 1,
              borderTopColor: C.border,
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
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

        {/* ── Caption ─────────────────────────────────────────────────── */}
        <SectionLabel text="文案" />
        <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
          <View
            style={{ backgroundColor: C.panel, paddingHorizontal: 16, paddingVertical: 12 }}
          >
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="在帖子媒体上添加叠加文本…"
              placeholderTextColor={C.muted}
              multiline
              numberOfLines={4}
              style={{
                fontSize: 15,
                color: C.text,
                minHeight: 88,
                textAlignVertical: "top",
              }}
            />
          </View>
        </View>

        {/* ── Media ───────────────────────────────────────────────────── */}
        <SectionLabel text={mediaSectionLabel} />
        <View
          style={{
            backgroundColor: C.panel,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: C.border,
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
        >
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {localAssets.map((asset, idx) => (
              <View
                key={`${asset.uri}-${idx}`}
                style={{
                  width: THUMB,
                  height: THUMB,
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <Image
                  source={{ uri: asset.uri }}
                  style={{ width: THUMB, height: THUMB }}
                  contentFit="cover"
                />
                {/* Remove button */}
                <Pressable
                  onPress={() => handleRemoveLocal(idx)}
                  hitSlop={6}
                  style={({ pressed }) => ({
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: pressed ? "#DC2626" : "rgba(0,0,0,0.65)",
                    alignItems: "center",
                    justifyContent: "center",
                  })}
                >
                  <Ionicons name="close" size={13} color="#FFFFFF" />
                </Pressable>
              </View>
            ))}

            {/*
             * Add button — same THUMB size as thumbnails.
             * All sizing goes on the inner View (not the Pressable callback)
             * to be reliable in React Native 0.81.
             */}
            <Pressable
              onPress={() => void handlePickImages()}
              disabled={saving}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <View
                style={{
                  width: THUMB,
                  height: THUMB,
                  borderRadius: 10,
                  backgroundColor: "#DDDFE2",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                <Ionicons name="add-circle-outline" size={28} color="#555" />
                <Text style={{ fontSize: 11, color: "#555", fontWeight: "600" }}>
                  添加
                </Text>
              </View>
            </Pressable>
          </View>

          {localAssets.length === 0 && (
            <Text
              style={{
                fontSize: 12,
                color: C.muted,
                textAlign: "center",
                marginTop: 10,
              }}
            >
              点击添加以附加图片或视频
            </Text>
          )}
        </View>

        {/* ── Status ──────────────────────────────────────────────────── */}
        <SectionLabel text="状态" />
        <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
          {STATUS_OPTIONS.map((opt) => {
            const selected = status === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setStatus(opt.value)}
                style={{
                  backgroundColor: C.panel,
                  borderTopWidth: 1,
                  borderTopColor: C.border,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "500",
                      color: selected ? opt.color : C.text,
                      marginBottom: 2,
                    }}
                  >
                    {opt.label}
                  </Text>
                  <Text style={{ fontSize: 12, color: C.muted }}>
                    {opt.description}
                  </Text>
                </View>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={20} color={opt.color} />
                ) : (
                  <Ionicons name="ellipse-outline" size={20} color={C.border} />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* ── Hint ────────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
            <Ionicons
              name="information-circle-outline"
              size={15}
              color={C.muted}
              style={{ marginTop: 1 }}
            />
            <Text style={{ fontSize: 12, color: C.muted, lineHeight: 18, flex: 1 }}>
              您可以在下一屏幕添加更多媒体并编辑排期。
            </Text>
          </View>
        </View>
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
