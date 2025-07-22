import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Music, Play, Trash2, Heart, RefreshCw, Users, Clock } from "lucide-react";

interface MusicQueueProps {
  selectedRoom: string;
  onRoomChange: (roomId: string) => void;
}

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

export default function MusicQueue({ selectedRoom, onRoomChange }: MusicQueueProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch rooms
  const { data: rooms } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  // Fetch queue for selected room
  const { data: queue, isLoading: queueLoading } = useQuery<QueueItem[]>({
    queryKey: selectedRoom === "all" ? ["/api/queue"] : ["/api/rooms", selectedRoom, "queue"],
    refetchInterval: 5000,
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
  };

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
    <Card className="shadow-material">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Global Music Queue</CardTitle>
          <div className="flex items-center space-x-3">
            <Select value={selectedRoom} onValueChange={onRoomChange}>
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
            <Button onClick={handleRefreshQueue} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {queueLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="w-10 h-10 bg-gray-200 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                  <div className="w-20 h-8 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : queue && queue.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-on-surface-variant">#</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-on-surface-variant">Song</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-on-surface-variant">Platform</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-on-surface-variant">Room</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-on-surface-variant">Requested By</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-on-surface-variant">Cubes</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-on-surface-variant">Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue.slice(0, 10).map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 text-sm text-on-surface-variant">
                      {item.position}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                          <Music className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-on-surface">
                            {item.songTitle}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {item.songArtist}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getPlatformIcon(item.platform)}</span>
                        <span className={`text-sm ${getPlatformColor(item.platform)}`}>
                          {item.platform}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-on-surface-variant">
                      {rooms?.find(r => r.id.toString() === selectedRoom)?.name || 'All Rooms'}
                    </td>
                    <td className="py-4 px-4 text-sm text-on-surface-variant">
                      @{item.user?.username || 'Unknown'}
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className="bg-purple-100 text-purple-800">
                        {item.cubesSpent} cubes
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLikeSong(item.id)}
                          disabled={likeSongMutation.isPending}
                          className="text-red-600 hover:bg-red-100"
                        >
                          <Heart className="w-4 h-4" />
                          <span className="ml-1">{item.likes}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFromQueue(item.id)}
                          disabled={removeFromQueueMutation.isPending}
                          className="text-red-600 hover:bg-red-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {queue.length > 10 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-on-surface-variant">
                  Showing 10 of {queue.length} songs
                </p>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-on-surface mb-2">
              Queue is empty
            </h3>
            <p className="text-sm text-on-surface-variant">
              Songs will appear here when users add them to the queue
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
