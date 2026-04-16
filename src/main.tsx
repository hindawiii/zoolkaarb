import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { useUser } from "./store/userStore";

// Apply persisted preferences before render
const initialState = useUser.getState();
if (initialState.darkMode) {
  document.documentElement.classList.add("dark");
}
document.documentElement.dir = initialState.language === "ar" ? "rtl" : "ltr";
document.documentElement.lang = initialState.language;

createRoot(document.getElementById("root")!).render(<App />);
