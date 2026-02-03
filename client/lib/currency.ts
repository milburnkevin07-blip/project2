import { UserSettings } from "@/types";

export interface CountryOption {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  emoji: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: "US", name: "United States", currency: "USD", currencySymbol: "$", locale: "en-US", emoji: "🇺🇸" },
  { code: "GB", name: "United Kingdom", currency: "GBP", currencySymbol: "£", locale: "en-GB", emoji: "🇬🇧" },
  { code: "EU", name: "European Union", currency: "EUR", currencySymbol: "€", locale: "de-DE", emoji: "🇪🇺" },
  { code: "CA", name: "Canada", currency: "CAD", currencySymbol: "$", locale: "en-CA", emoji: "🇨🇦" },
  { code: "AU", name: "Australia", currency: "AUD", currencySymbol: "$", locale: "en-AU", emoji: "🇦🇺" },
  { code: "NZ", name: "New Zealand", currency: "NZD", currencySymbol: "$", locale: "en-NZ", emoji: "🇳🇿" },
  { code: "JP", name: "Japan", currency: "JPY", currencySymbol: "¥", locale: "ja-JP", emoji: "🇯🇵" },
  { code: "CN", name: "China", currency: "CNY", currencySymbol: "¥", locale: "zh-CN", emoji: "🇨🇳" },
  { code: "IN", name: "India", currency: "INR", currencySymbol: "₹", locale: "en-IN", emoji: "🇮🇳" },
  { code: "BR", name: "Brazil", currency: "BRL", currencySymbol: "R$", locale: "pt-BR", emoji: "🇧🇷" },
  { code: "MX", name: "Mexico", currency: "MXN", currencySymbol: "$", locale: "es-MX", emoji: "🇲🇽" },
  { code: "CH", name: "Switzerland", currency: "CHF", currencySymbol: "Fr", locale: "de-CH", emoji: "🇨🇭" },
  { code: "SE", name: "Sweden", currency: "SEK", currencySymbol: "kr", locale: "sv-SE", emoji: "🇸🇪" },
  { code: "NO", name: "Norway", currency: "NOK", currencySymbol: "kr", locale: "nb-NO", emoji: "🇳🇴" },
  { code: "DK", name: "Denmark", currency: "DKK", currencySymbol: "kr", locale: "da-DK", emoji: "🇩🇰" },
  { code: "SG", name: "Singapore", currency: "SGD", currencySymbol: "$", locale: "en-SG", emoji: "🇸🇬" },
  { code: "HK", name: "Hong Kong", currency: "HKD", currencySymbol: "$", locale: "en-HK", emoji: "🇭🇰" },
  { code: "KR", name: "South Korea", currency: "KRW", currencySymbol: "₩", locale: "ko-KR", emoji: "🇰🇷" },
  { code: "ZA", name: "South Africa", currency: "ZAR", currencySymbol: "R", locale: "en-ZA", emoji: "🇿🇦" },
  { code: "AE", name: "United Arab Emirates", currency: "AED", currencySymbol: "د.إ", locale: "ar-AE", emoji: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", currency: "SAR", currencySymbol: "ر.س", locale: "ar-SA", emoji: "🇸🇦" },
  { code: "PL", name: "Poland", currency: "PLN", currencySymbol: "zł", locale: "pl-PL", emoji: "🇵🇱" },
  { code: "TH", name: "Thailand", currency: "THB", currencySymbol: "฿", locale: "th-TH", emoji: "🇹🇭" },
  { code: "MY", name: "Malaysia", currency: "MYR", currencySymbol: "RM", locale: "ms-MY", emoji: "🇲🇾" },
  { code: "PH", name: "Philippines", currency: "PHP", currencySymbol: "₱", locale: "en-PH", emoji: "🇵🇭" },
  { code: "ID", name: "Indonesia", currency: "IDR", currencySymbol: "Rp", locale: "id-ID", emoji: "🇮🇩" },
  { code: "VN", name: "Vietnam", currency: "VND", currencySymbol: "₫", locale: "vi-VN", emoji: "🇻🇳" },
  { code: "TR", name: "Turkey", currency: "TRY", currencySymbol: "₺", locale: "tr-TR", emoji: "🇹🇷" },
  { code: "RU", name: "Russia", currency: "RUB", currencySymbol: "₽", locale: "ru-RU", emoji: "🇷🇺" },
  { code: "IL", name: "Israel", currency: "ILS", currencySymbol: "₪", locale: "he-IL", emoji: "🇮🇱" },
];

export const DEFAULT_SETTINGS: UserSettings = {
  country: "US",
  currency: "USD",
  locale: "en-US",
  logoSize: 80,
};

export function getCountryByCode(code: string): CountryOption | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

export function formatCurrency(amount: number, settings: UserSettings): string {
  try {
    return new Intl.NumberFormat(settings.locale, {
      style: "currency",
      currency: settings.currency,
      minimumFractionDigits: settings.currency === "JPY" || settings.currency === "KRW" ? 0 : 2,
      maximumFractionDigits: settings.currency === "JPY" || settings.currency === "KRW" ? 0 : 2,
    }).format(amount);
  } catch (error) {
    return `${settings.currency} ${amount.toFixed(2)}`;
  }
}

export function getCurrencySymbol(settings: UserSettings): string {
  const country = getCountryByCode(settings.country);
  return country?.currencySymbol || "$";
}