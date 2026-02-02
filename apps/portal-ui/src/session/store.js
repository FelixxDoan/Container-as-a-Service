import { create } from "zustand";
import { persist } from "zustand/middleware";
import classData from "../hooks/under/useClassData";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      role: null,

      setUser: (user) => set({ user }),
      setRole: (role) => set({ role }),

      clearAuth: () => set({ user: null, role: null }),

      isAuthenticated: () => Boolean(get().user),
    }),
    { name: "auth" }
  )
);

export const useClassStore = create((set) => ({
  classes: [],
  loading: false,
  error: null,

  fetchClasses: async () => {
    set({ loading: true, error: null });
    try {
      const classes = await classData(); // nhận mảng class
      set({ classes, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

}));

export const useRepoStore = create((set) => ({
  treeByPath: {},
  blobByPath: {},

  setTree: (key, data) =>
    set((state) => ({
      treeByPath: { ...state.treeByPath, [key]: data },
    })),

  setBlob: (key, data) =>
    set((state) => ({
      blobByPath: { ...state.blobByPath, [key]: data },
    })),

  clearRepo: () => set({ treeByPath: {}, blobByPath: {} }),
}));
