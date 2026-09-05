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
import { useThemeTokens } from "@/context/ThemeContext";
import type { Tables } from "@/database.types";
import type { ThemeTokens } from "@/themes/types";

const SCREEN_WIDTH = Dimensions.get("window").width;
/** Tall media frame — night feed crop; captions live below, not on the plate. */
const MEDIA_HEIGHT = Math.round(SCREEN_WIDTH * 1.28);

interface CommentSheetProps {
  visible: boolean;
  onClose: () => void;
  tokens: ThemeTokens;
}

/**
 * Compact dark comment sheet for Noir Highlights night feed.
 */
function CommentSheet({
  visible,
  onClose,
  tokens,
}: CommentSheetProps): React.ReactElement {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = (): void => {
    if (text.trim().length === 0) {
      return;
    }
    setSent(true);
    setText("");
    setTimeout(() => {
      setSent(false);
      onClose();
    }, 1200);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.72)" }} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View
          style={{
            backgroundColor: tokens.panel,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            padding: 16,
            paddingBottom: Math.max(insets.bottom, 16),
            borderTopWidth: 1,
            borderColor: tokens.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 13,
                fontWeight: "600",
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: tokens.text,
              }}
            >
              {t("post.comment")}
            </Text>
            <Pressable onPress={onClose} hitSlop={8} accessibilityLabel={t("common.close")}>
              <Ionicons name="close" size={20} color={tokens.muted} />
            </Pressable>
          </View>
          <TextInput
            style={{
              height: 88,
              borderWidth: 1,
              borderColor: tokens.border,
              borderRadius: 6,
              padding: 12,
              backgroundColor: tokens.bg,
              color: tokens.text,
              fontSize: 14,
              fontFamily: "Inter_400Regular",
              textAlignVertical: "top",
            }}
            placeholder={t("post.commentPlaceholder")}
            placeholderTextColor={tokens.muted}
            value={text}
            onChangeText={setText}
            multiline
            autoFocus
          />
          <Pressable
            onPress={handleSend}
            style={{
              marginTop: 12,
              height: 46,
              backgroundColor: tokens.accent,
              borderRadius: 6,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: tokens.bg,
                fontSize: 13,
                fontWeight: "700",
                letterSpacing: 1,
                textTransform: "uppercase",
                fontFamily: "Inter_400Regular",
              }}
            >
              {sent ? t("post.commentSubmitted") : t("post.send")}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface NightMediaFrameProps {
  post: Tables<"posts">;
  medias: Tables<"post_medias">[];
  tokens: ThemeTokens;
}

/**
 * Noir night media frame — full-bleed media first; caption + actions secondary
 * below the plate. Not a Shop product row and not Atelier snap-journal copy.
 */
function NightMediaFrame({
  post,
  medias,
  tokens,
}: NightMediaFrameProps): React.ReactElement {
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
        const liked = JSON.parse(
          (await AsyncStorage.getItem("liked_posts")) ?? "[]"
        ) as string[];
        const saved = JSON.parse(
          (await AsyncStorage.getItem("saved_posts")) ?? "[]"
        ) as string[];
        setIsLiked(liked.includes(post.id));
        setIsSaved(saved.includes(post.id));
      } catch {
        /* ignore corrupt storage */
      }
    })();
  }, [post.id]);

  const toggleLike = useCallback(async () => {
    const next = !isLiked;
    setIsLiked(next);
    try {
      const liked = JSON.parse(
        (await AsyncStorage.getItem("liked_posts")) ?? "[]"
      ) as string[];
      if (next) {
        if (!liked.includes(post.id)) {
          liked.push(post.id);
        }
      } else {
        const idx = liked.indexOf(post.id);
        if (idx > -1) {
          liked.splice(idx, 1);
        }
      }
      await AsyncStorage.setItem("liked_posts", JSON.stringify(liked));
    } catch {
      /* ignore */
    }
  }, [isLiked, post.id]);

  const toggleSave = useCallback(async () => {
    const next = !isSaved;
    setIsSaved(next);
    try {
      const saved = JSON.parse(
        (await AsyncStorage.getItem("saved_posts")) ?? "[]"
      ) as string[];
      if (next) {
        if (!saved.includes(post.id)) {
          saved.push(post.id);
        }
      } else {
        const idx = saved.indexOf(post.id);
        if (idx > -1) {
          saved.splice(idx, 1);
        }
      }
      await AsyncStorage.setItem("saved_posts", JSON.stringify(saved));
    } catch {
      /* ignore */
    }
  }, [isSaved, post.id]);

  return (
    <View
      style={{
        width: "100%",
        backgroundColor: tokens.bg,
        borderBottomWidth: 1,
        borderBottomColor: tokens.border,
        paddingBottom: 14,
      }}
    >
      {/* Media plate — edge-to-edge, no caption overlay */}
      <View
        style={{
          width: SCREEN_WIDTH,
          height: MEDIA_HEIGHT,
          backgroundColor: "#000000",
        }}
      >
        {mediaUrl === null ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="image-outline" size={36} color={tokens.muted} />
            <Text
              style={{
                color: tokens.muted,
                fontSize: 12,
                marginTop: 8,
                fontFamily: "Inter_400Regular",
              }}
            >
              {t("post.noContent")}
            </Text>
          </View>
        ) : isVideo ? (
          <>
            <PostVideo
              uri={mediaUrl}
              style={{ width: SCREEN_WIDTH, height: MEDIA_HEIGHT }}
              contentFit="cover"
              shouldPlay
              muted={isMuted}
            />
            <TouchableOpacity
              onPress={() => setIsMuted((m) => !m)}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(10,10,10,0.72)",
                borderWidth: 1,
                borderColor: tokens.border,
                alignItems: "center",
                justifyContent: "center",
              }}
              accessibilityLabel={isMuted ? t("post.unmuteAria") : t("post.muteAria")}
            >
              <Ionicons
                name={isMuted ? "volume-mute-outline" : "volume-high-outline"}
                size={16}
                color={tokens.text}
              />
            </TouchableOpacity>
          </>
        ) : (
          <Image
            source={{ uri: mediaUrl }}
            style={{ width: SCREEN_WIDTH, height: MEDIA_HEIGHT }}
            contentFit="cover"
            accessibilityLabel={
              caption.length > 0 ? caption : t("post.featuredContent")
            }
          />
        )}
      </View>

      {/* Secondary caption + sparse actions under the frame */}
      <View style={{ paddingHorizontal: 14, paddingTop: 12 }}>
        {caption.length > 0 ? (
          <Text
            style={{
              fontSize: 13,
              color: tokens.muted,
              fontFamily: "Inter_400Regular",
              lineHeight: 18,
              marginBottom: 10,
            }}
            numberOfLines={3}
          >
            {caption}
          </Text>
        ) : null}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 18,
          }}
        >
          <TouchableOpacity
            onPress={() => void toggleLike()}
            style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={t("post.like")}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={18}
              color={isLiked ? tokens.danger : tokens.muted}
            />
            <Text
              style={{
                fontSize: 11,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: tokens.muted,
                fontFamily: "Inter_400Regular",
              }}
            >
              {t("post.like")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setCommentOpen(true)}
            style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={t("post.comment")}
          >
            <Ionicons name="chatbubble-outline" size={16} color={tokens.muted} />
            <Text
              style={{
                fontSize: 11,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: tokens.muted,
                fontFamily: "Inter_400Regular",
              }}
            >
              {t("post.comment")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => void toggleSave()}
            style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={t("post.save")}
          >
            <Ionicons
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={16}
              color={isSaved ? tokens.text : tokens.muted}
            />
            <Text
              style={{
                fontSize: 11,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: tokens.muted,
                fontFamily: "Inter_400Regular",
              }}
            >
              {t("post.save")}
            </Text>
          </TouchableOpacity>
        </View>

        {ctaText.length > 0 ? (
          <Pressable
            onPress={() => router.push("/(tabs)/browse")}
            style={{ marginTop: 12, paddingVertical: 2 }}
            accessibilityRole="button"
            accessibilityLabel={ctaText}
          >
            <Text
              style={{
                color: tokens.accent,
                fontSize: 12,
                fontWeight: "600",
                letterSpacing: 0.6,
                textTransform: "uppercase",
                fontFamily: "Inter_400Regular",
              }}
            >
              {ctaText}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <CommentSheet
        visible={commentOpen}
        onClose={() => setCommentOpen(false)}
        tokens={tokens}
      />
    </View>
  );
}

/**
 * Noir Highlights — media-first night feed (Tier A).
 * Shared by the Highlights tab and `profile/highlights`. Compact header bag
 * matches Agent 1 night commerce chrome (Inter, sparse gold).
 */
export function NoirHighlightsScreen(): React.ReactElement {
  const tokens = useThemeTokens();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { isEnabled } = useFeatureFlags();
  const { posts, loading: postsLoading } = usePostContext();
  const { postMedias, loading: mediaLoading } = usePostMediaContext();

  const showBack = pathname.includes("/profile");

  const featured = useMemo(
    () =>
      [...posts]
        .filter((p) => p.id.length > 0)
        .sort(
          (a, b) =>
            new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
        ),
    [posts]
  );

  const mediasForPost = useMemo(() => {
    const map = new Map<string, Tables<"post_medias">[]>();
    for (const media of postMedias) {
      if (typeof media.post_id !== "string") {
        continue;
      }
      const list = map.get(media.post_id) ?? [];
      list.push(media);
      map.set(media.post_id, list);
    }
    return map;
  }, [postMedias]);

  if (!showBack && !isEnabled("highlights")) {
    return <Redirect href="/(tabs)" />;
  }

  const loading = postsLoading || mediaLoading;

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: tokens.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={tokens.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <SafeAreaView
        edges={["top"]}
        style={{
          backgroundColor: tokens.bg,
          borderBottomWidth: 1,
          borderBottomColor: tokens.border,
        }}
      >
        <View
          style={{
            height: 48,
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
                left: 12,
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
              hitSlop={8}
              accessibilityLabel={t("orders.back")}
            >
              <Ionicons name="arrow-back" size={20} color={tokens.text} />
            </Pressable>
          ) : null}
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 13,
              fontWeight: "600",
              letterSpacing: 2,
              textTransform: "uppercase",
              color: tokens.text,
            }}
          >
            {t("highlights.noirTitle")}
          </Text>
          <View style={{ position: "absolute", right: 4 }}>
            <CartButton
              color={tokens.text}
              size={40}
              iconSize={20}
              accessibilityLabel={t("nav.openCart")}
            />
          </View>
        </View>
      </SafeAreaView>

      {featured.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text
            style={{
              color: tokens.muted,
              fontSize: 13,
              fontFamily: "Inter_400Regular",
              textAlign: "center",
            }}
          >
            {t("highlights.empty")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={featured}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NightMediaFrame
              post={item}
              medias={mediasForPost.get(item.id) ?? []}
              tokens={tokens}
            />
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
