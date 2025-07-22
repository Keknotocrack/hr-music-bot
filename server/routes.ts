import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { botManager } from "./services/bot-manager";
import { musicService } from "./services/music-service";
import { urlGenerator } from "./services/url-generator";
import { mlRecommendations } from "./services/ml-recommendations";
import { insertUserSchema, insertRoomSchema, insertMusicQueueSchema, insertCompetitionSchema, insertBotConfigurationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws) => {
    clients.add(ws);
    
    ws.on('close', () => {
      clients.delete(ws);
    });

    // Send initial bot status
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'bot_status',
        data: botManager.getStatus()
      }));
    }
  });

  // Broadcast function for real-time updates
  const broadcast = (message: any) => {
    clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  };

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.patch("/api/users/:id/role", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { role } = req.body;
      
      if (!["regular", "vip", "owner"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      await storage.updateUserRole(id, role);
      broadcast({ type: 'user_role_updated', data: { userId: id, role } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  // Room routes
  app.get("/api/rooms", async (req, res) => {
    try {
      const rooms = await storage.getAllRooms();
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rooms" });
    }
  });

  app.post("/api/rooms", async (req, res) => {
    try {
      const roomData = insertRoomSchema.parse(req.body);
      const room = await storage.createRoom(roomData);
      broadcast({ type: 'room_created', data: room });
      res.json(room);
    } catch (error) {
      res.status(400).json({ error: "Invalid room data" });
    }
  });

  app.get("/api/rooms/:id/queue", async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const queue = await storage.getQueueByRoom(roomId);
      res.json(queue);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch queue" });
    }
  });

  // Music queue routes
  app.post("/api/queue", async (req, res) => {
    try {
      const queueData = insertMusicQueueSchema.parse(req.body);
      
      // Validate user has enough cubes
      const user = await storage.getUser(queueData.userId);
      const cubesSpent = queueData.cubesSpent || 10; // Default to 10 cubes
      if (!user || (user.role !== "owner" && user.role !== "vip" && user.cubeBalance < cubesSpent)) {
        return res.status(400).json({ error: "Insufficient cubes" });
      }

      // Deduct cubes if not owner/vip
      if (user.role !== "owner" && user.role !== "vip") {
        await storage.updateUserCubes(queueData.userId, -cubesSpent);
        await storage.addCubeTransaction({
          userId: queueData.userId,
          type: "spend",
          amount: -cubesSpent,
          description: `Song request: ${queueData.songTitle}`
        });
      }

      const queueItem = await storage.addToQueue(queueData);
      broadcast({ type: 'queue_updated', data: queueItem });
      res.json(queueItem);
    } catch (error) {
      res.status(400).json({ error: "Failed to add song to queue" });
    }
  });

  app.delete("/api/queue/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.removeFromQueue(id);
      broadcast({ type: 'queue_item_removed', data: { id } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove from queue" });
    }
  });

  app.post("/api/queue/:id/like", async (req, res) => {
    try {
      const queueItemId = parseInt(req.params.id);
      const { userId } = req.body;
      
      await storage.likeQueueItem(userId, queueItemId);
      broadcast({ type: 'song_liked', data: { queueItemId, userId } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to like song" });
    }
  });

  // Music search routes
  app.get("/api/music/search", async (req, res) => {
    try {
      const { query, platform } = req.query;
      if (!query) {
        return res.status(400).json({ error: "Query required" });
      }

      const platforms = platform ? [platform as string] : undefined;
      const results = await musicService.search(query as string, platforms);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  app.get("/api/music/recommendations", async (req, res) => {
    try {
      const { userId, roomId } = req.query;
      const recommendations = await mlRecommendations.getRecommendations(
        parseInt(userId as string),
        roomId ? parseInt(roomId as string) : undefined
      );
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: "Failed to get recommendations" });
    }
  });

  // Competition routes
  app.post("/api/competitions", async (req, res) => {
    try {
      const competitionData = insertCompetitionSchema.parse(req.body);
      const competition = await storage.createCompetition(competitionData);
      broadcast({ type: 'competition_started', data: competition });
      res.json(competition);
    } catch (error) {
      res.status(400).json({ error: "Invalid competition data" });
    }
  });

  app.patch("/api/competitions/:id/end", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { winnerId } = req.body;
      
      await storage.endCompetition(id, winnerId);
      broadcast({ type: 'competition_ended', data: { id, winnerId } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to end competition" });
    }
  });

  // Cube system routes
  app.post("/api/cubes/purchase", async (req, res) => {
    try {
      const { userId, goldAmount } = req.body;
      const cubeAmount = Math.floor(goldAmount / 10); // 10 gold = 1 cube
      
      await storage.updateUserCubes(userId, cubeAmount);
      await storage.addCubeTransaction({
        userId,
        type: "purchase",
        amount: cubeAmount,
        description: "Cube purchase",
        goldSpent: goldAmount.toString()
      });

      broadcast({ type: 'cubes_purchased', data: { userId, amount: cubeAmount } });
      res.json({ success: true, cubesReceived: cubeAmount });
    } catch (error) {
      res.status(500).json({ error: "Purchase failed" });
    }
  });

  app.post("/api/cubes/daily-reward", async (req, res) => {
    try {
      const { userId } = req.body;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const now = new Date();
      const lastReward = user.lastDailyReward ? new Date(user.lastDailyReward) : null;
      
      // Check if 24 hours have passed
      if (lastReward && (now.getTime() - lastReward.getTime()) < 24 * 60 * 60 * 1000) {
        return res.status(400).json({ error: "Daily reward already claimed" });
      }

      await storage.updateUserCubes(userId, 50);
      await storage.addCubeTransaction({
        userId,
        type: "daily_reward",
        amount: 50,
        description: "Daily cube reward"
      });

      res.json({ success: true, cubesReceived: 50 });
    } catch (error) {
      res.status(500).json({ error: "Failed to claim daily reward" });
    }
  });

  // URL generation routes
  app.post("/api/urls/generate", async (req, res) => {
    try {
      const { roomId, createdBy } = req.body;
      const url = await urlGenerator.generateRoomUrl(roomId, createdBy);
      const shortCode = url.split('/').pop();
      
      res.json({
        url,
        shortCode
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate URL" });
    }
  });

  app.get("/api/urls/:shortCode", async (req, res) => {
    try {
      const { shortCode } = req.params;
      const mapping = await storage.getUrlMapping(shortCode);
      
      if (!mapping || !mapping.isActive) {
        return res.status(404).json({ error: "URL not found" });
      }

      await storage.incrementUrlClick(shortCode);
      res.json(mapping);
    } catch (error) {
      res.status(500).json({ error: "Failed to resolve URL" });
    }
  });

  // Bot control routes
  app.post("/api/bot/start", async (req, res) => {
    try {
      const { roomId } = req.body;
      await botManager.startBot(roomId);
      broadcast({ type: 'bot_started', data: { roomId } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to start bot" });
    }
  });

  app.post("/api/bot/stop", async (req, res) => {
    try {
      const { roomId } = req.body;
      await botManager.stopBot(roomId);
      broadcast({ type: 'bot_stopped', data: { roomId } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to stop bot" });
    }
  });

  app.get("/api/bot/status", async (req, res) => {
    try {
      const status = botManager.getStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to get bot status" });
    }
  });

  // Statistics routes
  app.get("/api/statistics", async (req, res) => {
    try {
      const stats = await storage.getBotStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Queue routes
  app.get("/api/queue", async (req, res) => {
    try {
      // Get all rooms and their queues
      const rooms = await storage.getAllRooms();
      const allQueueItems = [];
      
      for (const room of rooms) {
        const queue = await storage.getQueueByRoom(room.id);
        allQueueItems.push(...queue);
      }
      
      res.json(allQueueItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch queue" });
    }
  });

  // Current songs route
  app.get("/api/rooms/current-songs", async (req, res) => {
    try {
      const rooms = await storage.getAllRooms();
      const currentSongs = [];
      
      for (const room of rooms) {
        if (room.currentSong) {
          currentSongs.push({
            ...room.currentSong,
            roomName: room.name,
            roomId: room.id
          });
        }
      }
      
      res.json(currentSongs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch current songs" });
    }
  });

  // Bot configuration routes
  app.post("/api/bot/config", async (req, res) => {
    try {
      const configData = insertBotConfigurationSchema.parse(req.body);
      
      // Check if configuration exists for this room
      const existingConfig = await storage.getBotConfiguration(configData.roomId);
      
      if (existingConfig) {
        // Update existing configuration
        await storage.updateBotConfiguration(configData.roomId, configData);
        broadcast({ type: 'bot_config_updated', data: { roomId: configData.roomId } });
        res.json({ success: true, message: "Configuration updated successfully" });
      } else {
        // Create new configuration
        const config = await storage.createBotConfiguration(configData);
        broadcast({ type: 'bot_config_created', data: config });
        res.json({ success: true, message: "Configuration saved successfully", config });
      }
    } catch (error) {
      console.error("Bot config error:", error);
      res.status(500).json({ error: "Failed to save configuration" });
    }
  });

  app.get("/api/bot/config/:roomId", async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const config = await storage.getBotConfiguration(roomId);
      
      if (!config) {
        return res.status(404).json({ error: "Configuration not found" });
      }
      
      // Don't expose the API token in the response
      const safeConfig = { ...config, apiToken: "••••••••••••" };
      res.json(safeConfig);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch configuration" });
    }
  });

  app.get("/api/bot/configs", async (req, res) => {
    try {
      const configs = await storage.getAllBotConfigurations();
      // Don't expose API tokens
      const safeConfigs = configs.map(config => ({ 
        ...config, 
        apiToken: "••••••••••••" 
      }));
      res.json(safeConfigs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch configurations" });
    }
  });

  app.delete("/api/bot/config/:roomId", async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      await storage.deleteBotConfiguration(roomId);
      broadcast({ type: 'bot_config_deleted', data: { roomId } });
      res.json({ success: true, message: "Configuration deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete configuration" });
    }
  });

  return httpServer;
}
