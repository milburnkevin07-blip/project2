import React, { useState, useEffect } from "react";
import { View, StyleSheet, Image, Pressable, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { AppColors, Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";

const { height: screenHeight } = Dimensions.get("window");

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { login, setupPin, hasPin } = useAuth();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [error, setError] = useState("");

  const isConfirmStep = !hasPin && isSettingUp;
  const displayPin = isConfirmStep ? confirmPin : pin;

  const handleNumberPress = (num: string) => {
    Haptics.selectionAsync();
    setError("");
    if (displayPin.length < 4) {
      if (isConfirmStep) {
        setConfirmPin((prev) => prev + num);
      } else {
        setPin((prev) => prev + num);
      }
    }
  };

  const handleDelete = () => {
    Haptics.selectionAsync();
    if (isConfirmStep) {
      setConfirmPin((prev) => prev.slice(0, -1));
    } else {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  const handleSubmit = async () => {
    if (displayPin.length !== 4) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!hasPin) {
      if (!isSettingUp) {
        setIsSettingUp(true);
      } else {
        if (pin === confirmPin) {
          await setupPin(pin);
        } else {
          setError("PINs do not match");
          setConfirmPin("");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } else {
      const success = await login(pin);
      if (!success) {
        setError("Incorrect PIN");
        setPin("");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  useEffect(() => {
    if (displayPin.length === 4) {
      handleSubmit();
    }
  }, [displayPin]);

  const getTitle = () => {
    if (!hasPin) {
      return isSettingUp ? "Confirm your PIN" : "Create a PIN";
    }
    return "Enter your PIN";
  };

  const getSubtitle = () => {
    if (!hasPin) {
      return isSettingUp
        ? "Re-enter your 4-digit PIN"
        : "Set a 4-digit PIN to secure your data";
    }
    return "Enter your 4-digit PIN to continue";
  };

  const keypadNumbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];
  const isCompactScreen = screenHeight < 700;
  const keySize = isCompactScreen ? 64 : 72;

  return (
    <ThemedView
      style={[
        styles.container,
        { 
          paddingTop: insets.top + Spacing["2xl"],
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={[styles.logo, isCompactScreen && styles.logoSmall]}
          resizeMode="contain"
        />
        <ThemedText type="h3" style={styles.title}>
          {getTitle()}
        </ThemedText>
        <ThemedText
          type="body"
          style={[styles.subtitle, { color: theme.textSecondary }]}
        >
          {getSubtitle()}
        </ThemedText>
      </View>

      <View style={styles.pinContainer}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.pinDot,
              {
                backgroundColor:
                  i < displayPin.length ? AppColors.primary : theme.border,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.errorContainer}>
        {error ? (
          <ThemedText style={styles.error}>{error}</ThemedText>
        ) : null}
      </View>

      <View style={styles.keypadContainer}>
        <View style={styles.keypad}>
          {keypadNumbers.map((key, index) => (
            <Pressable
              key={index}
              onPress={() => {
                if (key === "del") handleDelete();
                else if (key) handleNumberPress(key);
              }}
              style={({ pressed }) => [
                styles.key,
                {
                  width: keySize,
                  height: keySize,
                  borderRadius: keySize / 2,
                  backgroundColor: key
                    ? pressed
                      ? theme.backgroundSecondary
                      : theme.backgroundDefault
                    : "transparent",
                },
              ]}
              disabled={!key}
              testID={key === "del" ? "pin-delete" : key ? `pin-${key}` : undefined}
            >
              {key === "del" ? (
                <Feather name="delete" size={24} color={theme.text} />
              ) : (
                <ThemedText style={[styles.keyText, isCompactScreen && styles.keyTextSmall]}>
                  {key}
                </ThemedText>
              )}
            </Pressable>
          ))}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: Spacing.lg,
    borderRadius: 16,
  },
  logoSmall: {
    width: 56,
    height: 56,
    marginBottom: Spacing.md,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: "center",
  },
  pinContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginHorizontal: Spacing.sm,
  },
  errorContainer: {
    height: 24,
    marginBottom: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    color: AppColors.error,
    textAlign: "center",
    fontSize: 14,
  },
  keypadContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    maxWidth: 280,
  },
  key: {
    alignItems: "center",
    justifyContent: "center",
    margin: Spacing.sm,
  },
  keyText: {
    fontSize: 26,
    fontWeight: "500",
  },
  keyTextSmall: {
    fontSize: 22,
  },
});
