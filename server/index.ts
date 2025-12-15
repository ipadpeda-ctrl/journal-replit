import express, { type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware per il logging delle richieste (utile per debug)
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

(async () => {
  // 1. Registra le rotte e ottieni il server HTTP
  // Qui passiamo 'app' che è stata creata correttamente con express()
  const server = await registerRoutes(app);

  // 2. Gestione errori globale
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // 3. Configura il Frontend (Dev vs Prod)
  if (app.get("env") === "development") {
    await setupVite(server, app);
  } else {
    // IMPORTANTE: Su Render siamo in produzione, quindi usiamo serveStatic
    serveStatic(app);
  }

  // 4. Avvia il server
  // Render ci dà la porta tramite process.env.PORT, altrimenti usiamo 5000
  const port = process.env.PORT || 5000;
  server.listen(port, () => {
    console.log(`serving on port ${port}`);
  });
})();