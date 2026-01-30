import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { StatusBadge } from "@/components/StatusBadge";
import { Job, Client } from "@/types";
import { AppColors, BorderRadius, Spacing } from "@/constants/theme";
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
          <ThemedText type="h4" style={styles.title} numberOfLines={1}>
            {job.title}
          </ThemedText>
          <StatusBadge status={job.status} />
        </View>
        {client ? (
          <ThemedText
            type="small"
            style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
            numberOfLines={1}
          >
            {client.name}
            {client.company ? ` - ${client.company}` : ""}
          </ThemedText>
        ) : null}
        {job.dueDate ? (
          <ThemedText
            type="small"
            style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
          >
            Due: {formatDate(job.dueDate)}
          </ThemedText>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    flexDirection: "row",
  },
  statusBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    flex: 1,
    marginRight: Spacing.sm,
  },
});
