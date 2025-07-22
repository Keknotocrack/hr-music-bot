import { spawn, type ChildProcess } from "child_process";
import { storage } from "../storage";

interface BotInstance {
  process: ChildProcess;
  isOnline: boolean;
  startTime: Date;
  roomId: string;
}

class BotManager {
  private bots = new Map<string, BotInstance>();

  async startBot(highriseRoomId: string): Promise<void> {
    if (this.bots.has(highriseRoomId)) {
      throw new Error("Bot is already running in this room");
    }

    // Get room configuration from database
    const room = await storage.getRoomByHighriseId(highriseRoomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Get bot configuration for this room
    const botConfig = await storage.getBotConfiguration(room.id);
    if (!botConfig) {
      throw new Error("Bot configuration not found. Please configure the bot first.");
    }

    // Use the API token from config or environment
    const apiToken = botConfig.apiToken || process.env.HIGHRISE_API_TOKEN;
    if (!apiToken) {
      throw new Error("No API token available. Please configure the bot with a valid token.");
    }

    // Start the Python bot process using the Highrise SDK CLI
    const botProcess = spawn("python", [
      "-m", "highrise",
      highriseRoomId,
      apiToken,
      "bot.music_bot:HighriseMusicBot"
    ], {
      env: {
        ...process.env,
        BOT_CONFIG: JSON.stringify(botConfig),
      },
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd(),
    });

    const botInstance: BotInstance = {
      process: botProcess,
      isOnline: true,
      startTime: new Date(),
      roomId: highriseRoomId,
    };

    this.bots.set(highriseRoomId, botInstance);

    botProcess.stdout?.on('data', (data) => {
      console.log(`Bot ${highriseRoomId} stdout:`, data.toString());
    });

    botProcess.stderr?.on('data', (data) => {
      console.error(`Bot ${highriseRoomId} stderr:`, data.toString());
    });

    botProcess.on('close', (code) => {
      console.log(`Bot ${highriseRoomId} exited with code ${code}`);
      const bot = this.bots.get(highriseRoomId);
      if (bot) {
        bot.isOnline = false;
      }
    });
  }

  async stopBot(highriseRoomId: string): Promise<void> {
    const bot = this.bots.get(highriseRoomId);
    if (!bot) {
      throw new Error("Bot not found in this room");
    }

    bot.process.kill();
    this.bots.delete(highriseRoomId);
  }

  getStatus(): any {
    const status = {
      totalBots: this.bots.size,
      onlineBots: 0,
      rooms: [] as any[]
    };

    for (const [roomId, bot] of this.bots) {
      if (bot.isOnline) {
        status.onlineBots++;
      }

      status.rooms.push({
        roomId,
        isOnline: bot.isOnline,
        startTime: bot.startTime,
        uptime: Date.now() - bot.startTime.getTime()
      });
    }

    return status;
  }

  async restartBot(highriseRoomId: string): Promise<void> {
    await this.stopBot(highriseRoomId);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    await this.startBot(highriseRoomId);
  }

  getBotByRoom(highriseRoomId: string): BotInstance | undefined {
    return this.bots.get(highriseRoomId);
  }
}

export const botManager = new BotManager();