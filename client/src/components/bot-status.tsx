import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Clock, Users, Zap, ExternalLink, AlertCircle } from "lucide-react";

interface BotStatusData {
  totalBots: number;
  onlineBots: number;
  rooms: Array<{
    roomId: string;
    isOnline: boolean;
    startTime: string;
    uptime: number;
  }>;
}

interface RecentActivity {
  type: string;
  message: string;
  timestamp: string;
  user?: string;
}

export default function BotStatus() {
  const { data: botStatus, isLoading } = useQuery<BotStatusData>({
    queryKey: ["/api/bot/status"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Mock recent activity - in real app this would come from API
  const recentActivity: RecentActivity[] = [
    {
      type: "song_request",
      message: "requested Blinding Lights",
      timestamp: "2 minutes ago",
      user: "user123"
    },
    {
      type: "cube_purchase",
      message: "purchased 50 cubes",
      timestamp: "5 minutes ago", 
      user: "musicfan"
    },
    {
      type: "song_like",
      message: "Good 4 U received 15 likes",
      timestamp: "8 minutes ago"
    },
    {
      type: "vip_granted",
      message: "was granted VIP status",
      timestamp: "12 minutes ago",
      user: "dj_master"
    },
    {
      type: "competition",
      message: "Music competition started in Beats & Vibes",
      timestamp: "15 minutes ago"
    }
  ];

  const formatUptime = (uptimeMs: number) => {
    const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "song_request":
        return "🎵";
      case "cube_purchase":
        return "💎";
      case "song_like":
        return "❤️";
      case "vip_granted":
        return "👑";
      case "competition":
        return "🏆";
      default:
        return "📝";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="w-5 h-5" />
          <span>Bot Status & Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bot Status Summary */}
        <div className="space-y-4">
          <h4 className="font-medium">System Status</h4>
          {isLoading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-green-600">
                  {botStatus?.onlineBots || 0}
                </div>
                <p className="text-xs text-on-surface-variant">Online Bots</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-on-surface">
                  {botStatus?.totalBots || 0}
                </div>
                <p className="text-xs text-on-surface-variant">Total Bots</p>
              </div>
            </div>
          )}
        </div>

        {/* Active Rooms */}
        <div className="space-y-3">
          <h4 className="font-medium">Active Rooms</h4>
          {botStatus?.rooms && botStatus.rooms.length > 0 ? (
            <div className="space-y-2">
              {botStatus.rooms.slice(0, 3).map((room) => (
                <div key={room.roomId} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${room.isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm font-medium">{room.roomId}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 text-xs text-on-surface-variant">
                      <Clock className="w-3 h-3" />
                      <span>{formatUptime(room.uptime)}</span>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {botStatus.rooms.length > 3 && (
                <p className="text-xs text-on-surface-variant text-center">
                  +{botStatus.rooms.length - 3} more rooms
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-on-surface-variant">No active rooms</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="space-y-3">
          <h4 className="font-medium">Recent Activity</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm">{getActivityIcon(activity.type)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-on-surface">
                    {activity.user && (
                      <span className="font-medium">@{activity.user}</span>
                    )}{" "}
                    {activity.message}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t">
          <Button variant="outline" className="w-full" size="sm">
            View All Activity
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
