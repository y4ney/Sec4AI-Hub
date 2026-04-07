import { defineConfig } from "vite";
import { readFileSync, existsSync, statSync } from "fs";
import { join, extname } from "path";
import { cpSync } from "fs";

const MIME: Record<string, string> = {
  ".md": "text/markdown; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function wikiPlugin() {
  return {
    name: "serve-wiki",
    // Serve wiki/ at /wiki during dev
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: () => void) => {
        if (!req.url?.startsWith("/wiki/")) return next();
        const filePath = join(process.cwd(), req.url);
        if (existsSync(filePath) && statSync(filePath).isFile()) {
          res.setHeader("Content-Type", MIME[extname(filePath)] || "application/octet-stream");
          res.end(readFileSync(filePath));
          return;
        }
        next();
      });
    },
    // Copy wiki/ into dist/ after build
    closeBundle() {
      if (existsSync("dist")) {
        cpSync("wiki", "dist/wiki", { recursive: true });
      }
    },
  };
}

export default defineConfig({
  base: process.env.CI ? "/Sec4AI-Hub/" : "/",
  server: {
    host: "127.0.0.1",
  },
  plugins: [wikiPlugin()],
});
