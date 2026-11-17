export const LEGACY_LIBRARY_FINE_PER_DAY = 15;
export const LIBRARY_FINE_PRICE_DIVISOR = 20;

export function dailyFineForBookPrice(bookPrice: number | null): number {
  if (bookPrice === null) return LEGACY_LIBRARY_FINE_PER_DAY;
  return Math.round((bookPrice / LIBRARY_FINE_PRICE_DIVISOR) * 100) / 100;
}

export function calculateOverdueFine(
  bookPrice: number | null,
  overdueDays: number
): { dailyRate: number; total: number } {
  const dailyRate = dailyFineForBookPrice(bookPrice);
  return {
    dailyRate,
    total: Math.round(dailyRate * Math.max(0, overdueDays) * 100) / 100,
  };
}
