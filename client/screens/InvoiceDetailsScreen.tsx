import React, { useEffect } from "react";
import { View, StyleSheet, Alert, Platform, Pressable, Share, Image } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/context/DataContext";
import { useSettings } from "@/context/SettingsContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { InvoiceStatus } from "@/types";

type RouteParams = {
  invoiceId: string;
};

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

const showAlert = (
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText = "OK",
  isDestructive = false
) => {
  if (Platform.OS === "web") {
    const result = window.confirm(`${title}\n\n${message}`);
    if (result) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      { text: confirmText, style: isDestructive ? "destructive" : "default", onPress: onConfirm },
    ]);
  }
};

export default function InvoiceDetailsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<{ params: RouteParams }, "params">>();
  const { theme } = useTheme();
  const { getInvoiceById, getClientById, getJobById, updateInvoice, deleteInvoice } = useData();
  const { formatCurrency, settings } = useSettings();

  const invoice = getInvoiceById(route.params.invoiceId);
  const client = invoice ? getClientById(invoice.clientId) : undefined;
  const job = invoice?.jobId ? getJobById(invoice.jobId) : undefined;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleMarkAsSent = async () => {
    if (!invoice) return;
    try {
      await updateInvoice({ ...invoice, status: "sent" });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Update invoice failed:", error);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!invoice) return;
    try {
      await updateInvoice({ ...invoice, status: "paid", paidDate: new Date().toISOString() });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Update invoice failed:", error);
    }
  };

  const handleShare = async () => {
    if (!invoice || !client) return;
    const invoiceText = `
Invoice: ${invoice.invoiceNumber}
Client: ${client.name}
Date: ${formatDate(invoice.issueDate)}
Due: ${formatDate(invoice.dueDate)}

Items:
${invoice.lineItems.map((item) => `- ${item.description}: ${formatCurrency(item.amount)}`).join("\n")}

Subtotal: ${formatCurrency(invoice.subtotal)}
Tax (${invoice.taxRate}%): ${formatCurrency(invoice.taxAmount)}
Total: ${formatCurrency(invoice.total)}

${invoice.notes || ""}
    `.trim();

    try {
      await Share.share({
        message: invoiceText,
        title: `Invoice ${invoice.invoiceNumber}`,
      });
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleDelete = () => {
    if (!invoice) return;
    showAlert(
      "Delete Invoice",
      "Are you sure you want to delete this invoice? This action cannot be undone.",
      async () => {
        try {
          await deleteInvoice(invoice.id);
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          navigation.goBack();
        } catch (error) {
          console.error("Delete invoice failed:", error);
        }
      },
      "Delete",
      true
    );
  };

  useEffect(() => {
    navigation.setOptions({
      headerTitle: invoice?.invoiceNumber || "Invoice",
      headerRight: () => (
        <HeaderButton onPress={() => navigation.navigate("EditInvoice", { invoiceId: route.params.invoiceId })}>
          <ThemedText type="body" style={{ color: theme.link }}>
            Edit
          </ThemedText>
        </HeaderButton>
      ),
    });
  }, [navigation, invoice, theme]);

  if (!invoice) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <ThemedText type="body">Invoice not found</ThemedText>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[invoice.status];

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
    >
      {settings.companyLogo || settings.companyName ? (
        <View style={[styles.logoHeader, { backgroundColor: theme.backgroundDefault }]}>
          {settings.companyLogo ? (
            <Image
              source={{ uri: settings.companyLogo }}
              style={{
                width: settings.logoSize || 80,
                height: settings.logoSize || 80,
                borderRadius: 8,
              }}
              resizeMode="contain"
            />
          ) : null}
          {settings.companyName ? (
            <ThemedText type="h4" style={{ marginTop: settings.companyLogo ? Spacing.sm : 0, textAlign: "center" }}>
              {settings.companyName}
            </ThemedText>
          ) : null}
        </View>
      ) : null}

      <View style={[styles.statusCard, { backgroundColor: statusColor + "15" }]}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <ThemedText type="small" style={{ color: "#FFFFFF", fontWeight: "600" }}>
            {STATUS_LABELS[invoice.status]}
          </ThemedText>
        </View>
        <ThemedText type="h2" style={{ marginTop: Spacing.md }}>
          {formatCurrency(invoice.total)}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
          Due {formatDate(invoice.dueDate)}
        </ThemedText>
      </View>

      <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
          BILL TO
        </ThemedText>
        <ThemedText type="body" style={{ fontWeight: "600" }}>
          {client?.name || "Unknown Client"}
        </ThemedText>
        {client?.company ? (
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {client.company}
          </ThemedText>
        ) : null}
        {client?.email ? (
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {client.email}
          </ThemedText>
        ) : null}
        {client?.address || client?.zipCode ? (
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
            {[client?.address, client?.zipCode].filter(Boolean).join(", ")}
          </ThemedText>
        ) : null}
      </View>

      {job ? (
        <Pressable
          onPress={() => navigation.navigate("JobDetails", { jobId: job.id })}
          style={[styles.card, { backgroundColor: theme.backgroundDefault }]}
        >
          <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
            RELATED JOB
          </ThemedText>
          <View style={styles.jobRow}>
            <Feather name="briefcase" size={18} color={theme.textSecondary} />
            <ThemedText type="body" style={{ marginLeft: Spacing.sm, flex: 1 }}>
              {job.title}
            </ThemedText>
            <Feather name="chevron-right" size={18} color={theme.textSecondary} />
          </View>
        </Pressable>
      ) : null}

      <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.lg }}>
          LINE ITEMS
        </ThemedText>
        {invoice.lineItems.map((item, index) => (
          <View key={item.id} style={[styles.lineItem, index < invoice.lineItems.length - 1 && styles.lineItemBorder]}>
            <View style={styles.lineItemLeft}>
              <ThemedText type="body">{item.description}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {item.quantity} x {formatCurrency(item.unitPrice)}
              </ThemedText>
            </View>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              {formatCurrency(item.amount)}
            </ThemedText>
          </View>
        ))}

        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Subtotal
            </ThemedText>
            <ThemedText type="body">{formatCurrency(invoice.subtotal)}</ThemedText>
          </View>
          <View style={styles.totalRow}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Tax ({invoice.taxRate}%)
            </ThemedText>
            <ThemedText type="body">{formatCurrency(invoice.taxAmount)}</ThemedText>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <ThemedText type="h4">Total</ThemedText>
            <ThemedText type="h4" style={{ color: AppColors.primary }}>
              {formatCurrency(invoice.total)}
            </ThemedText>
          </View>
        </View>
      </View>

      {invoice.notes ? (
        <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
            NOTES
          </ThemedText>
          <ThemedText type="body">{invoice.notes}</ThemedText>
        </View>
      ) : null}

      <View style={styles.actions}>
        {invoice.status === "draft" ? (
          <Button title="Mark as Sent" onPress={handleMarkAsSent} style={{ marginBottom: Spacing.md }} />
        ) : null}
        {invoice.status === "sent" || invoice.status === "overdue" ? (
          <Button title="Mark as Paid" onPress={handleMarkAsPaid} style={{ marginBottom: Spacing.md }} />
        ) : null}
        <Button title="Share Invoice" onPress={handleShare} variant="secondary" style={{ marginBottom: Spacing.md }} />
        <Button title="Delete Invoice" onPress={handleDelete} variant="destructive" />
      </View>

      <View style={styles.metadata}>
        <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center" }}>
          Issued: {formatDate(invoice.issueDate)}
        </ThemedText>
        {invoice.paidDate ? (
          <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center" }}>
            Paid: {formatDate(invoice.paidDate)}
          </ThemedText>
        ) : null}
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoHeader: {
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  statusCard: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  jobRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  lineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: Spacing.md,
  },
  lineItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  lineItemLeft: {
    flex: 1,
    marginRight: Spacing.lg,
  },
  totalsSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  grandTotal: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginBottom: 0,
  },
  actions: {
    marginTop: Spacing.lg,
  },
  metadata: {
    marginTop: Spacing.xl,
  },
});
