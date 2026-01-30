import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  runOnJS,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import * as Haptics from "expo-haptics";

interface SegmentedControlProps<T extends string> {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const { theme } = useTheme();
  const selectedIndex = options.findIndex((o) => o.value === value);

  const handlePress = (newValue: T) => {
    Haptics.selectionAsync();
    onChange(newValue);
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => handlePress(option.value)}
            style={[
              styles.option,
              isSelected && [
                styles.optionSelected,
                { backgroundColor: theme.backgroundDefault },
              ],
            ]}
          >
            <ThemedText
              type="small"
              style={[
                styles.optionText,
                { color: isSelected ? theme.text : theme.textSecondary },
              ]}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: BorderRadius.xs,
    padding: 2,
  },
  option: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: BorderRadius.xs - 2,
  },
  optionSelected: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  optionText: {
    fontWeight: "600",
  },
});
