import { build } from "vite";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("--> Inizio Build Client (Frontend)...");
  // 1. Costruisce il frontend (Vite)
  await build({
    configFile: path.resolve(__dirname, "../vite.config.ts"),
  });

  console.log("--> Inizio Build Server (Backend)...");
  // 2. Costruisce il backend usando TSC (TypeScript Compiler) invece di esbuild
  // Questo evita i problemi di minificazione e "app2 is not a function"
  try {
    execSync("tsc", { stdio: "inherit" });
  } catch (error) {
    console.error("Errore durante la compilazione del server:");
    throw error;
  }

  // 3. Copia i file statici (se necessario, ma Vite lo fa già)
  console.log("--> Build Completata con successo!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});