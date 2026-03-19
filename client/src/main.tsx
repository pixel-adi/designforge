import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

try {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (err) {
  console.error("App failed to render:", err);
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `<div style="padding:40px;font-family:sans-serif;text-align:center">
      <h2>Something went wrong</h2>
      <p style="color:#666">${err instanceof Error ? err.message : 'Unknown error'}</p>
    </div>`;
  }
}
