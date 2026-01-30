import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Client } from "@/types";
import { BorderRadius, Spacing, AppColors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

interface ClientCardProps {
  client: Client;
  jobCount: number;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ClientCard({ client, jobCount, onPress }: ClientCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
      testID={`client-card-${client.id}`}
    >
      <View style={[styles.avatar, { backgroundColor: AppColors.primary }]}>
        <ThemedText style={styles.avatarText}>
          {getInitials(client.name)}
        </ThemedText>
      </View>
      <View style={styles.content}>
        <ThemedText type="h4" numberOfLines={1}>
          {client.name}
        </ThemedText>
        {client.company ? (
          <ThemedText
            type="small"
            style={{ color: theme.textSecondary }}
            numberOfLines={1}
          >
            {client.company}
          </ThemedText>
        ) : null}
        <View style={styles.footer}>
          {client.phone ? (
            <View style={styles.infoItem}>
              <Feather
                name="phone"
                size={14}
                color={theme.textSecondary}
                style={styles.infoIcon}
              />
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {client.phone}
              </ThemedText>
            </View>
          ) : null}
          <View style={styles.jobBadge}>
            <ThemedText type="small" style={{ color: AppColors.primary }}>
              {jobCount} {jobCount === 1 ? "job" : "jobs"}
            </ThemedText>
          </View>
        </View>
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  infoIcon: {
    marginRight: Spacing.xs,
  },
  jobBadge: {
    backgroundColor: AppColors.primary + "15",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
});
