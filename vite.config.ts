import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 5173, // ব্যাকএন্ডের সাথে কনফ্লিক্ট এড়াতে পোর্ট পরিবর্তন করা হয়েছে
    strictPort: true,
    hmr: {
      overlay: false,
    },
    // ব্যাকএন্ডের সাথে কথা বলার জন্য প্রক্সি সেটআপ (ঐচ্ছিক কিন্তু দরকারি)
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));