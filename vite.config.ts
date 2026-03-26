import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), basicSsl()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "ReactFaceIdCapture",
      formats: ["es", "cjs"],
      fileName: "react-face-id-capture",
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "i18next",
        "react-i18next",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "jsxRuntime",
          i18next: "i18next",
          "react-i18next": "reactI18next",
        },
      },
    },
  },
});
