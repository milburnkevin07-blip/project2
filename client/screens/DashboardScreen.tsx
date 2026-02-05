import React from "react";
import { View, StyleSheet, ScrollView, Pressable, RefreshControl, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { JobCard } from "@/components/JobCard";
import { EmptyState } from "@/components/EmptyState";
import { FAB } from "@/components/FAB";
import { useData } from "@/context/DataContext";
import { useTheme } from "@/hooks/useTheme";
import { useSettings } from "@/context/SettingsContext";
import { Spacing, BorderRadius, AppColors, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { MainTabParamList } from "@/navigation/MainTabNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { clients, jobs, invoices, getActiveJobs, getClientById, isLoading, refreshData } = useData();
  const { formatCurrency } = useSettings();

  const activeJobs = getActiveJobs();
  const pendingInvoices = invoices.filter((inv) => inv.status === "sent" || inv.status === "overdue");
  const pendingTotal = pendingInvoices.reduce((sum, inv) => sum + inv.total, 0);
  
  // ✨ Jobs due TODAY
  const jobsDueToday = jobs.filter((job) => {
    if (job.status === "completed" || !job.dueDate) return false;
    const due = new Date(job.dueDate);
    const today = new Date();
    return due.toDateString() === today.toDateString();
  });

  // ✨ Jobs due THIS WEEK (next 7 days, not including today)
  const jobsDueThisWeek = jobs.filter((job) => {
    if (job.status === "completed" || !job.dueDate) return false;
    const due = new Date(job.dueDate);
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return due > today && due <= weekFromNow;
  }).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

  const handleAddJob = () => {
    navigation.navigate("AddJob", { clientId: undefined });
  };

  const handleAddClient = () => {
    navigation.navigate("AddClient", { clientId: undefined });
  };

  const handleAddInvoice = () => {
    navigation.navigate("AddInvoice", { clientId: undefined });
  };

  // ✨ Navigate to filtered screens when stat cards tapped
  const handleJobsCardPress = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    (navigation as any).navigate("Main", { screen: "JobsTab" });
  };

  const handleClientsCardPress = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    (navigation as any).navigate("Main", { screen: "ClientsTab" });
  };

  const handleUnpaidCardPress = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Could navigate to invoices filtered by unpaid - for now just go to invoices tab
    // TODO: Add filter support to InvoicesScreen
    navigation.navigate("AddInvoice", { clientId: undefined });
  };

  const handleJobPress = (jobId: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("JobDetails", { jobId });
  };

  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  // ✨ Tappable Stat Card Component
  const TappableStatCard = ({
    title,
    value,
    emoji,
    colors,
    onPress,
  }: {
    title: string;
    value: string | number;
    emoji: string;
    colors: string[];
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.statCard,
        { opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <LinearGradient colors={colors} style={styles.statGradient}>
        <View style={styles.statEmojiCircle}>
          <ThemedText style={styles.statEmoji}>{emoji}</ThemedText>
        </View>
        <ThemedText type="h2" style={styles.statValue}>
          {value}
        </ThemedText>
        <ThemedText type="small" style={styles.statTitle}>
          {title}
        </ThemedText>
      </LinearGradient>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl + Spacing.fabSize,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshData} />}
      >
        {/* ✨ STAT CARDS - All tappable, same border radius */}
        <View style={styles.statsRow}>
          <TappableStatCard
            title="Jobs"
            value={activeJobs.length}
            emoji="💼"
            colors={["#3B82F6", "#60A5FA"]}
            onPress={handleJobsCardPress}
          />
          <View style={styles.statSpacer} />
          <TappableStatCard
            title="Clients"
            value={clients.length}
            emoji="🧑‍💼"
            colors={["#8B5CF6", "#A78BFA"]}  // ✨ Purple gradient
            onPress={handleClientsCardPress}
          />
          <View style={styles.statSpacer} />
          <TappableStatCard
            title="Unpaid"
            value={formatCurrency(pendingTotal)}
            emoji="💳"
            colors={["#F59E0B", "#FBBF24"]}
            onPress={handleUnpaidCardPress}
          />
        </View>

        {/* ✨ QUICK ACTIONS BAR */}
        <View style={[styles.quickActionsCard, { backgroundColor: theme.backgroundDefault }, Shadows.small]}>
          <Pressable
            onPress={handleAddJob}
            style={({ pressed }) => [
              styles.quickActionButton,
              { backgroundColor: pressed ? AppColors.primary + "15" : "transparent" },
            ]}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: AppColors.primary + "15" }]}>
              <Feather name="briefcase" size={20} color={AppColors.primary} />
            </View>
            <ThemedText type="small" style={{ color: theme.text, fontWeight: "600" }}>
              New Job
            </ThemedText>
          </Pressable>

          <View style={[styles.quickActionDivider, { backgroundColor: theme.border }]} />

          <Pressable
            onPress={handleAddClient}
            style={({ pressed }) => [
              styles.quickActionButton,
              { backgroundColor: pressed ? AppColors.primary + "15" : "transparent" },
            ]}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: AppColors.primary + "15" }]}>
              <Feather name="user-plus" size={20} color={AppColors.primary} />
            </View>
            <ThemedText type="small" style={{ color: theme.text, fontWeight: "600" }}>
              New Client
            </ThemedText>
          </Pressable>

          <View style={[styles.quickActionDivider, { backgroundColor: theme.border }]} />

          <Pressable
            onPress={handleAddInvoice}
            style={({ pressed }) => [
              styles.quickActionButton,
              { backgroundColor: pressed ? AppColors.primary + "15" : "transparent" },
            ]}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: AppColors.primary + "15" }]}>
              <Feather name="file-text" size={20} color={AppColors.primary} />
            </View>
            <ThemedText type="small" style={{ color: theme.text, fontWeight: "600" }}>
              New Invoice
            </ThemedText>
          </Pressable>
        </View>

        {/* ✨ DUE TODAY SECTION */}
        {jobsDueToday.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Feather name="alert-circle" size={20} color={AppColors.warning} style={{ marginRight: 8 }} />
                <ThemedText type="h4">Due Today</ThemedText>
              </View>
            </View>
            <View style={[styles.dueTodayCard, { backgroundColor: AppColors.warning + "15", borderColor: AppColors.warning + "40" }, Shadows.small]}>
              {jobsDueToday.map((job, index) => (
                <Pressable
                  key={job.id}
                  onPress={() => handleJobPress(job.id)}
                  style={[
                    styles.dueTodayRow,
                    index < jobsDueToday.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: AppColors.warning + "20",
                    },
                  ]}
                >
                  <View style={styles.dueTodayInfo}>
                    <ThemedText type="body" numberOfLines={1} style={{ fontWeight: "600" }}>
                      {job.title}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {getClientById(job.clientId)?.name || "Unknown"}
                    </ThemedText>
                  </View>
                  <Feather name="chevron-right" size={20} color={AppColors.warning} />
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        {/* ✨ MONEY SUMMARY CARD */}
        {pendingTotal > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Feather name="dollar-sign" size={20} color={AppColors.primary} style={{ marginRight: 8 }} />
                <ThemedText type="h4">Money Outstanding</ThemedText>
              </View>
            </View>
            <Pressable
              onPress={handleUnpaidCardPress}
              style={[styles.moneySummaryCard, { backgroundColor: theme.backgroundDefault }, Shadows.small]}
            >
              <View style={styles.moneySummaryTop}>
                <View>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    TOTAL UNPAID
                  </ThemedText>
                  <ThemedText type="h2" style={{ color: AppColors.primary, marginTop: 4 }}>
                    {formatCurrency(pendingTotal)}
                  </ThemedText>
                </View>
                <View style={[styles.moneyIconCircle, { backgroundColor: AppColors.primary + "15" }]}>
                  <Feather name="trending-up" size={28} color={AppColors.primary} />
                </View>
              </View>
              <View style={[styles.moneySummaryBottom, { borderTopColor: theme.border }]}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {pendingInvoices.length} unpaid {pendingInvoices.length === 1 ? "invoice" : "invoices"}
                </ThemedText>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <ThemedText type="small" style={{ color: AppColors.primary, fontWeight: "600", marginRight: 4 }}>
                    View All
                  </ThemedText>
                  <Feather name="arrow-right" size={14} color={AppColors.primary} />
                </View>
              </View>
            </Pressable>
          </>
        ) : null}

        {/* ✨ UPCOMING THIS WEEK */}
        {jobsDueThisWeek.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Feather name="calendar" size={20} color={AppColors.primary} style={{ marginRight: 8 }} />
                <ThemedText type="h4">This Week</ThemedText>
              </View>
            </View>
            <View style={[styles.upcomingCard, { backgroundColor: theme.backgroundDefault }, Shadows.small]}>
              {jobsDueThisWeek.slice(0, 3).map((job, index) => (
                <Pressable
                  key={job.id}
                  onPress={() => handleJobPress(job.id)}
                  style={[
                    styles.upcomingRow,
                    index < Math.min(3, jobsDueThisWeek.length) - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.upcomingInfo}>
                    <ThemedText type="body" numberOfLines={1} style={{ fontWeight: "500" }}>
                      {job.title}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {getClientById(job.clientId)?.name || "Unknown"}
                    </ThemedText>
                  </View>
                  <View style={styles.upcomingDue}>
                    <View style={styles.dueBadge}>
                      <Feather name="clock" size={12} color={AppColors.info} />
                      <ThemedText type="small" style={{ color: AppColors.info, marginLeft: 4, fontWeight: "600" }}>
                        {formatDueDate(job.dueDate!)}
                      </ThemedText>
                    </View>
                    <Feather name="chevron-right" size={18} color={theme.textSecondary} style={{ marginLeft: 8 }} />
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        {/* ACTIVE JOBS */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Feather name="briefcase" size={20} color={AppColors.primary} style={{ marginRight: 8 }} />
            <ThemedText type="h4">Active Jobs</ThemedText>
          </View>
        </View>

        {activeJobs.length > 0 ? (
          activeJobs.slice(0, 5).map((job) => (
            <View key={job.id} style={styles.jobItem}>
              <JobCard
                job={job}
                client={getClientById(job.clientId)}
                onPress={() => handleJobPress(job.id)}
              />
            </View>
          ))
        ) : (
          <EmptyState
            image={require("../../assets/images/empty-jobs.png")}
            title="No active jobs"
            message="Create a new job to get started"
          />
        )}
      </ScrollView>

      <FAB onPress={handleAddJob} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },

  // ✨ Stat Cards - Tappable
  statsRow: {
    flexDirection: "row",
    marginBottom: Spacing["2xl"],
  },
  statCard: {
    flex: 1,
  },
  statGradient: {
    borderRadius: BorderRadius.lg, // ✨ All same rounded corners
    padding: Spacing.lg,
    alignItems: "center",
    minHeight: 140,
    justifyContent: "center",
    ...Shadows.small,
  },
  statEmojiCircle: {
    width: 72,   // ✨ Bigger circle
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  marginBottom: Spacing.md,
},
  statEmoji: {
    fontSize: 32,
  },
  statValue: {
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 4,
  },
  statTitle: {
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontWeight: "600",
  },
  statSpacer: {
    width: Spacing.md,
  },

  // ✨ Quick Actions Bar
  quickActionsCard: {
    flexDirection: "row",
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    marginBottom: Spacing["2xl"],
  },
  quickActionButton: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  quickActionDivider: {
    width: 1,
    marginVertical: Spacing.sm,
  },

  // ✨ Due Today Card
  dueTodayCard: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing["2xl"],
    overflow: "hidden",
    borderWidth: 1,
  },
  dueTodayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  dueTodayInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },

  // ✨ Money Summary Card
  moneySummaryCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing["2xl"],
  },
  moneySummaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  moneyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  moneySummaryBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },

  // Section Headers
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
    marginTop: Spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  // Upcoming Card
  upcomingCard: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing["2xl"],
    overflow: "hidden",
  },
  upcomingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.xl,
  },
  upcomingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  upcomingDue: {
    flexDirection: "row",
    alignItems: "center",
  },
  dueBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.info + "15",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },

  // Job Items
  jobItem: {
    marginBottom: Spacing.md,
  },
});