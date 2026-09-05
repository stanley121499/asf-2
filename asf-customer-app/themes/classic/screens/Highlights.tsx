import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Redirect, usePathname, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { CartButton } from "@/components/cart/CartButton";
import { PostVideo } from "@/components/PostVideo";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useContentTranslation } from "@/context/ContentTranslationContext";
import { useTranslation } from "@/context/LocaleContext";
import { usePostContext } from "@/context/post/PostContext";
import { usePostMediaContext } from "@/context/post/PostMediaContext";
import { colors } from "@/constants/theme";
import type { Tables } from "@/database.types";

const SCREEN_WIDTH = Dimensions.get("window").width;
/** 4:5 aspect ratio — matches web `pt-[125%]` */
const MEDIA_HEIGHT = SCREEN_WIDTH * 1.25;

// ─── Comment bottom sheet ────────────────────────────────────────────────────

interface CommentSheetProps {
  visible: boolean;
  onClose: () => void;
}

function CommentSheet({ visible, onClose }: CommentSheetProps): React.ReactElement {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (text.trim().length === 0) return;
    setSent(true);
    setText("");
    setTimeout(() => {
      setSent(false);
      onClose();
    }, 1200);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            paddingBottom: Math.max(insets.bottom, 24),
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 20, color: colors.text }}>
              {t("post.comment")}
            </Text>
            <Pressable onPress={onClose} hitSlop={8} accessibilityLabel={t("common.close")}>
              <Ionicons name="close" size={24} color={colors.muted} />
            </Pressable>
          </View>
          <TextInput
            style={{
              height: 120,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 16,
              backgroundColor: colors.panel,
              color: colors.text,
              fontSize: 15,
              fontFamily: "Inter_400Regular",
              textAlignVertical: "top",
            }}
            placeholder={t("post.commentPlaceholder")}
            placeholderTextColor={colors.muted}
            value={text}
            onChangeText={setText}
            multiline
            autoFocus
          />
          <Pressable
            onPress={handleSend}
            style={{
              marginTop: 16,
              height: 56,
              backgroundColor: "#000000",
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600", fontFamily: "Inter_400Regular" }}>
              {sent ? t("post.commentSubmitted") : t("post.send")}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Individual PostCard ─────────────────────────────────────────────────────

interface PostCardProps {
  post: Tables<"posts">;
  medias: Tables<"post_medias">[];
}

function PostCard({ post, medias }: PostCardProps): React.ReactElement {
  const { t } = useTranslation();
  const { translatePost } = useContentTranslation();
  const router = useRouter();
  const sortedMedias = useMemo(
    () => [...medias].sort((a, b) => (a.arrangement ?? 0) - (b.arrangement ?? 0)),
    [medias]
  );
  const firstMedia = sortedMedias[0] ?? null;
  const mediaUrl = firstMedia?.media_url ?? null;
  const isVideo = (firstMedia?.media_type ?? "image") === "video";
  const caption = translatePost(post.id, "caption", post.caption);
  const ctaText = translatePost(post.id, "cta_text", post.cta_text);

  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);

  React.useEffect(() => {
    void (async () => {
      try {
        const liked = JSON.parse((await AsyncStorage.getItem("liked_posts")) ?? "[]") as string[];
        const saved = JSON.parse((await AsyncStorage.getItem("saved_posts")) ?? "[]") as string[];
        setIsLiked(liked.includes(post.id));
        setIsSaved(saved.includes(post.id));
      } catch { /* ignore */ }
    })();
  }, [post.id]);

  const toggleLike = useCallback(async () => {
    const next = !isLiked;
    setIsLiked(next);
    try {
      const liked = JSON.parse((await AsyncStorage.getItem("liked_posts")) ?? "[]") as string[];
      if (next) { if (!liked.includes(post.id)) liked.push(post.id); }
      else { const idx = liked.indexOf(post.id); if (idx > -1) liked.splice(idx, 1); }
      await AsyncStorage.setItem("liked_posts", JSON.stringify(liked));
    } catch { /* ignore */ }
  }, [isLiked, post.id]);

  const toggleSave = useCallback(async () => {
    const next = !isSaved;
    setIsSaved(next);
    try {
      const saved = JSON.parse((await AsyncStorage.getItem("saved_posts")) ?? "[]") as string[];
      if (next) { if (!saved.includes(post.id)) saved.push(post.id); }
      else { const idx = saved.indexOf(post.id); if (idx > -1) saved.splice(idx, 1); }
      await AsyncStorage.setItem("saved_posts", JSON.stringify(saved));
    } catch { /* ignore */ }
  }, [isSaved, post.id]);

  return (
    <View style={{ width: "100%", backgroundColor: "#FFFFFF", marginBottom: 32 }}>
      {/* Media block — 4:5 ratio, black bg, edge-to-edge */}
      <View style={{ width: SCREEN_WIDTH, height: MEDIA_HEIGHT, backgroundColor: "#000000" }}>
        {mediaUrl === null ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="image-outline" size={40} color="#555" />
            <Text style={{ color: "#555", fontSize: 13, marginTop: 8, fontFamily: "Inter_400Regular" }}>
              {t("post.noContent")}
            </Text>
          </View>
        ) : isVideo ? (
          <>
            <PostVideo
              uri={mediaUrl}
              style={{ width: SCREEN_WIDTH, height: MEDIA_HEIGHT }}
              contentFit="contain"
              shouldPlay
              muted={isMuted}
            />
            <View
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                backgroundColor: "rgba(0,0,0,0.6)",
                borderRadius: 99,
                paddingHorizontal: 10,
                paddingVertical: 4,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
              pointerEvents="none"
            >
              <Ionicons name="play" size={10} color="#FFFFFF" />
              <Text style={{ color: "#FFFFFF", fontSize: 11, fontFamily: "Inter_400Regular" }}>
                {t("post.video")}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsMuted((m) => !m)}
              style={{
                position: "absolute",
                bottom: 12,
                right: 12,
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "rgba(0,0,0,0.6)",
                alignItems: "center",
                justifyContent: "center",
              }}
              accessibilityLabel={isMuted ? t("post.unmuteAria") : t("post.muteAria")}
            >
              <Ionicons
                name={isMuted ? "volume-mute-outline" : "volume-high-outline"}
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </>
        ) : (
          <Image
            source={{ uri: mediaUrl }}
            style={{ width: SCREEN_WIDTH, height: MEDIA_HEIGHT }}
            contentFit="cover"
          />
        )}
      </View>

      {/* Caption */}
      {caption.length > 0 && (
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <Text style={{ fontSize: 15, color: colors.text, fontFamily: "Inter_400Regular", lineHeight: 22 }}>
            {caption}
          </Text>
        </View>
      )}

      {/* Action row: Like, Comment, Save */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 24, marginTop: 4 }}>
        <TouchableOpacity
          onPress={() => void toggleLike()}
          style={{ flexDirection: "column", alignItems: "center", gap: 2 }}
        >
          <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? "#EF4444" : colors.text} />
          <Text style={{ fontSize: 11, color: colors.muted, fontFamily: "Inter_400Regular" }}>
            {t("post.like")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setCommentOpen(true)}
          style={{ flexDirection: "column", alignItems: "center", gap: 2 }}
        >
          <Ionicons name="chatbubble-outline" size={24} color={colors.text} />
          <Text style={{ fontSize: 11, color: colors.muted, fontFamily: "Inter_400Regular" }}>
            {t("post.comment")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => void toggleSave()}
          style={{ flexDirection: "column", alignItems: "center", gap: 2 }}
        >
          <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={24} color={colors.text} />
          <Text style={{ fontSize: 11, color: colors.muted, fontFamily: "Inter_400Regular" }}>
            {t("post.save")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* CTA button */}
      {ctaText.length > 0 && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <Pressable
            onPress={() => router.push("/(tabs)/browse")}
            style={{
              height: 52,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#000000",
              backgroundColor: "transparent",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#000000", fontSize: 15, fontWeight: "500", fontFamily: "Inter_400Regular" }}>
              {ctaText}
            </Text>
          </Pressable>
        </View>
      )}

      <CommentSheet visible={commentOpen} onClose={() => setCommentOpen(false)} />
    </View>
  );
}

// ─── Highlights screen (tab + profile stack) ─────────────────────────────────

/**
 * Classic Highlights skin — full-width vertical 4:5 post feed (Tier A).
 * Shared by the Highlights tab and `profile/highlights`. When mounted under
 * the profile stack (pathname contains `/profile/`), shows a back button.
 * Classic header bag sits in the top-right on both entry points.
 */
export function ClassicHighlightsScreen(): React.ReactElement {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { isEnabled } = useFeatureFlags();
  const { posts, loading: postsLoading } = usePostContext();
  const { postMedias, loading: mediaLoading } = usePostMediaContext();

  /**
   * Profile-stack entry keeps the back chevron; the root Highlights tab does not.
   */
  const showBack = pathname.includes("/profile");

  const featured = useMemo(
    () =>
      [...posts]
        .filter((p) => p.id.length > 0)
        .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()),
    [posts]
  );

  const mediasForPost = useMemo(() => {
    const map = new Map<string, Tables<"post_medias">[]>();
    for (const m of postMedias) {
      if (typeof m.post_id !== "string") continue;
      const list = map.get(m.post_id) ?? [];
      list.push(m);
      map.set(m.post_id, list);
    }
    return map;
  }, [postMedias]);

  if (!showBack && !isEnabled("highlights")) {
    return <Redirect href="/(tabs)" />;
  }

  const loading = postsLoading || mediaLoading;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView
        edges={["top"]}
        style={{ backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: colors.border }}
      >
        <View
          style={{
            height: 56,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            paddingHorizontal: 56,
          }}
        >
          {showBack ? (
            <Pressable
              onPress={() => {
                router.back();
              }}
              style={{
                position: "absolute",
                left: 16,
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
              hitSlop={8}
              accessibilityLabel={t("orders.back")}
            >
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </Pressable>
          ) : null}
          <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 20, color: colors.text }}>
            {t("highlights.title")}
          </Text>
          <View style={{ position: "absolute", right: 8 }}>
            <CartButton accessibilityLabel={t("nav.openCart")} />
          </View>
        </View>
      </SafeAreaView>

      {featured.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.muted, fontSize: 15, fontFamily: "Inter_400Regular" }}>
            {t("highlights.empty")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={featured}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard post={item} medias={mediasForPost.get(item.id) ?? []} />
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
