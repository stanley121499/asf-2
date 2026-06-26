import React, { useEffect, useRef } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from "react-native";

const ITEM_H = 46;
/** Rows visible at once — must be odd so the middle row is the selection. */
const VISIBLE = 5;
/** Phantom blank rows prepended/appended so the first/last real item can sit
 *  in the centre row. */
const PAD = 2;

export interface WheelPickerProps {
  items: ReadonlyArray<string>;
  selectedIndex: number;
  onChange: (index: number) => void;
  width?: number;
}

/**
 * A scroll-wheel column that snaps to items with iOS-native momentum.
 *
 * ### Offset math
 * The padded data array is:
 *   [ "", "", item0, item1, …, itemN-1, "", "" ]
 *
 * Scrolling to `contentOffset = k * ITEM_H` shows padded rows k … k+4.
 * Row 2 (the centre) = padded[k + 2] = padded[k + PAD] = items[k].
 *
 * So: `contentOffset = selectedIndex * ITEM_H` ⟹ items[selectedIndex] centred.
 * And: `selectedIndex = Math.round(contentOffset / ITEM_H)` (no PAD adjustment).
 */
export function WheelPicker({
  items,
  selectedIndex,
  onChange,
  width = 72,
}: Readonly<WheelPickerProps>): React.ReactElement {
  const ref = useRef<FlatList>(null);

  const padded = [
    ...new Array<string>(PAD).fill(""),
    ...items,
    ...new Array<string>(PAD).fill(""),
  ];

  /**
   * Scroll so that items[selectedIndex] sits on the centre row.
   * scrollToOffset is used (not scrollToIndex) so the offset maps directly
   * to the real item index without any PAD arithmetic at the call site.
   */
  useEffect(() => {
    ref.current?.scrollToOffset({
      offset: selectedIndex * ITEM_H,
      animated: false,
    });
  }, [selectedIndex]);

  /**
   * Fires when the scroll settles (momentum end or slow-drag end).
   * contentOffset / ITEM_H gives the real item index directly.
   */
  const handleScrollEnd = (
    e: NativeSyntheticEvent<NativeScrollEvent>
  ): void => {
    const rawIdx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    const clamped = Math.max(0, Math.min(rawIdx, items.length - 1));
    onChange(clamped);
  };

  return (
    <View style={{ width, height: ITEM_H * VISIBLE, overflow: "hidden" }}>
      {/* Selection band sits on the centre row */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: ITEM_H * PAD,
          left: 0,
          right: 0,
          height: ITEM_H,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderColor: "#C7C7CC",
        }}
      />

      <FlatList
        ref={ref}
        data={padded}
        keyExtractor={(_, i) => String(i)}
        snapToInterval={ITEM_H}
        /**
         * "normal" (0.998 on iOS) gives the natural iOS-picker momentum:
         * velocity carries through and gradually decelerates before snapping,
         * rather than stopping abruptly like "fast" (0.99).
         */
        decelerationRate="normal"
        showsVerticalScrollIndicator={false}
        getItemLayout={(_, i) => ({
          length: ITEM_H,
          offset: ITEM_H * i,
          index: i,
        })}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        renderItem={({ item, index }) => {
          /** padded index `selectedIndex + PAD` maps to the centre row. */
          const isSelected = index - PAD === selectedIndex;
          const isEmpty = item === "";
          return (
            <View
              style={{ height: ITEM_H, alignItems: "center", justifyContent: "center" }}
            >
              {!isEmpty && (
                <Text
                  style={{
                    fontSize: isSelected ? 19 : 15,
                    fontWeight: isSelected ? "700" : "400",
                    color: isSelected ? "#1C1C1E" : "#8E8E93",
                  }}
                >
                  {item}
                </Text>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}
