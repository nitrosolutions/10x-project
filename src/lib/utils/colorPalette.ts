/**
 * Dynamiczny generator kolorów dla kategorii
 * Używa predefiniowanej palety kolorów harmonijnych
 */

// Paleta kolorów harmonijnych (hex)
const COLOR_PALETTE = [
  "#ef4444", // Czerwony
  "#f97316", // Pomarańczowy
  "#eab308", // Żółty
  "#22c55e", // Zielony
  "#06b6d4", // Cyjan
  "#3b82f6", // Niebieski
  "#8b5cf6", // Fioletowy
  "#ec4899", // Różowy
  "#6b7280", // Szary
  "#d4af37", // Złoty
  "#06d6d0", // Turkus
  "#ff006e", // Magenta
];

/**
 * Pobiera kolor dla kategorii na podstawie jej ID
 * Używa modulo operatora do cyklicznego mapowania na paletę
 *
 * @param categoryId - ID kategorii
 * @returns Kod koloru w formacie hex
 */
export function getCategoryColor(categoryId: number): string {
  const index = (categoryId - 1) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
}

/**
 * Zwraca całą paletę kolorów
 */
export function getColorPalette(): string[] {
  return COLOR_PALETTE;
}

/**
 * Mapuje kategorie do kolorów
 *
 * @param categoryIds - Tablica ID kategorii
 * @returns Mapa { categoryId -> color }
 */
export function mapCategoriesToColors(categoryIds: number[]): Record<number, string> {
  const colorMap: Record<number, string> = {};

  for (const categoryId of categoryIds) {
    colorMap[categoryId] = getCategoryColor(categoryId);
  }

  return colorMap;
}
