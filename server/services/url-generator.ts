import { nanoid } from 'nanoid';
import { storage } from '../storage';

class UrlGenerator {
  private baseUrl = process.env.BASE_URL || 'http://localhost:5000';

  async generateRoomUrl(roomId: number, createdBy: number): Promise<string> {
    const shortCode = nanoid(8);
    
    await storage.createUrlMapping({
      shortCode,
      roomId,
      createdBy,
      clickCount: 0
    });

    return `${this.baseUrl}/r/${shortCode}`;
  }

  async resolveUrl(shortCode: string) {
    const mapping = await storage.getUrlMapping(shortCode);
    if (!mapping) {
      throw new Error('URL not found');
    }

    await storage.incrementUrlClick(shortCode);
    return mapping;
  }
}

export const urlGenerator = new UrlGenerator();