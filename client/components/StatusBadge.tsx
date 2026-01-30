import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { JobStatus } from "@/types";
import { AppColors, BorderRadius, Spacing } from "@/constants/theme";

interface StatusBadgeProps {
  status: JobStatus;
  size?: "small" | "medium";
}

const statusConfig = {
  not_started: { color: AppColors.statusNotStarted, label: "Not Started" },
  in_progress: { color: AppColors.statusInProgress, label: "In Progress" },
  completed: { color: AppColors.statusCompleted, label: "Completed" },
};

export function StatusBadge({ status, size = "small" }: StatusBadgeProps) {
  const config = statusConfig[status];
  const isSmall = size === "small";

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.color + "20" },
        isSmall ? styles.badgeSmall : styles.badgeMedium,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <ThemedText
        style={[
          styles.label,
          { color: config.color },
          isSmall ? styles.labelSmall : styles.labelMedium,
        ]}
      >
        {config.label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.full,
  },
  badgeSmall: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  badgeMedium: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.xs,
  },
  label: {
    fontWeight: "600",
  },
  labelSmall: {
    fontSize: 12,
  },
  labelMedium: {
    fontSize: 14,
  },
});
