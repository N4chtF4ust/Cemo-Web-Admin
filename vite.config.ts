import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  base: "./",
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
});
