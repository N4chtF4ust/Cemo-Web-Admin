import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./app.css";
import { initTheme } from "./lib/theme";

// Applies the saved theme preference, falling back to the system setting.
initTheme();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
