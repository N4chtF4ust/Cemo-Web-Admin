import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./app.css";

// Automatically follow system theme
(function() {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function setTheme() {
    const isDark = mediaQuery.matches;
    document.documentElement.classList.toggle('dark', isDark);
  }

  setTheme();

  mediaQuery.addEventListener("change", setTheme);
})();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
