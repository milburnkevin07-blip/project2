import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert, Platform, Modal, FlatList, TextInput, Image } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import Slider from "@react-native-community/slider";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useSettings } from "@/context/SettingsContext";
import { COUNTRIES, getCountryByCode } from "@/lib/currency";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";

const showAlert = (
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText = "OK",
  isDestructive = false
) => {
  if (Platform.OS === "web") {
    const result = window.confirm(`${title}\n\n${message}`);
    if (result) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      {
        text: confirmText,
        style: isDestructive ? "destructive" : "default",
        onPress: onConfirm,
      },
    ]);
  }
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { logout, verifyPin } = useAuth();
  const { clients, jobs, invoices, clientNotes, refreshData } = useData();
  const { settings, setCountry, formatCurrency, updateSettings } = useSettings();

  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [tempLogoSize, setTempLogoSize] = useState(settings.logoSize || 80);
  const [companyNameInput, setCompanyNameInput] = useState(settings.companyName || "");
  const [clearDataStep, setClearDataStep] = useState<"warning" | "pin">("warning");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [isClearing, setIsClearing] = useState(false);

  const currentCountry = getCountryByCode(settings.country);

  const totalInvoiceValue = invoices.reduce((sum, inv) => sum + inv.total, 0);

  const handleLogout = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    showAlert(
      "Log Out",
      "Are you sure you want to log out?",
      async () => {
        try {
          await logout();
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        } catch (error) {
          console.error("Logout failed:", error);
        }
      },
      "Log Out",
      true
    );
  };

  const handleClearDataPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    setClearDataStep("warning");
    setPinInput("");
    setPinError("");
    setShowClearDataModal(true);
  };

  const handleProceedToPinEntry = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setClearDataStep("pin");
    setPinInput("");
    setPinError("");
  };

  const handlePinDigit = (digit: string) => {
    if (pinInput.length >= 4) return;
    
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    
    const newPin = pinInput + digit;
    setPinInput(newPin);
    setPinError("");
    
    if (newPin.length === 4) {
      verifyAndClear(newPin);
    }
  };

  const handlePinBackspace = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    setPinInput(pinInput.slice(0, -1));
    setPinError("");
  };

  const verifyAndClear = async (pin: string) => {
    const isValid = await verifyPin(pin);
    
    if (!isValid) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setPinError("Incorrect PIN. Please try again.");
      setPinInput("");
      return;
    }

    setIsClearing(true);
    
    try {
      const AsyncStorage = require("@react-native-async-storage/async-storage").default;
      await AsyncStorage.removeItem("@clients");
      await AsyncStorage.removeItem("@jobs");
      await AsyncStorage.removeItem("@invoices");
      await AsyncStorage.removeItem("@client_notes");
      await AsyncStorage.removeItem("@invoice_counter");
      await refreshData();
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      setShowClearDataModal(false);
      
      if (Platform.OS === "web") {
        window.alert("All data has been permanently deleted.");
      } else {
        Alert.alert("Data Cleared", "All your data has been permanently deleted.");
      }
    } catch (error) {
      console.error("Clear data failed:", error);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setPinError("Failed to clear data. Please try again.");
    } finally {
      setIsClearing(false);
    }
  };

  const handleCloseClearModal = () => {
    setShowClearDataModal(false);
    setClearDataStep("warning");
    setPinInput("");
    setPinError("");
  };

  const handleSelectCountry = async (countryCode: string) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    await setCountry(countryCode);
    setShowCountryPicker(false);
  };

  const handlePickLogo = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await updateSettings({ companyLogo: result.assets[0].uri });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  const handleRemoveLogo = async () => {
    showAlert(
      "Remove Logo",
      "Are you sure you want to remove your company logo?",
      async () => {
        await updateSettings({ companyLogo: undefined });
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      },
      "Remove",
      true
    );
  };

  const handleSaveLogoSettings = async () => {
    try {
      await updateSettings({ 
        logoSize: tempLogoSize,
        companyName: companyNameInput.trim() || undefined,
      });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Failed to save logo settings:", error);
    } finally {
      setShowLogoModal(false);
    }
  };

  const handleOpenLogoSettings = () => {
    setTempLogoSize(settings.logoSize || 80);
    setCompanyNameInput(settings.companyName || "");
    setShowLogoModal(true);
  };

  const MenuItem = ({
    icon,
    title,
    subtitle,
    onPress,
    destructive = false,
    showValue,
  }: {
    icon: keyof typeof Feather.glyphMap;
    title: string;
    subtitle?: string;
    onPress: () => void;
    destructive?: boolean;
    showValue?: string;
  }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        { backgroundColor: pressed ? theme.backgroundSecondary : theme.backgroundDefault },
      ]}
      testID={`menu-item-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <View
        style={[
          styles.menuIcon,
          { backgroundColor: destructive ? AppColors.error + "15" : AppColors.primary + "15" },
        ]}
      >
        <Feather
          name={icon}
          size={20}
          color={destructive ? AppColors.error : AppColors.primary}
        />
      </View>
      <View style={styles.menuContent}>
        <ThemedText
          type="body"
          style={{ color: destructive ? AppColors.error : theme.text }}
        >
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {showValue ? (
        <ThemedText type="small" style={{ color: theme.textSecondary, marginRight: Spacing.sm }}>
          {showValue}
        </ThemedText>
      ) : null}
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </Pressable>
  );

  const renderCountryItem = ({ item }: { item: typeof COUNTRIES[0] }) => (
    <Pressable
      onPress={() => handleSelectCountry(item.code)}
      style={[
        styles.countryItem,
        { backgroundColor: item.code === settings.country ? AppColors.primary + "15" : "transparent" },
      ]}
    >
      <View style={styles.countryInfo}>
        <ThemedText type="body" style={{ fontWeight: item.code === settings.country ? "600" : "400" }}>
          {item.name}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {item.currency} ({item.currencySymbol})
        </ThemedText>
      </View>
      {item.code === settings.country ? (
        <Feather name="check" size={20} color={AppColors.primary} />
      ) : null}
    </Pressable>
  );

  const PinDot = ({ filled }: { filled: boolean }) => (
    <View
      style={[
        styles.pinDot,
        { 
          backgroundColor: filled ? AppColors.error : "transparent",
          borderColor: pinError ? AppColors.error : theme.border,
        },
      ]}
    />
  );

  const PinButton = ({ digit, onPress }: { digit: string; onPress: () => void }) => (
    <Pressable
      onPress={onPress}
      testID={`confirm-pin-${digit}`}
      style={({ pressed }) => [
        styles.pinButton,
        { backgroundColor: pressed ? theme.backgroundSecondary : theme.backgroundDefault },
      ]}
    >
      <ThemedText type="h3">{digit}</ThemedText>
    </Pressable>
  );

  return (
    <>
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h2">{clients.length}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Clients
            </ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={[styles.statBox, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h2">{jobs.length}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Jobs
            </ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={[styles.statBox, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h2">
              {jobs.filter((j) => j.status === "completed").length}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Completed
            </ThemedText>
          </View>
        </View>

        <ThemedText
          type="small"
          style={[styles.sectionTitle, { color: theme.textSecondary }]}
        >
          COMPANY BRANDING
        </ThemedText>
        <View style={[styles.menuSection, { backgroundColor: theme.backgroundDefault }]}>
          <Pressable
            onPress={handleOpenLogoSettings}
            style={({ pressed }) => [
              styles.logoMenuItem,
              { backgroundColor: pressed ? theme.backgroundSecondary : theme.backgroundDefault },
            ]}
          >
            <View style={styles.logoPreviewContainer}>
              {settings.companyLogo ? (
                <Image
                  source={{ uri: settings.companyLogo }}
                  style={[styles.logoPreview, { width: 50, height: 50 }]}
                />
              ) : (
                <View style={[styles.logoPlaceholder, { backgroundColor: AppColors.primary + "15" }]}>
                  <Feather name="image" size={24} color={AppColors.primary} />
                </View>
              )}
            </View>
            <View style={styles.menuContent}>
              <ThemedText type="body">Company Logo</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {settings.companyLogo ? "Tap to edit" : "Add logo for invoices & quotes"}
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>

        <ThemedText
          type="small"
          style={[styles.sectionTitle, { color: theme.textSecondary }]}
        >
          REGIONAL SETTINGS
        </ThemedText>
        <View style={[styles.menuSection, { backgroundColor: theme.backgroundDefault }]}>
          <MenuItem
            icon="globe"
            title="Country & Currency"
            subtitle={`${currentCountry?.currency || "USD"} (${currentCountry?.currencySymbol || "$"})`}
            onPress={() => setShowCountryPicker(true)}
            showValue={currentCountry?.name || "United States"}
          />
        </View>

        <ThemedText
          type="small"
          style={[styles.sectionTitle, { color: theme.textSecondary }]}
        >
          ACCOUNT
        </ThemedText>
        <View style={[styles.menuSection, { backgroundColor: theme.backgroundDefault }]}>
          <MenuItem
            icon="log-out"
            title="Log Out"
            subtitle="Lock the app with your PIN"
            onPress={handleLogout}
          />
        </View>

        <ThemedText
          type="small"
          style={[styles.sectionTitle, { color: theme.textSecondary }]}
        >
          DATA
        </ThemedText>
        <View style={[styles.menuSection, { backgroundColor: theme.backgroundDefault }]}>
          <MenuItem
            icon="trash-2"
            title="Clear All Data"
            subtitle="Delete all clients, jobs, and invoices"
            onPress={handleClearDataPress}
            destructive
          />
        </View>

        <ThemedText
          type="small"
          style={[styles.version, { color: theme.textSecondary }]}
        >
          Client Job Manager v1.0.0
        </ThemedText>
      </KeyboardAwareScrollViewCompat>

      <Modal
        visible={showCountryPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <ThemedView style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowCountryPicker(false)}>
              <ThemedText type="body" style={{ color: theme.link }}>
                Cancel
              </ThemedText>
            </Pressable>
            <ThemedText type="h4">Select Country</ThemedText>
            <View style={{ width: 60 }} />
          </View>

          <ThemedText type="small" style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
            Currency will be automatically set based on your country selection.
          </ThemedText>

          <FlatList
            data={COUNTRIES}
            keyExtractor={(item) => item.code}
            renderItem={renderCountryItem}
            contentContainerStyle={styles.countryList}
            showsVerticalScrollIndicator={false}
          />
        </ThemedView>
      </Modal>

      <Modal
        visible={showClearDataModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseClearModal}
      >
        <ThemedView style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={handleCloseClearModal}>
              <ThemedText type="body" style={{ color: theme.link }}>
                Cancel
              </ThemedText>
            </Pressable>
            <ThemedText type="h4">
              {clearDataStep === "warning" ? "Clear All Data" : "Confirm PIN"}
            </ThemedText>
            <View style={{ width: 60 }} />
          </View>

          {clearDataStep === "warning" ? (
            <View style={styles.warningContent}>
              <View style={[styles.warningIcon, { backgroundColor: AppColors.error + "15" }]}>
                <Feather name="alert-triangle" size={48} color={AppColors.error} />
              </View>
              
              <ThemedText type="h3" style={styles.warningTitle}>
                Are you sure?
              </ThemedText>
              
              <ThemedText type="body" style={[styles.warningMessage, { color: theme.textSecondary }]}>
                This action will permanently delete all your data. This cannot be undone.
              </ThemedText>

              <View style={[styles.deletionList, { backgroundColor: theme.backgroundSecondary }]}>
                <ThemedText type="small" style={[styles.deletionHeader, { color: theme.textSecondary }]}>
                  THE FOLLOWING WILL BE DELETED:
                </ThemedText>
                
                <View style={styles.deletionItem}>
                  <Feather name="users" size={18} color={AppColors.error} />
                  <ThemedText type="body" style={styles.deletionText}>
                    {clients.length} {clients.length === 1 ? "Client" : "Clients"}
                  </ThemedText>
                </View>
                
                <View style={styles.deletionItem}>
                  <Feather name="briefcase" size={18} color={AppColors.error} />
                  <ThemedText type="body" style={styles.deletionText}>
                    {jobs.length} {jobs.length === 1 ? "Job" : "Jobs"}
                  </ThemedText>
                </View>
                
                <View style={styles.deletionItem}>
                  <Feather name="file-text" size={18} color={AppColors.error} />
                  <ThemedText type="body" style={styles.deletionText}>
                    {invoices.length} {invoices.length === 1 ? "Invoice" : "Invoices"} ({formatCurrency(totalInvoiceValue)})
                  </ThemedText>
                </View>
                
                <View style={styles.deletionItem}>
                  <Feather name="message-square" size={18} color={AppColors.error} />
                  <ThemedText type="body" style={styles.deletionText}>
                    {clientNotes.length} {clientNotes.length === 1 ? "Note" : "Notes"}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.warningButtons}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={handleCloseClearModal}
                  style={{ flex: 1, marginRight: Spacing.sm }}
                  testID="clear-data-cancel"
                />
                <Button
                  title="Continue"
                  variant="destructive"
                  onPress={handleProceedToPinEntry}
                  style={{ flex: 1, marginLeft: Spacing.sm }}
                  testID="clear-data-continue"
                />
              </View>
            </View>
          ) : (
            <View style={styles.pinContent}>
              <View style={[styles.pinIcon, { backgroundColor: AppColors.error + "15" }]}>
                <Feather name="lock" size={32} color={AppColors.error} />
              </View>
              
              <ThemedText type="body" style={[styles.pinMessage, { color: theme.textSecondary }]}>
                Enter your PIN to confirm deletion
              </ThemedText>

              <View style={styles.pinDotsContainer}>
                {[0, 1, 2, 3].map((i) => (
                  <PinDot key={i} filled={pinInput.length > i} />
                ))}
              </View>

              {pinError ? (
                <ThemedText type="small" style={styles.pinErrorText}>
                  {pinError}
                </ThemedText>
              ) : null}

              <View style={styles.pinPad}>
                <View style={styles.pinRow}>
                  <PinButton digit="1" onPress={() => handlePinDigit("1")} />
                  <PinButton digit="2" onPress={() => handlePinDigit("2")} />
                  <PinButton digit="3" onPress={() => handlePinDigit("3")} />
                </View>
                <View style={styles.pinRow}>
                  <PinButton digit="4" onPress={() => handlePinDigit("4")} />
                  <PinButton digit="5" onPress={() => handlePinDigit("5")} />
                  <PinButton digit="6" onPress={() => handlePinDigit("6")} />
                </View>
                <View style={styles.pinRow}>
                  <PinButton digit="7" onPress={() => handlePinDigit("7")} />
                  <PinButton digit="8" onPress={() => handlePinDigit("8")} />
                  <PinButton digit="9" onPress={() => handlePinDigit("9")} />
                </View>
                <View style={styles.pinRow}>
                  <View style={styles.pinButtonPlaceholder} />
                  <PinButton digit="0" onPress={() => handlePinDigit("0")} />
                  <Pressable
                    onPress={handlePinBackspace}
                    testID="confirm-pin-backspace"
                    style={({ pressed }) => [
                      styles.pinButton,
                      { backgroundColor: pressed ? theme.backgroundSecondary : "transparent" },
                    ]}
                  >
                    <Feather name="delete" size={24} color={theme.text} />
                  </Pressable>
                </View>
              </View>

              <Pressable onPress={() => setClearDataStep("warning")} style={styles.backButton}>
                <ThemedText type="body" style={{ color: theme.link }}>
                  Go Back
                </ThemedText>
              </Pressable>
            </View>
          )}
        </ThemedView>
      </Modal>

      <Modal
        visible={showLogoModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLogoModal(false)}
      >
        <ThemedView style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowLogoModal(false)}>
              <ThemedText type="body" style={{ color: theme.link }}>
                Cancel
              </ThemedText>
            </Pressable>
            <ThemedText type="h4">Company Branding</ThemedText>
            <Pressable onPress={handleSaveLogoSettings}>
              <ThemedText type="body" style={{ color: theme.link, fontWeight: "600" }}>
                Save
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.logoSettingsContent}>
            <View style={styles.logoUploadSection}>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
                LOGO PREVIEW
              </ThemedText>
              <View style={[styles.logoPreviewLarge, { backgroundColor: theme.backgroundSecondary }]}>
                {settings.companyLogo ? (
                  <Image
                    source={{ uri: settings.companyLogo }}
                    style={{ width: tempLogoSize, height: tempLogoSize, borderRadius: 8 }}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={[styles.logoPlaceholderLarge, { backgroundColor: AppColors.primary + "15" }]}>
                    <Feather name="image" size={40} color={AppColors.primary} />
                    <ThemedText type="small" style={{ color: AppColors.primary, marginTop: Spacing.sm }}>
                      No logo uploaded
                    </ThemedText>
                  </View>
                )}
              </View>
              <View style={styles.logoButtons}>
                <Button
                  title={settings.companyLogo ? "Change Logo" : "Upload Logo"}
                  onPress={handlePickLogo}
                  style={{ flex: 1, marginRight: settings.companyLogo ? Spacing.sm : 0 }}
                />
                {settings.companyLogo ? (
                  <Button
                    title="Remove"
                    onPress={handleRemoveLogo}
                    variant="destructive"
                    style={{ flex: 1, marginLeft: Spacing.sm }}
                  />
                ) : null}
              </View>
            </View>

            {settings.companyLogo ? (
              <View style={styles.sizeSliderSection}>
                <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
                  LOGO SIZE
                </ThemedText>
                <View style={styles.sliderRow}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>Small</ThemedText>
                  <Slider
                    style={styles.slider}
                    minimumValue={40}
                    maximumValue={120}
                    step={10}
                    value={tempLogoSize}
                    onValueChange={setTempLogoSize}
                    minimumTrackTintColor={AppColors.primary}
                    maximumTrackTintColor={theme.border}
                    thumbTintColor={AppColors.primary}
                  />
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>Large</ThemedText>
                </View>
                <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center" }}>
                  {tempLogoSize}px
                </ThemedText>
              </View>
            ) : null}

            <View style={styles.companyNameSection}>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
                COMPANY NAME (OPTIONAL)
              </ThemedText>
              <Input
                placeholder="Your Company Name"
                value={companyNameInput}
                onChangeText={setCompanyNameInput}
              />
              <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
                Displayed on invoices and quotes below the logo
              </ThemedText>
            </View>
          </View>
        </ThemedView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: "row",
    marginBottom: Spacing.xl,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  statDivider: {
    width: Spacing.sm,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    fontWeight: "600",
    letterSpacing: 1,
  },
  menuSection: {
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    marginBottom: Spacing.xl,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  version: {
    textAlign: "center",
    marginTop: Spacing.xl,
  },
  logoMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  logoPreviewContainer: {
    marginRight: Spacing.md,
  },
  logoPreview: {
    borderRadius: 8,
  },
  logoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  logoSettingsContent: {
    flex: 1,
    paddingTop: Spacing.lg,
  },
  logoUploadSection: {
    marginBottom: Spacing.xl,
  },
  logoPreviewLarge: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
    minHeight: 150,
    marginBottom: Spacing.lg,
  },
  logoPlaceholderLarge: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
  },
  logoButtons: {
    flexDirection: "row",
  },
  sizeSliderSection: {
    marginBottom: Spacing.xl,
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  companyNameSection: {
    marginBottom: Spacing.xl,
  },
  modalContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  modalSubtitle: {
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  countryList: {
    paddingBottom: Spacing.xl,
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.xs,
  },
  countryInfo: {
    flex: 1,
  },
  warningContent: {
    flex: 1,
    alignItems: "center",
    paddingTop: Spacing.xl,
  },
  warningIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  warningTitle: {
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  warningMessage: {
    textAlign: "center",
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  deletionList: {
    alignSelf: "stretch",
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  deletionHeader: {
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  deletionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  deletionText: {
    marginLeft: Spacing.md,
  },
  warningButtons: {
    flexDirection: "row",
    alignSelf: "stretch",
    marginTop: "auto",
    paddingBottom: Spacing.xl,
  },
  pinContent: {
    flex: 1,
    alignItems: "center",
    paddingTop: Spacing.xl,
  },
  pinIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  pinMessage: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  pinDotsContainer: {
    flexDirection: "row",
    marginBottom: Spacing.lg,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    marginHorizontal: Spacing.sm,
  },
  pinErrorText: {
    color: AppColors.error,
    marginBottom: Spacing.md,
  },
  pinPad: {
    marginTop: Spacing.lg,
  },
  pinRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  pinButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: Spacing.sm,
  },
  pinButtonPlaceholder: {
    width: 72,
    height: 72,
    marginHorizontal: Spacing.sm,
  },
  backButton: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
  },
});
