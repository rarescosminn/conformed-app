import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Period = "lunar" | "trimestrial" | "anual";
export type ChartKind = "line" | "bar" | "area" | "stacked";

type IndicatoriUiState = {
  category: string;
  selected: string[];
  period: Period;
  chartKind: ChartKind;
  setCategory: (v: string) => void;
  setSelected: (v: string[]) => void;
  setPeriod: (v: Period) => void;
  setChartKind: (v: ChartKind) => void;
};

export const useIndicatoriUi = create<IndicatoriUiState>()(
  persist(
    (set) => ({
      category: "Venituri",
      selected: ["venituri_totale"],
      period: "lunar",
      chartKind: "line",
      setCategory: (v) => set({ category: v }),
      setSelected: (v) => set({ selected: v }),
      setPeriod: (v) => set({ period: v }),
      setChartKind: (v) => set({ chartKind: v }),
    }),
    {
      name: "indicatori-ui",                          // 🔒 persistă doar setările UI
      storage: createJSONStorage(() => localStorage), // nu persistăm înălțimea cardului
      partialize: (s) => ({
        category: s.category,
        selected: s.selected,
        period: s.period,
        chartKind: s.chartKind,
      }),
    }
  )
);
