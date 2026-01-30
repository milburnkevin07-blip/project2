import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserSettings } from "@/types";
import { DEFAULT_SETTINGS, formatCurrency as formatCurrencyUtil, getCountryByCode, COUNTRIES } from "@/lib/currency";

const SETTINGS_KEY = "@user_settings";

interface SettingsContextType {
  settings: UserSettings;
  isLoading: boolean;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  setCountry: (countryCode: string) => Promise<void>;
  formatCurrency: (amount: number) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const updated = { ...settings, ...newSettings };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      setSettings(updated);
    } catch (error) {
      console.error("Failed to save settings:", error);
      throw error;
    }
  };

  const setCountry = async (countryCode: string) => {
    const country = getCountryByCode(countryCode);
    if (country) {
      await updateSettings({
        country: country.code,
        currency: country.currency,
        locale: country.locale,
      });
    }
  };

  const formatCurrency = useCallback(
    (amount: number) => formatCurrencyUtil(amount, settings),
    [settings]
  );

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        updateSettings,
        setCountry,
        formatCurrency,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
