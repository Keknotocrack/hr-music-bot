import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Settings } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface StartBotButtonProps {
  roomId: string;
  roomName: string;
}

export default function StartBotButton({ roomId, roomName }: StartBotButtonProps) {
  const { data: botStatus } = useQuery({
    queryKey: ["/api/bot/status"],
    refetchInterval: 5000,
  });

  const startBotMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/bot/start/${roomId}`, {
        method: "POST",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start bot");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot/status"] });
      toast({
        title: "Bot Started",
        description: `Music bot is now active in ${roomName}!`,
      });
    },
    onError: (error: Error) => {
      if (error.message.includes("No bot configuration found")) {
        toast({
          title: "Configuration Required",
          description: "Please set up the bot configuration first.",
          action: (
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/bot-setup"}>
              <Settings className="h-4 w-4 mr-1" />
              Setup
            </Button>
          ),
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const stopBotMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/bot/stop/${roomId}`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to stop bot");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot/status"] });
      toast({
        title: "Bot Stopped",
        description: `Music bot stopped in ${roomName}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isRunning = botStatus?.rooms?.some((room: any) => room.highriseRoomId === roomId);
  const isLoading = startBotMutation.isPending || stopBotMutation.isPending;

  return (
    <div className="flex items-center gap-2">
      <Badge variant={isRunning ? "default" : "secondary"}>
        {isRunning ? "Online" : "Offline"}
      </Badge>
      
      {isRunning ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => stopBotMutation.mutate()}
          disabled={isLoading}
        >
          <Square className="h-4 w-4 mr-1" />
          Stop Bot
        </Button>
      ) : (
        <Button
          size="sm"
          onClick={() => startBotMutation.mutate()}
          disabled={isLoading}
        >
          <Play className="h-4 w-4 mr-1" />
          Start Bot
        </Button>
      )}
    </div>
  );
}