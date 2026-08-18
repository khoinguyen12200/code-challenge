import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

export function Toast({ message }: { message: string | null }) {
  // Portalled straight to <body> so it's never affected by the swap card's
  // own layout/transform/overflow — it's a page-level notification, not
  // part of the card.
  return createPortal(
    <div className="toast-layer">
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            className="toast"
            role="status"
            initial={{ opacity: 0, y: -28, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.95, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
          >
            <motion.span
              className="toast__icon"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.05 }}
            >
              ✓
            </motion.span>
            <span>{message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
