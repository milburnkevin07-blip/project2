import React from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { StatusBadge } from "@/components/StatusBadge";
import { Job, Client } from "@/types";
import { AppColors, BorderRadius, Spacing, Shadows } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

interface JobCardProps {
  job: Job;
  client?: Client;
  onPress?: () => void;
}

const statusColors = {
  not_started: AppColors.statusNotStarted,
  in_progress: AppColors.statusInProgress,
  completed: AppColors.statusCompleted,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function JobCard({ job, client, onPress }: JobCardProps) {
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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        { backgroundColor: theme.backgroundDefault },
        Shadows.small,
        animatedStyle,
      ]}
      testID={`job-card-${job.id}`}
    >
      <View
        style={[
          styles.statusBar,
          { backgroundColor: statusColors[job.status] },
        ]}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <ThemedText type="h4" style={styles.title} numberOfLines={1}>
              {job.title}
            </ThemedText>
            <StatusBadge status={job.status} />
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </View>
        
        {client ? (
          <View style={styles.infoRow}>
            <Feather name="user" size={14} color={theme.textSecondary} style={styles.icon} />
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary }}
              numberOfLines={1}
            >
              {client.name}
              {client.company ? ` • ${client.company}` : ""}
            </ThemedText>
          </View>
        ) : null}
        
        {job.dueDate ? (
          <View style={styles.infoRow}>
            <Feather name="calendar" size={14} color={theme.textSecondary} style={styles.icon} />
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary }}
            >
              Due: {formatDate(job.dueDate)}
            </ThemedText>
          </View>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,  // ✨ Larger radius
    overflow: "hidden",
    flexDirection: "row",
  },
  statusBar: {
    width: 5,  // ✨ Slightly thicker
  },
  content: {
    flex: 1,
    padding: Spacing.xl,  // ✨ More padding
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  titleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginRight: Spacing.sm,
  },
  title: {
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  icon: {
    marginRight: Spacing.xs,
  },
});