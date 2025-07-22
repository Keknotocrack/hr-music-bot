import { 
  users, rooms, musicQueue, songLikes, competitions, cubeTransactions, 
  botStatistics, urlMappings, botConfigurations,
  type User, type InsertUser, type Room, type InsertRoom,
  type MusicQueueItem, type InsertMusicQueueItem, type Competition,
  type InsertCompetition, type CubeTransaction, type InsertCubeTransaction,
  type BotStatistics, type UrlMapping, type InsertUrlMapping,
  type BotConfiguration, type InsertBotConfiguration
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCubes(userId: number, amount: number): Promise<void>;
  updateUserRole(userId: number, role: string): Promise<void>;

  // Room management
  getRoom(id: number): Promise<Room | undefined>;
  getRoomByHighriseId(highriseRoomId: string): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: number, updates: Partial<InsertRoom>): Promise<void>;
  getAllRooms(): Promise<Room[]>;

  // Music queue
  getQueueByRoom(roomId: number): Promise<MusicQueueItem[]>;
  addToQueue(item: InsertMusicQueueItem): Promise<MusicQueueItem>;
  removeFromQueue(id: number): Promise<void>;
  updateQueuePosition(id: number, position: number): Promise<void>;
  likeQueueItem(userId: number, queueItemId: number): Promise<void>;
  unlikeQueueItem(userId: number, queueItemId: number): Promise<void>;

  // Competitions
  getActiveCompetitions(roomId: number): Promise<Competition[]>;
  createCompetition(competition: InsertCompetition): Promise<Competition>;
  endCompetition(id: number, winnerId?: number): Promise<void>;

  // Cube transactions
  addCubeTransaction(transaction: InsertCubeTransaction): Promise<CubeTransaction>;
  getUserTransactions(userId: number): Promise<CubeTransaction[]>;

  // Statistics
  getBotStatistics(date?: Date): Promise<BotStatistics | undefined>;
  updateBotStatistics(stats: Partial<BotStatistics>): Promise<void>;

  // URL management
  createUrlMapping(mapping: InsertUrlMapping): Promise<UrlMapping>;
  getUrlMapping(shortCode: string): Promise<UrlMapping | undefined>;
  incrementUrlClick(shortCode: string): Promise<void>;

  // Bot configuration management
  createBotConfiguration(config: InsertBotConfiguration): Promise<BotConfiguration>;
  getBotConfiguration(roomId: number): Promise<BotConfiguration | undefined>;
  updateBotConfiguration(roomId: number, updates: Partial<InsertBotConfiguration>): Promise<void>;
  getAllBotConfigurations(): Promise<BotConfiguration[]>;
  deleteBotConfiguration(roomId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserCubes(userId: number, amount: number): Promise<void> {
    await db
      .update(users)
      .set({ cubeBalance: sql`${users.cubeBalance} + ${amount}` })
      .where(eq(users.id, userId));
  }

  async updateUserRole(userId: number, role: string): Promise<void> {
    await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId));
  }

  async getRoom(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room || undefined;
  }

  async getRoomByHighriseId(highriseRoomId: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.highriseRoomId, highriseRoomId));
    return room || undefined;
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const [room] = await db
      .insert(rooms)
      .values(insertRoom)
      .returning();
    return room;
  }

  async updateRoom(id: number, updates: Partial<InsertRoom>): Promise<void> {
    await db
      .update(rooms)
      .set(updates)
      .where(eq(rooms.id, id));
  }

  async getAllRooms(): Promise<Room[]> {
    return await db.select().from(rooms).where(eq(rooms.isActive, true));
  }

  async getQueueByRoom(roomId: number): Promise<MusicQueueItem[]> {
    return await db
      .select()
      .from(musicQueue)
      .where(eq(musicQueue.roomId, roomId))
      .orderBy(musicQueue.position);
  }

  async addToQueue(item: InsertMusicQueueItem): Promise<MusicQueueItem> {
    const [queueItem] = await db
      .insert(musicQueue)
      .values(item)
      .returning();
    return queueItem;
  }

  async removeFromQueue(id: number): Promise<void> {
    await db.delete(musicQueue).where(eq(musicQueue.id, id));
  }

  async updateQueuePosition(id: number, position: number): Promise<void> {
    await db
      .update(musicQueue)
      .set({ position })
      .where(eq(musicQueue.id, id));
  }

  async likeQueueItem(userId: number, queueItemId: number): Promise<void> {
    // Check if already liked
    const [existingLike] = await db
      .select()
      .from(songLikes)
      .where(and(eq(songLikes.userId, userId), eq(songLikes.queueItemId, queueItemId)));

    if (!existingLike) {
      await db.insert(songLikes).values({ userId, queueItemId });
      await db
        .update(musicQueue)
        .set({ likes: sql`${musicQueue.likes} + 1` })
        .where(eq(musicQueue.id, queueItemId));
    }
  }

  async unlikeQueueItem(userId: number, queueItemId: number): Promise<void> {
    const deleted = await db
      .delete(songLikes)
      .where(and(eq(songLikes.userId, userId), eq(songLikes.queueItemId, queueItemId)));

    if (deleted) {
      await db
        .update(musicQueue)
        .set({ likes: sql`${musicQueue.likes} - 1` })
        .where(eq(musicQueue.id, queueItemId));
    }
  }

  async getActiveCompetitions(roomId: number): Promise<Competition[]> {
    return await db
      .select()
      .from(competitions)
      .where(and(eq(competitions.roomId, roomId), eq(competitions.isActive, true)));
  }

  async createCompetition(competition: InsertCompetition): Promise<Competition> {
    const [comp] = await db
      .insert(competitions)
      .values(competition)
      .returning();
    return comp;
  }

  async endCompetition(id: number, winnerId?: number): Promise<void> {
    await db
      .update(competitions)
      .set({ isActive: false, winnerId })
      .where(eq(competitions.id, id));
  }

  async addCubeTransaction(transaction: InsertCubeTransaction): Promise<CubeTransaction> {
    const [txn] = await db
      .insert(cubeTransactions)
      .values(transaction)
      .returning();
    return txn;
  }

  async getUserTransactions(userId: number): Promise<CubeTransaction[]> {
    return await db
      .select()
      .from(cubeTransactions)
      .where(eq(cubeTransactions.userId, userId))
      .orderBy(desc(cubeTransactions.createdAt));
  }

  async getBotStatistics(date?: Date): Promise<BotStatistics | undefined> {
    const targetDate = date || new Date();
    const [stats] = await db
      .select()
      .from(botStatistics)
      .where(eq(botStatistics.date, targetDate));
    return stats || undefined;
  }

  async updateBotStatistics(stats: Partial<BotStatistics>): Promise<void> {
    const today = new Date();
    const [existing] = await db
      .select()
      .from(botStatistics)
      .where(eq(botStatistics.date, today));

    if (existing) {
      await db
        .update(botStatistics)
        .set(stats)
        .where(eq(botStatistics.date, today));
    } else {
      await db
        .insert(botStatistics)
        .values({ ...stats, date: today } as any);
    }
  }

  async createUrlMapping(mapping: InsertUrlMapping): Promise<UrlMapping> {
    const [url] = await db
      .insert(urlMappings)
      .values(mapping)
      .returning();
    return url;
  }

  async getUrlMapping(shortCode: string): Promise<UrlMapping | undefined> {
    const [url] = await db
      .select()
      .from(urlMappings)
      .where(eq(urlMappings.shortCode, shortCode));
    return url || undefined;
  }

  async incrementUrlClick(shortCode: string): Promise<void> {
    await db
      .update(urlMappings)
      .set({ clickCount: sql`${urlMappings.clickCount} + 1` })
      .where(eq(urlMappings.shortCode, shortCode));
  }

  async createBotConfiguration(config: InsertBotConfiguration): Promise<BotConfiguration> {
    const [botConfig] = await db
      .insert(botConfigurations)
      .values(config)
      .returning();
    return botConfig;
  }

  async getBotConfiguration(roomId: number): Promise<BotConfiguration | undefined> {
    const [config] = await db
      .select()
      .from(botConfigurations)
      .where(eq(botConfigurations.roomId, roomId));
    return config || undefined;
  }

  async updateBotConfiguration(roomId: number, updates: Partial<InsertBotConfiguration>): Promise<void> {
    await db
      .update(botConfigurations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(botConfigurations.roomId, roomId));
  }

  async getAllBotConfigurations(): Promise<BotConfiguration[]> {
    return await db
      .select()
      .from(botConfigurations)
      .where(eq(botConfigurations.isActive, true));
  }

  async deleteBotConfiguration(roomId: number): Promise<void> {
    await db
      .update(botConfigurations)
      .set({ isActive: false })
      .where(eq(botConfigurations.roomId, roomId));
  }
}

export const storage = new DatabaseStorage();
