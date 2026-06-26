import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useBrandContext } from "@/context/product/BrandContext";
import { useCategoryContext } from "@/context/product/CategoryContext";
import { useProductContext } from "@/context/product/ProductContext";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#FAF9F6",
  panel: "#FFFFFF",
  border: "#E5E7EB",
  text: "#1A1A1A",
  muted: "#6B7280",
  accent: "#000000",
  danger: "#EF4444",
};

type ProductStatus = "PUBLISH" | "DRAFT" | "UNPUBLISHED";
const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: "PUBLISH", label: "已发布" },
  { value: "DRAFT", label: "草稿" },
  { value: "UNPUBLISHED", label: "未发布" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function FieldLabel({ label, required }: { label: string; required?: boolean }): React.ReactElement {
  return (
    <Text style={{ fontSize: 12, fontWeight: "600", color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
      {label}
      {required === true && <Text style={{ color: C.danger }}> *</Text>}
    </Text>
  );
}

function StyledInput({
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  numberOfLines,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  numberOfLines?: number;
}): React.ReactElement {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder ?? ""}
      placeholderTextColor={C.muted}
      multiline={multiline}
      keyboardType={keyboardType ?? "default"}
      numberOfLines={numberOfLines}
      textAlignVertical={multiline === true ? "top" : "center"}
      style={{
        backgroundColor: C.panel,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        color: C.text,
        minHeight: multiline === true ? (numberOfLines ?? 3) * 22 : undefined,
        marginBottom: 16,
      }}
    />
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }): React.ReactElement {
  return (
    <View
      style={{
        backgroundColor: C.panel,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border,
        marginBottom: 16,
        overflow: "hidden",
      }}
    >
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: C.text }}>{title}</Text>
      </View>
      <View style={{ padding: 16 }}>{children}</View>
    </View>
  );
}

// ─── Chip component ───────────────────────────────────────────────────────────
function Chip({ label, onRemove }: { label: string; onRemove: () => void }): React.ReactElement {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: C.bg,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 20,
        paddingLeft: 10,
        paddingRight: 6,
        paddingVertical: 5,
        gap: 4,
      }}
    >
      <Text style={{ fontSize: 12, color: C.text }}>{label}</Text>
      <Pressable onPress={onRemove} hitSlop={6}>
        <Ionicons name="close" size={12} color={C.muted} />
      </Pressable>
    </View>
  );
}

// ─── Picker Modal ─────────────────────────────────────────────────────────────
function PickerModal<T extends string>({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: { label: string; value: T }[];
  value: T | null;
  onSelect: (v: T) => void;
  onClose: () => void;
}): React.ReactElement {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: C.panel, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "70%", paddingBottom: 32 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: C.text }}>{title}</Text>
            <Pressable onPress={onClose}><Ionicons name="close" size={20} color={C.muted} /></Pressable>
          </View>
          <ScrollView>
            {options.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => { onSelect(opt.value); onClose(); }}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 }}
              >
                <Text style={{ fontSize: 15, color: opt.value === value ? C.accent : C.text, fontWeight: opt.value === value ? "600" : "400" }}>
                  {opt.label}
                </Text>
                {opt.value === value && <Ionicons name="checkmark" size={18} color={C.accent} />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Create Screen ────────────────────────────────────────────────────────────
export default function ProductCreateScreen(): React.ReactElement {
  const router = useRouter();
  const { createProduct } = useProductContext();
  const { categories } = useCategoryContext();
  const { brands } = useBrandContext();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProductStatus>("DRAFT");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [brandId, setBrandId] = useState<string | null>(null);

  const [colorInput, setColorInput] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [sizeInput, setSizeInput] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [brandPickerOpen, setBrandPickerOpen] = useState(false);

  const addColor = (): void => {
    const v = colorInput.trim();
    if (v.length === 0 || colors.includes(v)) return;
    setColors((prev) => [...prev, v]);
    setColorInput("");
  };

  const addSize = (): void => {
    const v = sizeInput.trim();
    if (v.length === 0 || sizes.includes(v)) return;
    setSizes((prev) => [...prev, v]);
    setSizeInput("");
  };

  const handleSave = async (): Promise<void> => {
    if (name.trim().length === 0) { Alert.alert("请输入商品名称"); return; }
    const priceNum = Number.parseFloat(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) { Alert.alert("请输入有效价格"); return; }

    setSaving(true);
    try {
      await createProduct(
        {
          name: name.trim(),
          price: priceNum,
          description: description.trim().length > 0 ? description.trim() : null,
          status,
          brand_id: brandId,
          category_id: categoryId,
        },
        colors,
        sizes,
        [],
      );
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const categoryLabel = categoryId !== null ? (categories.find((c) => c.id === categoryId)?.name ?? "—") : "选择分类";
  const brandLabel = brandId !== null ? (brands.find((b) => b.id === brandId)?.name ?? "—") : "选择品牌";
  const statusLabel = STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={{ backgroundColor: C.panel, borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={{ width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="arrow-back" size={18} color={C.text} />
          </Pressable>
          <Text style={{ fontSize: 17, fontWeight: "700", color: C.text }}>新建商品</Text>
        </View>
        <Pressable onPress={() => void handleSave()} disabled={saving} style={{ backgroundColor: saving ? "#D1D5DB" : C.accent, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: C.panel }}>
            {saving ? "保存中…" : "保存"}
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        {/* Basic Info */}
        <SectionCard title="基本信息">
          <FieldLabel label="商品名称" required />
          <StyledInput value={name} onChangeText={setName} placeholder="例: 高级亚麻衬衫" />

          <FieldLabel label="价格 (RM)" required />
          <StyledInput value={price} onChangeText={setPrice} placeholder="0.00" keyboardType="decimal-pad" />

          <FieldLabel label="描述" />
          <StyledInput value={description} onChangeText={setDescription} placeholder="商品描述…" multiline numberOfLines={4} />
        </SectionCard>

        {/* Status + Category + Brand */}
        <SectionCard title="分类信息">
          <FieldLabel label="状态" />
          <Pressable
            onPress={() => setStatusPickerOpen(true)}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.panel, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 }}
          >
            <Text style={{ fontSize: 14, color: C.text }}>{statusLabel}</Text>
            <Ionicons name="chevron-down" size={14} color={C.muted} />
          </Pressable>

          <FieldLabel label="分类" />
          <Pressable
            onPress={() => setCategoryPickerOpen(true)}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.panel, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 }}
          >
            <Text style={{ fontSize: 14, color: categoryId !== null ? C.text : C.muted }}>{categoryLabel}</Text>
            <Ionicons name="chevron-down" size={14} color={C.muted} />
          </Pressable>

          <FieldLabel label="品牌" />
          <Pressable
            onPress={() => setBrandPickerOpen(true)}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.panel, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 }}
          >
            <Text style={{ fontSize: 14, color: brandId !== null ? C.text : C.muted }}>{brandLabel}</Text>
            <Ionicons name="chevron-down" size={14} color={C.muted} />
          </Pressable>
        </SectionCard>

        {/* Colors */}
        <SectionCard title="颜色">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: colors.length > 0 ? 12 : 0 }}>
            {colors.map((c) => (
              <Chip key={c} label={c} onRemove={() => setColors((prev) => prev.filter((x) => x !== c))} />
            ))}
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput
              value={colorInput}
              onChangeText={setColorInput}
              onSubmitEditing={addColor}
              placeholder="例: 黑色"
              placeholderTextColor={C.muted}
              returnKeyType="done"
              style={{ flex: 1, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: C.text }}
            />
            <Pressable onPress={addColor} style={{ backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="add" size={18} color={C.panel} />
            </Pressable>
          </View>
        </SectionCard>

        {/* Sizes */}
        <SectionCard title="尺寸">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: sizes.length > 0 ? 12 : 0 }}>
            {sizes.map((s) => (
              <Chip key={s} label={s} onRemove={() => setSizes((prev) => prev.filter((x) => x !== s))} />
            ))}
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput
              value={sizeInput}
              onChangeText={setSizeInput}
              onSubmitEditing={addSize}
              placeholder="例: M"
              placeholderTextColor={C.muted}
              returnKeyType="done"
              style={{ flex: 1, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: C.text }}
            />
            <Pressable onPress={addSize} style={{ backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="add" size={18} color={C.panel} />
            </Pressable>
          </View>
        </SectionCard>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Pickers */}
      <PickerModal
        visible={statusPickerOpen}
        title="选择状态"
        options={STATUS_OPTIONS}
        value={status}
        onSelect={(v) => setStatus(v)}
        onClose={() => setStatusPickerOpen(false)}
      />
      <PickerModal
        visible={categoryPickerOpen}
        title="选择分类"
        options={[{ label: "无", value: "" as string }, ...categories.map((c) => ({ label: c.name ?? c.id, value: c.id }))]}
        value={categoryId ?? ""}
        onSelect={(v) => setCategoryId(v === "" ? null : v)}
        onClose={() => setCategoryPickerOpen(false)}
      />
      <PickerModal
        visible={brandPickerOpen}
        title="选择品牌"
        options={[{ label: "无", value: "" as string }, ...brands.map((b) => ({ label: b.name ?? b.id, value: b.id }))]}
        value={brandId ?? ""}
        onSelect={(v) => setBrandId(v === "" ? null : v)}
        onClose={() => setBrandPickerOpen(false)}
      />
    </SafeAreaView>
  );
}
