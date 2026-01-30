import { UserSettings } from "@/types";

export interface CountryOption {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  locale: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: "US", name: "United States", currency: "USD", currencySymbol: "$", locale: "en-US" },
  { code: "GB", name: "United Kingdom", currency: "GBP", currencySymbol: "£", locale: "en-GB" },
  { code: "EU", name: "European Union", currency: "EUR", currencySymbol: "€", locale: "de-DE" },
  { code: "CA", name: "Canada", currency: "CAD", currencySymbol: "$", locale: "en-CA" },
  { code: "AU", name: "Australia", currency: "AUD", currencySymbol: "$", locale: "en-AU" },
  { code: "NZ", name: "New Zealand", currency: "NZD", currencySymbol: "$", locale: "en-NZ" },
  { code: "JP", name: "Japan", currency: "JPY", currencySymbol: "¥", locale: "ja-JP" },
  { code: "CN", name: "China", currency: "CNY", currencySymbol: "¥", locale: "zh-CN" },
  { code: "IN", name: "India", currency: "INR", currencySymbol: "₹", locale: "en-IN" },
  { code: "BR", name: "Brazil", currency: "BRL", currencySymbol: "R$", locale: "pt-BR" },
  { code: "MX", name: "Mexico", currency: "MXN", currencySymbol: "$", locale: "es-MX" },
  { code: "CH", name: "Switzerland", currency: "CHF", currencySymbol: "Fr", locale: "de-CH" },
  { code: "SE", name: "Sweden", currency: "SEK", currencySymbol: "kr", locale: "sv-SE" },
  { code: "NO", name: "Norway", currency: "NOK", currencySymbol: "kr", locale: "nb-NO" },
  { code: "DK", name: "Denmark", currency: "DKK", currencySymbol: "kr", locale: "da-DK" },
  { code: "SG", name: "Singapore", currency: "SGD", currencySymbol: "$", locale: "en-SG" },
  { code: "HK", name: "Hong Kong", currency: "HKD", currencySymbol: "$", locale: "en-HK" },
  { code: "KR", name: "South Korea", currency: "KRW", currencySymbol: "₩", locale: "ko-KR" },
  { code: "ZA", name: "South Africa", currency: "ZAR", currencySymbol: "R", locale: "en-ZA" },
  { code: "AE", name: "United Arab Emirates", currency: "AED", currencySymbol: "د.إ", locale: "ar-AE" },
  { code: "SA", name: "Saudi Arabia", currency: "SAR", currencySymbol: "ر.س", locale: "ar-SA" },
  { code: "PL", name: "Poland", currency: "PLN", currencySymbol: "zł", locale: "pl-PL" },
  { code: "TH", name: "Thailand", currency: "THB", currencySymbol: "฿", locale: "th-TH" },
  { code: "MY", name: "Malaysia", currency: "MYR", currencySymbol: "RM", locale: "ms-MY" },
  { code: "PH", name: "Philippines", currency: "PHP", currencySymbol: "₱", locale: "en-PH" },
  { code: "ID", name: "Indonesia", currency: "IDR", currencySymbol: "Rp", locale: "id-ID" },
  { code: "VN", name: "Vietnam", currency: "VND", currencySymbol: "₫", locale: "vi-VN" },
  { code: "TR", name: "Turkey", currency: "TRY", currencySymbol: "₺", locale: "tr-TR" },
  { code: "RU", name: "Russia", currency: "RUB", currencySymbol: "₽", locale: "ru-RU" },
  { code: "IL", name: "Israel", currency: "ILS", currencySymbol: "₪", locale: "he-IL" },
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
