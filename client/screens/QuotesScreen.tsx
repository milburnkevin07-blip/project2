import React, { useState, useMemo } from "react";
import { View, StyleSheet, FlatList, Pressable } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { SegmentedControl } from "@/components/SegmentedControl";
import { EmptyState } from "@/components/EmptyState";
import { FAB } from "@/components/FAB";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/context/DataContext";
import { useSettings } from "@/context/SettingsContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { Quote, QuoteStatus } from "@/types";

const STATUS_COLORS: Record<QuoteStatus, string> = {
  draft: AppColors.statusNotStarted,
  sent: AppColors.statusInProgress,
  accepted: AppColors.statusCompleted,
  rejected: AppColors.error,
};

const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  rejected: "Rejected",
};

type FilterOption = "all" | "pending" | "accepted";

export default function QuotesScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const { quotes, getClientById } = useData();
  const { formatCurrency } = useSettings();
  const [filter, setFilter] = useState<FilterOption>("all");

  const filteredQuotes = useMemo(() => {
    let filtered = quotes;
    if (filter === "pending") {
      filtered = quotes.filter((q) => q.status === "draft" || q.status === "sent");
    } else if (filter === "accepted") {
      filtered = quotes.filter((q) => q.status === "accepted");
    }
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [quotes, filter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderQuote = ({ item }: { item: Quote }) => {
    const client = getClientById(item.clientId);
    const statusColor = STATUS_COLORS[item.status];

    return (
      <Pressable
        onPress={() => navigation.navigate("QuoteDetails", { quoteId: item.id })}
        style={({ pressed }) => [
          styles.quoteCard,
          { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.6 : 1 },
        ]}
        testID={`quote-card-${item.id}`}
      >
        <View style={[styles.statusBar, { backgroundColor: statusColor }]} />
        <View style={styles.quoteContent}>
          <View style={styles.quoteHeader}>
            <View style={styles.headerLeft}>
              <View style={[styles.quoteBadge, { backgroundColor: AppColors.primary + "20" }]}>
                <ThemedText type="caption" style={{ color: AppColors.primary, fontWeight: "600" }}>
                  QUOTE
                </ThemedText>
              </View>
              <ThemedText type="body" style={{ fontWeight: "600", marginLeft: Spacing.sm }}>
                {item.quoteNumber}
              </ThemedText>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
              <ThemedText type="caption" style={{ color: statusColor, fontWeight: "600" }}>
                {STATUS_LABELS[item.status]}
              </ThemedText>
            </View>
          </View>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {client?.name || "Unknown Client"}
          </ThemedText>
          <View style={styles.quoteFooter}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Valid until: {formatDate(item.validUntil)}
            </ThemedText>
            <ThemedText type="body" style={{ fontWeight: "700", color: theme.text }}>
              {formatCurrency(item.total)}
            </ThemedText>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={filteredQuotes}
        keyExtractor={(item) => item.id}
        renderItem={renderQuote}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl + 80,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListHeaderComponent={
          <View style={styles.header}>
            <SegmentedControl
              options={["All", "Pending", "Accepted"]}
              selectedIndex={filter === "all" ? 0 : filter === "pending" ? 1 : 2}
              onSelect={(index) => setFilter(index === 0 ? "all" : index === 1 ? "pending" : "accepted")}
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="file-text"
            title="No quotes yet"
            subtitle="Create your first quote to get started"
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
      />
      <FAB
        icon="plus"
        onPress={() => navigation.navigate("AddQuote")}
        style={{ bottom: tabBarHeight + Spacing.lg }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  quoteCard: {
    flexDirection: "row",
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  statusBar: {
    width: 4,
  },
  quoteContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  quoteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  quoteBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  quoteFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
});
