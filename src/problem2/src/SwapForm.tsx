import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { TokenPrice } from "./types";
import { formatAmount, sanitizeAmountInput } from "./prices";
import { TokenSelect } from "./TokenSelect";
import { Toast } from "./Toast";
import { SwapVerticalIcon } from "./icons";

type ActiveField = "from" | "to";

export function SwapForm({ tokens }: { tokens: TokenPrice[] }) {
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const [reverseRotation, setReverseRotation] = useState(0);

  const priceOf = useMemo(() => {
    const map = new Map(tokens.map((t) => [t.symbol, t.price]));
    return (symbol: string) => map.get(symbol) ?? 0;
  }, [tokens]);

  const [fromSymbol, setFromSymbol] = useState(
    () => tokens.find((t) => t.symbol === "ETH")?.symbol ?? tokens[0].symbol,
  );
  const [toSymbol, setToSymbol] = useState(
    () => tokens.find((t) => t.symbol === "USDC")?.symbol ?? tokens[1]?.symbol ?? tokens[0].symbol,
  );
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [activeField, setActiveField] = useState<ActiveField>("from");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fromPrice = priceOf(fromSymbol);
  const toPrice = priceOf(toSymbol);
  const sameToken = fromSymbol === toSymbol;
  const parsedFromAmount = parseFloat(fromAmount);
  const isAmountValid = Number.isFinite(parsedFromAmount) && parsedFromAmount > 0;
  const canSubmit = !submitting && !sameToken && isAmountValid;

  useEffect(() => {
    if (!successMessage) return;
    const id = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(id);
  }, [successMessage]);

  function handleFromAmountChange(raw: string) {
    const cleaned = sanitizeAmountInput(raw);
    setActiveField("from");
    setSuccessMessage(null);
    setFromAmount(cleaned);
    const amount = parseFloat(cleaned);
    setToAmount(Number.isFinite(amount) && toPrice > 0 ? formatAmount((amount * fromPrice) / toPrice) : "");
  }

  function handleToAmountChange(raw: string) {
    const cleaned = sanitizeAmountInput(raw);
    setActiveField("to");
    setSuccessMessage(null);
    setToAmount(cleaned);
    const amount = parseFloat(cleaned);
    setFromAmount(Number.isFinite(amount) && fromPrice > 0 ? formatAmount((amount * toPrice) / fromPrice) : "");
  }

  function handleFromTokenChange(symbol: string) {
    setFromSymbol(symbol);
    const newFromPrice = priceOf(symbol);
    if (activeField === "from") {
      const amount = parseFloat(fromAmount);
      setToAmount(Number.isFinite(amount) && toPrice > 0 ? formatAmount((amount * newFromPrice) / toPrice) : "");
    } else {
      const amount = parseFloat(toAmount);
      setFromAmount(Number.isFinite(amount) && newFromPrice > 0 ? formatAmount((amount * toPrice) / newFromPrice) : "");
    }
  }

  function handleToTokenChange(symbol: string) {
    setToSymbol(symbol);
    const newToPrice = priceOf(symbol);
    if (activeField === "from") {
      const amount = parseFloat(fromAmount);
      setToAmount(Number.isFinite(amount) && newToPrice > 0 ? formatAmount((amount * fromPrice) / newToPrice) : "");
    } else {
      const amount = parseFloat(toAmount);
      setFromAmount(Number.isFinite(amount) && fromPrice > 0 ? formatAmount((amount * newToPrice) / fromPrice) : "");
    }
  }

  function focusField(ref: React.RefObject<HTMLInputElement | null>, e: React.MouseEvent) {
    // Let the token dropdown's own click handle itself instead of stealing focus.
    if ((e.target as HTMLElement).closest(".token-select")) return;
    ref.current?.focus();
  }

  function handleReverse() {
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
    setActiveField(activeField === "from" ? "to" : "from");
    setReverseRotation((r) => r + 180);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setSuccessMessage(null);

    // Simulated backend call — in a real app this would hit a swap endpoint.
    setTimeout(() => {
      setSuccessMessage(`Swapped ${fromAmount} ${fromSymbol} for ${toAmount} ${toSymbol}.`);
      setFromAmount("");
      setToAmount("");
      setSubmitting(false);
    }, 1500);
  }

  const rateLine =
    fromPrice > 0 && toPrice > 0
      ? `1 ${fromSymbol} ≈ ${formatAmount(fromPrice / toPrice)} ${toSymbol}`
      : "";
  const fromUsdHint = isAmountValid ? `≈ $${(parsedFromAmount * fromPrice).toFixed(2)}` : "";
  const parsedToAmount = parseFloat(toAmount);
  const toUsdHint =
    Number.isFinite(parsedToAmount) && parsedToAmount > 0 ? `≈ $${(parsedToAmount * toPrice).toFixed(2)}` : "";

  return (
    <>
      <Toast message={successMessage} />
      <form className="swap-form" onSubmit={handleSubmit}>
        <h1 className="swap-form__title">Swap</h1>

        <div className="field" onClick={(e) => focusField(fromInputRef, e)}>
          <div className="field__row">
            <label className="field__label" htmlFor="from-amount">
              You send
            </label>
            <span className="field__balance-hint">{fromUsdHint}</span>
          </div>
          <div className="field__control">
            <TokenSelect tokens={tokens} value={fromSymbol} onChange={handleFromTokenChange} disabled={submitting} />
            <input
              ref={fromInputRef}
              id="from-amount"
              className="field__input"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.0"
              value={fromAmount}
              disabled={submitting}
              onChange={(e) => handleFromAmountChange(e.target.value)}
            />
          </div>
        </div>

        <motion.button
          type="button"
          className="swap-direction"
          aria-label="Reverse swap direction"
          disabled={submitting}
          onClick={handleReverse}
          animate={{ rotate: reverseRotation }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          whileHover={submitting ? undefined : { scale: 1.12 }}
          whileTap={submitting ? undefined : { scale: 0.85, rotate: reverseRotation + 30 }}
        >
          <SwapVerticalIcon />
        </motion.button>

        <div className="field" onClick={(e) => focusField(toInputRef, e)}>
          <div className="field__row">
            <label className="field__label" htmlFor="to-amount">
              You receive
            </label>
            <span className="field__balance-hint">{toUsdHint}</span>
          </div>
          <div className="field__control">
            <TokenSelect tokens={tokens} value={toSymbol} onChange={handleToTokenChange} disabled={submitting} />
            <input
              ref={toInputRef}
              id="to-amount"
              className="field__input"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.0"
              value={toAmount}
              disabled={submitting}
              onChange={(e) => handleToAmountChange(e.target.value)}
            />
          </div>
        </div>

        <p className="rate-line">{rateLine}</p>
        <p className="error-line" role="alert">
          {sameToken ? "Please choose two different tokens." : ""}
        </p>

        <motion.button
          type="submit"
          className="btn btn--primary"
          disabled={!canSubmit}
          whileHover={canSubmit ? { scale: 1.02 } : undefined}
          whileTap={canSubmit ? { scale: 0.96 } : undefined}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {submitting ? (
              <motion.span
                key="loading"
                className="btn__content"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <motion.span
                  className="btn__spinner"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                />
                Swapping…
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                className="btn__content"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                Confirm Swap
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </form>
    </>
  );
}
