import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useBrandContext } from "@/context/product/BrandContext";
import { useCategoryContext } from "@/context/product/CategoryContext";
import { useProductColorContext } from "@/context/product/ProductColorContext";
import { useProductContext } from "@/context/product/ProductContext";
import { useProductMediaContext } from "@/context/product/ProductMediaContext";
import { useProductSizeContext } from "@/context/product/ProductSizeContext";
import { useProductStockContext } from "@/context/product/ProductStockContext";
import { supabase } from "@/lib/supabase";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#F5F5F3",
  panel: "#FFFFFF",
  border: "#E5E5E3",
  text: "#0A0A0A",
  muted: "#6B7280",
  accent: "#C9A96E",
  danger: "#E8453C",
  chip: "#F5F5F3",
};

// ─── Status config ─────────────────────────────────────────────────────────────
type ProductStatus = "PUBLISH" | "DRAFT" | "UNPUBLISHED";
const STATUSES: { value: ProductStatus; label: string; active: string; dot: string }[] = [
  { value: "DRAFT",       label: "草稿",     active: "#C9A96E", dot: "#C9A96E" },
  { value: "PUBLISH",     label: "已发布",   active: "#22C55E", dot: "#22C55E" },
  { value: "UNPUBLISHED", label: "未发布",   active: "#E8453C", dot: "#E8453C" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function extractStoragePath(url: string): string {
  const marker = "/object/public/product_medias/";
  const idx = url.indexOf(marker);
  return idx >= 0 ? url.slice(idx + marker.length) : url;
}

function FieldLabel({ text, required }: { text: string; required?: boolean }): React.ReactElement {
  return (
    <Text style={{ fontSize: 11, fontWeight: "600", color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
      {text}{required === true && <Text style={{ color: C.danger }}> *</Text>}
    </Text>
  );
}

function Card({ title, children, noPad }: { title?: string; children: React.ReactNode; noPad?: boolean }): React.ReactElement {
  return (
    <View style={{ backgroundColor: C.panel, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginBottom: 12, overflow: "hidden" }}>
      {title !== undefined && (
        <View style={{ paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: C.text }}>{title}</Text>
        </View>
      )}
      <View style={noPad === true ? undefined : { padding: 16 }}>{children}</View>
    </View>
  );
}

function StyledInput({
  value, onChangeText, placeholder, multiline, keyboardType, numberOfLines, inputRef,
}: {
  value: string; onChangeText: (v: string) => void; placeholder?: string;
  multiline?: boolean; keyboardType?: "default" | "decimal-pad"; numberOfLines?: number;
  inputRef?: React.RefObject<TextInput>;
}): React.ReactElement {
  return (
    <TextInput
      ref={inputRef}
      value={value} onChangeText={onChangeText}
      placeholder={placeholder ?? ""} placeholderTextColor={C.muted}
      multiline={multiline} keyboardType={keyboardType ?? "default"}
      numberOfLines={numberOfLines} textAlignVertical={multiline === true ? "top" : "center"}
      style={{
        backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: C.text,
        minHeight: multiline === true ? (numberOfLines ?? 3) * 24 : undefined, marginBottom: 12,
      }}
    />
  );
}

function DropdownRow({
  label, value, placeholder, onPress,
}: {
  label: string; value: string | null; placeholder: string; onPress: () => void;
}): React.ReactElement {
  return (
    <>
      <FieldLabel text={label} />
      <Pressable
        onPress={onPress}
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12 }}
      >
        <Text style={{ fontSize: 15, color: value !== null ? C.text : C.muted }}>
          {value ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={14} color={C.muted} />
      </Pressable>
    </>
  );
}

function PickerModal<T extends string>({ visible, title, options, value, onSelect, onClose }: {
  visible: boolean; title: string; options: { label: string; value: T }[];
  value: T | null; onSelect: (v: T) => void; onClose: () => void;
}): React.ReactElement {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }} onPress={onClose}>
        <Pressable style={{ backgroundColor: C.panel, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "70%", paddingBottom: 32 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: C.text }}>{title}</Text>
            <Pressable onPress={onClose}><Ionicons name="close" size={20} color={C.muted} /></Pressable>
          </View>
          <ScrollView>
            {options.map((opt) => (
              <Pressable key={opt.value} onPress={() => { onSelect(opt.value); onClose(); }}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 }}>
                <Text style={{ fontSize: 15, color: opt.value === value ? C.accent : C.text, fontWeight: opt.value === value ? "600" : "400" }}>
                  {opt.label}
                </Text>
                {opt.value === value && <Ionicons name="checkmark" size={18} color={C.accent} />}
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Chip tag row ──────────────────────────────────────────────────────────────
function ChipEditor({ chips, placeholder, onAdd, onRemove }: {
  chips: string[]; placeholder: string;
  onAdd: (v: string) => void; onRemove: (v: string) => void;
}): React.ReactElement {
  const [input, setInput] = useState("");
  const inputRef = useRef<TextInput>(null);

  const commit = (): void => {
    const trimmed = input.trim();
    if (trimmed.length === 0) return;
    if (chips.includes(trimmed)) { setInput(""); return; }
    onAdd(trimmed);
    setInput("");
  };

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
      {chips.map((chip) => (
        <View key={chip} style={{ flexDirection: "row", alignItems: "center", backgroundColor: C.chip, borderRadius: 20, paddingLeft: 12, paddingRight: 6, paddingVertical: 6, gap: 4 }}>
          <Text style={{ fontSize: 13, color: C.text, fontWeight: "500" }}>{chip}</Text>
          <TouchableOpacity onPress={() => onRemove(chip)} hitSlop={6} style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: "#D1D5DB", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="close" size={10} color={C.text} />
          </TouchableOpacity>
        </View>
      ))}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <TextInput
          ref={inputRef}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={commit}
          placeholder={placeholder}
          placeholderTextColor={C.muted}
          returnKeyType="done"
          blurOnSubmit={false}
          style={{ fontSize: 13, color: C.text, minWidth: 80, borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 4, paddingHorizontal: 2 }}
        />
        <TouchableOpacity onPress={commit} style={{ backgroundColor: C.accent, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: C.panel }}>添加</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProductEditScreen(): React.ReactElement {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const router = useRouter();
  const { products, updateProduct } = useProductContext();
  const { productMedias, createProductMedia, deleteProductMedia } = useProductMediaContext();
  const { categories } = useCategoryContext();
  const { brands } = useBrandContext();
  const { productColors } = useProductColorContext();
  const { productSizes } = useProductSizeContext();
  const { productStocks } = useProductStockContext();

  const product = useMemo(() => products.find((p) => p.id === productId), [products, productId]);
  const medias = useMemo(
    () => productMedias.filter((m) => m.product_id === productId).sort((a, b) => a.arrangement - b.arrangement),
    [productMedias, productId]
  );

  // ── Form state ──────────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProductStatus>("DRAFT");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [brandPickerOpen, setBrandPickerOpen] = useState(false);

  useEffect(() => {
    if (product === undefined) return;
    setName(product.name);
    setPrice(typeof product.price === "number" ? product.price.toString() : "");
    setDescription(product.description ?? "");
    setStatus((product.status as ProductStatus) ?? "DRAFT");
    setCategoryId(product.category_id ?? null);
    setBrandId(product.brand_id ?? null);
  }, [product]);

  // Sync chip arrays when context data loads
  useEffect(() => {
    setColors(productColors.filter((c) => c.product_id === productId).map((c) => c.color));
  }, [productColors, productId]);

  useEffect(() => {
    setSizes(productSizes.filter((s) => s.product_id === productId).map((s) => s.size));
  }, [productSizes, productId]);

  const stockTotal = productStocks
    .filter((s) => s.product_id === productId)
    .reduce((sum, s) => sum + (s.count ?? 0), 0);

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async (): Promise<void> => {
    if (typeof productId !== "string") return;
    if (name.trim().length === 0) { Alert.alert("请输入商品名称"); return; }
    const priceNum = Number.parseFloat(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) { Alert.alert("请输入有效价格"); return; }
    setSaving(true);
    try {
      await updateProduct(
        { id: productId, name: name.trim(), price: priceNum, description: description.trim() || null, status, brand_id: brandId, category_id: categoryId },
        colors, sizes, [],
      );
      Alert.alert("已保存", "商品更新成功。");
    } finally {
      setSaving(false);
    }
  };

  // ── Image upload ────────────────────────────────────────────────────────────
  const handlePickImages = useCallback(async (replaceId?: string): Promise<void> => {
    if (typeof productId !== "string") return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("需要权限", "请允许访问相册以上传图片。"); return; }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: replaceId === undefined,
      quality: 0.85,
      selectionLimit: 10,
    });

    if (result.canceled || result.assets.length === 0) return;
    setUploadingImage(true);

    try {
      // If replacing the cover, delete the old one first
      if (replaceId !== undefined) {
        const old = medias.find((m) => m.id === replaceId);
        if (old !== undefined) {
          await supabase.storage.from("product_medias").remove([extractStoragePath(old.media_url)]);
          await deleteProductMedia(replaceId);
        }
      }

      for (const asset of result.assets) {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const ext = asset.uri.split(".").pop() ?? "jpg";
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("product_medias")
          .upload(filename, blob, { contentType: asset.mimeType ?? "image/jpeg", upsert: false });

        if (uploadError !== null || uploadData === null) { Alert.alert("上传失败", uploadError?.message ?? "未知错误"); continue; }

        const { data: urlData } = supabase.storage.from("product_medias").getPublicUrl(uploadData.path);
        await createProductMedia({ product_id: productId, media_url: urlData.publicUrl, arrangement: medias.length });
      }
    } finally {
      setUploadingImage(false);
    }
  }, [productId, medias, createProductMedia, deleteProductMedia]);

  // ── Image delete ────────────────────────────────────────────────────────────
  const handleDeleteMedia = useCallback(async (id: string, url: string): Promise<void> => {
    setDeletingMediaId(id);
    try {
      await supabase.storage.from("product_medias").remove([extractStoragePath(url)]);
      await deleteProductMedia(id);
    } finally {
      setDeletingMediaId(null);
    }
  }, [deleteProductMedia]);

  if (product === undefined) {
    return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg }}><ActivityIndicator color={C.accent} /></View>;
  }

  const coverMedia = medias[0];
  const thumbMedias = medias.slice(1);
  const categoryLabel = categories.find((c) => c.id === categoryId)?.name ?? null;
  const brandLabel = brands.find((b) => b.id === brandId)?.name ?? null;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      {/* ── Sticky header ──────────────────────────────────────────────────── */}
      <View style={{ backgroundColor: C.panel, borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center" }}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={{ width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center", marginRight: 10 }}>
          <Ionicons name="arrow-back" size={18} color={C.text} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 15, fontWeight: "700", color: C.text }} numberOfLines={1}>{product.name}</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">

          {/* ── Cover image ──────────────────────────────────────────────── */}
          <View style={{ backgroundColor: C.panel, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Pressable
              onPress={() => void handlePickImages(coverMedia?.id)}
              style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: "#F3F4F6" }}
            >
              {coverMedia !== undefined ? (
                <Image source={{ uri: coverMedia.media_url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              ) : (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Ionicons name="image-outline" size={36} color={C.muted} />
                  <Text style={{ fontSize: 13, color: C.muted }}>点击添加封面图</Text>
                </View>
              )}
              {/* Overlay tap hint on existing cover */}
              {coverMedia !== undefined && (
                <View style={{ position: "absolute", bottom: 10, right: 10, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 8, flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, gap: 5 }}>
                  <Ionicons name="camera-outline" size={13} color="#FFF" />
                  <Text style={{ fontSize: 12, color: "#FFF", fontWeight: "600" }}>更换</Text>
                </View>
              )}
              {uploadingImage && (
                <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" }}>
                  <ActivityIndicator color="#FFF" size="large" />
                </View>
              )}
            </Pressable>

            {/* Thumbnail strip */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 12, gap: 8 }}>
              {thumbMedias.map((m) => (
                <View key={m.id} style={{ position: "relative" }}>
                  <Pressable onPress={() => void handlePickImages(m.id)}>
                    <Image source={{ uri: m.media_url }} style={{ width: 60, height: 60, borderRadius: 8, backgroundColor: "#F3F4F6" }} resizeMode="cover" />
                  </Pressable>
                  <Pressable
                    onPress={() => void handleDeleteMedia(m.id, m.media_url)}
                    disabled={deletingMediaId === m.id}
                    style={{ position: "absolute", top: -4, right: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: "#1A1A1A", alignItems: "center", justifyContent: "center" }}
                  >
                    {deletingMediaId === m.id
                      ? <ActivityIndicator size="small" color={C.panel} />
                      : <Ionicons name="close" size={11} color={C.panel} />}
                  </Pressable>
                </View>
              ))}
              {/* Add more photos button */}
              <Pressable
                onPress={() => void handlePickImages()}
                style={{ width: 60, height: 60, borderRadius: 8, borderWidth: 1.5, borderStyle: "dashed", borderColor: C.border, alignItems: "center", justifyContent: "center", backgroundColor: C.bg }}
              >
                <Ionicons name="add" size={22} color={C.muted} />
              </Pressable>
            </ScrollView>
          </View>

          <View style={{ padding: 14 }}>
            {/* ── Status segmented control ──────────────────────────────── */}
            <Card>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {STATUSES.map((s) => {
                  const active = status === s.value;
                  return (
                    <Pressable
                      key={s.value}
                      onPress={() => setStatus(s.value)}
                      style={{
                        flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: "center",
                        backgroundColor: active ? s.active : C.bg,
                        borderWidth: 1, borderColor: active ? s.active : C.border,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: active ? "#FFF" : s.dot }} />
                        <Text style={{ fontSize: 12, fontWeight: "600", color: active ? "#FFF" : C.muted }}>
                          {s.label}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </Card>

            {/* ── Basic Info ───────────────────────────────────────────── */}
            <Card title="基本信息">
              <FieldLabel text="商品名称" required />
              <StyledInput value={name} onChangeText={setName} placeholder="商品名称" />
              <FieldLabel text="价格 (RM)" required />
              <StyledInput value={price} onChangeText={setPrice} placeholder="0.00" keyboardType="decimal-pad" />
              <FieldLabel text="描述" />
              <StyledInput value={description} onChangeText={setDescription} placeholder="商品描述…" multiline numberOfLines={4} />
            </Card>

            {/* ── Variants ─────────────────────────────────────────────── */}
            <Card title="款式变体">
              <FieldLabel text="颜色" />
              <View style={{ marginBottom: 16 }}>
                <ChipEditor
                  chips={colors}
                  placeholder="例: 红色"
                  onAdd={(v) => setColors((prev) => [...prev, v])}
                  onRemove={(v) => setColors((prev) => prev.filter((c) => c !== v))}
                />
              </View>

              <FieldLabel text="尺寸" />
              <ChipEditor
                chips={sizes}
                placeholder="例: M"
                onAdd={(v) => setSizes((prev) => [...prev, v])}
                onRemove={(v) => setSizes((prev) => prev.filter((s) => s !== v))}
              />
            </Card>

            {/* ── Classification ───────────────────────────────────────── */}
            <Card title="分类信息">
              <DropdownRow
                label="分类"
                value={categoryLabel}
                placeholder="选择分类"
                onPress={() => setCategoryPickerOpen(true)}
              />
              <DropdownRow
                label="品牌"
                value={brandLabel}
                placeholder="选择品牌"
                onPress={() => setBrandPickerOpen(true)}
              />
            </Card>

            {/* ── Stock ────────────────────────────────────────────────── */}
            <Pressable
              onPress={() => router.push(`/(app)/(tabs)/products/${productId}/stock`)}
              style={{ backgroundColor: C.panel, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center" }}
            >
              <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                <Ionicons name="layers-outline" size={18} color={C.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: C.text }}>库存</Text>
                <Text style={{ fontSize: 12, color: stockTotal === 0 ? C.danger : C.muted, marginTop: 1 }}>
                  {stockTotal === 0 ? "缺货" : `共 ${stockTotal} 件`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={C.muted} />
            </Pressable>
          </View>
        </ScrollView>

        {/* ── Sticky save button ──────────────────────────────────────────── */}
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: C.panel, borderTopWidth: 1, borderTopColor: C.border, paddingHorizontal: 16, paddingVertical: 12, paddingBottom: Platform.OS === "ios" ? 24 : 12 }}>
          <Pressable
            onPress={() => void handleSave()}
            disabled={saving}
            style={({ pressed }) => ({
              opacity: pressed || saving ? 0.8 : 1,
            })}
          >
            <View style={{ backgroundColor: "#0A0A0A", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
              {saving
                ? <ActivityIndicator color={C.accent} />
                : <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.5 }}>保存修改</Text>}
            </View>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <PickerModal
        visible={categoryPickerOpen} title="选择分类"
        options={[{ label: "无", value: "" as string }, ...categories.map((c) => ({ label: c.name ?? c.id, value: c.id }))]}
        value={categoryId ?? ""} onSelect={(v) => setCategoryId(v === "" ? null : v)} onClose={() => setCategoryPickerOpen(false)}
      />
      <PickerModal
        visible={brandPickerOpen} title="选择品牌"
        options={[{ label: "无", value: "" as string }, ...brands.map((b) => ({ label: b.name ?? b.id, value: b.id }))]}
        value={brandId ?? ""} onSelect={(v) => setBrandId(v === "" ? null : v)} onClose={() => setBrandPickerOpen(false)}
      />
    </SafeAreaView>
  );
}
