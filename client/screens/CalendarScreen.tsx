import React, { useState, useMemo } from "react";
import { View, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useData } from "@/context/DataContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Job, JobStatus } from "@/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const STATUS_COLORS: Record<JobStatus, string> = {
  not_started: "#F59E0B",
  in_progress: "#3B82F6",
  completed: "#10B981",
  cancelled: "#EF4444",
};

const STATUS_LABELS: Record<JobStatus, string> = {
  not_started: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const startPadding = firstDay.getDay();
  for (let i = startPadding - 1; i >= 0; i--) {
    const paddingDate = new Date(year, month, -i);
    days.push(paddingDate);
  }
  
  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }
  
  const endPadding = 42 - days.length;
  for (let i = 1; i <= endPadding; i++) {
    days.push(new Date(year, month + 1, i));
  }
  
  return days;
}

export default function CalendarScreen() {
  const navigation = useNavigation<NavigationProp>();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { jobs, getClientById } = useData();

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const days = useMemo(
    () => getDaysInMonth(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const jobsByDate = useMemo(() => {
    const map: Record<string, Job[]> = {};
    jobs.forEach((job) => {
      const dates: string[] = [];
      if (job.startDate) {
        dates.push(new Date(job.startDate).toDateString());
      }
      if (job.dueDate) {
        dates.push(new Date(job.dueDate).toDateString());
      }
      dates.forEach((dateKey) => {
        if (!map[dateKey]) map[dateKey] = [];
        if (!map[dateKey].find((j) => j.id === job.id)) {
          map[dateKey].push(job);
        }
      });
    });
    return map;
  }, [jobs]);

  const monthJobs = useMemo(() => {
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);
    
    const jobsInMonth: { job: Job; date: Date; type: "start" | "due" }[] = [];
    
    jobs.forEach((job) => {
      if (job.startDate) {
        const startDate = new Date(job.startDate);
        if (startDate >= monthStart && startDate <= monthEnd) {
          jobsInMonth.push({ job, date: startDate, type: "start" });
        }
      }
      if (job.dueDate) {
        const dueDate = new Date(job.dueDate);
        if (dueDate >= monthStart && dueDate <= monthEnd) {
          if (!job.startDate || !isSameDay(new Date(job.startDate), dueDate)) {
            jobsInMonth.push({ job, date: dueDate, type: "due" });
          }
        }
      }
    });
    
    return jobsInMonth.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [jobs, currentMonth, currentYear]);

  const handlePrevMonth = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleJobPress = (jobId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("JobDetails", { jobId });
  };

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const renderDayCell = (date: Date, index: number) => {
    const isCurrentMonth = date.getMonth() === currentMonth;
    const isToday = isSameDay(date, today);
    const dateKey = date.toDateString();
    const dayJobs = jobsByDate[dateKey] || [];
    const hasJobs = dayJobs.length > 0;

    return (
      <View key={index} style={styles.dayCell}>
        <View
          style={[
            styles.dayNumber,
            isToday && { backgroundColor: AppColors.primary },
          ]}
        >
          <ThemedText
            type="caption"
            style={[
              { textAlign: "center" },
              !isCurrentMonth && { color: theme.textSecondary + "40" },
              isToday && { color: "#FFFFFF", fontWeight: "600" },
            ]}
          >
            {date.getDate()}
          </ThemedText>
        </View>
        {hasJobs ? (
          <View style={styles.dotContainer}>
            {dayJobs.slice(0, 3).map((job) => (
              <View
                key={job.id}
                style={[
                  styles.dot,
                  { backgroundColor: STATUS_COLORS[job.status] },
                ]}
              />
            ))}
            {dayJobs.length > 3 ? (
              <ThemedText type="caption" style={{ fontSize: 8, color: theme.textSecondary }}>
                +{dayJobs.length - 3}
              </ThemedText>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
      >
        <View style={[styles.calendarCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.monthHeader}>
            <Pressable onPress={handlePrevMonth} hitSlop={12} style={styles.navButton}>
              <Feather name="chevron-left" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h3" style={{ fontWeight: "600" }}>
              {MONTHS[currentMonth]} {currentYear}
            </ThemedText>
            <Pressable onPress={handleNextMonth} hitSlop={12} style={styles.navButton}>
              <Feather name="chevron-right" size={24} color={theme.text} />
            </Pressable>
          </View>

          <View style={styles.weekDays}>
            {DAYS.map((day) => (
              <View key={day} style={styles.weekDayCell}>
                <ThemedText type="caption" style={{ color: theme.textSecondary, fontWeight: "600" }}>
                  {day}
                </ThemedText>
              </View>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {days.map((date, index) => renderDayCell(date, index))}
          </View>

          <View style={styles.legend}>
            {(Object.keys(STATUS_COLORS) as JobStatus[]).map((status) => (
              <View key={status} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS[status] }]} />
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  {STATUS_LABELS[status]}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.jobsListHeader}>
          <ThemedText type="h4" style={{ fontWeight: "600" }}>
            Scheduled Jobs
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {monthJobs.length} this month
          </ThemedText>
        </View>

        {monthJobs.length > 0 ? (
          <View style={styles.jobsList}>
            {monthJobs.map(({ job, date, type }, index) => {
              const client = getClientById(job.clientId);
              const statusColor = STATUS_COLORS[job.status];
              const isPast = date < today && !isSameDay(date, today);
              
              return (
                <Pressable
                  key={`${job.id}-${type}`}
                  onPress={() => handleJobPress(job.id)}
                  style={[
                    styles.jobRow,
                    { backgroundColor: theme.backgroundDefault },
                    isPast && { opacity: 0.6 },
                  ]}
                >
                  <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
                  <View style={styles.jobDateColumn}>
                    <ThemedText type="caption" style={{ color: theme.textSecondary, fontWeight: "600" }}>
                      {formatShortDate(date)}
                    </ThemedText>
                    <View style={[styles.typeTag, { backgroundColor: type === "start" ? AppColors.primary + "20" : AppColors.warning + "20" }]}>
                      <ThemedText type="caption" style={{ color: type === "start" ? AppColors.primary : AppColors.warning, fontSize: 10 }}>
                        {type === "start" ? "START" : "DUE"}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.jobDetails}>
                    <ThemedText type="body" style={{ fontWeight: "600" }} numberOfLines={1}>
                      {job.title}
                    </ThemedText>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }} numberOfLines={1}>
                      {client?.name || "Unknown Client"}
                    </ThemedText>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
                    <ThemedText type="caption" style={{ color: statusColor, fontWeight: "600", fontSize: 10 }}>
                      {STATUS_LABELS[job.status]}
                    </ThemedText>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="calendar" size={40} color={theme.textSecondary} />
            <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
              No jobs scheduled this month
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  navButton: {
    padding: Spacing.sm,
  },
  weekDays: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  weekDayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    paddingTop: 2,
  },
  dayNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dotContainer: {
    flexDirection: "row",
    marginTop: 2,
    gap: 2,
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.md,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  jobsListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  jobsList: {
    gap: Spacing.sm,
  },
  jobRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  statusIndicator: {
    width: 4,
    alignSelf: "stretch",
  },
  jobDateColumn: {
    width: 60,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: "center",
  },
  typeTag: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  jobDetails: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingRight: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
    marginRight: Spacing.md,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl * 2,
    borderRadius: BorderRadius.sm,
  },
});
