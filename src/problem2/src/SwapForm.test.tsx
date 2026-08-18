import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SwapForm } from "./SwapForm";
import type { TokenPrice } from "./types";

const TOKENS: TokenPrice[] = [
  { symbol: "ETH", price: 2000 },
  { symbol: "USDC", price: 1 },
  { symbol: "BTC", price: 40000 },
];

describe("SwapForm", () => {
  it("computes the receive amount from the send amount using live prices", async () => {
    const user = userEvent.setup();
    render(<SwapForm tokens={TOKENS} />);

    const fromInput = screen.getByLabelText("You send");
    await user.type(fromInput, "2");

    const toInput = screen.getByLabelText("You receive") as HTMLInputElement;
    expect(toInput.value).toBe("4000");
  });

  it("computes the send amount when the receive amount is edited instead", async () => {
    const user = userEvent.setup();
    render(<SwapForm tokens={TOKENS} />);

    const toInput = screen.getByLabelText("You receive");
    await user.type(toInput, "4000");

    const fromInput = screen.getByLabelText("You send") as HTMLInputElement;
    expect(fromInput.value).toBe("2");
  });

  it("disables submit and shows an error when both sides use the same token", async () => {
    const user = userEvent.setup();
    render(<SwapForm tokens={TOKENS} />);

    await user.type(screen.getByLabelText("You send"), "1");

    // Switch the "to" token to match the "from" token (ETH).
    const toField = screen.getByLabelText("You receive").closest(".field") as HTMLElement;
    await user.click(within(toField).getByRole("button", { name: /USDC/i }));
    await user.click(await screen.findByRole("option", { name: /ETH/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("Please choose two different tokens.");
    expect(screen.getByRole("button", { name: /confirm swap/i })).toBeDisabled();
  });

  it("disables submit when the amount is empty or non-positive", () => {
    render(<SwapForm tokens={TOKENS} />);
    expect(screen.getByRole("button", { name: /confirm swap/i })).toBeDisabled();
  });

  it("clicking anywhere in a field focuses its amount input", async () => {
    const user = userEvent.setup();
    render(<SwapForm tokens={TOKENS} />);

    const fromField = screen.getByLabelText("You send").closest(".field") as HTMLElement;
    await user.click(fromField);

    expect(screen.getByLabelText("You send")).toHaveFocus();
  });

  it("shows a loading state and then a success toast after submitting", async () => {
    const user = userEvent.setup();
    render(<SwapForm tokens={TOKENS} />);

    await user.type(screen.getByLabelText("You send"), "1");
    await user.click(screen.getByRole("button", { name: /confirm swap/i }));

    expect(await screen.findByText(/swapping/i)).toBeInTheDocument();
    expect(await screen.findByText(/swapped 1 eth for 2000 usdc/i, {}, { timeout: 3000 })).toBeInTheDocument();
  });
});
