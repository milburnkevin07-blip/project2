// JobNotes Component - Beautiful, production-ready notes UI
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useJobNotes, useCreateJobNote, useDeleteJobNote } from "@/hooks/useJobNotes";
import type { JobNote } from "@/hooks/useJobNotes";

interface JobNotesProps {
  jobId: string;
}

export function JobNotes({ jobId }: JobNotesProps) {
  const [noteText, setNoteText] = useState("");
  const { data: notes, isLoading } = useJobNotes(jobId);
  const createNote = useCreateJobNote(jobId);
  const deleteNote = useDeleteJobNote(jobId);

  const handleAddNote = async () => {
    if (!noteText.trim()) return;

    try {
      await createNote.mutateAsync(noteText.trim());
      setNoteText("");
    } catch (error) {
      Alert.alert("Error", "Failed to add note. Please try again.");
    }
  };

  const handleDeleteNote = (noteId: string) => {
    Alert.alert(
      "Delete Note",
      "Are you sure you want to delete this note?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteNote.mutateAsync(noteId);
            } catch (error) {
              Alert.alert("Error", "Failed to delete note. Please try again.");
            }
          },
        },
      ]
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return "Just now";
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const renderNote = ({ item }: { item: JobNote }) => (
    <View style={styles.noteCard}>
      <View style={styles.noteHeader}>
        <Text style={styles.noteTimestamp}>{formatTimestamp(item.createdAt)}</Text>
        <TouchableOpacity
          onPress={() => handleDeleteNote(item.id)}
          style={styles.deleteButton}
          activeOpacity={0.6}
        >
          <Feather name="trash-2" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
      <Text style={styles.noteText}>{item.noteText}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Notes</Text>
        {notes && notes.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{notes.length}</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color="#2D5F8D" />
        </View>
      ) : notes && notes.length > 0 ? (
        <FlatList
          data={notes}
          renderItem={renderNote}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.notesList}
        />
      ) : (
        <View style={styles.emptyState}>
          <Feather name="file-text" size={32} color="#9CA3AF" />
          <Text style={styles.emptyText}>No notes yet</Text>
          <Text style={styles.emptySubtext}>Add your first note below</Text>
        </View>
      )}

      <View style={styles.addNoteContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a note..."
          placeholderTextColor="#9CA3AF"
          value={noteText}
          onChangeText={setNoteText}
          multiline
          maxLength={1000}
          editable={!createNote.isPending}
        />
        <TouchableOpacity
          onPress={handleAddNote}
          style={[
            styles.addButton,
            (!noteText.trim() || createNote.isPending) && styles.addButtonDisabled,
          ]}
          disabled={!noteText.trim() || createNote.isPending}
          activeOpacity={0.6}
        >
          {createNote.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Feather name="plus" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  countBadge: {
    marginLeft: 8,
    backgroundColor: "#2D5F8D",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: "center",
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  loaderContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  notesList: {
    gap: 12,
  },
  noteCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  noteTimestamp: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
  },
  deleteButton: {
    padding: 4,
    borderRadius: 4,
  },
  noteText: {
    fontSize: 16,
    color: "#1A1A1A",
    lineHeight: 24,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 4,
  },
  addNoteContainer: {
    flexDirection: "row",
    marginTop: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1A1A1A",
    minHeight: 48,
    maxHeight: 120,
    textAlignVertical: "top",
  },
  addButton: {
    backgroundColor: "#E67E22",
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#E67E22",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
});