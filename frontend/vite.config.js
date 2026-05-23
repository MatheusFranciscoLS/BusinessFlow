import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./", // <--- ISSO É O QUE CORRIGE O CSS NO F5
});
