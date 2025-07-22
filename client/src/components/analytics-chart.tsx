import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Music, Users } from "lucide-react";

interface PlatformUsage {
  platform: string;
  percentage: number;
  count: number;
  color: string;
  icon: string;
}

interface TopSong {
  title: string;
  artist: string;
  requests: number;
  platform: string;
}

interface AnalyticsData {
  platformUsage: PlatformUsage[];
  topSongs: TopSong[];
  totalRequests: number;
  growthRate: number;
}

export default function AnalyticsChart() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
    // Mock data for now - replace with real API call
    queryFn: async () => ({
      platformUsage: [
        {
          platform: "YouTube",
          percentage: 65,
          count: 324,
          color: "bg-red-500",
          icon: "▶️"
        },
        {
          platform: "Spotify", 
          percentage: 25,
          count: 125,
          color: "bg-green-500",
          icon: "🎵"
        },
        {
          platform: "SoundCloud",
          percentage: 10,
          count: 50,
          color: "bg-orange-500", 
          icon: "☁️"
        }
      ],
      topSongs: [
        {
          title: "Blinding Lights",
          artist: "The Weeknd",
          requests: 23,
          platform: "YouTube"
        },
        {
          title: "Shape of You",
          artist: "Ed Sheeran", 
          requests: 19,
          platform: "Spotify"
        },
        {
          title: "Good 4 U",
          artist: "Olivia Rodrigo",
          requests: 15,
          platform: "YouTube"
        }
      ],
      totalRequests: 499,
      growthRate: 12.5
    }),
    refetchInterval: 30000,
  });

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube':
        return '▶️';
      case 'spotify':
        return '🎵';
      case 'soundcloud':
        return '☁️';
      default:
        return '🎶';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube':
        return 'text-red-500';
      case 'spotify':
        return 'text-green-500';
      case 'soundcloud':
        return 'text-orange-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <span>Platform Analytics</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Platform Usage */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Platform Usage</h4>
            <div className="flex items-center space-x-1 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span>+{analytics?.growthRate || 0}%</span>
            </div>
          </div>
          
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-4 bg-gray-200 rounded w-20" />
                    <div className="h-4 bg-gray-200 rounded w-10" />
                  </div>
                  <div className="h-2 bg-gray-200 rounded w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {analytics?.platformUsage.map((platform) => (
                <div key={platform.platform} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{platform.icon}</span>
                      <span className="text-sm font-medium text-on-surface">
                        {platform.platform}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-on-surface">
                        {platform.percentage}%
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {platform.count}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={platform.percentage} className="h-2" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Songs */}
        <div className="space-y-4">
          <h4 className="font-medium">Top Requested Songs Today</h4>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-12" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {analytics?.topSongs.map((song, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-on-surface-variant w-4">
                      {index + 1}.
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-on-surface">
                          {song.title}
                        </span>
                        <span className={`text-xs ${getPlatformColor(song.platform)}`}>
                          {getPlatformIcon(song.platform)}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant">
                        {song.artist}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {song.requests}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="pt-4 border-t space-y-3">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Music className="w-4 h-4 text-primary" />
                <span className="text-lg font-bold text-on-surface">
                  {analytics?.totalRequests || 0}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">Total Requests</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Users className="w-4 h-4 text-green-600" />
                <span className="text-lg font-bold text-on-surface">
                  {analytics?.platformUsage.reduce((sum, p) => sum + p.count, 0) || 0}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">Active Users</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
