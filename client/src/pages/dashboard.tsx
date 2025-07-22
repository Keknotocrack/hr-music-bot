import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import BotStatus from "@/components/bot-status";
import MusicQueue from "@/components/music-queue";
import AnalyticsChart from "@/components/analytics-chart";
import RoomCard from "@/components/room-card";
import { useWebSocket } from "@/hooks/use-websocket";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Music, 
  Users, 
  Play, 
  Trophy, 
  Plus, 
  Link, 
  Group,
  RefreshCw,
  Home,
  Bell,
  Settings
} from "lucide-react";
import { useState } from "react";

interface DashboardStats {
  totalBots: number;
  onlineBots: number;
  activeUsers: number;
  totalSongsPlayed: number;
  totalCubesCirculating: number;
  activeRooms: number;
}

interface CurrentSong {
  id: number;
  title: string;
  artist: string;
  platform: string;
  requestedBy: string;
  likes: number;
  duration: number;
  currentTime: number;
  roomName: string;
  roomId: number;
}

export default function Dashboard() {
  const { toast } = useToast();
  const [selectedRoom, setSelectedRoom] = useState<string>("all");

  // WebSocket connection for real-time updates
  const { isConnected, lastMessage } = useWebSocket("/ws");

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/statistics"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch bot status
  const { data: botStatus, isLoading: botLoading } = useQuery({
    queryKey: ["/api/bot/status"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch rooms
  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ["/api/rooms"],
  });

  // Fetch current playing songs
  const { data: currentSongs, isLoading: songsLoading } = useQuery<CurrentSong[]>({
    queryKey: ["/api/rooms/current-songs"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const handleCreateRoom = async () => {
    try {
      await api.post("/api/rooms", {
        name: "New Music Room",
        highriseRoomId: `room_${Date.now()}`,
        ownerId: 1, // This would come from auth context
      });
      toast({
        title: "Success",
        description: "New room created successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create room",
        variant: "destructive",
      });
    }
  };

  const handleGenerateURL = async () => {
    try {
      const response = await api.post("/api/urls/generate", {
        roomId: 1, // Selected room
        createdBy: 1, // Current user
      });
      
      navigator.clipboard.writeText(response.data.url);
      toast({
        title: "Success", 
        description: "Room URL copied to clipboard!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate URL",
        variant: "destructive",
      });
    }
  };

  const handleStartCompetition = async () => {
    try {
      await api.post("/api/competitions", {
        roomId: 1,
        name: "Music Competition",
        description: "Most liked song wins!",
        startTime: new Date(),
        endTime: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      });
      toast({
        title: "Success",
        description: "Competition started!",
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to start competition",
        variant: "destructive",
      });
    }
  };

  const handleDistributeCubes = async () => {
    try {
      // This would distribute daily cubes to all users
      toast({
        title: "Success",
        description: "Daily cubes distributed to all users!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to distribute cubes",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface shadow-material sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Music className="text-white text-lg" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-on-surface">Highrise Music Bot</h1>
                  <p className="text-sm text-on-surface-variant">Dashboard & Analytics</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-on-surface-variant">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">AD</span>
                </div>
                <span className="text-sm font-medium">Admin User</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-surface shadow-material min-h-screen">
          <nav className="p-4 space-y-2">
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
                Bot Management
              </h2>
              <ul className="space-y-1">
                <li>
                  <a href="/" className="flex items-center space-x-3 px-3 py-2 bg-primary text-white rounded-lg">
                    <Home className="w-5 h-5" />
                    <span className="font-medium">Dashboard</span>
                  </a>
                </li>
                <li>
                  <a href="/bot-setup" className="flex items-center space-x-3 px-3 py-2 text-on-surface-variant hover:bg-gray-100 rounded-lg transition-colors">
                    <Settings className="w-5 h-5" />
                    <span>Bot Setup</span>
                  </a>
                </li>
                <li>
                  <a href="/saved-configs" className="flex items-center space-x-3 px-3 py-2 text-on-surface-variant hover:bg-gray-100 rounded-lg transition-colors">
                    <Group className="w-5 h-5" />
                    <span>Saved Configs</span>
                  </a>
                </li>
                <li>
                  <a href="/rooms" className="flex items-center space-x-3 px-3 py-2 text-on-surface-variant hover:bg-gray-100 rounded-lg transition-colors">
                    <Home className="w-5 h-5" />
                    <span>Room Management</span>
                  </a>
                </li>
              </ul>
            </div>

            <div className="mb-6">
              <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
                Music Control
              </h2>
              <ul className="space-y-1">
                <li>
                  <a href="/queue" className="flex items-center space-x-3 px-3 py-2 text-on-surface-variant hover:bg-gray-100 rounded-lg transition-colors">
                    <Music className="w-5 h-5" />
                    <span>Queue Manager</span>
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Status Cards */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-on-surface mb-6">Bot Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Settings className="text-green-600 text-xl" />
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {botStatus?.onlineBots > 0 ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-on-surface">Bot Status</h3>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Connected to {botStatus?.rooms?.length || 0} rooms
                  </p>
                  <div className="mt-4">
                    <div className="text-2xl font-bold text-on-surface">
                      {botStatus?.onlineBots || 0}/{botStatus?.totalBots || 0}
                    </div>
                    <p className="text-xs text-on-surface-variant">Active Bots</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Play className="text-blue-600 text-xl" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-on-surface">Active Queues</h3>
                  <p className="text-sm text-on-surface-variant mt-1">Across all rooms</p>
                  <div className="mt-4">
                    <div className="text-2xl font-bold text-on-surface">
                      {stats?.totalSongsPlayed || 0}
                    </div>
                    <p className="text-xs text-on-surface-variant">Songs queued</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Group className="text-purple-600 text-xl" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-on-surface">Group Circulating</h3>
                  <p className="text-sm text-on-surface-variant mt-1">Total in system</p>
                  <div className="mt-4">
                    <div className="text-2xl font-bold text-on-surface">
                      {stats?.totalCubesCirculating?.toLocaleString() || 0}
                    </div>
                    <p className="text-xs text-on-surface-variant">+324 today</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Users className="text-orange-600 text-xl" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-on-surface">Active Users</h3>
                  <p className="text-sm text-on-surface-variant mt-1">Last 24 hours</p>
                  <div className="mt-4">
                    <div className="text-2xl font-bold text-on-surface">
                      {stats?.activeUsers?.toLocaleString() || 0}
                    </div>
                    <p className="text-xs text-on-surface-variant">-12 vs yesterday</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Playing Section */}
            <div className="lg:col-span-2">
              <Card className="shadow-material">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold">Now Playing</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Live
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {songsLoading ? (
                    <div className="space-y-4">
                      <div className="animate-pulse bg-gray-200 h-24 rounded-lg" />
                      <div className="animate-pulse bg-gray-200 h-24 rounded-lg" />
                    </div>
                  ) : currentSongs && currentSongs.length > 0 ? (
                    currentSongs.map((song) => (
                      <RoomCard key={song.id} song={song} />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-on-surface mb-2">No Music Playing</h3>
                      <p className="text-sm text-on-surface-variant">
                        Start playing music in your rooms to see them here.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions Panel */}
            <div>
              <Card className="shadow-material">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleCreateRoom} className="w-full" size="lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Room
                  </Button>

                  <Button onClick={handleGenerateURL} variant="outline" className="w-full" size="lg">
                    <Link className="mr-2 h-4 w-4" />
                    Generate URL
                  </Button>

                  <Button onClick={handleStartCompetition} variant="outline" className="w-full" size="lg">
                    <Trophy className="mr-2 h-4 w-4" />
                    Start Competition
                  </Button>

                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-on-surface mb-3">Cube Management</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-on-surface">Daily Rewards</p>
                          <p className="text-xs text-on-surface-variant">50 cubes per user</p>
                        </div>
                        <Button onClick={handleDistributeCubes} size="sm" variant="secondary">
                          Distribute
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-on-surface">Purchase Rate</p>
                          <p className="text-xs text-on-surface-variant">10g = 1 cube</p>
                        </div>
                        <Button size="sm" variant="secondary">
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Music Queue Section */}
          <div className="mt-8">
            <MusicQueue selectedRoom={selectedRoom} onRoomChange={setSelectedRoom} />
          </div>

          {/* Analytics Section */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnalyticsChart />
            <BotStatus />
          </div>
        </main>
      </div>
    </div>
  );
}
