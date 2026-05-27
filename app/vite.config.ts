/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import fs from "node:fs";
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

// Pre-gzip large text assets at build time so nginx (`gzip_static on`) serves
// them with zero per-request CPU. Without this, nginx re-gzips the ~13 MB app
// bundle on every cache-miss, which throttled against the pod's CPU limit and
// caused intermittent minute-long .js loads after deploys.
function precompressAssets(): Plugin {
  return {
    name: "precompress-assets",
    apply: "build",
    writeBundle(options, bundle) {
      const outDir = options.dir;
      if (!outDir) return;
      for (const fileName of Object.keys(bundle)) {
        if (!/\.(js|css|svg|json)$/.test(fileName)) continue;
        const filePath = path.join(outDir, fileName);
        try {
          const raw = fs.readFileSync(filePath);
          if (raw.length < 1024) continue; // matches nginx gzip_min_length
          const gz = zlib.gzipSync(raw, { level: 9 });
          if (gz.length < raw.length) fs.writeFileSync(`${filePath}.gz`, gz);
        } catch {
          // emitted entry not on disk — skip
        }
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, path.resolve(__dirname, ".."), "");

  return {
    plugins: [react(), tailwindcss(), s3ProxyPlugin(), precompressAssets()],
    resolve: {
      // Prevent duplicate React instances from different packages
      dedupe: ["react", "react-dom"],
      ...(mode === "development"
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
        : {}),
    },
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
          cookieDomainRewrite: "",
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
