import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as Colombian Pesos (COP)
 * Format: $1.660.000 (dot as thousands separator, no decimals)
 */
export function formatCOP(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return "$0";

  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) return "$0";

  // Round to integer and format with dots as thousands separator
  const formatted = Math.round(numAmount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `$${formatted}`;
}
