import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { 
  Home, 
  Plus, 
  Settings, 
  Users, 
  Music, 
  Play, 
  Square, 
  ExternalLink,
  Link,
  Copy,
  Eye,
  MoreHorizontal,
  Crown
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const roomSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  highriseRoomId: z.string().min(1, "Highrise Room ID is required"),
  ownerId: z.number().default(1),
  customUrl: z.string().optional(),
});

type RoomFormData = z.infer<typeof roomSchema>;

interface Room {
  id: number;
  name: string;
  highriseRoomId: string;
  isActive: boolean;
  customUrl?: string;
  currentSong?: any;
  settings: any;
  createdAt: string;
}

export default function RoomManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const form = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      ownerId: 1,
    },
  });

  // Fetch rooms
  const { data: rooms, isLoading: roomsLoading } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  // Fetch bot status for each room
  const { data: botStatus } = useQuery({
    queryKey: ["/api/bot/status"],
    refetchInterval: 10000,
  });

  // Create room mutation
  const createRoomMutation = useMutation({
    mutationFn: (data: RoomFormData) => api.post("/api/rooms", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Room created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create room",
        variant: "destructive",
      });
    },
  });

  // Start bot mutation
  const startBotMutation = useMutation({
    mutationFn: (roomId: string) => api.post("/api/bot/start", { roomId }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bot started successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bot/status"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start bot",
        variant: "destructive",
      });
    },
  });

  // Stop bot mutation
  const stopBotMutation = useMutation({
    mutationFn: (roomId: string) => api.post("/api/bot/stop", { roomId }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bot stopped successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bot/status"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to stop bot",
        variant: "destructive",
      });
    },
  });

  // Generate URL mutation
  const generateUrlMutation = useMutation({
    mutationFn: (roomId: number) => api.post("/api/urls/generate", { roomId, createdBy: 1 }),
    onSuccess: (response) => {
      navigator.clipboard.writeText(response.data.url);
      toast({
        title: "Success",
        description: "Room URL copied to clipboard!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate URL",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RoomFormData) => {
    createRoomMutation.mutate(data);
  };

  const getBotStatus = (highriseRoomId: string) => {
    if (!botStatus?.rooms) return null;
    return botStatus.rooms.find((room: any) => room.roomId === highriseRoomId);
  };

  const handleStartBot = (highriseRoomId: string) => {
    startBotMutation.mutate(highriseRoomId);
  };

  const handleStopBot = (highriseRoomId: string) => {
    stopBotMutation.mutate(highriseRoomId);
  };

  const handleGenerateUrl = (roomId: number) => {
    generateUrlMutation.mutate(roomId);
  };

  const handleViewRoom = (highriseRoomId: string) => {
    window.open(`https://highrise.game/room/${highriseRoomId}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface shadow-material">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Home className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-semibold text-on-surface">Room Management</h1>
                <p className="text-sm text-on-surface-variant">Manage your Highrise music rooms</p>
              </div>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Room</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Room Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter room name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="highriseRoomId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Highrise Room ID</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter Highrise room ID" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custom URL (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="custom-room-name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createRoomMutation.isPending}
                      >
                        {createRoomMutation.isPending ? "Creating..." : "Create Room"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Room Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Home className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{rooms?.length || 0}</div>
                  <p className="text-sm text-on-surface-variant">Total Rooms</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Play className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{botStatus?.onlineBots || 0}</div>
                  <p className="text-sm text-on-surface-variant">Active Bots</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">127</div>
                  <p className="text-sm text-on-surface-variant">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Music className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold">1,432</div>
                  <p className="text-sm text-on-surface-variant">Songs Played</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roomsLoading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-8 bg-gray-200 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : rooms && rooms.length > 0 ? (
            rooms.map((room) => {
              const status = getBotStatus(room.highriseRoomId);
              const isOnline = status?.isOnline || false;
              
              return (
                <Card key={room.id} className="card-hover">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{room.name}</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewRoom(room.highriseRoomId)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View in Highrise
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleGenerateUrl(room.id)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Share URL
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="w-4 h-4 mr-2" />
                            Room Settings
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="secondary" 
                        className={isOnline ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                      >
                        {isOnline ? "Online" : "Offline"}
                      </Badge>
                      {room.isActive && (
                        <Badge variant="outline">Active</Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-on-surface-variant">
                        <Home className="w-4 h-4" />
                        <span>ID: {room.highriseRoomId}</span>
                      </div>
                      
                      {room.customUrl && (
                        <div className="flex items-center space-x-2 text-sm text-on-surface-variant">
                          <Link className="w-4 h-4" />
                          <span>{room.customUrl}</span>
                        </div>
                      )}
                      
                      {room.currentSong && (
                        <div className="flex items-center space-x-2 text-sm text-on-surface-variant">
                          <Music className="w-4 h-4" />
                          <span>Playing: {room.currentSong.title}</span>
                        </div>
                      )}
                    </div>

                    {/* Room Stats */}
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold">12</div>
                        <p className="text-xs text-on-surface-variant">Songs in Queue</p>
                      </div>
                      <div>
                        <div className="text-lg font-semibold">24</div>
                        <p className="text-xs text-on-surface-variant">Active Users</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      {isOnline ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleStopBot(room.highriseRoomId)}
                          disabled={stopBotMutation.isPending}
                        >
                          <Square className="w-3 h-3 mr-1" />
                          Stop Bot
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleStartBot(room.highriseRoomId)}
                          disabled={startBotMutation.isPending}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Start Bot
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewRoom(room.highriseRoomId)}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            // Empty state
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <Home className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-on-surface mb-2">No rooms yet</h3>
              <p className="text-sm text-on-surface-variant mb-4">
                Create your first music room to get started
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Room
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
