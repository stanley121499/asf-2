import { useRouter } from "expo-router";
import React, { useState } from "react";
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

import { useStoreLocationContext } from "@/context/StoreLocationContext";

const C = {
  bg: "#F5F5F3",
  panel: "#FFFFFF",
  border: "#E5E5E3",
  text: "#0A0A0A",
  muted: "#6B7280",
} as const;

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

/**
 * Parses optional numeric input.
 */
function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function CreateLocationScreen(): React.ReactElement {
  const router = useRouter();
  const { createStoreLocation } = useStoreLocationContext();

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
  const [saving, setSaving] = useState(false);

  const onSubmit = async (): Promise<void> => {
    if (name.trim().length === 0 || mallName.trim().length === 0) {
      Alert.alert("验证失败", "请填写门店名称和商场名称。");
      return;
    }
    if (addressLine1.trim().length === 0 || city.trim().length === 0 || state.trim().length === 0) {
      Alert.alert("验证失败", "请填写地址、城市和州属。");
      return;
    }
    const sortParsed = Number.parseInt(sortOrder, 10);
    if (!Number.isInteger(sortParsed)) {
      Alert.alert("验证失败", "排序必须是整数。");
      return;
    }

    setSaving(true);
    try {
      const created = await createStoreLocation({
        name: name.trim(),
        mall_name: mallName.trim(),
        address_line_1: addressLine1.trim(),
        address_line_2: addressLine2.trim().length > 0 ? addressLine2.trim() : null,
        city: city.trim(),
        state: state.trim(),
        postcode: postcode.trim().length > 0 ? postcode.trim() : null,
        country: country.trim().length > 0 ? country.trim() : "Malaysia",
        phone: phone.trim().length > 0 ? phone.trim() : null,
        opening_hours: openingHours.trim().length > 0 ? openingHours.trim() : null,
        google_maps_url: googleMapsUrl.trim().length > 0 ? googleMapsUrl.trim() : null,
        waze_url: wazeUrl.trim().length > 0 ? wazeUrl.trim() : null,
        sort_order: sortParsed,
        active,
      });
      if (created === undefined) {
        Alert.alert("创建失败", "无法创建门店，请检查字段和链接格式。");
        return;
      }
      router.replace(`/(app)/locations/${created.id}`);
    } finally {
      setSaving(false);
    }
  };

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
        <Text style={{ fontSize: 17, fontWeight: "600", color: C.text }}>新建门店</Text>
        <Pressable onPress={() => void onSubmit()} disabled={saving} hitSlop={8}>
          {saving ? (
            <ActivityIndicator size="small" color={C.text} />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: "600", color: C.text }}>保存</Text>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
