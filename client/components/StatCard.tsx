import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Spacing, Shadows } from "@/constants/theme";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: any; // Keeping for compatibility but using emoji instead
  color: string;
  emoji?: string; // New prop for emoji
}

export function StatCard({ title, value, color, emoji = "📊" }: StatCardProps) {
  // Create vibrant gradient colors
  const getGradientColors = (baseColor: string) => {
    // Map of color to gradient pairs
    const gradients: { [key: string]: string[] } = {
      "#3B82F6": ["#3B82F6", "#60A5FA"], // Blue - Active Jobs
      "#2D5F8D": ["#2D5F8D", "#4A90C4"], // Primary Blue - Clients
      "#F59E0B": ["#F59E0B", "#FBBF24"], // Amber - Pending
    };
    
    return gradients[baseColor] || [baseColor, baseColor];
  };
  
  const [startColor, endColor] = getGradientColors(color);
  
  return (
    <View style={[styles.card, Shadows.medium]}>
      <LinearGradient
        colors={[startColor, endColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.emojiContainer}>
          <ThemedText style={styles.emoji}>{emoji}</ThemedText>
        </View>
        <ThemedText type="h2" style={styles.value}>
          {value}
        </ThemedText>
        <ThemedText type="small" style={styles.title}>
          {title}
        </ThemedText>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  gradient: {
    padding: Spacing.lg,
    alignItems: "center",
    minHeight: 140,
    justifyContent: "center",
  },
  emojiContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  emoji: {
    fontSize: 32,
  },
  value: {
    marginBottom: Spacing.xs,
    fontWeight: "700",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  title: {
    color: "#FFFFFF",
    fontWeight: "600",
    textAlign: "center",
    opacity: 0.95,
  },
});