import {
  pgTable,
  serial,
  varchar,
  integer,
  timestamp,
  text,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  plan: varchar("plan", { length: 50 }).default("Free"),
  remainingMsg: integer("remaining_msg").default(5),
  credits: integer("credits").default(1000),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").references(() => chats.id, {
    onDelete: "cascade",
  }),
  role: varchar("role", { length: 50 }),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow(),
});

import { jsonb } from "drizzle-orm/pg-core";

export const userModelPreferences = pgTable("user_model_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  preferences: jsonb("preferences").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});