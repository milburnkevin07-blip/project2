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
import { Invoice, InvoiceStatus } from "@/types";

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: AppColors.statusNotStarted,
  sent: AppColors.statusInProgress,
  paid: AppColors.statusCompleted,
  overdue: AppColors.error,
};

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
};

type FilterOption = "all" | "pending" | "paid";

export default function InvoicesScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const { invoices, getClientById } = useData();
  const { formatCurrency } = useSettings();
  const [filter, setFilter] = useState<FilterOption>("all");

  const filteredInvoices = useMemo(() => {
    let filtered = invoices;
    if (filter === "pending") {
      filtered = invoices.filter((i) => i.status === "sent" || i.status === "overdue" || i.status === "draft");
    } else if (filter === "paid") {
      filtered = invoices.filter((i) => i.status === "paid");
    }
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [invoices, filter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderInvoice = ({ item }: { item: Invoice }) => {
    const client = getClientById(item.clientId);
    const statusColor = STATUS_COLORS[item.status];

    return (
      <Pressable
        onPress={() => navigation.navigate("InvoiceDetails", { invoiceId: item.id })}
        style={({ pressed }) => [
          styles.invoiceCard,
          { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.6 : 1 },
        ]}
        testID={`invoice-card-${item.id}`}
      >
        <View style={[styles.statusBar, { backgroundColor: statusColor }]} />
        <View style={styles.invoiceContent}>
          <View style={styles.invoiceHeader}>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              {item.invoiceNumber}
            </ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
              <ThemedText type="caption" style={{ color: statusColor, fontWeight: "600" }}>
                {STATUS_LABELS[item.status]}
              </ThemedText>
            </View>
          </View>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {client?.name || "Unknown Client"}
          </ThemedText>
          <View style={styles.invoiceFooter}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Due: {formatDate(item.dueDate)}
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
        data={filteredInvoices}
        keyExtractor={(item) => item.id}
        renderItem={renderInvoice}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl + 80,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListHeaderComponent={
          <View style={styles.header}>
            <SegmentedControl
              options={["All", "Pending", "Paid"]}
              selectedIndex={filter === "all" ? 0 : filter === "pending" ? 1 : 2}
              onSelect={(index) => setFilter(index === 0 ? "all" : index === 1 ? "pending" : "paid")}
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="file-text"
            title="No invoices yet"
            subtitle="Create your first invoice to get started"
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
      />
      <FAB
        icon="plus"
        onPress={() => navigation.navigate("AddInvoice")}
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
  invoiceCard: {
    flexDirection: "row",
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  statusBar: {
    width: 4,
  },
  invoiceContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  invoiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  invoiceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
});
