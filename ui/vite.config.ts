import path from "path"
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  const suggestedQuestionsPath = env["SUGGESTED_QUESTIONS_PATH"]
    ?? path.resolve(__dirname, "../configs/suggested-questions.json")

  return {
    plugins: [
      tailwindcss(),
      react(),
    ],
    define: {
      __APP_TITLE__: JSON.stringify(env["APP_TITLE"] ?? "Agentic AI"),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@suggested-questions": suggestedQuestionsPath,
      },
    },
  }
})
