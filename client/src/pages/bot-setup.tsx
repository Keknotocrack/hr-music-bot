import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Settings, Play, Square, RotateCcw, ExternalLink, Key, Music } from "lucide-react";

const botConfigSchema = z.object({
  highriseRoomId: z.string().min(1, "Room ID is required"),
  apiToken: z.string().min(1, "API Token is required"),
  autoStart: z.boolean().default(true),
  welcomeMessage: z.string().optional(),
  maxQueueSize: z.number().min(1).max(100).default(50),
  songCost: z.number().min(1).max(100).default(10),
  enableCompetitions: z.boolean().default(true),
  platformPreference: z.enum(["all", "youtube", "spotify", "soundcloud"]).default("all"),
});

type BotConfig = z.infer<typeof botConfigSchema>;

export default function BotSetup() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState<string>("");

  const form = useForm<BotConfig>({
    resolver: zodResolver(botConfigSchema),
    defaultValues: {
      autoStart: true,
      maxQueueSize: 50,
      songCost: 10,
      enableCompetitions: true,
      platformPreference: "all",
    },
  });

  // Fetch bot status
  const { data: botStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["/api/bot/status"],
    refetchInterval: 5000,
  });

  // Fetch available rooms
  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ["/api/rooms"],
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

  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: (config: BotConfig) => api.post("/api/bot/config", config),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bot configuration saved!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: BotConfig) => {
    // Find the room ID from the selected room
    const room = rooms?.find(r => r.highriseRoomId === data.highriseRoomId);
    if (!room) {
      toast({
        title: "Error",
        description: "Please select a valid room",
        variant: "destructive",
      });
      return;
    }

    // Add room ID and use environment API token if available
    const configWithRoomId = {
      ...data,
      roomId: room.id,
      apiToken: data.apiToken || ""
    };

    saveConfigMutation.mutate(configWithRoomId);
  };

  const handleStartBot = () => {
    if (selectedRoom) {
      startBotMutation.mutate(selectedRoom);
    } else {
      toast({
        title: "Error",
        description: "Please select a room first",
        variant: "destructive",
      });
    }
  };

  const handleStopBot = (roomId: string) => {
    stopBotMutation.mutate(roomId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface shadow-material">
        <div className="px-6 py-4">
          <div className="flex items-center space-x-3">
            <Settings className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-semibold text-on-surface">Bot Setup</h1>
              <p className="text-sm text-on-surface-variant">Configure and manage your Highrise music bot</p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Bot Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Music className="w-5 h-5" />
              <span>Bot Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <div className="animate-pulse bg-gray-200 h-20 rounded" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-on-surface">
                    {botStatus?.totalBots || 0}
                  </div>
                  <p className="text-sm text-on-surface-variant">Total Bots</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {botStatus?.onlineBots || 0}
                  </div>
                  <p className="text-sm text-on-surface-variant">Online</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-on-surface">
                    {botStatus?.rooms?.length || 0}
                  </div>
                  <p className="text-sm text-on-surface-variant">Active Rooms</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bot Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Bot Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="highriseRoomId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Highrise Room ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter room ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="apiToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Token</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter API token" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="welcomeMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Welcome Message (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Welcome to our music room! 🎵"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="maxQueueSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Queue Size</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              max="100"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="songCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Song Cost (Cubes)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              max="100"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="platformPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform Preference</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select platform preference" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all">All Platforms</SelectItem>
                            <SelectItem value="youtube">YouTube Only</SelectItem>
                            <SelectItem value="spotify">Spotify Only</SelectItem>
                            <SelectItem value="soundcloud">SoundCloud Only</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="autoStart"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Auto Start</FormLabel>
                            <div className="text-sm text-on-surface-variant">
                              Automatically start bot when room is created
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="enableCompetitions"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Enable Competitions</FormLabel>
                            <div className="text-sm text-on-surface-variant">
                              Allow VIP/Owner users to start music competitions
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={saveConfigMutation.isPending}
                  >
                    {saveConfigMutation.isPending ? "Saving..." : "Save Configuration"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Active Bots Management */}
          <Card>
            <CardHeader>
              <CardTitle>Active Bots</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Quick Start Section */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Quick Start Bot</h4>
                  <div className="space-y-3">
                    <Select onValueChange={setSelectedRoom}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a room" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms?.map((room: any) => (
                          <SelectItem key={room.id} value={room.highriseRoomId}>
                            {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleStartBot}
                      disabled={!selectedRoom || startBotMutation.isPending}
                      className="w-full"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {startBotMutation.isPending ? "Starting..." : "Start Bot"}
                    </Button>
                  </div>
                </div>

                {/* Running Bots */}
                <div className="space-y-3">
                  <h4 className="font-medium">Running Bots</h4>
                  {botStatus?.rooms?.length > 0 ? (
                    botStatus.rooms.map((room: any) => (
                      <div key={room.roomId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{room.roomId}</div>
                          <div className="text-sm text-on-surface-variant">
                            {room.isOnline ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Online
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-red-100 text-red-800">
                                Offline
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`https://highrise.game/room/${room.roomId}`, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStopBot(room.roomId)}
                            disabled={stopBotMutation.isPending}
                          >
                            <Square className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-on-surface-variant">
                      <Settings className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No bots running</p>
                      <p className="text-sm">Start a bot in a room to see it here</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Keys Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="w-5 h-5" />
              <span>API Keys</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>YouTube API Key</Label>
                <Input 
                  type="password" 
                  placeholder="Enter YouTube API key"
                  defaultValue={import.meta.env.VITE_YOUTUBE_API_KEY ? "••••••••••••" : ""}
                />
                <p className="text-xs text-on-surface-variant">
                  Required for YouTube music search
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Spotify Client ID</Label>
                <Input 
                  type="password" 
                  placeholder="Enter Spotify client ID"
                  defaultValue={import.meta.env.VITE_SPOTIFY_CLIENT_ID ? "••••••••••••" : ""}
                />
                <p className="text-xs text-on-surface-variant">
                  Required for Spotify integration
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>SoundCloud Client ID</Label>
                <Input 
                  type="password" 
                  placeholder="Enter SoundCloud client ID"
                  defaultValue={import.meta.env.VITE_SOUNDCLOUD_CLIENT_ID ? "••••••••••••" : ""}
                />
                <p className="text-xs text-on-surface-variant">
                  Required for SoundCloud integration
                </p>
              </div>
            </div>
            
            <Button className="mt-4" variant="outline">
              Update API Keys
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
