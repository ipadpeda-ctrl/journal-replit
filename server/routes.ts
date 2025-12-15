import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./replitAuth"; // Usa il nostro sistema personalizzato
import { storage } from "./storage";
import { insertTradeSchema, insertDiarySchema, insertGoalSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configura l'autenticazione (sessioni, login, register)
  setupAuth(app);

  // --- API Routes (Tutte protette da isAuthenticated) ---

  // 1. Recupera l'utente corrente
  // (Questa è la rotta che ti dava errore: ora è corretta!)
  app.get("/api/auth/user", isAuthenticated, (req, res) => {
    // req.user contiene già l'utente loggato grazie a passport
    res.json(req.user); 
  });

  // 2. Rotte per i Trades
  app.get("/api/trades", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.id;
    const trades = await storage.getTradesByUser(userId);
    res.json(trades);
  });

  app.post("/api/trades", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.id;
    const parseResult = insertTradeSchema.safeParse({ ...req.body, userId });
    
    if (!parseResult.success) {
      return res.status(400).json(parseResult.error);
    }

    const trade = await storage.createTrade(parseResult.data);
    res.status(201).json(trade);
  });

  app.patch("/api/trades/:id", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    // @ts-ignore
    const userId = req.user!.id;
    const parseResult = insertTradeSchema.partial().safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json(parseResult.error);
    }

    const updated = await storage.updateTrade(id, userId, parseResult.data);
    if (!updated) return res.status(404).json({ message: "Trade not found" });
    
    res.json(updated);
  });

  app.delete("/api/trades/:id", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    // @ts-ignore
    const userId = req.user!.id;
    const success = await storage.deleteTrade(id, userId);
    
    if (!success) return res.status(404).json({ message: "Trade not found" });
    res.sendStatus(204);
  });

  // 3. Rotte per il Diario
  app.get("/api/diary", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.id;
    const entries = await storage.getDiaryByUser(userId);
    res.json(entries);
  });

  app.post("/api/diary", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.id;
    const parseResult = insertDiarySchema.safeParse({ ...req.body, userId });

    if (!parseResult.success) {
      return res.status(400).json(parseResult.error);
    }

    const entry = await storage.upsertDiary(parseResult.data);
    res.json(entry);
  });

  // 4. Rotte per i Goals
  app.get("/api/goals", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.id;
    const goals = await storage.getGoalsByUser(userId);
    res.json(goals);
  });

  app.post("/api/goals", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.id;
    const parseResult = insertGoalSchema.safeParse({ ...req.body, userId });

    if (!parseResult.success) {
      return res.status(400).json(parseResult.error);
    }

    const goal = await storage.upsertGoal(parseResult.data);
    res.json(goal);
  });

  const httpServer = createServer(app);
  return httpServer;
}