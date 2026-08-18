import type { TokenPrice } from "./types";

const PRICES_URL = "https://interview.switcheo.com/prices.json";
const ICON_BASE_URL = "https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens";

interface PricePoint {
  currency: string;
  date: string;
  price: number;
}

// The feed contains multiple timestamped entries per currency and some
// zero/missing prices — keep only the latest priced entry for each token.
export async function fetchTokenPrices(): Promise<TokenPrice[]> {
  const res = await fetch(PRICES_URL);
  if (!res.ok) {
    throw new Error(`Failed to load prices (${res.status})`);
  }
  const raw: PricePoint[] = await res.json();

  const latestByCurrency = new Map<string, PricePoint>();
  for (const point of raw) {
    const existing = latestByCurrency.get(point.currency);
    if (!existing || new Date(point.date) > new Date(existing.date)) {
      latestByCurrency.set(point.currency, point);
    }
  }

  return Array.from(latestByCurrency.values())
    .filter((p) => typeof p.price === "number" && p.price > 0)
    .map((p) => ({ symbol: p.currency, price: p.price }))
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
}

export function iconUrl(symbol: string): string {
  return `${ICON_BASE_URL}/${symbol}.svg`;
}

export function formatUsd(value: number): string {
  return `$${value < 1 ? value.toPrecision(4) : value.toFixed(2)}`;
}

export function formatAmount(value: number): string {
  return value < 1 ? value.toPrecision(4) : value.toFixed(4).replace(/\.?0+$/, "");
}

export function sanitizeAmountInput(raw: string): string {
  let cleaned = raw.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
  }
  return cleaned;
}
