import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Platform,
  Pressable,
  TextInput,
  Image,
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
import { Spacing, BorderRadius, AppColors, Shadows } from "@/constants/theme";
import { InvoiceLineItem, QuoteStatus, PaymentTerms, PAYMENT_TERMS_LABELS } from "@/types";

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
  const { settings, formatCurrency } = useSettings();

  const quoteId = route.params?.quoteId;
  const preselectedClientId = route.params?.clientId;
  const preselectedJobId = route.params?.jobId;
  const isEditing = !!quoteId;
  const existingQuote = quoteId ? getQuoteById(quoteId) : undefined;

  const [clientId, setClientId] = useState(preselectedClientId || existingQuote?.clientId || "");
  const [jobId, setJobId] = useState(preselectedJobId || existingQuote?.jobId || "");
  const [status, setStatus] = useState<QuoteStatus>(existingQuote?.status || "draft");
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(
    existingQuote?.lineItems || [{ id: generateLineItemId(), description: "", quantity: 1, unitPrice: 0, amount: 0 }]
  );
  const [taxRate, setTaxRate] = useState(existingQuote?.taxRate?.toString() || "0");
  const [discountPercent, setDiscountPercent] = useState(existingQuote?.discountPercent?.toString() || "0");
  const [notes, setNotes] = useState(existingQuote?.notes || "");
  const [validUntil, setValidUntil] = useState(
    existingQuote?.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms | undefined>(
    existingQuote?.paymentTerms || settings.defaultPaymentTerms
  );

  // Pickers
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showJobPicker, setShowJobPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showPaymentTermsPicker, setShowPaymentTermsPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Calculations
  const subtotal = useMemo(() => lineItems.reduce((sum, item) => sum + item.amount, 0), [lineItems]);
  const discountAmount = useMemo(() => subtotal * (parseFloat(discountPercent) || 0) / 100, [subtotal, discountPercent]);
  const taxableAmount = useMemo(() => subtotal - discountAmount, [subtotal, discountAmount]);
  const taxAmount = useMemo(() => taxableAmount * (parseFloat(taxRate) || 0) / 100, [taxableAmount, taxRate]);
  const total = useMemo(() => taxableAmount + taxAmount, [taxableAmount, taxAmount]);

  // Filter jobs for selected client
  const clientJobs = useMemo(() => {
    if (!clientId) return [];
    return jobs.filter((job) => job.clientId === clientId);
  }, [clientId, jobs]);

  const selectedClient = clientId ? getClientById(clientId) : undefined;
  const selectedJob = jobId ? getJobById(jobId) : undefined;

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

  // When client changes, clear job selection
  useEffect(() => {
    if (clientId && jobId) {
      const jobStillValid = jobs.find((j) => j.id === jobId && j.clientId === clientId);
      if (!jobStillValid) setJobId("");
    }
  }, [clientId]);

  const handleSave = async () => {
    if (!clientId) {
      if (Platform.OS === "web") window.alert("Please select a client");
      else Alert.alert("Error", "Please select a client");
      return;
    }
    if (lineItems.every((item) => !item.description.trim())) {
      if (Platform.OS === "web") window.alert("Please add at least one line item");
      else Alert.alert("Error", "Please add at least one line item");
      return;
    }

    setIsSaving(true);
    try {
      const quoteData = {
        clientId,
        jobId: jobId || undefined,
        status,
        lineItems: lineItems.filter((item) => item.description.trim()),
        subtotal,
        discountPercent: parseFloat(discountPercent) || 0,
        discountAmount,
        taxRate: parseFloat(taxRate) || 0,
        taxAmount,
        total,
        notes: notes.trim() || undefined,
        paymentTerms,
        issueDate: existingQuote?.issueDate || new Date().toISOString(),
        validUntil,
      };

      if (isEditing && existingQuote) {
        await updateQuote({ ...existingQuote, ...quoteData });
      } else {
        await addQuote(quoteData);
      }

      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      console.error("Save quote failed:", error);
      if (Platform.OS === "web") window.alert("Failed to save quote");
      else Alert.alert("Error", "Failed to save quote");
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
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
          <ThemedText type="body" style={{ color: theme.link }}>Cancel</ThemedText>
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
  }, [navigation, isEditing, theme, isSaving, clientId, jobId, status, lineItems, taxRate, discountPercent, notes, validUntil, paymentTerms]);

  const STATUS_COLORS: Record<QuoteStatus, { bg: string; text: string; border: string }> = {
    draft: { bg: AppColors.info + "15", text: AppColors.info, border: AppColors.info },
    sent: { bg: AppColors.warning + "15", text: AppColors.warning, border: AppColors.warning },
    accepted: { bg: AppColors.success + "15", text: AppColors.success, border: AppColors.success },
    rejected: { bg: AppColors.error + "15", text: AppColors.error, border: AppColors.error },
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: Spacing.xl,
        paddingBottom: insets.bottom + Spacing["3xl"],
        paddingHorizontal: Spacing.lg,
      }}
    >
      {/* ✨ HEADER: Logo + Business Info */}
      <View style={[styles.headerCard, { backgroundColor: theme.backgroundDefault }, Shadows.small]}>
        <View style={styles.headerTop}>
          {/* Logo */}
          {settings.companyLogo ? (
            <Image
              source={{ uri: settings.companyLogo }}
              style={{ width: settings.logoSize || 80, height: settings.logoSize || 80, borderRadius: 8 }}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.logoPlaceholder, { backgroundColor: AppColors.primary + "15" }]}>
              <Feather name="image" size={28} color={AppColors.primary} />
            </View>
          )}

          {/* Quote Badge + Number */}
          <View style={styles.headerBadgeGroup}>
            <View style={[styles.quoteBadge, { backgroundColor: AppColors.primary + "20" }]}>
              <ThemedText type="small" style={{ color: AppColors.primary, fontWeight: "700", letterSpacing: 1 }}>
                QUOTE
              </ThemedText>
            </View>
            {existingQuote?.quoteNumber ? (
              <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 4 }}>
                #{existingQuote.quoteNumber}
              </ThemedText>
            ) : (
              <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 4 }}>
                #New
              </ThemedText>
            )}
          </View>
        </View>

        {/* Business details */}
        {(settings.companyName || settings.businessAddress || settings.businessPhone || settings.businessEmail) ? (
          <View style={[styles.businessDetails, { borderTopColor: theme.border }]}>
            {settings.companyName ? (
              <ThemedText type="body" style={{ fontWeight: "600" }}>{settings.companyName}</ThemedText>
            ) : null}
            {settings.businessAddress ? (
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {settings.businessAddress}{settings.businessCity ? `, ${settings.businessCity}` : ""}{settings.businessPostcode ? ` ${settings.businessPostcode}` : ""}
              </ThemedText>
            ) : null}
            <View style={styles.businessContactRow}>
              {settings.businessPhone ? (
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  📞 {settings.businessPhone}
                </ThemedText>
              ) : null}
              {settings.businessEmail ? (
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  ✉️ {settings.businessEmail}
                </ThemedText>
              ) : null}
            </View>
            {settings.vatNumber ? (
              <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: 2 }}>
                VAT: {settings.vatNumber}
              </ThemedText>
            ) : null}
          </View>
        ) : (
          <ThemedText type="caption" style={{ color: AppColors.warning, marginTop: Spacing.sm }}>
            ⚠️ Add business details in Profile settings
          </ThemedText>
        )}
      </View>

      {/* ✨ STATUS + ISSUE DATE ROW */}
      <View style={styles.statusDateRow}>
        <Pressable
          onPress={() => setShowStatusPicker(!showStatusPicker)}
          style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[status].bg, borderColor: STATUS_COLORS[status].border }]}
        >
          <ThemedText type="small" style={{ color: STATUS_COLORS[status].text, fontWeight: "600", textTransform: "uppercase" }}>
            {status}
          </ThemedText>
          <Feather name="chevron-down" size={14} color={STATUS_COLORS[status].text} style={{ marginLeft: 4 }} />
        </Pressable>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          Issued: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </ThemedText>
      </View>

      {/* Status Picker Dropdown */}
      {showStatusPicker ? (
        <View style={[styles.pickerList, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }, Shadows.medium]}>
          {(["draft", "sent", "accepted", "rejected"] as QuoteStatus[]).map((s) => (
            <Pressable
              key={s}
              onPress={() => { setStatus(s); setShowStatusPicker(false); }}
              style={[styles.pickerItem, { borderBottomColor: theme.border }]}
            >
              <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[s].text }]} />
              <ThemedText type="body" style={{ color: theme.text, textTransform: "capitalize", marginLeft: Spacing.sm }}>
                {s}
              </ThemedText>
              {status === s ? <Feather name="check" size={18} color={AppColors.primary} /> : null}
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* ✨ CLIENT SECTION */}
      <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        BILL TO
      </ThemedText>
      <Pressable
        onPress={() => { setShowClientPicker(!showClientPicker); setShowJobPicker(false); }}
        style={[styles.pickerButton, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }, Shadows.small]}
      >
        <View style={{ flex: 1 }}>
          <ThemedText type="body" style={{ color: selectedClient ? theme.text : theme.textSecondary, fontWeight: selectedClient ? "500" : "400" }}>
            {selectedClient?.name || "Select a client"}
          </ThemedText>
          {selectedClient?.company ? (
            <ThemedText type="small" style={{ color: theme.textSecondary }}>{selectedClient.company}</ThemedText>
          ) : null}
        </View>
        <Feather name={showClientPicker ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
      </Pressable>

      {showClientPicker ? (
        <View style={[styles.pickerList, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }, Shadows.medium]}>
          {clients.map((client) => (
            <Pressable
              key={client.id}
              onPress={() => { setClientId(client.id); setShowClientPicker(false); }}
              style={[styles.pickerItem, { borderBottomColor: theme.border }]}
            >
              <ThemedText type="body" style={{ color: client.id === clientId ? AppColors.primary : theme.text, flex: 1 }}>
                {client.name}
              </ThemedText>
              {client.company ? (
                <ThemedText type="small" style={{ color: theme.textSecondary, marginRight: Spacing.sm }}>{client.company}</ThemedText>
              ) : null}
              {client.id === clientId ? <Feather name="check" size={18} color={AppColors.primary} /> : null}
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* ✨ Client detail card - shows once selected */}
      {selectedClient ? (
        <View style={[styles.clientDetailCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          {selectedClient.address ? (
            <View style={styles.clientDetailRow}>
              <Feather name="map-pin" size={14} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.sm }}>
                {selectedClient.address}{selectedClient.zipCode ? ` ${selectedClient.zipCode}` : ""}
              </ThemedText>
            </View>
          ) : null}
          {selectedClient.phone ? (
            <View style={styles.clientDetailRow}>
              <Feather name="phone" size={14} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.sm }}>{selectedClient.phone}</ThemedText>
            </View>
          ) : null}
          {selectedClient.email ? (
            <View style={styles.clientDetailRow}>
              <Feather name="mail" size={14} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.sm }}>{selectedClient.email}</ThemedText>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* ✨ JOB SELECTOR */}
      {clientJobs.length > 0 ? (
        <>
          <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            LINKED JOB (OPTIONAL)
          </ThemedText>
          <Pressable
            onPress={() => { setShowJobPicker(!showJobPicker); setShowClientPicker(false); }}
            style={[styles.pickerButton, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }, Shadows.small]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <Feather name="briefcase" size={18} color={selectedJob ? AppColors.primary : theme.textSecondary} style={{ marginRight: Spacing.sm }} />
              <ThemedText type="body" style={{ color: selectedJob ? theme.text : theme.textSecondary }}>
                {selectedJob?.title || "Link a job (optional)"}
              </ThemedText>
            </View>
            <Feather name={showJobPicker ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
          </Pressable>

          {showJobPicker ? (
            <View style={[styles.pickerList, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }, Shadows.medium]}>
              <Pressable
                onPress={() => { setJobId(""); setShowJobPicker(false); }}
                style={[styles.pickerItem, { borderBottomColor: theme.border }]}
              >
                <ThemedText type="body" style={{ color: theme.textSecondary }}>None</ThemedText>
              </Pressable>
              {clientJobs.map((job) => (
                <Pressable
                  key={job.id}
                  onPress={() => { setJobId(job.id); setShowJobPicker(false); }}
                  style={[styles.pickerItem, { borderBottomColor: theme.border }]}
                >
                  <ThemedText type="body" style={{ color: job.id === jobId ? AppColors.primary : theme.text, flex: 1 }}>
                    {job.title}
                  </ThemedText>
                  {job.id === jobId ? <Feather name="check" size={18} color={AppColors.primary} /> : null}
                </Pressable>
              ))}
            </View>
          ) : null}
        </>
      ) : null}

      {/* ✨ LINE ITEMS */}
      <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        LINE ITEMS
      </ThemedText>
      {lineItems.map((item, index) => (
        <View key={item.id} style={[styles.lineItem, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }, Shadows.small]}>
          <View style={styles.lineItemHeader}>
            <ThemedText type="small" style={{ color: AppColors.primary, fontWeight: "600" }}>
              Item {index + 1}
            </ThemedText>
            {lineItems.length > 1 ? (
              <Pressable onPress={() => removeLineItem(item.id)} hitSlop={8}>
                <Feather name="trash-2" size={16} color={AppColors.error} />
              </Pressable>
            ) : null}
          </View>
          <TextInput
            placeholder="Description of work..."
            placeholderTextColor={theme.textSecondary}
            value={item.description}
            onChangeText={(text) => updateLineItem(item.id, "description", text)}
            style={[styles.lineInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundRoot }]}
          />
          <View style={styles.lineItemRow}>
            <View style={styles.lineItemField}>
              <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: 4 }}>Qty</ThemedText>
              <TextInput
                placeholder="1"
                placeholderTextColor={theme.textSecondary}
                value={item.quantity.toString()}
                onChangeText={(text) => updateLineItem(item.id, "quantity", parseFloat(text) || 0)}
                keyboardType="numeric"
                style={[styles.lineInputSmall, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundRoot }]}
              />
            </View>
            <View style={styles.lineItemField}>
              <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: 4 }}>Unit Price</ThemedText>
              <TextInput
                placeholder="0.00"
                placeholderTextColor={theme.textSecondary}
                value={item.unitPrice > 0 ? item.unitPrice.toString() : ""}
                onChangeText={(text) => updateLineItem(item.id, "unitPrice", parseFloat(text) || 0)}
                keyboardType="decimal-pad"
                style={[styles.lineInputSmall, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundRoot }]}
              />
            </View>
            <View style={[styles.lineItemField, { alignItems: "flex-end" }]}>
              <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: 4 }}>Amount</ThemedText>
              <ThemedText type="body" style={{ fontWeight: "700", color: AppColors.primary }}>
                {formatCurrency(item.amount)}
              </ThemedText>
            </View>
          </View>
        </View>
      ))}

      {/* Add Line Item Button */}
      <Pressable onPress={addLineItem} style={[styles.addButton, { borderColor: AppColors.primary }]}>
        <Feather name="plus" size={18} color={AppColors.primary} />
        <ThemedText type="body" style={{ color: AppColors.primary, marginLeft: Spacing.sm, fontWeight: "500" }}>
          Add Line Item
        </ThemedText>
      </Pressable>

      {/* ✨ TOTALS CARD */}
      <View style={[styles.totalsCard, { backgroundColor: theme.backgroundDefault }, Shadows.small]}>
        <View style={styles.totalRow}>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>Subtotal</ThemedText>
          <ThemedText type="body">{formatCurrency(subtotal)}</ThemedText>
        </View>

        {/* Discount */}
        <View style={styles.totalRow}>
          <View style={styles.taxRow}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>Discount</ThemedText>
            <TextInput
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              value={discountPercent}
              onChangeText={setDiscountPercent}
              keyboardType="decimal-pad"
              style={[styles.taxInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundRoot }]}
            />
            <ThemedText type="body" style={{ color: theme.textSecondary }}>%</ThemedText>
          </View>
          <ThemedText type="body" style={{ color: discountAmount > 0 ? AppColors.success : theme.textSecondary }}>
            {discountAmount > 0 ? `-${formatCurrency(discountAmount)}` : formatCurrency(0)}
          </ThemedText>
        </View>

        {/* Tax */}
        <View style={styles.totalRow}>
          <View style={styles.taxRow}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>Tax</ThemedText>
            <TextInput
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              value={taxRate}
              onChangeText={setTaxRate}
              keyboardType="decimal-pad"
              style={[styles.taxInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundRoot }]}
            />
            <ThemedText type="body" style={{ color: theme.textSecondary }}>%</ThemedText>
          </View>
          <ThemedText type="body">{formatCurrency(taxAmount)}</ThemedText>
        </View>

        {/* Grand Total */}
        <View style={[styles.totalRow, styles.grandTotal, { borderTopColor: theme.border }]}>
          <ThemedText type="h4">Total</ThemedText>
          <ThemedText type="h4" style={{ color: AppColors.primary }}>{formatCurrency(total)}</ThemedText>
        </View>
      </View>

      {/* ✨ PAYMENT TERMS */}
      <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        PAYMENT TERMS
      </ThemedText>
      <Pressable
        onPress={() => setShowPaymentTermsPicker(!showPaymentTermsPicker)}
        style={[styles.pickerButton, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }, Shadows.small]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <Feather name="clock" size={18} color={paymentTerms ? AppColors.primary : theme.textSecondary} style={{ marginRight: Spacing.sm }} />
          <ThemedText type="body" style={{ color: paymentTerms ? theme.text : theme.textSecondary }}>
            {paymentTerms ? PAYMENT_TERMS_LABELS[paymentTerms] : "Select payment terms"}
          </ThemedText>
        </View>
        <Feather name={showPaymentTermsPicker ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
      </Pressable>

      {showPaymentTermsPicker ? (
        <View style={[styles.pickerList, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }, Shadows.medium]}>
          {(Object.keys(PAYMENT_TERMS_LABELS) as PaymentTerms[]).map((term) => (
            <Pressable
              key={term}
              onPress={() => { setPaymentTerms(term); setShowPaymentTermsPicker(false); }}
              style={[styles.pickerItem, { borderBottomColor: theme.border }]}
            >
              <ThemedText type="body" style={{ color: paymentTerms === term ? AppColors.primary : theme.text, flex: 1 }}>
                {PAYMENT_TERMS_LABELS[term]}
              </ThemedText>
              {paymentTerms === term ? <Feather name="check" size={18} color={AppColors.primary} /> : null}
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* ✨ VALID UNTIL */}
      <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        VALID UNTIL
      </ThemedText>
      <Input placeholder="YYYY-MM-DD" value={validUntil} onChangeText={setValidUntil} />

      {/* NOTES */}
      <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        NOTES & TERMS
      </ThemedText>
      <Input
        placeholder="Terms, conditions, additional notes..."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        style={{ minHeight: 80 }}
      />

      {/* Delete Button */}
      {isEditing ? (
        <Button title="Delete Quote" onPress={handleDelete} variant="destructive" style={{ marginTop: Spacing["3xl"] }} />
      ) : null}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  // Header
  headerCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  logoPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBadgeGroup: {
    alignItems: "flex-end",
  },
  quoteBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  businessDetails: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
  },
  businessContactRow: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginTop: 2,
  },

  // Status + Date
  statusDateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Section titles
  sectionTitle: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    fontWeight: "600",
    letterSpacing: 1,
    marginTop: Spacing.lg,
  },

  // Pickers
  pickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  pickerList: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  pickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },

  // Client detail card
  clientDetailCard: {
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  clientDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },

  // Line Items
  lineItem: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
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
  },

  // Add button
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    borderStyle: "dashed",
  },

  // Totals
  totalsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
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
    borderTopWidth: 1.5,
    marginBottom: 0,
  },
});