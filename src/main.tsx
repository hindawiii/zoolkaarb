import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { useUser } from "./store/userStore";

// Apply persisted preferences before render
const applyPrefs = (state: ReturnType<typeof useUser.getState>) => {
  document.documentElement.classList.toggle("dark", state.darkMode);
  document.documentElement.dir = state.language === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = state.language;
};
applyPrefs(useUser.getState());
// Re-apply after persist rehydration + on every change
useUser.subscribe(applyPrefs);

createRoot(document.getElementById("root")!).render(<App />);
