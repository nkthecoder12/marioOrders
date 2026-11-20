import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const dir = path.dirname(fileURLToPath(import.meta.url));

function lanIPv4(): string | null {
  const ifaces = os.networkInterfaces();
  for (const list of Object.values(ifaces)) {
    for (const iface of list ?? []) {
      if (iface.family === "IPv4" && !iface.internal) return iface.address;
    }
  }
  return null;
}

function printLanUrl(): Plugin {
  return {
    name: "print-lan-url",
    configureServer(server) {
      server.httpServer?.once("listening", () => {
        const lan = lanIPv4();
        const port = server.config.server.port ?? 5173;
        console.log("\n  Mario Juice — open on phones (same Wi-Fi):\n");
        if (lan) {
          console.log(`    Customer + Admin UI:  http://${lan}:${port}\n`);
        } else {
          console.log(`    Local only:           http://localhost:${port}\n`);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), printLanUrl()],
  resolve: {
    alias: {
      "@shared": path.resolve(dir, "../shared"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
        timeout: 0,
      },
    },
  },
});
