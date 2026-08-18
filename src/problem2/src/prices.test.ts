import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchTokenPrices, iconUrl, formatUsd, formatAmount, sanitizeAmountInput } from "./prices";

describe("fetchTokenPrices", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps only the latest priced entry per currency and drops zero/invalid prices", async () => {
    const raw = [
      { currency: "ETH", date: "2024-01-01T00:00:00.000Z", price: 1000 },
      { currency: "ETH", date: "2024-01-02T00:00:00.000Z", price: 1500 },
      { currency: "USDC", date: "2024-01-01T00:00:00.000Z", price: 1 },
      { currency: "DEAD", date: "2024-01-01T00:00:00.000Z", price: 0 },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => raw }),
    );

    const tokens = await fetchTokenPrices();

    expect(tokens).toEqual([
      { symbol: "ETH", price: 1500 },
      { symbol: "USDC", price: 1 },
    ]);
  });

  it("throws when the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => [] }));

    await expect(fetchTokenPrices()).rejects.toThrow("Failed to load prices (500)");
  });
});

describe("iconUrl", () => {
  it("builds the raw githubusercontent url for a symbol", () => {
    expect(iconUrl("ETH")).toBe(
      "https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/ETH.svg",
    );
  });
});

describe("formatUsd", () => {
  it("uses two decimal places for values >= 1", () => {
    expect(formatUsd(1645.9337373737374)).toBe("$1645.93");
  });

  it("uses precision formatting for sub-dollar values", () => {
    expect(formatUsd(0.20811525423728813)).toBe("$0.2081");
  });
});

describe("sanitizeAmountInput", () => {
  it("strips non-numeric characters", () => {
    expect(sanitizeAmountInput("12a3.4b5")).toBe("123.45");
  });

  it("keeps only the first decimal point", () => {
    expect(sanitizeAmountInput("1.2.3.4")).toBe("1.234");
  });
});

describe("formatAmount", () => {
  it("trims trailing zeros for values >= 1", () => {
    expect(formatAmount(10)).toBe("10");
    expect(formatAmount(10.5)).toBe("10.5");
  });

  it("uses precision formatting for sub-1 values", () => {
    expect(formatAmount(0.123456)).toBe("0.1235");
  });
});
