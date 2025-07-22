import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Settings, Play, Square, Trash2, Edit3 } from "lucide-react";
import { useLocation } from "wouter";
import StartBotButton from "@/components/start-bot-button";

interface BotConfiguration {
  id: number;
  roomId: number;
  apiToken: string;
  autoStart: boolean;
  welcomeMessage?: string;
  maxQueueSize: number;
  songCost: number;
  enableCompetitions: boolean;
  platformPreference: string;
  isActive: boolean;
  lastStarted?: string;
  createdAt: string;
  updatedAt: string;
}

interface Room {
  id: number;
  name: string;
  highriseRoomId: string;
}

export default function SavedConfigs() {
  const [, setLocation] = useLocation();

  const { data: configs, isLoading } = useQuery<BotConfiguration[]>({
    queryKey: ["/api/bot/configs"],
  });

  const { data: rooms } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  const deleteConfigMutation = useMutation({
    mutationFn: async (roomId: number) => {
      const response = await fetch(`/api/bot/config/${roomId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete configuration");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot/configs"] });
      toast({
        title: "Configuration Deleted",
        description: "Bot configuration has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete configuration. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getRoomName = (roomId: number) => {
    return rooms?.find(r => r.id === roomId)?.name || `Room ${roomId}`;
  };

  const getStatusColor = (isActive: boolean, lastStarted?: string) => {
    if (!isActive) return "secondary";
    if (lastStarted && new Date(lastStarted).getTime() > Date.now() - 300000) {
      return "default"; // Online (started within 5 minutes)
    }
    return "outline"; // Configured but not recently started
  };

  const getStatusText = (isActive: boolean, lastStarted?: string) => {
    if (!isActive) return "Inactive";
    if (lastStarted && new Date(lastStarted).getTime() > Date.now() - 300000) {
      return "Online";
    }
    return "Configured";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Saved Bot Configurations</h1>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Saved Bot Configurations</h1>
        <Button onClick={() => setLocation("/bot-setup")}>
          <Settings className="h-4 w-4 mr-2" />
          New Configuration
        </Button>
      </div>

      {configs?.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Configurations Found</h3>
              <p className="text-muted-foreground mb-4">
                You haven't set up any bot configurations yet. Create your first one to get started.
              </p>
              <Button onClick={() => setLocation("/bot-setup")}>
                Create Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {configs?.map((config) => (
            <Card key={config.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getRoomName(config.roomId)}
                      <Badge variant={getStatusColor(config.isActive, config.lastStarted)}>
                        {getStatusText(config.isActive, config.lastStarted)}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Created {new Date(config.createdAt).toLocaleDateString()}
                      {config.lastStarted && (
                        <>
                          {" • "}Last started {new Date(config.lastStarted).toLocaleString()}
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <StartBotButton 
                      roomId={rooms?.find(r => r.id === config.roomId)?.highriseRoomId || ""} 
                      roomName={getRoomName(config.roomId)} 
                    />
                    <Button variant="outline" size="sm" onClick={() => setLocation(`/bot-setup?roomId=${config.roomId}`)}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteConfigMutation.mutate(config.roomId)}
                      disabled={deleteConfigMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium">Max Queue Size</p>
                    <p className="text-2xl font-bold">{config.maxQueueSize}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Song Cost</p>
                    <p className="text-2xl font-bold">{config.songCost} cubes</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Platform</p>
                    <p className="text-sm capitalize">{config.platformPreference}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Auto Start</p>
                    <Switch checked={config.autoStart} disabled />
                  </div>
                </div>

                {config.welcomeMessage && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-1">Welcome Message</p>
                    <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                      {config.welcomeMessage}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Competitions</p>
                    <Badge variant={config.enableCompetitions ? "default" : "secondary"}>
                      {config.enableCompetitions ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">API Token</p>
                    <p className="text-sm font-mono bg-muted p-1 rounded">{config.apiToken}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}