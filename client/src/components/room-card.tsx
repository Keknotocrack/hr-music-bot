import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, SkipForward, Heart, Users, Music } from "lucide-react";

interface Song {
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

interface RoomCardProps {
  song: Song;
}

export default function RoomCard({ song }: RoomCardProps) {
  const progressPercentage = (song.currentTime / song.duration) * 100;

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePauseMusic = () => {
    // API call to pause music in this room
    console.log(`Pausing music in room ${song.roomId}`);
  };

  const handleSkipSong = () => {
    // API call to skip song in this room
    console.log(`Skipping song in room ${song.roomId}`);
  };

  return (
    <Card className="border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Room Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Music className="text-white text-sm" />
            </div>
            <div>
              <h4 className="font-medium text-on-surface">{song.roomName}</h4>
              <p className="text-xs text-on-surface-variant flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>24 listeners</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handlePauseMusic}
              className="h-7 w-7 p-0"
            >
              <Pause className="w-3 h-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSkipSong}
              className="h-7 w-7 p-0"
            >
              <SkipForward className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Song Info */}
        <div className="flex items-center space-x-4">
          {/* Song artwork placeholder */}
          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
            <Music className="w-6 h-6 text-gray-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h5 className="font-medium text-on-surface truncate">{song.title}</h5>
            <p className="text-sm text-on-surface-variant truncate">{song.artist}</p>
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-lg">{getPlatformIcon(song.platform)}</span>
              <span className={`text-xs ${getPlatformColor(song.platform)}`}>
                {song.platform}
              </span>
              <span className="text-xs text-on-surface-variant">
                requested by @{song.requestedBy}
              </span>
            </div>
          </div>
          
          <div className="text-right flex-shrink-0">
            <div className="flex items-center space-x-1 mb-1">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium">{song.likes}</span>
            </div>
            <div className="text-xs text-on-surface-variant">
              {formatTime(song.currentTime)} / {formatTime(song.duration)}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <Progress 
            value={progressPercentage} 
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  );
}
