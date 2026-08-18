# Problem 3: Messy React

- `original.tsx` — the snippet exactly as given (kept for reference; it doesn't type-check on
  purpose, see issue #1).
- `WalletPage.tsx` — the refactored version.
- `assumed-deps.ts` — minimal stand-ins for `BoxProps`, `useWalletBalances`, `usePrices`,
  `WalletRow`, and `classes`, which the original snippet references but doesn't define. These
  exist only so the refactor is real, type-checkable code instead of a fragment; run
  `npm install && npm run typecheck` to verify.

## Issues found

**Bugs**

1. `lhsPriority` is referenced in the `filter` callback but never defined (`balancePriority` is
   the actual computed value) — a `ReferenceError` at runtime.
2. Even fixing the typo, the filter logic is inverted: it keeps a balance when
   `amount <= 0` and drops everything with a positive amount — backwards for a wallet list,
   which should show balances with `amount > 0`.
3. `balance.blockchain` is used in `getPriority(balance.blockchain)`, but `WalletBalance` never
   declares a `blockchain` field — the interface is incomplete.
4. `formattedBalances` (which adds `.formatted`) is computed and then never used — `rows` maps
   over `sortedBalances` instead, which has no `.formatted` field, so `formattedAmount` would be
   `undefined` at runtime despite the type annotation claiming `FormattedWalletBalance`.
5. The sort comparator has no `return 0` for the equal-priority case — it falls through and
   implicitly returns `undefined`, which isn't a valid comparator result.

**Computational inefficiencies**

6. `getPriority` is called up to twice per comparison inside `sort`, on top of once per item in
   `filter` — the same value recomputed repeatedly instead of computed once per balance and
   reused.
7. Four separate full passes over the array (`filter`, `sort`, then two independent `.map` calls
   for `formattedBalances` and `rows`) where filtering/sorting once and formatting once is enough.
8. `useMemo`'s dependency array includes `prices`, but the memoized computation never reads
   `prices` — every price update triggers a pointless recompute of the filter+sort.
9. `getPriority` is redefined as a new closure on every render and uses a `switch` on string
   literals instead of a lookup table.

**Anti-patterns / type-safety**

10. `getPriority(blockchain: any)` throws away type safety on exactly the value it's validating.
11. Magic numbers (`100`, `50`, `30`, `20`, `-99`) with no named constants.
12. `key={index}` in `rows.map` — unstable once the list is filtered/sorted, since array position
    isn't a stable identity for a given balance.
13. `children` is destructured from `props` but never rendered — dead code, and surprising for a
    component that accepts `BoxProps` (implying it might be given children).
14. `prices[balance.currency]` isn't guarded — not every currency has a price (true of the real
    feed used in Problem 2), so a missing price silently produces `NaN`.

## How WalletPage.tsx fixes each one

- Priority is computed once per balance (`balances.map(...)` adding a `priority` field) and that
  cached value is reused by both `filter` and `sort` — fixes #6, and as a side effect fixes #1/#2
  since the filter now correctly reads `balance.amount > 0` off the right variable.
- `blockchain: string` was added to `WalletBalance` (fixes #3), and `getPriority` takes `string`
  instead of `any` (fixes #10).
- `BLOCKCHAIN_PRIORITY` is a `Record<string, number>` with a named `UNKNOWN_BLOCKCHAIN_PRIORITY`
  constant, declared at module scope so it isn't recreated every render (fixes #9, #11).
- The sort comparator returns a numeric difference (`rhs.priority - lhs.priority`), which handles
  the equal case correctly by returning `0` (fixes #5).
- The pipeline is `map → filter → sort → map`: one pass to decorate with priority, filter and sort
  reusing that cached value, then one final map that both drops the temporary `priority` field and
  builds the `FormattedWalletBalance` shape — the unused `formattedBalances` variable and the
  extra pass it caused are gone (fixes #4, #7).
- `useMemo` now only depends on `balances`, matching what it actually reads (fixes #8). Building
  the `rows` JSX is left as a plain `.map` outside `useMemo` — memoizing React elements themselves
  isn't idiomatic since they're cheap to create; only the actual data pipeline needs the cache.
- `key` is now `` `${blockchain}-${currency}` `` instead of array index — stable across re-sorts
  (fixes #12).
- The unused `children` destructure was removed. `rest` is spread onto the `<div>` as before, and
  since the JSX children (`{rows}`) still take precedence over any `children` key that spreading
  `rest` might carry, behavior is unchanged — just without the dead variable (fixes #13).
- `prices[balance.currency] ?? 0` guards against a missing price instead of producing `NaN`
  (fixes #14).
