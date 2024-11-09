import { create } from "zustand";

type Store = {
  active: string;
  setActive: (active: string) => void;
};

export const stores = create<Store>()((set) => ({
  active: "1-4",
  setActive: (active) => set({ active }),
}));
