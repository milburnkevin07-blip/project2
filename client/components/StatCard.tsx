import React from "react";
import { View, StyleSheet, Platform, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Spacing, Shadows } from "@/constants/theme";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: any;
  color: string;
  emoji?: string;
}

export function StatCard({ title, value, color, emoji = "📊" }: StatCardProps) {
  const getGradientColors = (baseColor: string) => {
    const gradients: { [key: string]: string[] } = {
      "#3B82F6": ["#3B82F6", "#60A5FA"],
      "#2D5F8D": ["#2D5F8D", "#4A90C4"],
      "#8B5CF6": ["#8B5CF6", "#A78BFA"],
      "#F59E0B": ["#F59E0B", "#FBBF24"],
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
          <Text style={styles.emoji}>{emoji}</Text>
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
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  gradient: {
    padding: Spacing.lg,
    alignItems: "center",
    minHeight: 140,
    justifyContent: "center",
  },
  emojiContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    overflow: "visible",
    paddingTop: 2,
  },
  emoji: {
    fontSize: 38,
    lineHeight: 44,
    textAlign: "center",
    marginTop: -4,
    marginBottom: -4,
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