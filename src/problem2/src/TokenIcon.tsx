import { useState } from "react";
import { iconUrl } from "./prices";

export function TokenIcon({ symbol }: { symbol: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span className="token-icon token-icon--fallback" aria-hidden="true" />;
  }

  return (
    <img
      className="token-icon"
      src={iconUrl(symbol)}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
