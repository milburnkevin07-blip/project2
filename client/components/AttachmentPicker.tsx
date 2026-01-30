import React, { useState } from "react";
import { View, StyleSheet, Pressable, Image, Alert, Platform, FlatList } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { Attachment } from "@/types";

function generateAttachmentId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

interface AttachmentPickerProps {
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  maxAttachments?: number;
}

export function AttachmentPicker({
  attachments,
  onAttachmentsChange,
  maxAttachments = 10,
}: AttachmentPickerProps) {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const showOptions = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (Platform.OS === "web") {
      handlePickDocument();
      return;
    }

    Alert.alert("Add Attachment", "Choose how to add a file", [
      { text: "Take Photo", onPress: handleTakePhoto },
      { text: "Choose from Library", onPress: handlePickImage },
      { text: "Choose Document", onPress: handlePickDocument },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Camera permission is needed to take photos.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images",
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const newAttachment: Attachment = {
          id: generateAttachmentId(),
          uri: asset.uri,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          type: "image",
          size: asset.fileSize,
          createdAt: new Date().toISOString(),
        };
        onAttachmentsChange([...attachments, newAttachment]);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Media library permission is needed to select photos.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: maxAttachments - attachments.length,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newAttachments: Attachment[] = result.assets.map((asset) => ({
          id: generateAttachmentId(),
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: "image" as const,
          size: asset.fileSize,
          createdAt: new Date().toISOString(),
        }));
        onAttachmentsChange([...attachments, ...newAttachments]);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to select images. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickDocument = async () => {
    setIsLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newAttachments: Attachment[] = result.assets.map((asset) => ({
          id: generateAttachmentId(),
          uri: asset.uri,
          name: asset.name || `document_${Date.now()}`,
          type: asset.mimeType?.startsWith("image/") ? ("image" as const) : ("document" as const),
          size: asset.size,
          createdAt: new Date().toISOString(),
        }));
        onAttachmentsChange([...attachments, ...newAttachments]);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error("Document picker error:", error);
      Alert.alert("Error", "Failed to select document. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = (attachmentId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onAttachmentsChange(attachments.filter((a) => a.id !== attachmentId));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderAttachment = ({ item }: { item: Attachment }) => (
    <View style={[styles.attachmentItem, { backgroundColor: theme.backgroundDefault }]}>
      {item.type === "image" ? (
        <Image source={{ uri: item.uri }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.docIcon, { backgroundColor: AppColors.primary + "15" }]}>
          <Feather name="file" size={20} color={AppColors.primary} />
        </View>
      )}
      <View style={styles.attachmentInfo}>
        <ThemedText type="small" numberOfLines={1} style={{ flex: 1 }}>
          {item.name}
        </ThemedText>
        {item.size ? (
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {formatFileSize(item.size)}
          </ThemedText>
        ) : null}
      </View>
      <Pressable onPress={() => handleRemove(item.id)} hitSlop={8} style={styles.removeButton}>
        <Feather name="x" size={18} color={AppColors.error} />
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          ATTACHMENTS
        </ThemedText>
        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          {attachments.length}/{maxAttachments}
        </ThemedText>
      </View>

      {attachments.length > 0 ? (
        <FlatList
          data={attachments}
          keyExtractor={(item) => item.id}
          renderItem={renderAttachment}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          style={styles.list}
        />
      ) : null}

      {attachments.length < maxAttachments ? (
        <Pressable
          onPress={showOptions}
          disabled={isLoading}
          style={[
            styles.addButton,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          ]}
        >
          <Feather name={isLoading ? "loader" : "plus"} size={20} color={AppColors.primary} />
          <ThemedText type="body" style={{ color: AppColors.primary, marginLeft: Spacing.sm }}>
            {isLoading ? "Loading..." : "Add Attachment"}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  label: {
    fontWeight: "600",
    letterSpacing: 1,
  },
  list: {
    marginBottom: Spacing.md,
  },
  attachmentItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xs,
    marginRight: Spacing.md,
  },
  docIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  attachmentInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  removeButton: {
    padding: Spacing.sm,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderStyle: "dashed",
  },
});
