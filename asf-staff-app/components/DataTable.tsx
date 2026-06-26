import React from "react";
import {
  FlatList,
  Pressable,
  Text,
  View,
  type ListRenderItem,
} from "react-native";

export type TableColumn<T> = {
  key: keyof T | string;
  header: string;
  flex?: number;
  render?: (row: T) => React.ReactNode;
};

type DataTableProps<T extends Record<string, unknown>> = {
  columns: readonly TableColumn<T>[];
  data: readonly T[];
  keyExtractor: (row: T, index: number) => string;
  onRowPress?: (row: T) => void;
  emptyLabel?: string;
};

/**
 * Simple FlatList-based table with header row.
 */
export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  onRowPress,
  emptyLabel,
}: DataTableProps<T>): React.ReactElement {
  const renderItem: ListRenderItem<T> = ({ item }) => {
    const cells = columns.map((col) => {
      const flex = typeof col.flex === "number" ? col.flex : 1;
      const content =
        col.render !== undefined
          ? col.render(item)
          : String(item[col.key as keyof T] ?? "");
      return (
        <View key={String(col.key)} style={{ flex }} className="px-2 py-2">
          {typeof content === "string" || typeof content === "number" ? (
            <Text className="text-sm text-text">{content}</Text>
          ) : (
            content
          )}
        </View>
      );
    });

    const rowInner = (
      <View className="flex-row border-b border-border">{cells}</View>
    );

    if (onRowPress !== undefined) {
      return (
        <Pressable onPress={() => onRowPress(item)} accessibilityRole="button">
          {rowInner}
        </Pressable>
      );
    }

    return rowInner;
  };

  const header = (
    <View className="flex-row border-b border-accent bg-bg px-2 py-2">
      {columns.map((col) => (
        <View
          key={String(col.key)}
          style={{ flex: typeof col.flex === "number" ? col.flex : 1 }}
          className="px-2"
        >
          <Text className="text-xs font-semibold uppercase text-muted">
            {col.header}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <View className="rounded-xl border border-border bg-panel">
      {header}
      <FlatList
        data={data as T[]}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text className="px-4 py-6 text-center text-sm text-muted">
            {emptyLabel ?? "No rows"}
          </Text>
        }
      />
    </View>
  );
}
