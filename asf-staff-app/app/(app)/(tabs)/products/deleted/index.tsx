import React from "react";
import { Text, View } from "react-native";

export default function DeletedProductsScreen(): React.ReactElement {
  return (
    <View className="flex-1 bg-bg px-4 pt-4">
      <Text className="text-xl font-semibold text-text">已删除商品</Text>
    </View>
  );
}
