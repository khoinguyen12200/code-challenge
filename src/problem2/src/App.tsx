import { useEffect, useState } from "react";
import type { TokenPrice } from "./types";
import { fetchTokenPrices } from "./prices";
import { SwapForm } from "./SwapForm";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; tokens: TokenPrice[] };

export default function App() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    load();
  }, []);

  function load() {
    setState({ status: "loading" });
    fetchTokenPrices()
      .then((tokens) => {
        if (tokens.length < 2) {
          setState({ status: "error", message: "Not enough priced tokens available to swap." });
          return;
        }
        setState({ status: "ready", tokens });
      })
      .catch((err) =>
        setState({ status: "error", message: err instanceof Error ? err.message : "Unknown error" }),
      );
  }

  return (
    <main className="page">
      <div className="card">
        {state.status === "loading" && (
          <div className="card__loading">
            <div className="spinner" aria-hidden="true" />
            <p>Loading token prices&hellip;</p>
          </div>
        )}

        {state.status === "error" && (
          <div className="card__error">
            <p>Couldn't load token prices.</p>
            <p className="card__error-detail">{state.message}</p>
            <button type="button" className="btn btn--secondary" onClick={load}>
              Try again
            </button>
          </div>
        )}

        {state.status === "ready" && <SwapForm tokens={state.tokens} />}
      </div>
    </main>
  );
}
