import fetch from "node-fetch";

export interface SearchResult {
  id: string;
  title: string;
  artist: string;
  duration: number;
  platform: "youtube" | "spotify" | "soundcloud";
  url: string;
  thumbnail?: string;
}

class MusicService {
  async searchYouTube(query: string): Promise<SearchResult[]> {
    // For now, return mock data - will be replaced with real API
    return [
      {
        id: "mock_yt_1",
        title: query,
        artist: "Unknown Artist",
        duration: 180,
        platform: "youtube" as const,
        url: `https://youtube.com/watch?v=mock1`,
        thumbnail: "https://img.youtube.com/vi/mock1/default.jpg"
      }
    ];
  }

  async searchSpotify(query: string): Promise<SearchResult[]> {
    // For now, return mock data - will be replaced with real API
    return [
      {
        id: "mock_spotify_1",
        title: query,
        artist: "Unknown Artist", 
        duration: 200,
        platform: "spotify" as const,
        url: `https://open.spotify.com/track/mock1`
      }
    ];
  }

  async searchSoundCloud(query: string): Promise<SearchResult[]> {
    // For now, return mock data - will be replaced with real API
    return [
      {
        id: "mock_sc_1", 
        title: query,
        artist: "Unknown Artist",
        duration: 220,
        platform: "soundcloud" as const,
        url: `https://soundcloud.com/mock1`
      }
    ];
  }

  async search(query: string, platforms: string[] = ["youtube", "spotify", "soundcloud"]): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    if (platforms.includes("youtube")) {
      const ytResults = await this.searchYouTube(query);
      results.push(...ytResults);
    }

    if (platforms.includes("spotify")) {
      const spotifyResults = await this.searchSpotify(query);
      results.push(...spotifyResults);
    }

    if (platforms.includes("soundcloud")) {
      const scResults = await this.searchSoundCloud(query);
      results.push(...scResults);
    }

    return results;
  }
}

export const musicService = new MusicService();