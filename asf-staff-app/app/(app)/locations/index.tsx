import { Redirect, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import {
  useStoreLocationContext,
  type StoreLocation,
} from "@/context/StoreLocationContext";

const C = {
  bg: "#F5F5F3",
  panel: "#FFFFFF",
  border: "#E5E5E3",
  text: "#0A0A0A",
  muted: "#6B7280",
  accent: "#C9A96E",
} as const;

function LocationCard({
  item,
  onPress,
}: Readonly<{ item: StoreLocation; onPress: () => void }>): React.ReactElement {
  return (
    <Pressable onPress={onPress}>
      <View
        style={{
          backgroundColor: C.panel,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: C.border,
          marginHorizontal: 16,
          marginBottom: 10,
          padding: 16,
          gap: 8,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: C.text, flex: 1 }} numberOfLines={1}>
            {item.name}
          </Text>
          <View
            style={{
              backgroundColor: item.active ? "#D1FAE5" : "#F3F4F6",
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 3,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "600", color: item.active ? "#059669" : "#4B5563" }}>
              {item.active ? "启用" : "停用"}
            </Text>
          </View>
        </View>
        <Text style={{ fontSize: 13, color: C.accent }}>{item.mall_name}</Text>
        <Text style={{ fontSize: 12, color: C.muted }}>{`${item.city}, ${item.state}`}</Text>
      </View>
    </Pressable>
  );
}

export default function LocationsListScreen(): React.ReactElement {
  const router = useRouter();
  const { isEnabled } = useFeatureFlags();
  const { storeLocations, loading } = useStoreLocationContext();
  const [search, setSearch] = useState("");

  if (!isEnabled("store_locations")) {
    return <Redirect href="/(app)/(tabs)/dashboard" />;
  }

  const sorted = useMemo(
    () =>
      [...storeLocations].sort((a, b) => {
        if (a.sort_order !== b.sort_order) {
          return a.sort_order - b.sort_order;
        }
        return a.name.localeCompare(b.name);
      }),
    [storeLocations]
  );

  const filtered = useMemo(() => {
    if (search.trim().length === 0) {
      return sorted;
    }
    const q = search.toLowerCase();
    return sorted.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.mall_name.toLowerCase().includes(q) ||
        row.city.toLowerCase().includes(q)
    );
  }, [search, sorted]);

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
        <Text style={{ fontSize: 17, fontWeight: "600", color: C.text }}>门店管理</Text>
        <Pressable onPress={() => router.push("/(app)/locations/create")} hitSlop={8}>
          <Ionicons name="add" size={26} color={C.text} />
        </Pressable>
      </View>

      <View style={{ padding: 16, backgroundColor: C.panel, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="搜索门店、商场、城市…"
          placeholderTextColor={C.muted}
          style={{
            backgroundColor: C.bg,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 10,
            fontSize: 14,
            color: C.text,
          }}
        />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={C.accent} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", color: C.muted, marginTop: 40 }}>暂无门店</Text>
          }
          renderItem={({ item }) => (
            <LocationCard item={item} onPress={() => router.push(`/(app)/locations/${item.id}`)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}
