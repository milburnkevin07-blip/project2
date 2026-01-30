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
import { QuoteStatus } from "@/types";

type RouteParams = {
  quoteId: string;
};

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

export default function QuoteDetailsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<{ params: RouteParams }, "params">>();
  const { theme } = useTheme();
  const { getQuoteById, getClientById, getJobById, updateQuote, deleteQuote, addInvoice } = useData();
  const { formatCurrency, settings } = useSettings();

  const quote = getQuoteById(route.params.quoteId);
  const client = quote ? getClientById(quote.clientId) : undefined;
  const job = quote?.jobId ? getJobById(quote.jobId) : undefined;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleSendQuote = async () => {
    if (!quote || !client) return;
    
    const quoteText = `
Quote: ${quote.quoteNumber}
Client: ${client.name}
Date: ${formatDate(quote.issueDate)}
Valid Until: ${formatDate(quote.validUntil)}

Items:
${quote.lineItems.map((item) => `- ${item.description}: ${formatCurrency(item.amount)}`).join("\n")}

Subtotal: ${formatCurrency(quote.subtotal)}
Tax (${quote.taxRate}%): ${formatCurrency(quote.taxAmount)}
Total: ${formatCurrency(quote.total)}

${quote.notes || ""}
    `.trim();

    try {
      await Share.share({
        message: quoteText,
        title: `Quote ${quote.quoteNumber}`,
      });
      
      if (quote.status === "draft") {
        await updateQuote({ 
          ...quote, 
          status: "sent", 
          sentDate: new Date().toISOString() 
        });
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleMarkAsAccepted = async () => {
    if (!quote) return;
    try {
      await updateQuote({ 
        ...quote, 
        status: "accepted", 
        respondedDate: new Date().toISOString() 
      });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Update quote failed:", error);
    }
  };

  const handleMarkAsRejected = async () => {
    if (!quote) return;
    try {
      await updateQuote({ 
        ...quote, 
        status: "rejected", 
        respondedDate: new Date().toISOString() 
      });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Update quote failed:", error);
    }
  };

  const handleConvertToInvoice = async () => {
    if (!quote) return;
    showAlert(
      "Convert to Invoice",
      "This will create a new invoice based on this quote. Continue?",
      async () => {
        try {
          const invoiceData = {
            clientId: quote.clientId,
            jobId: quote.jobId,
            status: "draft" as const,
            lineItems: quote.lineItems,
            subtotal: quote.subtotal,
            taxRate: quote.taxRate,
            taxAmount: quote.taxAmount,
            total: quote.total,
            notes: quote.notes,
            issueDate: new Date().toISOString(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          };
          
          const newInvoice = await addInvoice(invoiceData);
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          navigation.replace("InvoiceDetails", { invoiceId: newInvoice.id });
        } catch (error) {
          console.error("Convert to invoice failed:", error);
          if (Platform.OS === "web") {
            window.alert("Failed to convert quote to invoice");
          } else {
            Alert.alert("Error", "Failed to convert quote to invoice");
          }
        }
      },
      "Convert"
    );
  };

  const handleDelete = () => {
    if (!quote) return;
    showAlert(
      "Delete Quote",
      "Are you sure you want to delete this quote? This action cannot be undone.",
      async () => {
        try {
          await deleteQuote(quote.id);
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          navigation.goBack();
        } catch (error) {
          console.error("Delete quote failed:", error);
        }
      },
      "Delete",
      true
    );
  };

  useEffect(() => {
    navigation.setOptions({
      headerTitle: quote?.quoteNumber || "Quote",
      headerRight: () => (
        <HeaderButton onPress={() => navigation.navigate("EditQuote", { quoteId: route.params.quoteId })}>
          <ThemedText type="body" style={{ color: theme.link }}>
            Edit
          </ThemedText>
        </HeaderButton>
      ),
    });
  }, [navigation, quote, theme]);

  if (!quote) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <ThemedText type="body">Quote not found</ThemedText>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[quote.status];

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
        <View style={styles.badgeRow}>
          <View style={[styles.quoteBadge, { backgroundColor: AppColors.primary + "30" }]}>
            <ThemedText type="small" style={{ color: AppColors.primary, fontWeight: "600" }}>
              QUOTE
            </ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <ThemedText type="small" style={{ color: "#FFFFFF", fontWeight: "600" }}>
              {STATUS_LABELS[quote.status]}
            </ThemedText>
          </View>
        </View>
        <ThemedText type="h2" style={{ marginTop: Spacing.md }}>
          {formatCurrency(quote.total)}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
          Valid until {formatDate(quote.validUntil)}
        </ThemedText>
      </View>

      <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
          CLIENT
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
        {quote.lineItems.map((item, index) => (
          <View key={item.id} style={[styles.lineItem, index < quote.lineItems.length - 1 && styles.lineItemBorder]}>
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
            <ThemedText type="body">{formatCurrency(quote.subtotal)}</ThemedText>
          </View>
          <View style={styles.totalRow}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Tax ({quote.taxRate}%)
            </ThemedText>
            <ThemedText type="body">{formatCurrency(quote.taxAmount)}</ThemedText>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <ThemedText type="h4">Total</ThemedText>
            <ThemedText type="h4" style={{ color: AppColors.primary }}>
              {formatCurrency(quote.total)}
            </ThemedText>
          </View>
        </View>
      </View>

      {quote.notes ? (
        <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
            NOTES
          </ThemedText>
          <ThemedText type="body">{quote.notes}</ThemedText>
        </View>
      ) : null}

      <View style={styles.actions}>
        {quote.status === "draft" ? (
          <Button title="Send Quote" onPress={handleSendQuote} style={{ marginBottom: Spacing.md }} />
        ) : null}
        {quote.status === "sent" ? (
          <>
            <Button title="Mark as Accepted" onPress={handleMarkAsAccepted} style={{ marginBottom: Spacing.md }} />
            <Button title="Mark as Rejected" onPress={handleMarkAsRejected} variant="secondary" style={{ marginBottom: Spacing.md }} />
          </>
        ) : null}
        {quote.status === "accepted" ? (
          <Button title="Convert to Invoice" onPress={handleConvertToInvoice} style={{ marginBottom: Spacing.md }} />
        ) : null}
        {quote.status !== "draft" ? (
          <Button title="Share Quote" onPress={handleSendQuote} variant="secondary" style={{ marginBottom: Spacing.md }} />
        ) : null}
        <Button title="Delete Quote" onPress={handleDelete} variant="destructive" />
      </View>

      <View style={styles.metadata}>
        <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center" }}>
          Created: {formatDate(quote.issueDate)}
        </ThemedText>
        {quote.sentDate ? (
          <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center" }}>
            Sent: {formatDate(quote.sentDate)}
          </ThemedText>
        ) : null}
        {quote.respondedDate ? (
          <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center" }}>
            {quote.status === "accepted" ? "Accepted" : "Rejected"}: {formatDate(quote.respondedDate)}
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
  badgeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  quoteBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
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
