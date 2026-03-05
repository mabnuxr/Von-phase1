import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Plugin to automatically replace S3 URLs with proxy URLs in development
function s3ProxyPlugin() {
  const s3BaseUrl = "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com";
  const proxyPath = "/s3-assets";

  return {
    name: "s3-proxy-transform",
    transform(code: string, id: string) {
      // Only transform in development mode and for JS/TS files
      if (
        process.env.NODE_ENV === "development" &&
        /\.(js|ts|jsx|tsx)$/.test(id)
      ) {
        // Replace S3 URLs with proxy URLs
        return {
          code: code.replace(new RegExp(s3BaseUrl, "g"), proxyPath),
          map: null,
        };
      }
      return null;
    },
  };
}

// https://vite.dev/config/
/// <reference types="vitest/config" />
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, path.resolve(__dirname, ".."), "");

  return {
    plugins: [react(), tailwindcss(), s3ProxyPlugin()],
    resolve:
      mode === "development"
        ? {
            alias: [
              // CSS files use the built dist version to avoid @import ordering issues
              {
                find: "@vonlabs/design-components/dist/design-components.css",
                replacement: path.resolve(
                  __dirname,
                  "../design-components/dist/design-components.css"
                ),
              },
              {
                find: "@vonlabs/design-components/styles",
                replacement: path.resolve(
                  __dirname,
                  "../design-components/dist/design-components.css"
                ),
              },
              // JS/TS files use source for better debugging with sourcemaps
              {
                find: "@vonlabs/design-components",
                replacement: path.resolve(
                  __dirname,
                  "../design-components/src"
                ),
              },
            ],
          }
        : undefined,
    envDir: path.resolve(__dirname, ".."),
    server: {
      port: 5173, // always start on 5173
      strictPort: true, // fail if it's already in use
      proxy: {
        "/api": {
          target: env.VITE_API_BASE_URL || "http://localhost:4173",
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
          configure: (proxy) => {
            proxy.on("error", (err) => {
              console.log("proxy error", err);
            });
          },
        },
        "/s3-assets": {
          target: "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/s3-assets/, ""),
          configure: (proxy) => {
            proxy.on("error", (err) => {
              console.log("S3 proxy error", err);
            });
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.removeHeader("origin");
            });
          },
        },
      },
    },
    preview: {
      allowedHosts: ["app.vonlabs.ai"],
    },
    optimizeDeps: {
      include: ["@thesysai/genui-sdk", "@crayonai/react-ui"],
    },
    test: {
      environment: "node",
      include: ["src/**/*.test.ts"],
      setupFiles: ["src/__tests__/setup.ts"],
      alias: [
        {
          find: "@vonlabs/design-components",
          replacement: path.resolve(
            __dirname,
            "src/__tests__/stubs/design-components.ts",
          ),
        },
      ],
    },
  };
});
