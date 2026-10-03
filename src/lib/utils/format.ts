/**
 * Formatting utilities for enterprise e-commerce
 */

export type CurrencyCode = "USD" | "EUR" | "GBP" | "PKR" | "JPY" | "CAD";

export const DEFAULT_EXCHANGE_RATES: Record<CurrencyCode, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  PKR: 278.50,
  JPY: 155.00,
  CAD: 1.36,
};

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  PKR: "₨",
  JPY: "¥",
  CAD: "CA$",
};

export const SUPPORTED_CURRENCIES: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: "USD", label: "USD ($)", symbol: "$" },
  { code: "EUR", label: "EUR (€)", symbol: "€" },
  { code: "GBP", label: "GBP (£)", symbol: "£" },
  { code: "PKR", label: "PKR (₨)", symbol: "₨" },
  { code: "JPY", label: "JPY (¥)", symbol: "¥" },
  { code: "CAD", label: "CAD (CA$)", symbol: "CA$" },
];

/**
 * Formats a base USD price into the active currency with appropriate decimal precision.
 * Supports string, object option, and positional argument calls.
 */
export function formatPrice(
  price: number | string,
  currencyOrOptions?:
    | CurrencyCode
    | {
        currency?: CurrencyCode;
        exchangeRates?: Record<CurrencyCode, number>;
        notation?: Intl.NumberFormatOptions["notation"];
      },
  exchangeRatesParam?: Record<CurrencyCode, number>
): string {
  const numericPrice = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(numericPrice)) return "$0.00";

  let currency: CurrencyCode = "USD";
  let rates: Record<CurrencyCode, number> = DEFAULT_EXCHANGE_RATES;
  let notation: Intl.NumberFormatOptions["notation"] = "standard";

  if (typeof currencyOrOptions === "string") {
    currency = currencyOrOptions;
    if (exchangeRatesParam) {
      rates = exchangeRatesParam;
    }
  } else if (currencyOrOptions && typeof currencyOrOptions === "object") {
    if (currencyOrOptions.currency) currency = currencyOrOptions.currency;
    if (currencyOrOptions.exchangeRates) rates = currencyOrOptions.exchangeRates;
    if (currencyOrOptions.notation) notation = currencyOrOptions.notation;
  }

  const rate = rates[currency] ?? 1.0;
  const convertedAmount = numericPrice * rate;

  // JPY and other zero-decimal currencies
  const isZeroDecimal = currency === "JPY";
  const decimals = isZeroDecimal ? 0 : 2;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(convertedAmount);
  } catch {
    const symbol = CURRENCY_SYMBOLS[currency] || "$";
    return `${symbol}${convertedAmount.toFixed(decimals)}`;
  }
}

export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
  }
): string {
  return new Intl.DateTimeFormat("en-US", options).format(new Date(date));
}
