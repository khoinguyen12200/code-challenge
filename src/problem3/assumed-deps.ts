// The original snippet references several things that must come from the
// surrounding app (a data layer and a design system) but weren't included in
// the problem statement: `BoxProps`, `useWalletBalances`, `usePrices`,
// `WalletRow`, and `classes`. These stand-ins exist ONLY so WalletPage.tsx is
// real, type-checkable code rather than a fragment — they're not part of the
// actual fix and would be deleted/replaced by the real imports in the real
// codebase.

import type { HTMLAttributes } from "react";

export interface BoxProps extends HTMLAttributes<HTMLDivElement> {}

export interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string;
}

export interface WalletRowProps {
  className?: string;
  amount: number;
  usdValue: number;
  formattedAmount: string;
}

export function useWalletBalances(): WalletBalance[] {
  return [];
}

export function usePrices(): Record<string, number> {
  return {};
}

export function WalletRow(_props: WalletRowProps) {
  return null;
}

export const classes = { row: "wallet-row" };
