# Problem 3: Messy React

- `original.tsx` — the snippet exactly as given (kept for reference; it doesn't type-check on
  purpose, see issue #1).
- [`WalletPage.tsx`](WalletPage.tsx) — the refactored version.
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

6. `getPriority` is redefined as a brand-new closure on every render, and uses a `switch` on
   string literals instead of a lookup table — so every one of the repeated calls made during
   `filter`/`sort` (up to twice per comparison) pays for a fresh function plus a multi-branch
   string comparison, when a stable, module-level `Record` lookup would do the same job in O(1).
7. Four separate full passes over the array (`filter`, `sort`, then two independent `.map` calls
   for `formattedBalances` and `rows`) where filtering/sorting once and formatting once is enough.
8. `useMemo`'s dependency array includes `prices`, but the memoized computation never reads
   `prices` — every price update triggers a pointless recompute of the filter+sort.

**Anti-patterns / type-safety**

9. `getPriority(blockchain: any)` throws away type safety on exactly the value it's validating.
10. Magic numbers (`100`, `50`, `30`, `20`, `-99`) with no named constants.
11. `key={index}` in `rows.map` — unstable once the list is filtered/sorted, since array position
    isn't a stable identity for a given balance.
12. `children` is destructured from `props` but never rendered — dead code, and surprising for a
    component that accepts `BoxProps` (implying it might be given children).
13. `prices[balance.currency]` isn't guarded — not every currency has a price (true of the real
    feed used in Problem 2), so a missing price silently produces `NaN`.

## How WalletPage.tsx fixes each one

- `getPriority` moved to module scope as a plain function over a `BLOCKCHAIN_PRIORITY`
  `Record<string, number>`, with the sentinel named `UNKNOWN_BLOCKCHAIN_PRIORITY` instead of a
  bare `-99` — fixes #6, #9, #10. Once it's an O(1) lookup instead of a `switch`-based closure
  recreated every render, calling it a couple of times per element during `filter`/`sort` is
  negligible, which is why the refactor does *not* bother pre-computing and caching a `priority`
  field on each item — that would only be worth the added complexity if `getPriority` were doing
  real work.
- The `filter` predicate now reads `balance.amount > 0` (the correct condition, off the correct
  variable — there is no `lhsPriority` anymore) — fixes #1, #2.
- `blockchain: string` was added to `WalletBalance` — fixes #3.
- The sort comparator returns a numeric difference (`rhs.priority - lhs.priority` via
  `getPriority`), which naturally returns `0` for equal priorities instead of falling through to
  `undefined` — fixes #5.
- The pipeline is now `filter → sort → map`, one pass each, with the `map` both building the
  `formatted` string and being the only place `FormattedWalletBalance` is produced — the unused
  `formattedBalances` variable and the extra pass it caused are gone — fixes #4, #7.
- `useMemo` now only depends on `balances`, matching what it actually reads. Building `rows` is
  left as a plain `.map` outside `useMemo` — memoizing React elements themselves isn't idiomatic
  since they're cheap to create; only the actual data pipeline needs the cache — fixes #8.
- `key` is now `` `${blockchain}-${currency}` `` instead of array index — stable across re-sorts —
  fixes #11.
- The unused `children` destructure was removed; `props` is spread onto the `<div>` directly, and
  since the JSX children (`{rows}`) still take precedence over any `children` key that spreading
  might carry, behavior is unchanged — just without the dead variable — fixes #12.
- `prices[balance.currency] ?? 0` guards against a missing price instead of producing `NaN` —
  fixes #13.
