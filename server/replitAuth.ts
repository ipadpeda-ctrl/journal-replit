import { type Express, type RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import passport from "passport";
import { storage } from "./storage";

// Configurazione della sessione
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 settimana
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  return session({
    secret: process.env.SESSION_SECRET || "chiave-segreta-fallback",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

// Funzione principale di setup (Semplificata per evitare crash)
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Serializzazione utente base
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user: any, done) => done(null, user));

  console.log("Auth system initialized (Replit Auth disabled for external hosting)");

  // Endpoint di login fittizi per non rompere il frontend
  app.get("/api/login", (req, res) => {
    res.status(501).send("Login non configurato. Implementare Google/Email Auth.");
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

// Middleware di protezione (Bypassa il controllo se non c'è auth configurata)
export const isAuthenticated: RequestHandler = (req, res, next) => {
  // In questa modalità "sicura", permettiamo l'accesso o blocchiamo tutto.
  // Per ora lasciamo passare o restituiamo 401 se vuoi bloccare.
  // Se vuoi testare il sito, commenta le righe sotto.
  
  // if (!req.isAuthenticated()) {
  //   return res.status(401).json({ message: "Unauthorized" });
  // }
  
  return next();
};