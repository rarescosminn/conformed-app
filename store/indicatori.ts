import { create } from "zustand";

export type Point = { date: string; year: number; month: number; value: number };
export type SeriePoints = { label: string; points: Point[] };
export type SerieLegacy = { label: string; labels: string[]; values: number[] };
export type SeriesMap = Record<string, SeriePoints | SerieLegacy>;

export const isPointsSerie = (s: SeriePoints | SerieLegacy): s is SeriePoints =>
    (s as any).points && Array.isArray((s as any).points);

type IndicatoriState = {
    series: SeriesMap;
    activeYears: number[];
    setActiveYears: (y: number[]) => void;
    setSeries: (s: SeriesMap) => void;
    mergeUploaded: (s: SeriesMap) => void;
    reset: () => void;
};

export const useIndicatoriStore = create<IndicatoriState>((set) => ({
    series: {},
    activeYears: [],
    setActiveYears: (y) => set({ activeYears: y }),
    setSeries: (s) => set({ series: s }),
    mergeUploaded: (s) => set((prev) => ({ series: { ...prev.series, ...s } })),
    reset: () => set({ series: {}, activeYears: [] }),
}));
