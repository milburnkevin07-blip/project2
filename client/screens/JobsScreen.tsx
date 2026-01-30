import React, { useState, useMemo } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { JobCard } from "@/components/JobCard";
import { EmptyState } from "@/components/EmptyState";
import { SegmentedControl } from "@/components/SegmentedControl";
import { FAB } from "@/components/FAB";
import { useData } from "@/context/DataContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Job } from "@/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type FilterType = "all" | "active" | "completed";

const filterOptions = [
  { label: "All", value: "all" as FilterType },
  { label: "Active", value: "active" as FilterType },
  { label: "Completed", value: "completed" as FilterType },
];

export default function JobsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { jobs, getClientById, isLoading, refreshData } = useData();
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredJobs = useMemo(() => {
    let result = [...jobs];
    if (filter === "active") {
      result = result.filter((j) => j.status !== "completed");
    } else if (filter === "completed") {
      result = result.filter((j) => j.status === "completed");
    }
    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [jobs, filter]);

  const handleAddJob = () => {
    navigation.navigate("AddJob", { clientId: undefined });
  };

  const handleJobPress = (job: Job) => {
    navigation.navigate("JobDetails", { jobId: job.id });
  };

  const renderItem = ({ item }: { item: Job }) => (
    <View style={styles.cardItem}>
      <JobCard
        job={item}
        client={getClientById(item.clientId)}
        onPress={() => handleJobPress(item)}
      />
    </View>
  );

  const renderEmpty = () => (
    <EmptyState
      image={require("../../assets/images/empty-jobs.png")}
      title="No jobs found"
      message={
        filter === "all"
          ? "Create your first job to get started"
          : `No ${filter} jobs at the moment`
      }
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.filterContainer}>
            <SegmentedControl
              options={filterOptions}
              value={filter}
              onChange={setFilter}
            />
          </View>
        }
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl + Spacing.fabSize,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshData} />
        }
      />

      <FAB onPress={handleAddJob} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    marginBottom: Spacing.lg,
  },
  cardItem: {
    marginBottom: Spacing.sm,
  },
});
