import { useRouter } from "expo-router";
import React from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import { useTicketContext } from "@/context/TicketContext";

export default function SupportTicketsScreen(): React.ReactElement {
  const router = useRouter();
  const { tickets, loading } = useTicketContext();

  return (
    <View className="flex-1 bg-bg px-4 pt-4">
      <Text className="mb-4 text-xl font-semibold text-text">客服</Text>
      <FlatList
        data={tickets}
        keyExtractor={(t) => t.id}
        ListEmptyComponent={
          <Text className="py-10 text-center text-muted">
            {loading ? "加载中…" : "暂无工单"}
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            className="mb-3 rounded-2xl border border-border bg-panel p-4"
            onPress={() =>
              router.push(`/(app)/(tabs)/support/${item.id}`)
            }
          >
            <Text className="font-semibold text-text">
              {item.subject ?? "无主题"}
            </Text>
            <Text className="text-xs text-muted">
              {item.status ?? "—"}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}
