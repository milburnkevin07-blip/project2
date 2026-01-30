import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Platform,
  Pressable,
  TextInput,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/context/DataContext";
import { useSettings } from "@/context/SettingsContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { InvoiceLineItem, QuoteStatus } from "@/types";

type RouteParams = {
  quoteId?: string;
  clientId?: string;
  jobId?: string;
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

function generateLineItemId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export default function AddEditQuoteScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<{ params: RouteParams }, "params">>();
  const { theme } = useTheme();
  const { clients, jobs, addQuote, updateQuote, deleteQuote, getQuoteById, getClientById, getJobById } = useData();
  const { formatCurrency } = useSettings();

  const quoteId = route.params?.quoteId;
  const preselectedClientId = route.params?.clientId;
  const preselectedJobId = route.params?.jobId;
  const isEditing = !!quoteId;
  const existingQuote = quoteId ? getQuoteById(quoteId) : undefined;

  const [clientId, setClientId] = useState(preselectedClientId || existingQuote?.clientId || "");
  const [jobId, setJobId] = useState(preselectedJobId || existingQuote?.jobId || "");
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(
    existingQuote?.lineItems || [{ id: generateLineItemId(), description: "", quantity: 1, unitPrice: 0, amount: 0 }]
  );
  const [taxRate, setTaxRate] = useState(existingQuote?.taxRate?.toString() || "0");
  const [notes, setNotes] = useState(existingQuote?.notes || "");
  const [validUntil, setValidUntil] = useState(
    existingQuote?.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const subtotal = useMemo(() => lineItems.reduce((sum, item) => sum + item.amount, 0), [lineItems]);
  const taxAmount = useMemo(() => subtotal * (parseFloat(taxRate) || 0) / 100, [subtotal, taxRate]);
  const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);

  const updateLineItem = (id: string, field: keyof InvoiceLineItem, value: string | number) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          const qty = field === "quantity" ? Number(value) : item.quantity;
          const price = field === "unitPrice" ? Number(value) : item.unitPrice;
          updated.amount = qty * price;
        }
        return updated;
      })
    );
  };

  const addLineItem = () => {
    setLineItems((prev) => [...prev, { id: generateLineItemId(), description: "", quantity: 1, unitPrice: 0, amount: 0 }]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleSave = async () => {
    if (!clientId) {
      if (Platform.OS === "web") {
        window.alert("Please select a client");
      } else {
        Alert.alert("Error", "Please select a client");
      }
      return;
    }

    if (lineItems.every((item) => !item.description.trim())) {
      if (Platform.OS === "web") {
        window.alert("Please add at least one line item");
      } else {
        Alert.alert("Error", "Please add at least one line item");
      }
      return;
    }

    setIsSaving(true);
    try {
      const quoteData = {
        clientId,
        jobId: jobId || undefined,
        status: (existingQuote?.status || "draft") as QuoteStatus,
        lineItems: lineItems.filter((item) => item.description.trim()),
        subtotal,
        taxRate: parseFloat(taxRate) || 0,
        taxAmount,
        total,
        notes: notes.trim() || undefined,
        issueDate: existingQuote?.issueDate || new Date().toISOString(),
        validUntil,
      };

      if (isEditing && existingQuote) {
        await updateQuote({
          ...existingQuote,
          ...quoteData,
        });
      } else {
        await addQuote(quoteData);
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      navigation.goBack();
    } catch (error) {
      console.error("Save quote failed:", error);
      if (Platform.OS === "web") {
        window.alert("Failed to save quote");
      } else {
        Alert.alert("Error", "Failed to save quote");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!quoteId) return;
    showAlert(
      "Delete Quote",
      "Are you sure you want to delete this quote? This action cannot be undone.",
      async () => {
        try {
          await deleteQuote(quoteId);
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
      headerTitle: isEditing ? "Edit Quote" : "New Quote",
      headerLeft: () => (
        <HeaderButton onPress={() => navigation.goBack()}>
          <ThemedText type="body" style={{ color: theme.link }}>
            Cancel
          </ThemedText>
        </HeaderButton>
      ),
      headerRight: () => (
        <HeaderButton onPress={handleSave} disabled={isSaving}>
          <ThemedText type="body" style={{ color: theme.link, opacity: isSaving ? 0.5 : 1 }}>
            {isSaving ? "Saving..." : "Save"}
          </ThemedText>
        </HeaderButton>
      ),
    });
  }, [navigation, isEditing, theme, isSaving, clientId, lineItems, taxRate, notes, validUntil]);

  const selectedClient = clientId ? getClientById(clientId) : undefined;

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
    >
      <View style={[styles.quoteBadge, { backgroundColor: AppColors.primary + "20" }]}>
        <ThemedText type="small" style={{ color: AppColors.primary, fontWeight: "600" }}>
          QUOTE
        </ThemedText>
      </View>

      <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        CLIENT
      </ThemedText>
      <Pressable
        onPress={() => setShowClientPicker(!showClientPicker)}
        style={[styles.pickerButton, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
      >
        <ThemedText type="body" style={{ color: selectedClient ? theme.text : theme.textSecondary }}>
          {selectedClient?.name || "Select a client"}
        </ThemedText>
        <Feather name="chevron-down" size={20} color={theme.textSecondary} />
      </Pressable>

      {showClientPicker ? (
        <View style={[styles.pickerList, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          {clients.map((client) => (
            <Pressable
              key={client.id}
              onPress={() => {
                setClientId(client.id);
                setShowClientPicker(false);
              }}
              style={[styles.pickerItem, { borderBottomColor: theme.border }]}
            >
              <ThemedText type="body" style={{ color: client.id === clientId ? AppColors.primary : theme.text }}>
                {client.name}
              </ThemedText>
              {client.id === clientId ? <Feather name="check" size={20} color={AppColors.primary} /> : null}
            </Pressable>
          ))}
        </View>
      ) : null}

      <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: Spacing.xl }]}>
        LINE ITEMS
      </ThemedText>
      {lineItems.map((item, index) => (
        <View key={item.id} style={[styles.lineItem, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.lineItemHeader}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Item {index + 1}
            </ThemedText>
            {lineItems.length > 1 ? (
              <Pressable onPress={() => removeLineItem(item.id)} hitSlop={8}>
                <Feather name="x" size={18} color={AppColors.error} />
              </Pressable>
            ) : null}
          </View>
          <TextInput
            placeholder="Description"
            placeholderTextColor={theme.textSecondary}
            value={item.description}
            onChangeText={(text) => updateLineItem(item.id, "description", text)}
            style={[styles.lineInput, { color: theme.text, borderColor: theme.border }]}
          />
          <View style={styles.lineItemRow}>
            <View style={styles.lineItemField}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Qty
              </ThemedText>
              <TextInput
                placeholder="1"
                placeholderTextColor={theme.textSecondary}
                value={item.quantity.toString()}
                onChangeText={(text) => updateLineItem(item.id, "quantity", parseFloat(text) || 0)}
                keyboardType="numeric"
                style={[styles.lineInputSmall, { color: theme.text, borderColor: theme.border }]}
              />
            </View>
            <View style={styles.lineItemField}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Unit Price
              </ThemedText>
              <TextInput
                placeholder="0.00"
                placeholderTextColor={theme.textSecondary}
                value={item.unitPrice > 0 ? item.unitPrice.toString() : ""}
                onChangeText={(text) => updateLineItem(item.id, "unitPrice", parseFloat(text) || 0)}
                keyboardType="decimal-pad"
                style={[styles.lineInputSmall, { color: theme.text, borderColor: theme.border }]}
              />
            </View>
            <View style={styles.lineItemField}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Amount
              </ThemedText>
              <ThemedText type="body" style={{ fontWeight: "600", marginTop: Spacing.sm }}>
                {formatCurrency(item.amount)}
              </ThemedText>
            </View>
          </View>
        </View>
      ))}

      <Pressable onPress={addLineItem} style={styles.addButton}>
        <Feather name="plus" size={18} color={AppColors.primary} />
        <ThemedText type="body" style={{ color: AppColors.primary, marginLeft: Spacing.sm }}>
          Add Line Item
        </ThemedText>
      </Pressable>

      <View style={[styles.totalsCard, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.totalRow}>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            Subtotal
          </ThemedText>
          <ThemedText type="body">{formatCurrency(subtotal)}</ThemedText>
        </View>
        <View style={styles.totalRow}>
          <View style={styles.taxRow}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Tax
            </ThemedText>
            <TextInput
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              value={taxRate}
              onChangeText={setTaxRate}
              keyboardType="decimal-pad"
              style={[styles.taxInput, { color: theme.text, borderColor: theme.border }]}
            />
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              %
            </ThemedText>
          </View>
          <ThemedText type="body">{formatCurrency(taxAmount)}</ThemedText>
        </View>
        <View style={[styles.totalRow, styles.grandTotal]}>
          <ThemedText type="h4">Total</ThemedText>
          <ThemedText type="h4" style={{ color: AppColors.primary }}>
            {formatCurrency(total)}
          </ThemedText>
        </View>
      </View>

      <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: Spacing.xl }]}>
        VALID UNTIL
      </ThemedText>
      <Input
        placeholder="YYYY-MM-DD"
        value={validUntil}
        onChangeText={setValidUntil}
      />

      <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: Spacing.xl }]}>
        NOTES
      </ThemedText>
      <Input
        placeholder="Terms, conditions, additional notes..."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        style={{ minHeight: 80 }}
      />

      {isEditing ? (
        <Button
          title="Delete Quote"
          onPress={handleDelete}
          variant="destructive"
          style={{ marginTop: Spacing["3xl"] }}
        />
      ) : null}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  quoteBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    fontWeight: "600",
    letterSpacing: 1,
  },
  pickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  pickerList: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    overflow: "hidden",
  },
  pickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  lineItem: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  lineItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  lineInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
    padding: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.sm,
  },
  lineItemRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  lineItemField: {
    flex: 1,
  },
  lineInputSmall: {
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
    padding: Spacing.sm,
    fontSize: 16,
    marginTop: Spacing.xs,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  totalsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  taxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  taxInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
    padding: Spacing.sm,
    width: 50,
    textAlign: "center",
    fontSize: 16,
  },
  grandTotal: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginBottom: 0,
  },
});
