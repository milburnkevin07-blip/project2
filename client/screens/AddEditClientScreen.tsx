import React, { useState, useLayoutEffect } from "react";
import { View, StyleSheet, Alert, Pressable } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { ThemedText } from "@/components/ThemedText";
import { useData } from "@/context/DataContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, AppColors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "AddClient" | "EditClient">;
type AddRouteProp = RouteProp<RootStackParamList, "AddClient">;
type EditRouteProp = RouteProp<RootStackParamList, "EditClient">;

export default function AddEditClientScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AddRouteProp | EditRouteProp>();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { addClient, updateClient, deleteClient, getClientById } = useData();

  const isEdit = route.name === "EditClient";
  const clientId = isEdit ? (route.params as { clientId: string }).clientId : undefined;
  const existingClient = clientId ? getClientById(clientId) : undefined;

  const [name, setName] = useState(existingClient?.name || "");
  const [company, setCompany] = useState(existingClient?.company || "");
  const [email, setEmail] = useState(existingClient?.email || "");
  const [phone, setPhone] = useState(existingClient?.phone || "");
  const [address, setAddress] = useState(existingClient?.address || "");
  const [zipCode, setZipCode] = useState(existingClient?.zipCode || "");
  const [isSaving, setIsSaving] = useState(false);

  const isValid = name.trim().length > 0;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: isEdit ? "Edit Client" : "Add Client",
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
  }, [navigation, isValid, isSaving, name, company, email, phone, address, zipCode]);

  const handleSave = async () => {
    if (!isValid || isSaving) return;

    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (isEdit && existingClient) {
        await updateClient({
          ...existingClient,
          name: name.trim(),
          company: company.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          zipCode: zipCode.trim() || undefined,
        });
      } else {
        await addClient({
          name: name.trim(),
          company: company.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          zipCode: zipCode.trim() || undefined,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to save client. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!clientId) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Delete Client",
      "Are you sure you want to delete this client? All associated jobs will also be deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteClient(clientId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            navigation.popToTop();
          },
        },
      ]
    );
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
    >
      <Input
        label="Name *"
        placeholder="Client name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        autoFocus={!isEdit}
      />
      <Input
        label="Company"
        placeholder="Company name (optional)"
        value={company}
        onChangeText={setCompany}
        autoCapitalize="words"
      />
      <Input
        label="Email"
        placeholder="email@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Input
        label="Phone"
        placeholder="(555) 123-4567"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <Input
        label="Address"
        placeholder="Street address (optional)"
        value={address}
        onChangeText={setAddress}
        autoCapitalize="words"
      />
      <Input
        label="Zip/Postal Code"
        placeholder="Zip or postal code (optional)"
        value={zipCode}
        onChangeText={setZipCode}
        autoCapitalize="characters"
      />

      {isEdit ? (
        <Pressable onPress={handleDelete} style={styles.deleteButton}>
          <ThemedText style={{ color: AppColors.error, fontWeight: "600" }}>
            Delete Client
          </ThemedText>
        </Pressable>
      ) : null}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  deleteButton: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    marginTop: Spacing.xl,
  },
});
