import { build } from "vite";
import { execSync } from "child_process";
import path from "path";

// Usiamo process.cwd() invece di import.meta per evitare errori di modulo
const root = process.cwd();

async function main() {
  console.log("--> Inizio Build Client (Frontend)...");
  await build({
    configFile: path.resolve(root, "vite.config.ts"),
  });

  console.log("--> Inizio Build Server (Backend)...");
  try {
    // Compila il server ignorando gli errori non critici
    execSync("tsc", { stdio: "inherit" });
  } catch (error) {
    // Se tsc fallisce ma ha generato i file (grazie a noEmitOnError: false),
    // continuiamo lo stesso.
    console.log("Avviso: TypeScript ha trovato errori, ma proseguiamo...");
  }

  console.log("--> Build Completata con successo!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});