# Problem 2: Fancy Form

A currency swap form built with Vite + React + TypeScript, styled with plain CSS, animated with
[Motion](https://motion.dev) (the Framer Motion successor).

## Running it

```bash
npm install
npm run dev      # dev server with HMR
npm run build    # typecheck + production build
npm run test     # unit + component tests (vitest)
```

## What it does

- Fetches live prices from `https://interview.switcheo.com/prices.json` and token icons from
  [`Switcheo/token-icons`](https://github.com/Switcheo/token-icons).
- Lets you pick any two priced tokens and computes the exchange rate from their USD prices.
- Both amount fields are editable — typing in either one recalculates the other.
- Validates input (positive numbers only, can't swap a token for itself) and disables submit
  until the form is valid.
- Submitting simulates a backend call (1.5s delay + loading spinner) and shows a toast on success,
  per the problem's hint to mock the backend interaction.

## Assumptions / notes

- The price feed contains multiple timestamped entries per currency (some historical, some
  zero-priced). Only the latest entry per currency is used, and tokens with a zero/invalid price
  are omitted from the token list, since there's nothing to compute an exchange rate against.
- The submit action is fully mocked — there's no real swap endpoint, matching the challenge's
  explicit hint that this is acceptable.
- If the price feed ever returns fewer than two usable tokens, the app shows an error state
  rather than crashing, since a swap needs at least two tokens to choose from.
- The token dropdown is a custom component (not a native `<select>`) so it can show icons and
  live prices per option; it implements `aria-expanded`/`aria-activedescendant`/arrow-key
  navigation to stay keyboard-accessible despite not being a native form control.
