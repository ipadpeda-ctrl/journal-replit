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
    secret: process.env.SESSION_SECRET || "chiave-di-riserva-super-segreta",
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

// Funzione principale di setup (VERSINE SICURA - NO CRASH)
export async function setupAuth(app: Express) {
  // Configura i proxy per Render
  app.set("trust proxy", 1);

  // Avvia la sessione
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Serializzazione utente standard
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user: any, done) => done(null, user));

  console.log("Sistema di Auth avviato in modalità ESTERNA (Replit Auth disabilitato).");

  // Endpoint finti per non rompere il frontend se clicchi login
  app.get("/api/login", (req, res) => {
    res.status(200).send("Login disabilitato su Render. Il sito è visibile.");
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

// Middleware che lascia passare TUTTI (per vedere il sito)
export const isAuthenticated: RequestHandler = (req, res, next) => {
  // In questa versione, non controlliamo se l'utente è loggato.
  // Lasciamo passare tutti per far funzionare il sito.
  return next();
};