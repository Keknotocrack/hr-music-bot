import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { 
  Music, 
  Play, 
  Pause, 
  SkipForward, 
  Heart, 
  Trash2, 
  Search,
  RefreshCw,
  Users,
  Clock,
  Volume2
} from "lucide-react";

interface QueueItem {
  id: number;
  songTitle: string;
  songArtist: string;
  platform: string;
  platformUrl: string;
  cubesSpent: number;
  position: number;
  likes: number;
  isPlaying: boolean;
  addedAt: string;
  user?: {
    username: string;
  };
}

interface Room {
  id: number;
  name: string;
  highriseRoomId: string;
}

export default function QueueManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch rooms
  const { data: rooms } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  // Fetch queue for selected room
  const { data: queue, isLoading: queueLoading } = useQuery<QueueItem[]>({
    queryKey: selectedRoom === "all" ? ["/api/queue"] : ["/api/rooms", selectedRoom, "queue"],
    refetchInterval: 5000,
  });

  // Fetch current playing songs across all rooms
  const { data: currentSongs } = useQuery({
    queryKey: ["/api/rooms/current-songs"],
    refetchInterval: 3000,
  });

  // Remove from queue mutation
  const removeFromQueueMutation = useMutation({
    mutationFn: (queueItemId: number) => api.delete(`/api/queue/${queueItemId}`),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Song removed from queue",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove song",
        variant: "destructive",
      });
    },
  });

  // Like song mutation
  const likeSongMutation = useMutation({
    mutationFn: ({ queueItemId, userId }: { queueItemId: number; userId: number }) => 
      api.post(`/api/queue/${queueItemId}/like`, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to like song",
        variant: "destructive",
      });
    },
  });

  const handleRemoveFromQueue = (queueItemId: number) => {
    removeFromQueueMutation.mutate(queueItemId);
  };

  const handleLikeSong = (queueItemId: number) => {
    likeSongMutation.mutate({ queueItemId, userId: 1 }); // This would come from auth context
  };

  const handleRefreshQueue = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/queue"] });
    queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
    toast({
      title: "Queue Refreshed",
      description: "Queue data has been updated",
    });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube':
        return <div className="w-4 h-4 bg-red-500 rounded-sm flex items-center justify-center text-white text-xs font-bold">▶</div>;
      case 'spotify':
        return <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">♫</div>;
      case 'soundcloud':
        return <div className="w-4 h-4 bg-orange-500 rounded flex items-center justify-center text-white text-xs">☁</div>;
      default:
        return <Music className="w-4 h-4" />;
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

  const filteredQueue = queue?.filter(item => 
    searchQuery === "" || 
    item.songTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.songArtist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.user?.username.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface shadow-material">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Music className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-semibold text-on-surface">Queue Manager</h1>
                <p className="text-sm text-on-surface-variant">Manage music queues across all rooms</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button onClick={handleRefreshQueue} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Current Playing Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Volume2 className="w-5 h-5" />
                <span>Currently Playing</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentSongs && currentSongs.length > 0 ? (
                <div className="space-y-4">
                  {currentSongs.map((song: any, index: number) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        {getPlatformIcon(song.platform)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{song.title}</h4>
                        <p className="text-sm text-on-surface-variant">{song.artist}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">{song.roomName}</Badge>
                          <span className="text-xs text-on-surface-variant">by @{song.requestedBy}</span>
                          {song.url && (
                            <a
                              href={song.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded-full transition-colors"
                            >
                              <Play className="w-3 h-3" />
                              <span>Listen Now</span>
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 text-sm">
                          <Heart className="w-4 h-4 text-red-500" />
                          <span>{song.likes}</span>
                        </div>
                        <div className="text-xs text-on-surface-variant mt-1">
                          {Math.floor(song.currentTime / 60)}:{(song.currentTime % 60).toString().padStart(2, '0')} / 
                          {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Music Playing</h3>
                  <p className="text-sm text-on-surface-variant">
                    No songs are currently playing in any rooms
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Queue Stats</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{queue?.length || 0}</div>
                  <p className="text-xs text-on-surface-variant">Total Songs</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {rooms?.length || 0}
                  </div>
                  <p className="text-xs text-on-surface-variant">Active Rooms</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>YouTube</span>
                  <span className="text-red-500">65%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '65%' }} />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Spotify</span>
                  <span className="text-green-500">25%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '25%' }} />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>SoundCloud</span>
                  <span className="text-orange-500">10%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '10%' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Queue Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Music Queue</CardTitle>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search songs, artists, or users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rooms</SelectItem>
                    {rooms?.map((room) => (
                      <SelectItem key={room.id} value={room.id.toString()}>
                        {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {queueLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                    <div className="w-20 h-8 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : filteredQueue.length > 0 ? (
              <div className="space-y-3">
                {filteredQueue.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center space-x-4 p-4 border rounded-lg queue-item ${
                      item.isPlaying ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-on-surface-variant w-6">
                        {item.position}
                      </span>
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        {getPlatformIcon(item.platform)}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{item.songTitle}</h4>
                        {item.isPlaying && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            Playing
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-on-surface-variant">{item.songArtist}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1">
                          {getPlatformIcon(item.platform)}
                          <span className={`text-xs ${getPlatformColor(item.platform)}`}>
                            {item.platform}
                          </span>
                        </div>
                        <span className="text-xs text-on-surface-variant">
                          by @{item.user?.username || 'Unknown'}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-on-surface-variant" />
                          <span className="text-xs text-on-surface-variant">
                            {new Date(item.addedAt).toLocaleTimeString()}
                          </span>
                        </div>
                        {item.platformUrl && (
                          <a
                            href={item.platformUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded-full transition-colors"
                          >
                            <Play className="w-3 h-3" />
                            <span>Listen Now</span>
                          </a>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline" className="bg-purple-100 text-purple-800">
                        {item.cubesSpent} cubes
                      </Badge>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLikeSong(item.id)}
                          disabled={likeSongMutation.isPending}
                        >
                          <Heart className="w-4 h-4 text-red-500" />
                          <span className="ml-1">{item.likes}</span>
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFromQueue(item.id)}
                          disabled={removeFromQueueMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery ? "No songs found" : "Queue is empty"}
                </h3>
                <p className="text-sm text-on-surface-variant">
                  {searchQuery 
                    ? "Try adjusting your search terms"
                    : "Songs will appear here when users add them to the queue"
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
