import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppLanguage = "ar" | "en";

interface UserState {
  name: string;
  language: AppLanguage;
  darkMode: boolean;
  notifications: boolean;
  lastLocation: { lat: number; lon: number; city?: string } | null;
  setName: (n: string) => void;
  setLanguage: (l: AppLanguage) => void;
  setDarkMode: (v: boolean) => void;
  setNotifications: (v: boolean) => void;
  setLastLocation: (loc: UserState["lastLocation"]) => void;
}

export const useUser = create<UserState>()(
  persist(
    (set) => ({
      name: "صديقي",
      language: "ar",
      darkMode: false,
      notifications: true,
      lastLocation: null,
      setName: (name) => set({ name }),
      setLanguage: (language) => set({ language }),
      setDarkMode: (darkMode) => {
        set({ darkMode });
        if (typeof document !== "undefined") {
          document.documentElement.classList.toggle("dark", darkMode);
        }
      },
      setNotifications: (notifications) => set({ notifications }),
      setLastLocation: (lastLocation) => set({ lastLocation }),
    }),
    { name: "zoolkaarb-user" },
  ),
);
