import React from "react";
import { View, StyleSheet, ScrollView, Pressable, RefreshControl, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { StatCard } from "@/components/StatCard";
import { JobCard } from "@/components/JobCard";
import { EmptyState } from "@/components/EmptyState";
import { FAB } from "@/components/FAB";
import { useData } from "@/context/DataContext";
import { useTheme } from "@/hooks/useTheme";
import { useSettings } from "@/context/SettingsContext";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
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
  
  const upcomingJobs = jobs
    .filter((job) => {
      if (job.status === "completed") return false;
      if (!job.dueDate) return false;
      const due = new Date(job.dueDate);
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return due >= now && due <= weekFromNow;
    })
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

  const handleAddJob = () => {
    navigation.navigate("AddJob", { clientId: undefined });
  };

  const handleViewAllJobs = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    (navigation as any).navigate("Main", { screen: "JobsTab" });
  };

  const handleViewCalendar = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    (navigation as any).navigate("Main", { screen: "CalendarTab" });
  };

  const handleJobPress = (jobId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("JobDetails", { jobId });
  };

  const handleInvoicePress = (invoiceId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("InvoiceDetails", { invoiceId });
  };

  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

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
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshData} />
        }
      >
        <View style={styles.statsRow}>
          <StatCard
            title="Active Jobs"
            value={activeJobs.length}
            icon="briefcase"
            color={AppColors.statusInProgress}
          />
          <View style={styles.statSpacer} />
          <StatCard
            title="Total Clients"
            value={clients.length}
            icon="users"
            color={AppColors.primary}
          />
          <View style={styles.statSpacer} />
          <StatCard
            title="Pending"
            value={formatCurrency(pendingTotal)}
            icon="dollar-sign"
            color={AppColors.warning}
          />
        </View>

        {upcomingJobs.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <ThemedText type="h4">Upcoming Due Dates</ThemedText>
              <Pressable onPress={handleViewCalendar}>
                <ThemedText type="link">Calendar</ThemedText>
              </Pressable>
            </View>
            <View style={[styles.upcomingCard, { backgroundColor: theme.backgroundDefault }]}>
              {upcomingJobs.slice(0, 3).map((job, index) => (
                <Pressable
                  key={job.id}
                  onPress={() => handleJobPress(job.id)}
                  style={[
                    styles.upcomingRow,
                    index < upcomingJobs.slice(0, 3).length - 1 && {
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
                    <Feather name="clock" size={14} color={AppColors.warning} />
                    <ThemedText type="small" style={{ color: AppColors.warning, marginLeft: 4, fontWeight: "600" }}>
                      {formatDueDate(job.dueDate!)}
                    </ThemedText>
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        {pendingInvoices.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <ThemedText type="h4">Pending Invoices</ThemedText>
            </View>
            <View style={[styles.upcomingCard, { backgroundColor: theme.backgroundDefault }]}>
              {pendingInvoices.slice(0, 3).map((invoice, index) => (
                <Pressable
                  key={invoice.id}
                  onPress={() => handleInvoicePress(invoice.id)}
                  style={[
                    styles.upcomingRow,
                    index < pendingInvoices.slice(0, 3).length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.upcomingInfo}>
                    <ThemedText type="body" numberOfLines={1} style={{ fontWeight: "500" }}>
                      {invoice.invoiceNumber}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {getClientById(invoice.clientId)?.name || "Unknown"}
                    </ThemedText>
                  </View>
                  <ThemedText type="body" style={{ fontWeight: "600", color: AppColors.primary }}>
                    {formatCurrency(invoice.total)}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        <View style={styles.sectionHeader}>
          <ThemedText type="h4">Active Jobs</ThemedText>
          {activeJobs.length > 5 ? (
            <Pressable onPress={handleViewAllJobs}>
              <ThemedText type="link">View All</ThemedText>
            </Pressable>
          ) : null}
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
  statsRow: {
    flexDirection: "row",
    marginBottom: Spacing.xl,
  },
  statSpacer: {
    width: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  upcomingCard: {
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xl,
    overflow: "hidden",
  },
  upcomingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  upcomingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  upcomingDue: {
    flexDirection: "row",
    alignItems: "center",
  },
  jobItem: {
    marginBottom: Spacing.sm,
  },
});
