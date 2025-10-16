import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { StatsDto } from "@/types";
import { useCategories } from "@/components/hooks/useCategories";
import { getCategoryColor } from "@/lib/utils/colorPalette";

interface StatsChartProps {
  stats: StatsDto | null;
  isLoading: boolean;
}

/**
 * Komponent wykresu donut do wizualizacji wydatków per kategoria
 *
 * Wyświetla:
 * - Podział wydatków na kategorie w postaci wykresu donut
 * - Sumę wszystkich wydatków w środku wykresu
 * - Legendę z kategoriami
 * - Tooltip z informacją o kwocie po najechaniu
 *
 * Kolory są generowane dynamicznie na podstawie ID kategorii
 * Nazwy i ikony kategorii są pobierane z API
 */
export function StatsChart({ stats, isLoading }: StatsChartProps) {
  // Pobieranie kategorii
  const { categories } = useCategories();

  // Mapowanie kategii ID -> dane kategorii
  const categoryMap = useMemo(() => {
    const map: Record<number, { name: string; icon: string }> = {};

    for (const category of categories) {
      map[category.id] = {
        name: category.name,
        icon: category.icon,
      };
    }

    return map;
  }, [categories]);

  // Przygotowanie danych do wykresu
  const chartData = useMemo(() => {
    if (!stats || !stats.totals || stats.totals.length === 0) {
      return [];
    }

    return stats.totals.map((item) => {
      const category = categoryMap[item.category_id];
      const categoryName = category ? `${category.icon} ${category.name}` : `Kategoria ${item.category_id}`;

      return {
        name: categoryName,
        value: item.amount,
        category_id: item.category_id,
      };
    });
  }, [stats, categoryMap]);

  // Stan ładowania
  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-slate-50 rounded-lg">
        <div className="text-center space-y-2">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="text-sm text-muted-foreground">Ładowanie statystyk...</p>
        </div>
      </div>
    );
  }

  // Brak danych
  if (!stats || chartData.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-slate-50 rounded-lg">
        <p className="text-sm text-muted-foreground">Brak danych do wyświetlenia</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-slate-200 rounded-lg p-4 sm:p-6 mb-6 max-w-full overflow-hidden">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
            label={(entry) => `${(entry.value as number).toFixed(2)} PLN`}
          >
            {chartData.map((entry) => (
              <Cell key={`cell-${entry.category_id}`} fill={getCategoryColor(entry.category_id)} />
            ))}
          </Pie>

          <Tooltip
            contentStyle={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
            }}
            formatter={(value: number) => `${value.toFixed(2)} PLN`}
            labelFormatter={(label) => `${label}`}
          />

          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{
              paddingTop: "20px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Wyświetlanie sumy całkowitej */}
      <div className="mt-6 pt-4 border-t border-slate-200 text-center">
        <p className="text-sm text-muted-foreground mb-1">Suma całkowita</p>
        <p className="text-2xl font-bold text-slate-900">{stats.grand_total.toFixed(2)} PLN</p>
      </div>
    </div>
  );
}
