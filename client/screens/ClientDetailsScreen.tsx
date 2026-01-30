import React, { useLayoutEffect, useState } from "react";
import { View, StyleSheet, FlatList, Pressable, Linking, Alert, TextInput, Platform, Modal } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { JobCard } from "@/components/JobCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { useData } from "@/context/DataContext";
import { useTheme } from "@/hooks/useTheme";
import { useSettings } from "@/context/SettingsContext";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { ClientNote } from "@/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "ClientDetails">;
type ClientDetailsRouteProp = RouteProp<RootStackParamList, "ClientDetails">;

const NOTE_TYPES = [
  { value: "note" as const, label: "Note", icon: "file-text" as const },
  { value: "call" as const, label: "Call", icon: "phone" as const },
  { value: "email" as const, label: "Email", icon: "mail" as const },
  { value: "meeting" as const, label: "Meeting", icon: "users" as const },
];

export default function ClientDetailsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ClientDetailsRouteProp>();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { getClientById, getJobsForClient, getNotesForClient, getInvoicesForClient, getQuotesForClient, addClientNote, deleteClientNote } = useData();
  const { formatCurrency } = useSettings();

  const { clientId } = route.params;
  const client = getClientById(clientId);
  const clientJobs = getJobsForClient(clientId);
  const clientNotes = getNotesForClient(clientId);
  const clientInvoices = getInvoicesForClient(clientId);
  const clientQuotes = getQuotesForClient(clientId);

  const [showAddNote, setShowAddNote] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState<ClientNote["type"]>("note");
  const [activeSection, setActiveSection] = useState<"jobs" | "notes" | "invoices">("jobs");

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: client?.name || "Client",
      headerRight: () => (
        <HeaderButton
          onPress={() => navigation.navigate("EditClient", { clientId })}
        >
          <ThemedText type="body" style={{ color: theme.link }}>
            Edit
          </ThemedText>
        </HeaderButton>
      ),
    });
  }, [navigation, client]);

  if (!client) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <ThemedText>Client not found</ThemedText>
      </View>
    );
  }

  const handleCall = () => {
    if (client.phone) {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      Linking.openURL(`tel:${client.phone}`);
    }
  };

  const handleEmail = () => {
    if (client.email) {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      Linking.openURL(`mailto:${client.email}`);
    }
  };

  const handleAddJob = () => {
    navigation.navigate("AddJob", { clientId: client.id });
  };

  const handleAddInvoice = () => {
    navigation.navigate("AddInvoice", { clientId: client.id });
  };

  const handleAddQuote = () => {
    navigation.navigate("AddQuote", { clientId: client.id });
  };

  const handleQuotePress = (quoteId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("QuoteDetails", { quoteId });
  };

  const handleJobPress = (jobId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("JobDetails", { jobId });
  };

  const handleInvoicePress = (invoiceId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("InvoiceDetails", { invoiceId });
  };

  const handleSaveNote = async () => {
    if (!noteContent.trim()) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    await addClientNote({
      clientId: client.id,
      content: noteContent.trim(),
      type: noteType,
    });
    
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    setNoteContent("");
    setNoteType("note");
    setShowAddNote(false);
  };

  const handleDeleteNote = (noteId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    const performDelete = async () => {
      await deleteClientNote(noteId);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("Delete this note?")) {
        performDelete();
      }
    } else {
      Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: performDelete },
      ]);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const InfoRow = ({
    icon,
    value,
    onPress,
  }: {
    icon: keyof typeof Feather.glyphMap;
    value: string;
    onPress?: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.infoRow, onPress && { opacity: 1 }]}
    >
      <Feather name={icon} size={18} color={theme.textSecondary} />
      <ThemedText
        type="body"
        style={[styles.infoText, onPress && { color: theme.link }]}
      >
        {value}
      </ThemedText>
    </Pressable>
  );

  const renderNoteItem = (note: ClientNote) => {
    const typeInfo = NOTE_TYPES.find((t) => t.value === note.type) || NOTE_TYPES[0];
    
    return (
      <View key={note.id} style={[styles.noteCard, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.noteHeader}>
          <View style={[styles.noteTypeIcon, { backgroundColor: AppColors.primary + "15" }]}>
            <Feather name={typeInfo.icon} size={14} color={AppColors.primary} />
          </View>
          <View style={styles.noteInfo}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {typeInfo.label}
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {formatDate(note.createdAt)} at {formatTime(note.createdAt)}
            </ThemedText>
          </View>
          <Pressable
            onPress={() => handleDeleteNote(note.id)}
            hitSlop={8}
            style={styles.deleteNoteButton}
          >
            <Feather name="trash-2" size={16} color={AppColors.error} />
          </Pressable>
        </View>
        <ThemedText type="body" style={styles.noteContent}>
          {note.content}
        </ThemedText>
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      <View style={[styles.clientCard, { backgroundColor: theme.backgroundDefault }]}>
        <View style={[styles.avatar, { backgroundColor: AppColors.primary }]}>
          <ThemedText style={styles.avatarText}>{getInitials(client.name)}</ThemedText>
        </View>
        <ThemedText type="h3" style={styles.clientName}>
          {client.name}
        </ThemedText>
        {client.company ? (
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            {client.company}
          </ThemedText>
        ) : null}

        <View style={styles.infoContainer}>
          {client.phone ? (
            <InfoRow icon="phone" value={client.phone} onPress={handleCall} />
          ) : null}
          {client.email ? (
            <InfoRow icon="mail" value={client.email} onPress={handleEmail} />
          ) : null}
          {client.address || client.zipCode ? (
            <InfoRow 
              icon="map-pin" 
              value={[client.address, client.zipCode].filter(Boolean).join(", ")} 
            />
          ) : null}
        </View>

        <View style={styles.actionButtons}>
          {client.phone ? (
            <Pressable
              onPress={handleCall}
              style={[styles.actionButton, { backgroundColor: AppColors.primary + "15" }]}
            >
              <Feather name="phone" size={20} color={AppColors.primary} />
            </Pressable>
          ) : null}
          {client.email ? (
            <Pressable
              onPress={handleEmail}
              style={[styles.actionButton, { backgroundColor: AppColors.primary + "15" }]}
            >
              <Feather name="mail" size={20} color={AppColors.primary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={[styles.tabsContainer, { backgroundColor: theme.backgroundDefault }]}>
        <Pressable
          onPress={() => setActiveSection("jobs")}
          style={[styles.tab, activeSection === "jobs" && styles.activeTab]}
        >
          <ThemedText
            type="small"
            style={[
              styles.tabText,
              { color: activeSection === "jobs" ? AppColors.primary : theme.textSecondary },
            ]}
          >
            Jobs ({clientJobs.length})
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setActiveSection("notes")}
          style={[styles.tab, activeSection === "notes" && styles.activeTab]}
        >
          <ThemedText
            type="small"
            style={[
              styles.tabText,
              { color: activeSection === "notes" ? AppColors.primary : theme.textSecondary },
            ]}
          >
            Notes ({clientNotes.length})
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setActiveSection("invoices")}
          style={[styles.tab, activeSection === "invoices" && styles.activeTab]}
        >
          <ThemedText
            type="small"
            style={[
              styles.tabText,
              { color: activeSection === "invoices" ? AppColors.primary : theme.textSecondary },
            ]}
          >
            Billing ({clientInvoices.length + clientQuotes.length})
          </ThemedText>
        </Pressable>
      </View>

      {activeSection === "jobs" ? (
        <View style={styles.sectionHeader}>
          <ThemedText type="h4">Jobs</ThemedText>
          <Pressable onPress={handleAddJob}>
            <Feather name="plus" size={24} color={theme.link} />
          </Pressable>
        </View>
      ) : activeSection === "notes" ? (
        <View style={styles.sectionHeader}>
          <ThemedText type="h4">Notes & History</ThemedText>
          <Pressable onPress={() => setShowAddNote(true)}>
            <Feather name="plus" size={24} color={theme.link} />
          </Pressable>
        </View>
      ) : activeSection === "invoices" ? (
        <View style={styles.sectionHeader}>
          <ThemedText type="h4">Invoices & Quotes</ThemedText>
          <View style={{ flexDirection: "row", gap: Spacing.md }}>
            <Pressable onPress={handleAddQuote}>
              <ThemedText type="small" style={{ color: theme.link }}>Quote</ThemedText>
            </Pressable>
            <Pressable onPress={handleAddInvoice}>
              <Feather name="plus" size={24} color={theme.link} />
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );

  const renderContent = () => {
    if (activeSection === "jobs") {
      return clientJobs.length > 0 ? (
        clientJobs.map((job) => (
          <View key={job.id} style={styles.itemSpacing}>
            <JobCard job={job} onPress={() => handleJobPress(job.id)} />
          </View>
        ))
      ) : (
        <EmptyState
          image={require("../../assets/images/empty-jobs.png")}
          title="No jobs yet"
          message="Create a job for this client"
        />
      );
    }

    if (activeSection === "notes") {
      return clientNotes.length > 0 ? (
        clientNotes.map((note) => renderNoteItem(note))
      ) : (
        <View style={[styles.emptyNotes, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="file-text" size={40} color={theme.textSecondary} />
          <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md, textAlign: "center" }}>
            No notes yet
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
            Add notes to track interactions
          </ThemedText>
        </View>
      );
    }

    const hasContent = clientQuotes.length > 0 || clientInvoices.length > 0;
    
    return hasContent ? (
      <>
        {clientQuotes.map((quote) => (
          <Pressable
            key={quote.id}
            onPress={() => handleQuotePress(quote.id)}
            style={[styles.invoiceCard, { backgroundColor: theme.backgroundDefault }]}
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
                {formatDate(quote.issueDate)}
              </ThemedText>
            </View>
            <View style={styles.invoiceRight}>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {formatCurrency(quote.total)}
              </ThemedText>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      quote.status === "accepted"
                        ? AppColors.success + "20"
                        : quote.status === "rejected"
                        ? AppColors.error + "20"
                        : AppColors.warning + "20",
                  },
                ]}
              >
                <ThemedText
                  type="caption"
                  style={{
                    color:
                      quote.status === "accepted"
                        ? AppColors.success
                        : quote.status === "rejected"
                        ? AppColors.error
                        : AppColors.warning,
                    fontWeight: "600",
                    textTransform: "capitalize",
                  }}
                >
                  {quote.status}
                </ThemedText>
              </View>
            </View>
          </Pressable>
        ))}
        {clientInvoices.map((invoice) => (
          <Pressable
            key={invoice.id}
            onPress={() => handleInvoicePress(invoice.id)}
            style={[styles.invoiceCard, { backgroundColor: theme.backgroundDefault }]}
          >
            <View>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {invoice.invoiceNumber}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {formatDate(invoice.issueDate)}
              </ThemedText>
            </View>
            <View style={styles.invoiceRight}>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {formatCurrency(invoice.total)}
              </ThemedText>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      invoice.status === "paid"
                        ? AppColors.success + "20"
                        : invoice.status === "overdue"
                        ? AppColors.error + "20"
                        : AppColors.warning + "20",
                  },
                ]}
              >
                <ThemedText
                  type="caption"
                  style={{
                    color:
                      invoice.status === "paid"
                        ? AppColors.success
                        : invoice.status === "overdue"
                        ? AppColors.error
                        : AppColors.warning,
                    fontWeight: "600",
                    textTransform: "capitalize",
                  }}
                >
                  {invoice.status}
                </ThemedText>
              </View>
            </View>
          </Pressable>
        ))}
      </>
    ) : (
      <View style={[styles.emptyNotes, { backgroundColor: theme.backgroundDefault }]}>
        <Feather name="file-text" size={40} color={theme.textSecondary} />
        <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md, textAlign: "center" }}>
          No invoices or quotes yet
        </ThemedText>
      </View>
    );
  };

  return (
    <>
      <FlatList
        style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        data={[1]}
        keyExtractor={() => "content"}
        renderItem={() => <View>{renderContent()}</View>}
        ListHeaderComponent={renderHeader}
      />

      <Modal
        visible={showAddNote}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddNote(false)}
      >
        <ThemedView style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowAddNote(false)}>
              <ThemedText type="body" style={{ color: theme.link }}>
                Cancel
              </ThemedText>
            </Pressable>
            <ThemedText type="h4">Add Note</ThemedText>
            <Pressable onPress={handleSaveNote} disabled={!noteContent.trim()}>
              <ThemedText
                type="body"
                style={{ color: noteContent.trim() ? theme.link : theme.textSecondary, fontWeight: "600" }}
              >
                Save
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.noteTypeContainer}>
            {NOTE_TYPES.map((type) => (
              <Pressable
                key={type.value}
                onPress={() => {
                  setNoteType(type.value);
                  if (Platform.OS !== "web") {
                    Haptics.selectionAsync();
                  }
                }}
                style={[
                  styles.noteTypeButton,
                  {
                    backgroundColor: noteType === type.value ? AppColors.primary : theme.backgroundDefault,
                    borderColor: noteType === type.value ? AppColors.primary : theme.border,
                  },
                ]}
              >
                <Feather
                  name={type.icon}
                  size={16}
                  color={noteType === type.value ? "#FFFFFF" : theme.textSecondary}
                />
                <ThemedText
                  type="small"
                  style={{
                    color: noteType === type.value ? "#FFFFFF" : theme.text,
                    marginLeft: 6,
                  }}
                >
                  {type.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <TextInput
            style={[
              styles.noteInput,
              {
                backgroundColor: theme.backgroundDefault,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="Write your note..."
            placeholderTextColor={theme.textSecondary}
            value={noteContent}
            onChangeText={setNoteContent}
            multiline
            autoFocus
          />
        </ThemedView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  clientCard: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "600",
    lineHeight: 34,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  clientName: {
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  infoContainer: {
    alignSelf: "stretch",
    marginTop: Spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  infoText: {
    marginLeft: Spacing.md,
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: Spacing.lg,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: Spacing.sm,
  },
  tabsContainer: {
    flexDirection: "row",
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderRadius: BorderRadius.xs,
  },
  activeTab: {
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  tabText: {
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  itemSpacing: {
    marginBottom: Spacing.sm,
  },
  noteCard: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  noteTypeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  noteInfo: {
    flex: 1,
  },
  deleteNoteButton: {
    padding: Spacing.sm,
  },
  noteContent: {
    lineHeight: 22,
  },
  emptyNotes: {
    alignItems: "center",
    padding: Spacing.xl * 2,
    borderRadius: BorderRadius.sm,
  },
  invoiceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  invoiceRight: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  noteTypeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  noteTypeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  noteInput: {
    flex: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    fontSize: 16,
    textAlignVertical: "top",
    borderWidth: 1,
  },
});
