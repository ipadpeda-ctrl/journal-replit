import { build } from "vite";
import { build as esbuild } from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("--> Inizio Build Client (Frontend)...");
  // Costruisce il frontend
  await build({
    configFile: path.resolve(__dirname, "../vite.config.ts"),
  });

  console.log("--> Inizio Build Server (Backend)...");
  // Costruisce il backend
  await esbuild({
    entryPoints: ["server/index.ts"],
    bundle: true,
    platform: "node",
    format: "cjs",
    outfile: "dist/index.cjs",
    // QUESTA è la modifica fondamentale:
    packages: "external", 
    // Dice a esbuild di non includere le librerie nel file finale
    // ma di lasciarle come "require(...)" che Node.js sa gestire.
  });

  console.log("--> Build Completata con successo!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});