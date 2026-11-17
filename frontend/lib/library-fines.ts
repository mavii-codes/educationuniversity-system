export const LEGACY_LIBRARY_FINE_PER_DAY = 15;
export const LIBRARY_FINE_PRICE_DIVISOR = 20;

function roundToCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function dailyFineForBookPrice(bookPrice: number): number {
  return roundToCents(bookPrice / LIBRARY_FINE_PRICE_DIVISOR);
}

export function dailyFineForLoanPrice(
  bookPriceAtBorrow: number | null | undefined
): number {
  return bookPriceAtBorrow == null
    ? LEGACY_LIBRARY_FINE_PER_DAY
    : dailyFineForBookPrice(bookPriceAtBorrow);
}

export function estimateOverdueFine(
  dailyRate: number,
  overdueDays: number
): number {
  return roundToCents(dailyRate * Math.max(0, overdueDays));
}
