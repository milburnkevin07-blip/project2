import React, { useState, useLayoutEffect } from "react";
import { View, StyleSheet, Alert, Pressable, Platform } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Input } from "@/components/Input";
import { ThemedText } from "@/components/ThemedText";
import { AttachmentPicker } from "@/components/AttachmentPicker";
import { useData } from "@/context/DataContext";
import { useTheme } from "@/hooks/useTheme";
import { useSettings } from "@/context/SettingsContext";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { JobStatus, Attachment, Expense } from "@/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "AddJob" | "EditJob">;
type AddRouteProp = RouteProp<RootStackParamList, "AddJob">;
type EditRouteProp = RouteProp<RootStackParamList, "EditJob">;

const statusOptions: { label: string; value: JobStatus }[] = [
  { label: "Not Started", value: "not_started" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
];

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

function generateExpenseId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export default function AddEditJobScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AddRouteProp | EditRouteProp>();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { clients, addJob, updateJob, deleteJob, getJobById } = useData();
  const { formatCurrency } = useSettings();

  const isEdit = route.name === "EditJob";
  const jobId = isEdit ? (route.params as { jobId: string }).jobId : undefined;
  const preselectedClientId = !isEdit
    ? (route.params as { clientId?: string })?.clientId
    : undefined;
  const existingJob = jobId ? getJobById(jobId) : undefined;

  const [clientId, setClientId] = useState(existingJob?.clientId || preselectedClientId || "");
  const [title, setTitle] = useState(existingJob?.title || "");
  const [description, setDescription] = useState(existingJob?.description || "");
  const [status, setStatus] = useState<JobStatus>(existingJob?.status || "not_started");
  const [startDate, setStartDate] = useState<Date | undefined>(
    existingJob?.startDate ? new Date(existingJob.startDate) : undefined
  );
  const [dueDate, setDueDate] = useState<Date | undefined>(
    existingJob?.dueDate ? new Date(existingJob.dueDate) : undefined
  );
  const [laborHours, setLaborHours] = useState(existingJob?.laborHours?.toString() || "");
  const [laborRate, setLaborRate] = useState(existingJob?.laborRate?.toString() || "");
  const [materialsCost, setMaterialsCost] = useState(existingJob?.materialsCost?.toString() || "");
  const [expenses, setExpenses] = useState<Expense[]>(existingJob?.expenses || []);
  const [attachments, setAttachments] = useState<Attachment[]>(existingJob?.attachments || []);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showDuePicker, setShowDuePicker] = useState(false);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showCostSection, setShowCostSection] = useState(
    !!(existingJob?.laborHours || existingJob?.materialsCost || (existingJob?.expenses && existingJob.expenses.length > 0))
  );
  const [isSaving, setIsSaving] = useState(false);

  const [newExpenseDesc, setNewExpenseDesc] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");

  const isValid = title.trim().length > 0 && clientId.length > 0;
  const selectedClient = clients.find((c) => c.id === clientId);

  const totalLaborCost = (parseFloat(laborHours) || 0) * (parseFloat(laborRate) || 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalCost = totalLaborCost + (parseFloat(materialsCost) || 0) + totalExpenses;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: isEdit ? "Edit Job" : "New Job",
      headerLeft: () => (
        <HeaderButton onPress={() => navigation.goBack()}>
          <ThemedText type="body" style={{ color: theme.link }}>
            Cancel
          </ThemedText>
        </HeaderButton>
      ),
      headerRight: () => (
        <HeaderButton onPress={handleSave} disabled={!isValid || isSaving}>
          <ThemedText
            type="body"
            style={{
              color: isValid && !isSaving ? theme.link : theme.textSecondary,
              fontWeight: "600",
            }}
          >
            Save
          </ThemedText>
        </HeaderButton>
      ),
    });
  }, [navigation, isValid, isSaving, title, clientId, status, description, startDate, dueDate, attachments, laborHours, laborRate, materialsCost, expenses]);

  const handleSave = async () => {
    if (!isValid || isSaving) return;

    setIsSaving(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const jobData = {
        clientId,
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        startDate: startDate?.toISOString(),
        dueDate: dueDate?.toISOString(),
        laborHours: laborHours ? parseFloat(laborHours) : undefined,
        laborRate: laborRate ? parseFloat(laborRate) : undefined,
        materialsCost: materialsCost ? parseFloat(materialsCost) : undefined,
        expenses: expenses.length > 0 ? expenses : undefined,
        attachments,
      };

      if (isEdit && existingJob) {
        await updateJob({
          ...existingJob,
          ...jobData,
        });
      } else {
        await addJob(jobData);
      }
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      navigation.goBack();
    } catch (error) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      if (Platform.OS === "web") {
        window.alert("Failed to save job. Please try again.");
      } else {
        Alert.alert("Error", "Failed to save job. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!jobId) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    
    showAlert(
      "Delete Job",
      "Are you sure you want to delete this job?",
      async () => {
        await deleteJob(jobId);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        navigation.popToTop();
      },
      "Delete",
      true
    );
  };

  const handleAddExpense = () => {
    if (!newExpenseDesc.trim() || !newExpenseAmount.trim()) return;

    const expense: Expense = {
      id: generateExpenseId(),
      description: newExpenseDesc.trim(),
      amount: parseFloat(newExpenseAmount) || 0,
      date: new Date().toISOString(),
    };

    setExpenses([...expenses, expense]);
    setNewExpenseDesc("");
    setNewExpenseAmount("");
    
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
  };

  const handleRemoveExpense = (expenseId: string) => {
    setExpenses(expenses.filter((e) => e.id !== expenseId));
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return "Select date";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const PickerRow = ({
    label,
    value,
    onPress,
  }: {
    label: string;
    value: string;
    onPress: () => void;
  }) => (
    <View style={styles.fieldContainer}>
      <ThemedText type="small" style={styles.label}>
        {label}
      </ThemedText>
      <Pressable
        onPress={onPress}
        style={[styles.pickerButton, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
      >
        <ThemedText style={{ color: value.includes("Select") ? theme.textSecondary : theme.text }}>
          {value}
        </ThemedText>
        <Feather name="chevron-down" size={18} color={theme.textSecondary} />
      </Pressable>
    </View>
  );

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
    >
      <PickerRow
        label="Client *"
        value={selectedClient?.name || "Select client"}
        onPress={() => setShowClientPicker(true)}
      />

      {showClientPicker ? (
        <View style={[styles.optionsList, { backgroundColor: theme.backgroundDefault }]}>
          {clients.length > 0 ? (
            clients.map((client) => (
              <Pressable
                key={client.id}
                onPress={() => {
                  setClientId(client.id);
                  setShowClientPicker(false);
                  if (Platform.OS !== "web") {
                    Haptics.selectionAsync();
                  }
                }}
                style={[
                  styles.optionItem,
                  client.id === clientId && { backgroundColor: AppColors.primary + "15" },
                ]}
              >
                <ThemedText>{client.name}</ThemedText>
                {client.id === clientId ? (
                  <Feather name="check" size={18} color={AppColors.primary} />
                ) : null}
              </Pressable>
            ))
          ) : (
            <View style={styles.optionItem}>
              <ThemedText style={{ color: theme.textSecondary }}>
                No clients available. Add a client first.
              </ThemedText>
            </View>
          )}
        </View>
      ) : null}

      <Input
        label="Job Title *"
        placeholder="Enter job title"
        value={title}
        onChangeText={setTitle}
        autoCapitalize="sentences"
      />

      <Input
        label="Description"
        placeholder="Job description (optional)"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        style={{ height: 80, textAlignVertical: "top", paddingTop: Spacing.md }}
      />

      <PickerRow
        label="Status"
        value={statusOptions.find((s) => s.value === status)?.label || "Not Started"}
        onPress={() => setShowStatusPicker(!showStatusPicker)}
      />

      {showStatusPicker ? (
        <View style={[styles.optionsList, { backgroundColor: theme.backgroundDefault }]}>
          {statusOptions.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => {
                setStatus(option.value);
                setShowStatusPicker(false);
                if (Platform.OS !== "web") {
                  Haptics.selectionAsync();
                }
              }}
              style={[
                styles.optionItem,
                option.value === status && { backgroundColor: AppColors.primary + "15" },
              ]}
            >
              <ThemedText>{option.label}</ThemedText>
              {option.value === status ? (
                <Feather name="check" size={18} color={AppColors.primary} />
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}

      <PickerRow
        label="Start Date"
        value={formatDate(startDate)}
        onPress={() => setShowStartPicker(true)}
      />

      {showStartPicker ? (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, date) => {
            setShowStartPicker(Platform.OS === "ios");
            if (date) setStartDate(date);
          }}
        />
      ) : null}

      <PickerRow
        label="Due Date"
        value={formatDate(dueDate)}
        onPress={() => setShowDuePicker(true)}
      />

      {showDuePicker ? (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, date) => {
            setShowDuePicker(Platform.OS === "ios");
            if (date) setDueDate(date);
          }}
        />
      ) : null}

      <Pressable
        onPress={() => setShowCostSection(!showCostSection)}
        style={[styles.sectionToggle, { backgroundColor: theme.backgroundDefault }]}
      >
        <View style={styles.sectionToggleLeft}>
          <Feather name="dollar-sign" size={20} color={AppColors.primary} />
          <ThemedText type="body" style={{ marginLeft: Spacing.md, fontWeight: "600" }}>
            Cost Tracking
          </ThemedText>
        </View>
        <Feather
          name={showCostSection ? "chevron-up" : "chevron-down"}
          size={20}
          color={theme.textSecondary}
        />
      </Pressable>

      {showCostSection ? (
        <View style={[styles.costSection, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            LABOR
          </ThemedText>
          <View style={styles.laborRow}>
            <View style={styles.laborField}>
              <Input
                label="Hours"
                placeholder="0"
                value={laborHours}
                onChangeText={setLaborHours}
                keyboardType="decimal-pad"
              />
            </View>
            <ThemedText style={styles.laborMultiply}>x</ThemedText>
            <View style={styles.laborField}>
              <Input
                label="Rate ($)"
                placeholder="0.00"
                value={laborRate}
                onChangeText={setLaborRate}
                keyboardType="decimal-pad"
              />
            </View>
            <ThemedText style={styles.laborEquals}>=</ThemedText>
            <View style={styles.laborTotal}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Total
              </ThemedText>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {formatCurrency(totalLaborCost)}
              </ThemedText>
            </View>
          </View>

          <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: Spacing.lg }]}>
            MATERIALS
          </ThemedText>
          <Input
            placeholder="0.00"
            value={materialsCost}
            onChangeText={setMaterialsCost}
            keyboardType="decimal-pad"
          />

          <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: Spacing.lg }]}>
            OTHER EXPENSES
          </ThemedText>
          {expenses.map((expense) => (
            <View key={expense.id} style={styles.expenseRow}>
              <View style={styles.expenseInfo}>
                <ThemedText type="body">{expense.description}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {formatCurrency(expense.amount)}
                </ThemedText>
              </View>
              <Pressable onPress={() => handleRemoveExpense(expense.id)} hitSlop={8}>
                <Feather name="x" size={18} color={AppColors.error} />
              </Pressable>
            </View>
          ))}
          <View style={styles.addExpenseRow}>
            <View style={styles.expenseDescInput}>
              <Input
                placeholder="Description"
                value={newExpenseDesc}
                onChangeText={setNewExpenseDesc}
              />
            </View>
            <View style={styles.expenseAmountInput}>
              <Input
                placeholder="$0.00"
                value={newExpenseAmount}
                onChangeText={setNewExpenseAmount}
                keyboardType="decimal-pad"
              />
            </View>
            <Pressable
              onPress={handleAddExpense}
              disabled={!newExpenseDesc.trim() || !newExpenseAmount.trim()}
              style={[
                styles.addExpenseButton,
                {
                  backgroundColor:
                    newExpenseDesc.trim() && newExpenseAmount.trim()
                      ? AppColors.primary
                      : theme.backgroundSecondary,
                },
              ]}
            >
              <Feather
                name="plus"
                size={20}
                color={newExpenseDesc.trim() && newExpenseAmount.trim() ? "#FFFFFF" : theme.textSecondary}
              />
            </Pressable>
          </View>

          <View style={styles.totalRow}>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              Total Cost
            </ThemedText>
            <ThemedText type="h4" style={{ color: AppColors.primary }}>
              {formatCurrency(totalCost)}
            </ThemedText>
          </View>
        </View>
      ) : null}

      <AttachmentPicker
        attachments={attachments}
        onAttachmentsChange={setAttachments}
        maxAttachments={10}
      />

      {isEdit ? (
        <Pressable onPress={handleDelete} style={styles.deleteButton}>
          <ThemedText style={{ color: AppColors.error, fontWeight: "600" }}>
            Delete Job
          </ThemedText>
        </Pressable>
      ) : null}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: "600",
  },
  pickerButton: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
  },
  optionsList: {
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.lg,
    marginTop: -Spacing.sm,
    overflow: "hidden",
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  sectionToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  sectionToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  costSection: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  laborRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  laborField: {
    flex: 1,
  },
  laborMultiply: {
    marginHorizontal: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  laborEquals: {
    marginHorizontal: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  laborTotal: {
    alignItems: "flex-end",
    paddingBottom: Spacing.lg,
  },
  expenseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  expenseInfo: {
    flex: 1,
  },
  addExpenseRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: Spacing.sm,
  },
  expenseDescInput: {
    flex: 2,
    marginRight: Spacing.sm,
  },
  expenseAmountInput: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  addExpenseButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginTop: Spacing.lg,
  },
  deleteButton: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    marginTop: Spacing.xl,
  },
});
