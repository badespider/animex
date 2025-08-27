"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type FavItem = { id: string; title: string; cover?: string; year?: number; type?: string; addedAt?: number };

type State = {
  items: Record<string, FavItem>;
  toggle: (item: FavItem) => void;
  remove: (id: string) => void;
  has: (id: string) => boolean;
  list: () => FavItem[];
  clear: () => void;
  importFrom: (items: FavItem[]) => void;
  exportList: () => FavItem[];
};

export const useFavorites = create<State>()(
  persist(
    (set, get) => ({
      items: {},
      toggle: (item) =>
        set((s) => {
          const next = { ...s.items };
          if (next[item.id]) delete next[item.id];
          else next[item.id] = { ...item, addedAt: Date.now(), };
          return { items: next } as State;
        }),
      remove: (id) => set((s) => ({ items: Object.fromEntries(Object.entries(s.items).filter(([k]) => k !== id)) } as State)),
      has: (id) => Boolean(get().items[id]),
      list: () => Object.values(get().items),
      clear: () => set({ items: {} } as State),
      importFrom: (items) => set((s) => {
        const merged = { ...s.items } as Record<string, FavItem>;
        for (const it of items) {
          if (!it || !it.id) continue;
          merged[it.id] = { ...merged[it.id], ...it, addedAt: merged[it.id]?.addedAt ?? it.addedAt ?? Date.now() };
        }
        return { items: merged } as State;
      }),
      exportList: () => Object.values(get().items),
    }),
    { name: "animex:favorites" },
  ),
);

