import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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

import {
  useStoreLocationContext,
  type StoreLocation,
} from "@/context/StoreLocationContext";
import { apiFetch } from "@/lib/apiFetch";

const C = {
  bg: "#F5F5F3",
  panel: "#FFFFFF",
  border: "#E5E5E3",
  text: "#0A0A0A",
  muted: "#6B7280",
  danger: "#DC2626",
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function FieldRow({
  label,
  value,
  onChangeText,
  first = false,
  multiline = false,
}: Readonly<{
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  first?: boolean;
  multiline?: boolean;
}>): React.ReactElement {
  return (
    <View
      style={{
        backgroundColor: C.panel,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: C.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 8,
      }}
    >
      <Text style={{ fontSize: 13, color: C.muted }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        style={{ fontSize: 15, color: C.text, minHeight: multiline ? 60 : undefined }}
        placeholderTextColor={C.muted}
      />
    </View>
  );
}

export default function EditLocationScreen(): React.ReactElement {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const locationId = typeof id === "string" ? id : "";
  const { updateStoreLocation, deleteStoreLocation } = useStoreLocationContext();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [mallName, setMallName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postcode, setPostcode] = useState("");
  const [country, setCountry] = useState("Malaysia");
  const [phone, setPhone] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [wazeUrl, setWazeUrl] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [active, setActive] = useState(true);

  const applyRow = useCallback((row: StoreLocation): void => {
    setName(row.name);
    setMallName(row.mall_name);
    setAddressLine1(row.address_line_1);
    setAddressLine2(row.address_line_2 ?? "");
    setCity(row.city);
    setState(row.state);
    setPostcode(row.postcode ?? "");
    setCountry(row.country);
    setPhone(row.phone ?? "");
    setOpeningHours(row.opening_hours ?? "");
    setGoogleMapsUrl(row.google_maps_url ?? "");
    setWazeUrl(row.waze_url ?? "");
    setSortOrder(String(row.sort_order));
    setActive(row.active);
  }, []);

  useEffect(() => {
    async function load(): Promise<void> {
      if (locationId.length === 0) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await apiFetch(`/api/store-locations/${encodeURIComponent(locationId)}`);
        const json: unknown = await res.json();
        if (!res.ok || !isRecord(json)) {
          return;
        }
        const row = json["storeLocation"];
        if (isRecord(row) && typeof row["id"] === "string") {
          applyRow(row as StoreLocation);
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [applyRow, locationId]);

  const onSave = async (): Promise<void> => {
    if (locationId.length === 0) {
      return;
    }
    const sortParsed = Number.parseInt(sortOrder, 10);
    if (!Number.isInteger(sortParsed)) {
      Alert.alert("验证失败", "排序必须是整数。");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateStoreLocation(locationId, {
        name: name.trim(),
        mall_name: mallName.trim(),
        address_line_1: addressLine1.trim(),
        address_line_2: addressLine2.trim().length > 0 ? addressLine2.trim() : null,
        city: city.trim(),
        state: state.trim(),
        postcode: postcode.trim().length > 0 ? postcode.trim() : null,
        country: country.trim(),
        phone: phone.trim().length > 0 ? phone.trim() : null,
        opening_hours: openingHours.trim().length > 0 ? openingHours.trim() : null,
        google_maps_url: googleMapsUrl.trim().length > 0 ? googleMapsUrl.trim() : null,
        waze_url: wazeUrl.trim().length > 0 ? wazeUrl.trim() : null,
        sort_order: sortParsed,
        active,
      });
      if (updated === undefined) {
        Alert.alert("保存失败", "无法更新门店。");
        return;
      }
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (): void => {
    Alert.alert("删除门店？", "客户将无法再看到此门店。", [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: () => {
          void (async () => {
            if (locationId.length === 0) {
              return;
            }
            await deleteStoreLocation(locationId);
            router.replace("/(app)/locations");
          })();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={C.text} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: C.panel,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={C.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "600", color: C.text }}>编辑门店</Text>
        <Pressable onPress={() => void onSave()} disabled={saving} hitSlop={8}>
          {saving ? (
            <ActivityIndicator size="small" color={C.text} />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: "600", color: C.text }}>保存</Text>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <FieldRow label="门店名称 *" value={name} onChangeText={setName} first />
          <FieldRow label="商场名称 *" value={mallName} onChangeText={setMallName} />
          <FieldRow label="地址行 1 *" value={addressLine1} onChangeText={setAddressLine1} />
          <FieldRow label="地址行 2" value={addressLine2} onChangeText={setAddressLine2} />
          <FieldRow label="城市 *" value={city} onChangeText={setCity} />
          <FieldRow label="州属 *" value={state} onChangeText={setState} />
          <FieldRow label="邮编" value={postcode} onChangeText={setPostcode} />
          <FieldRow label="国家" value={country} onChangeText={setCountry} />
          <FieldRow label="电话" value={phone} onChangeText={setPhone} />
          <FieldRow label="营业时间" value={openingHours} onChangeText={setOpeningHours} multiline />
          <FieldRow label="Google Maps 链接" value={googleMapsUrl} onChangeText={setGoogleMapsUrl} />
          <FieldRow label="Waze 链接" value={wazeUrl} onChangeText={setWazeUrl} />
          <FieldRow label="排序" value={sortOrder} onChangeText={setSortOrder} />
          <View
            style={{
              backgroundColor: C.panel,
              borderTopWidth: 1,
              borderTopColor: C.border,
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 15, color: C.text }}>启用</Text>
            <Switch value={active} onValueChange={setActive} />
          </View>
          <Pressable onPress={onDelete} style={{ marginTop: 24, alignItems: "center" }}>
            <Text style={{ color: C.danger, fontSize: 15, fontWeight: "600" }}>删除门店</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
