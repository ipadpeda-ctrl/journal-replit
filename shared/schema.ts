import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (Mandatory for Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  // --- NUOVI CAMPI FONDAMENTALI ---
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  // --------------------------------
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  role: text("role").notNull().default("user"), // super_admin, admin, user
  initialCapital: doublePrecision("initial_capital").default(10000),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trades table
export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: text("date").notNull(),
  time: text("time"),
  pair: text("pair").notNull(),
  direction: text("direction").notNull(), // 'Long' or 'Short'
  target: doublePrecision("target"),
  stopLoss: doublePrecision("stop_loss"),
  result: text("result").notNull(), // 'Win', 'Loss', 'BE'
  pnl: doublePrecision("pnl"),
  emotion: text("emotion"),
  confluencesPro: text("confluences_pro").array(),
  confluencesContro: text("confluences_contro").array(),
  imageUrls: text("image_urls").array(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Trading diary
export const tradingDiary = pgTable("trading_diary", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: text("date").notNull(),
  content: text("content"),
  mood: text("mood"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Goals
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  targetTrades: integer("target_trades"),
  targetWinRate: doublePrecision("target_win_rate"),
  targetProfit: doublePrecision("target_profit"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schemas & Types (Zod)
export const insertUserSchema = createInsertSchema(users);
export const insertTradeSchema = createInsertSchema(trades);
export const insertDiarySchema = createInsertSchema(tradingDiary);
export const insertGoalSchema = createInsertSchema(goals);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UpsertUser = Partial<InsertUser>;

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = typeof trades.$inferInsert;

export type TradingDiary = typeof tradingDiary.$inferSelect;
export type InsertDiary = typeof tradingDiary.$inferInsert;

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = typeof goals.$inferInsert;