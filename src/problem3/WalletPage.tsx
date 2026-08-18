import { useMemo } from "react";
import type { FC } from "react";
import {
  type BoxProps,
  type WalletBalance,
  useWalletBalances,
  usePrices,
  WalletRow,
  classes,
} from "./assumed-deps";

interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
}

type Props = BoxProps;

// A lookup table beats a switch here, and — more importantly — living outside
// the component means it's not recreated on every render and it gives the
// "unknown chain" sentinel a name instead of a bare magic number.
const BLOCKCHAIN_PRIORITY: Record<string, number> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
};
const UNKNOWN_BLOCKCHAIN_PRIORITY = -99;

function getPriority(blockchain: string): number {
  return BLOCKCHAIN_PRIORITY[blockchain] ?? UNKNOWN_BLOCKCHAIN_PRIORITY;
}

const WalletPage: FC<Props> = (props) => {
  const rest = props;
  const balances = useWalletBalances();
  const prices = usePrices();

  // Only `balances` feeds this computation, so only `balances` belongs in the
  // dependency array — the original also re-ran this on every price tick for
  // no reason. Priority is computed once per balance up front (instead of up
  // to twice per comparison inside `sort`) and reused for both the filter and
  // the sort.
  const sortedBalances = useMemo<FormattedWalletBalance[]>(() => {
    const withPriority = balances.map((balance) => ({
      ...balance,
      priority: getPriority(balance.blockchain),
    }));

    return withPriority
      .filter((balance) => balance.amount > 0 && balance.priority > UNKNOWN_BLOCKCHAIN_PRIORITY)
      .sort((lhs, rhs) => rhs.priority - lhs.priority)
      .map((balance) => ({
        currency: balance.currency,
        amount: balance.amount,
        blockchain: balance.blockchain,
        formatted: balance.amount.toFixed(),
      }));
  }, [balances]);

  const rows = sortedBalances.map((balance) => {
    // Not every currency has a price (seen for real in the Problem 2 price
    // feed) — fall back to 0 instead of silently rendering NaN.
    const price = prices[balance.currency] ?? 0;
    return (
      <WalletRow
        className={classes.row}
        key={`${balance.blockchain}-${balance.currency}`}
        amount={balance.amount}
        usdValue={price * balance.amount}
        formattedAmount={balance.formatted}
      />
    );
  });

  return <div {...rest}>{rows}</div>;
};

export default WalletPage;
