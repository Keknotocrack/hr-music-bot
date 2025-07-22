import { pgTable, text, serial, integer, boolean, timestamp, json, varchar, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("regular"), // regular, vip, owner
  cubeBalance: integer("cube_balance").notNull().default(50),
  totalCubesEarned: integer("total_cubes_earned").notNull().default(50),
  lastDailyReward: timestamp("last_daily_reward").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  highriseRoomId: text("highrise_room_id").notNull().unique(),
  name: text("name").notNull(),
  ownerId: integer("owner_id").references(() => users.id),
  isActive: boolean("is_active").notNull().default(true),
  currentSong: json("current_song"),
  customUrl: text("custom_url").unique(),
  settings: json("settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const musicQueue = pgTable("music_queue", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => rooms.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  songTitle: text("song_title").notNull(),
  songArtist: text("song_artist").notNull(),
  platform: text("platform").notNull(), // youtube, spotify, soundcloud
  platformUrl: text("platform_url").notNull(),
  cubesSpent: integer("cubes_spent").notNull().default(10),
  position: integer("position").notNull(),
  likes: integer("likes").notNull().default(0),
  isPlaying: boolean("is_playing").notNull().default(false),
  addedAt: timestamp("added_at").defaultNow(),
});

export const songLikes = pgTable("song_likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  queueItemId: integer("queue_item_id").references(() => musicQueue.id).notNull(),
  likedAt: timestamp("liked_at").defaultNow(),
});

export const competitions = pgTable("competitions", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => rooms.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  prize: text("prize"),
  winnerId: integer("winner_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cubeTransactions = pgTable("cube_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // purchase, spend, daily_reward, tip_bonus
  amount: integer("amount").notNull(),
  description: text("description"),
  goldSpent: decimal("gold_spent", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const botStatistics = pgTable("bot_statistics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  totalUsers: integer("total_users").notNull().default(0),
  totalSongsPlayed: integer("total_songs_played").notNull().default(0),
  totalCubesCirculating: integer("total_cubes_circulating").notNull().default(0),
  activeRooms: integer("active_rooms").notNull().default(0),
  platformUsage: json("platform_usage").default({}),
  topSongs: json("top_songs").default([]),
});

export const botConfigurations = pgTable("bot_configurations", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => rooms.id).notNull(),
  apiToken: text("api_token").notNull(),
  autoStart: boolean("auto_start").notNull().default(true),
  welcomeMessage: text("welcome_message"),
  maxQueueSize: integer("max_queue_size").notNull().default(50),
  songCost: integer("song_cost").notNull().default(10),
  enableCompetitions: boolean("enable_competitions").notNull().default(true),
  platformPreference: text("platform_preference").notNull().default("all"),
  isActive: boolean("is_active").notNull().default(true),
  lastStarted: timestamp("last_started"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const urlMappings = pgTable("url_mappings", {
  id: serial("id").primaryKey(),
  shortCode: varchar("short_code", { length: 10 }).notNull().unique(),
  roomId: integer("room_id").references(() => rooms.id).notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  clickCount: integer("click_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  rooms: many(rooms),
  queueItems: many(musicQueue),
  likes: many(songLikes),
  transactions: many(cubeTransactions),
  urlsCreated: many(urlMappings),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  owner: one(users, {
    fields: [rooms.ownerId],
    references: [users.id],
  }),
  queue: many(musicQueue),
  competitions: many(competitions),
  urlMappings: many(urlMappings),
  botConfiguration: one(botConfigurations),
}));

export const botConfigurationsRelations = relations(botConfigurations, ({ one }) => ({
  room: one(rooms, {
    fields: [botConfigurations.roomId],
    references: [rooms.id],
  }),
}));

export const musicQueueRelations = relations(musicQueue, ({ one, many }) => ({
  room: one(rooms, {
    fields: [musicQueue.roomId],
    references: [rooms.id],
  }),
  user: one(users, {
    fields: [musicQueue.userId],
    references: [users.id],
  }),
  likes: many(songLikes),
}));

export const songLikesRelations = relations(songLikes, ({ one }) => ({
  user: one(users, {
    fields: [songLikes.userId],
    references: [users.id],
  }),
  queueItem: one(musicQueue, {
    fields: [songLikes.queueItemId],
    references: [musicQueue.id],
  }),
}));

export const competitionsRelations = relations(competitions, ({ one }) => ({
  room: one(rooms, {
    fields: [competitions.roomId],
    references: [rooms.id],
  }),
  winner: one(users, {
    fields: [competitions.winnerId],
    references: [users.id],
  }),
}));

export const cubeTransactionsRelations = relations(cubeTransactions, ({ one }) => ({
  user: one(users, {
    fields: [cubeTransactions.userId],
    references: [users.id],
  }),
}));

export const urlMappingsRelations = relations(urlMappings, ({ one }) => ({
  room: one(rooms, {
    fields: [urlMappings.roomId],
    references: [rooms.id],
  }),
  creator: one(users, {
    fields: [urlMappings.createdBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
});

export const insertMusicQueueSchema = createInsertSchema(musicQueue).omit({
  id: true,
  addedAt: true,
});

export const insertCompetitionSchema = createInsertSchema(competitions).omit({
  id: true,
  createdAt: true,
});

export const insertCubeTransactionSchema = createInsertSchema(cubeTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertUrlMappingSchema = createInsertSchema(urlMappings).omit({
  id: true,
  createdAt: true,
});

export const insertBotConfigurationSchema = createInsertSchema(botConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type MusicQueueItem = typeof musicQueue.$inferSelect;
export type InsertMusicQueueItem = z.infer<typeof insertMusicQueueSchema>;
export type Competition = typeof competitions.$inferSelect;
export type InsertCompetition = z.infer<typeof insertCompetitionSchema>;
export type CubeTransaction = typeof cubeTransactions.$inferSelect;
export type InsertCubeTransaction = z.infer<typeof insertCubeTransactionSchema>;
export type UrlMapping = typeof urlMappings.$inferSelect;
export type InsertUrlMapping = z.infer<typeof insertUrlMappingSchema>;
export type BotStatistics = typeof botStatistics.$inferSelect;
export type BotConfiguration = typeof botConfigurations.$inferSelect;
export type InsertBotConfiguration = z.infer<typeof insertBotConfigurationSchema>;
