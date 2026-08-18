import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { TokenPrice } from "./types";
import { formatUsd } from "./prices";
import { TokenIcon } from "./TokenIcon";

interface TokenSelectProps {
  tokens: TokenPrice[];
  value: string;
  onChange: (symbol: string) => void;
  disabled?: boolean;
}

// Custom searchable token dropdown — native <select> can't show icons/prices per option.
export function TokenSelect({ tokens, value, onChange, disabled }: TokenSelectProps) {
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = tokens.filter((t) => t.symbol.toUpperCase().includes(query.trim().toUpperCase()));

  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("click", handleClick);
    searchRef.current?.focus();
    setHighlightedIndex(Math.max(0, tokens.findIndex((t) => t.symbol === value)));

    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  function selectToken(symbol: string) {
    onChange(symbol);
    setOpen(false);
    setQuery("");
    buttonRef.current?.focus();
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const token = filtered[highlightedIndex];
      if (token) selectToken(token.symbol);
    }
  }

  const activeOptionId =
    filtered[highlightedIndex] != null ? `${listboxId}-opt-${filtered[highlightedIndex].symbol}` : undefined;

  return (
    <div className="token-select" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="token-select__button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((o) => !o)}
      >
        <TokenIcon symbol={value} />
        <span>{value}</span>
        <span className="token-select__caret">▾</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="token-select__panel"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.1 } }}
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
          >
            <input
              ref={searchRef}
              type="text"
              role="combobox"
              className="token-select__search"
              placeholder="Search token"
              value={query}
              aria-expanded={open}
              aria-controls={listboxId}
              aria-activedescendant={activeOptionId}
              autoComplete="off"
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleSearchKeyDown}
            />
            <ul className="token-select__list" role="listbox" id={listboxId} aria-label="Tokens">
              {filtered.length === 0 && <li className="token-select__empty">No tokens found</li>}
              {filtered.map((token, index) => (
                <li
                  key={token.symbol}
                  id={`${listboxId}-opt-${token.symbol}`}
                  role="option"
                  aria-selected={token.symbol === value}
                  className={`token-select__item${token.symbol === value ? " is-selected" : ""}${
                    index === highlightedIndex ? " is-highlighted" : ""
                  }`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => selectToken(token.symbol)}
                >
                  <TokenIcon symbol={token.symbol} />
                  <span className="token-select__symbol">{token.symbol}</span>
                  <span className="token-select__price">{formatUsd(token.price)}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
