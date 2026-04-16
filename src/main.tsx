import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { useUser } from "./store/userStore";

// Apply persisted dark mode before render
if (useUser.getState().darkMode) {
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")!).render(<App />);
