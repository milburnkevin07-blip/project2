import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { JobStatus } from "@/types";
import { BorderRadius, Spacing } from "@/constants/theme";

interface StatusBadgeProps {
  status: JobStatus;
  size?: "small" | "medium";
}

// ✨ NEW: Much more vibrant, distinct colors with borders
const statusConfig = {
  not_started: {
    bg: "#FEF3C7",      // Warm yellow background
    text: "#92400E",     // Dark brown text
    border: "#FCD34D",   // Golden border
    dot: "#F59E0B",      // Amber dot
    label: "Not Started"
  },
  in_progress: {
    bg: "#DBEAFE",       // Light blue background
    text: "#1E40AF",     // Deep blue text
    border: "#60A5FA",   // Sky blue border
    dot: "#3B82F6",      // Bright blue dot
    label: "In Progress"
  },
  completed: {
    bg: "#D1FAE5",       // Mint green background
    text: "#065F46",     // Forest green text
    border: "#34D399",   // Emerald border
    dot: "#10B981",      // Green dot
    label: "Completed"
  },
};

export function StatusBadge({ status, size = "small" }: StatusBadgeProps) {
  const config = statusConfig[status];
  const isSmall = size === "small";

  return (
    <View
      style={[
        styles.badge,
        { 
          backgroundColor: config.bg,
          borderColor: config.border,
        },
        isSmall ? styles.badgeSmall : styles.badgeMedium,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.dot }]} />
      <ThemedText
        style={[
          styles.label,
          { color: config.text },
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
    borderWidth: 1,          // ✨ NEW: Border for definition
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