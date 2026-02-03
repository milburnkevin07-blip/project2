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
import { SearchBar } from "@/components/SearchBar";
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
  const [searchQuery, setSearchQuery] = useState("");

  const filteredJobs = useMemo(() => {
    let result = [...jobs];
    
    // Filter by status
    if (filter === "active") {
      result = result.filter((j) => j.status !== "completed");
    } else if (filter === "completed") {
      result = result.filter((j) => j.status === "completed");
    }
    
    // Search by title, description, or client name
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((job) => {
        const client = getClientById(job.clientId);
        return (
          job.title.toLowerCase().includes(query) ||
          job.description?.toLowerCase().includes(query) ||
          client?.name.toLowerCase().includes(query) ||
          client?.company?.toLowerCase().includes(query)
        );
      });
    }
    
    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [jobs, filter, searchQuery, getClientById]);

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
        searchQuery.trim()
          ? "No jobs match your search"
          : filter === "all"
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
          <View>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search jobs or clients..."
            />
            <View style={styles.filterContainer}>
              <SegmentedControl
                options={filterOptions}
                value={filter}
                onChange={setFilter}
              />
            </View>
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