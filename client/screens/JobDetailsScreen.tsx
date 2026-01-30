import React, { useLayoutEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, Linking, Alert, Platform, Image, FlatList } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { ThemedText } from "@/components/ThemedText";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/Button";
import { useData } from "@/context/DataContext";
import { useTheme } from "@/hooks/useTheme";
import { useSettings } from "@/context/SettingsContext";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Attachment } from "@/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "JobDetails">;
type JobDetailsRouteProp = RouteProp<RootStackParamList, "JobDetails">;

const showAlert = (
  title: string,
  message: string,
  options: { text: string; onPress?: () => void; style?: "cancel" | "destructive" | "default" }[]
) => {
  if (Platform.OS === "web") {
    const result = window.confirm(`${title}\n\n${message}`);
    if (result && options.find((o) => o.style !== "cancel")?.onPress) {
      options.find((o) => o.style !== "cancel")?.onPress?.();
    }
  } else {
    Alert.alert(title, message, options);
  }
};

export default function JobDetailsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<JobDetailsRouteProp>();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { getJobById, getClientById, updateJob, getInvoicesForJob, getQuotesForJob } = useData();
  const { formatCurrency } = useSettings();

  const { jobId } = route.params;
  const job = getJobById(jobId);
  const client = job ? getClientById(job.clientId) : undefined;
  const invoices = job ? getInvoicesForJob(job.id) : [];
  const quotes = job ? getQuotesForJob(job.id) : [];

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: job?.title || "Job",
      headerRight: () => (
        <HeaderButton onPress={() => navigation.navigate("EditJob", { jobId })}>
          <ThemedText type="body" style={{ color: theme.link }}>
            Edit
          </ThemedText>
        </HeaderButton>
      ),
    });
  }, [navigation, job]);

  if (!job) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <ThemedText>Job not found</ThemedText>
      </View>
    );
  }

  const laborCost = (job.laborHours || 0) * (job.laborRate || 0);
  const expensesCost = job.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
  const totalCost = laborCost + (job.materialsCost || 0) + expensesCost;
  const hasCostData = job.laborHours || job.materialsCost || (job.expenses && job.expenses.length > 0);

  const paidInvoiceTotal = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.total, 0);
  const profit = paidInvoiceTotal - totalCost;

  const handleMarkComplete = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await updateJob({ ...job, status: "completed" });
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleMarkInProgress = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await updateJob({ ...job, status: "in_progress" });
  };

  const handleContactClient = () => {
    if (!client) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const options: { text: string; onPress?: () => void; style?: "cancel" | "destructive" | "default" }[] = [];

    if (client.phone) {
      options.push({
        text: "Call",
        onPress: () => Linking.openURL(`tel:${client.phone}`),
      });
    }
    if (client.email) {
      options.push({
        text: "Email",
        onPress: () => Linking.openURL(`mailto:${client.email}`),
      });
    }

    if (options.length === 0) {
      if (Platform.OS === "web") {
        window.alert("This client has no contact information.");
      } else {
        Alert.alert("No Contact Info", "This client has no contact information.");
      }
      return;
    }

    options.push({ text: "Cancel", style: "cancel" });
    showAlert("Contact " + client.name, "How would you like to reach out?", options);
  };

  const handleViewClient = () => {
    if (client) {
      navigation.navigate("ClientDetails", { clientId: client.id });
    }
  };

  const handleCreateInvoice = () => {
    navigation.navigate("AddInvoice", { clientId: job.clientId, jobId: job.id });
  };

  const handleCreateQuote = () => {
    navigation.navigate("AddQuote", { clientId: job.clientId, jobId: job.id });
  };

  const handleOpenAttachment = async (attachment: Attachment) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      if (attachment.type === "image") {
        if (Platform.OS === "web") {
          window.open(attachment.uri, "_blank");
        } else {
          await WebBrowser.openBrowserAsync(attachment.uri);
        }
      } else {
        await Linking.openURL(attachment.uri);
      }
    } catch (error) {
      console.error("Failed to open attachment:", error);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Not set";
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const DetailRow = ({
    icon,
    label,
    value,
    onPress,
  }: {
    icon: keyof typeof Feather.glyphMap;
    label: string;
    value: string;
    onPress?: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={styles.detailRow}
    >
      <View style={[styles.detailIcon, { backgroundColor: AppColors.primary + "15" }]}>
        <Feather name={icon} size={18} color={AppColors.primary} />
      </View>
      <View style={styles.detailContent}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {label}
        </ThemedText>
        <ThemedText
          type="body"
          style={onPress ? { color: theme.link } : undefined}
        >
          {value}
        </ThemedText>
      </View>
      {onPress ? (
        <Feather name="chevron-right" size={18} color={theme.textSecondary} />
      ) : null}
    </Pressable>
  );

  const CostRow = ({ label, value, isTotal }: { label: string; value: number; isTotal?: boolean }) => (
    <View style={[styles.costRow, isTotal && styles.costRowTotal]}>
      <ThemedText type="body" style={isTotal ? { fontWeight: "600" } : undefined}>
        {label}
      </ThemedText>
      <ThemedText
        type="body"
        style={[
          isTotal ? { fontWeight: "600" } : undefined,
          value < 0 ? { color: AppColors.error } : undefined,
        ]}
      >
        {formatCurrency(value)}
      </ThemedText>
    </View>
  );

  const renderAttachment = ({ item }: { item: Attachment }) => (
    <Pressable
      onPress={() => handleOpenAttachment(item)}
      style={[styles.attachmentItem, { backgroundColor: theme.backgroundSecondary }]}
    >
      {item.type === "image" ? (
        <Image source={{ uri: item.uri }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.docIcon, { backgroundColor: AppColors.primary + "15" }]}>
          <Feather name="file" size={16} color={AppColors.primary} />
        </View>
      )}
      <ThemedText type="caption" numberOfLines={1} style={styles.attachmentName}>
        {item.name}
      </ThemedText>
    </Pressable>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
    >
      <View style={styles.statusContainer}>
        <StatusBadge status={job.status} size="medium" />
      </View>

      <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText type="h3" style={styles.title}>
          {job.title}
        </ThemedText>
        {job.description ? (
          <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
            {job.description}
          </ThemedText>
        ) : null}
      </View>

      <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
        <DetailRow
          icon="user"
          label="Client"
          value={client?.name || "Unknown"}
          onPress={client ? handleViewClient : undefined}
        />
        <DetailRow icon="calendar" label="Start Date" value={formatDate(job.startDate)} />
        <DetailRow icon="clock" label="Due Date" value={formatDate(job.dueDate)} />
        <DetailRow
          icon="activity"
          label="Created"
          value={formatDate(job.createdAt)}
        />
      </View>

      {hasCostData ? (
        <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            COST BREAKDOWN
          </ThemedText>
          {job.laborHours ? (
            <CostRow
              label={`Labor (${job.laborHours}h x ${formatCurrency(job.laborRate || 0)})`}
              value={laborCost}
            />
          ) : null}
          {job.materialsCost ? (
            <CostRow label="Materials" value={job.materialsCost} />
          ) : null}
          {job.expenses && job.expenses.length > 0 ? (
            <>
              {job.expenses.map((expense) => (
                <CostRow key={expense.id} label={expense.description} value={expense.amount} />
              ))}
            </>
          ) : null}
          <CostRow label="Total Cost" value={totalCost} isTotal />
          
          {invoices.length > 0 ? (
            <>
              <View style={styles.divider} />
              <CostRow label="Revenue (Paid)" value={paidInvoiceTotal} />
              <CostRow
                label={profit >= 0 ? "Profit" : "Loss"}
                value={profit}
                isTotal
              />
            </>
          ) : null}
        </View>
      ) : null}

      {job.attachments && job.attachments.length > 0 ? (
        <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            ATTACHMENTS ({job.attachments.length})
          </ThemedText>
          <FlatList
            data={job.attachments}
            keyExtractor={(item) => item.id}
            renderItem={renderAttachment}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.attachmentsList}
          />
        </View>
      ) : null}

      {quotes.length > 0 ? (
        <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            QUOTES ({quotes.length})
          </ThemedText>
          {quotes.map((quote) => (
            <Pressable
              key={quote.id}
              onPress={() => navigation.navigate("QuoteDetails", { quoteId: quote.id })}
              style={styles.invoiceRow}
            >
              <View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
                  <View style={{ backgroundColor: AppColors.primary + "20", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <ThemedText type="caption" style={{ color: AppColors.primary, fontWeight: "600" }}>QUOTE</ThemedText>
                  </View>
                  <ThemedText type="body" style={{ fontWeight: "600" }}>
                    {quote.quoteNumber}
                  </ThemedText>
                </View>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {formatCurrency(quote.total)} - {quote.status}
                </ThemedText>
              </View>
              <Feather name="chevron-right" size={18} color={theme.textSecondary} />
            </Pressable>
          ))}
        </View>
      ) : null}

      {invoices.length > 0 ? (
        <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            INVOICES ({invoices.length})
          </ThemedText>
          {invoices.map((invoice) => (
            <Pressable
              key={invoice.id}
              onPress={() => navigation.navigate("InvoiceDetails", { invoiceId: invoice.id })}
              style={styles.invoiceRow}
            >
              <View>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  {invoice.invoiceNumber}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {formatCurrency(invoice.total)} - {invoice.status}
                </ThemedText>
              </View>
              <Feather name="chevron-right" size={18} color={theme.textSecondary} />
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        {job.status !== "completed" ? (
          <Button onPress={handleMarkComplete} style={styles.primaryButton}>
            Mark as Completed
          </Button>
        ) : (
          <Button onPress={handleMarkInProgress} style={styles.primaryButton}>
            Reopen Job
          </Button>
        )}

        <View style={styles.buttonRow}>
          <Button onPress={handleCreateQuote} variant="secondary" style={styles.halfButton}>
            Create Quote
          </Button>
          <Button onPress={handleCreateInvoice} variant="secondary" style={styles.halfButton}>
            Create Invoice
          </Button>
        </View>

        {client ? (
          <Pressable onPress={handleContactClient} style={styles.secondaryButton}>
            <Feather name="phone" size={18} color={AppColors.primary} />
            <ThemedText style={{ color: AppColors.primary, marginLeft: Spacing.sm, fontWeight: "600" }}>
              Contact Client
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusContainer: {
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  card: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  detailContent: {
    flex: 1,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  costRowTotal: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: Spacing.md,
  },
  attachmentsList: {
    gap: Spacing.sm,
  },
  attachmentItem: {
    width: 80,
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
  },
  thumbnail: {
    width: 80,
    height: 60,
  },
  docIcon: {
    width: 80,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  attachmentName: {
    padding: Spacing.xs,
    textAlign: "center",
  },
  invoiceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  actions: {
    marginTop: Spacing.lg,
  },
  primaryButton: {
    marginBottom: Spacing.md,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  halfButton: {
    flex: 1,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
  },
});
