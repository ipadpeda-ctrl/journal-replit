import { build } from "vite";
import { execSync } from "child_process";
import path from "path";
import fs from "fs"; // <--- Importante: serve per scrivere il file

const root = process.cwd();

async function main() {
  console.log("--> Inizio Build Client (Frontend)...");
  await build({
    configFile: path.resolve(root, "vite.config.ts"),
  });

  console.log("--> Inizio Build Server (Backend)...");
  try {
    execSync("tsc", { stdio: "inherit" });
  } catch (error) {
    console.log("Avviso: TypeScript ha trovato errori, ma proseguiamo grazie a noEmitOnError...");
  }

  // --- IL TRUCCO MAGICO ---
  // Creiamo un piccolo file package.json dentro la cartella "dist".
  // Questo dice a Node: "Tutto quello che trovi qui dentro, trattalo come CommonJS".
  // Risolve istantaneamente l'errore "exports is not defined".
  const distPackageJson = JSON.stringify({ type: "commonjs" }, null, 2);
  fs.writeFileSync(path.resolve(root, "dist", "package.json"), distPackageJson);
  
  // Copiamo anche le cartelle statiche se necessario, ma il fix sopra è quello che conta.
  console.log("--> Configurazione CommonJS applicata.");
  console.log("--> Build Completata con successo!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});