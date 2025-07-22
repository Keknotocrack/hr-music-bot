# Highrise Music Bot Platform

A sophisticated multi-room Highrise music bot with web dashboard for managing music queues, user interactions, and bot configurations across multiple rooms.

## Features

- **Multi-Platform Music Search**: YouTube, Spotify, SoundCloud integration
- **Real-time Web Dashboard**: Monitor bot status, manage queues, view analytics
- **Cube Economy System**: User economy with cubes for song requests
- **VIP/Owner System**: Role-based permissions and unlimited access
- **Bot Commands**: 20+ chat commands for music and room management
- **Competition System**: Music battles and leaderboards
- **Dance Commands**: Bot can perform various dance emotes
- **Room Management**: Multi-room support with individual configurations

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Bot**: Python 3 + Highrise SDK
- **Real-time**: WebSocket for live updates
- **Build**: Vite for frontend, TSX for backend

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL database
- Highrise API token

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/highrise-music-bot.git
cd highrise-music-bot
```

2. **Install dependencies**
```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
pip install highrise-bot-sdk numpy pandas psycopg2-binary python-dotenv requests scikit-learn spotipy youtube-dl
```

3. **Environment setup**
Create `.env` file:
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Highrise Bot
HIGHRISE_API_TOKEN=your_highrise_token_here

# Optional Music APIs
YOUTUBE_API_KEY=your_youtube_api_key
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Development
NODE_ENV=development
```

4. **Database setup**
```bash
npm run db:push
```

5. **Start the application**
```bash
npm run dev
```

## Deployment

### Manual Deployment

1. **Build the application**
```bash
npm run build
```

2. **Set environment variables on your server**

3. **Start production server**
```bash
npm start
```

### Docker Deployment

```bash
docker build -t highrise-music-bot .
docker run -p 5000:5000 --env-file .env highrise-music-bot
```

### Railway/Heroku Deployment

1. Connect your GitHub repository
2. Set environment variables in dashboard
3. Deploy with automatic builds

## Bot Commands

### Music Commands
- `-play <song>` - Add song to queue (costs 10 cubes)
- `-queue` - Show current music queue
- `-skip` - Skip current song (VIP/Owner only)
- `-like` - Like the current song
- `-link` / `-url` - Get current song URL to listen
- `-search <song>` - Search for songs

### Platform-Specific
- `-youtube <song>` - Search only YouTube
- `-spotify <song>` - Search only Spotify
- `-soundcloud <song>` - Search only SoundCloud

### User Commands
- `-cubes` - Check your cube balance
- `-buy` - Info about buying cubes
- `-help` - Show all commands

### Owner Commands
- `-vip <user>` - Grant VIP status
- `-inv all` - Invite all registered users
- `-followme` - Make bot follow you
- `-dance` - Start bot dancing
- `-stopdance` - Stop bot dancing

## Web Dashboard

Access the dashboard at `http://localhost:5000` or your deployed URL:

- **Bot Setup**: Configure and start/stop bots
- **Queue Manager**: View and manage music queues with clickable "Listen Now" buttons
- **Room Management**: Manage multiple rooms
- **Analytics**: View usage statistics
- **Saved Configs**: Manage bot configurations

## Music Listening

The bot provides URLs for listening to music:

1. **Web Dashboard**: Click "Listen Now" buttons next to songs
2. **Chat Integration**: Bot automatically shares URLs when songs are added
3. **Commands**: Use `-link` or `-url` to get current song URL

## API Endpoints

- `GET /api/bot/status` - Bot status across all rooms
- `GET /api/queue` - Current music queue
- `GET /api/rooms` - List all rooms
- `POST /api/bot/start` - Start bot in room
- `POST /api/bot/stop` - Stop bot in room

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Configuration

### Bot Settings
- `welcomeMessage`: Custom welcome message
- `maxQueueSize`: Maximum songs in queue (default: 50)
- `songCost`: Cubes per song request (default: 10)
- `enableCompetitions`: Enable music competitions
- `platformPreference`: Preferred music platform

### Database Schema
The application uses Drizzle ORM with PostgreSQL. Run `npm run db:push` to apply schema changes.

## Troubleshooting

### Common Issues

**Bot not connecting**: Check your Highrise API token and room permissions
**Database errors**: Verify DATABASE_URL and PostgreSQL connection
**Music search failing**: Add YouTube/Spotify API keys for better results
**Permission denied**: Ensure bot has proper room permissions

### Logs
Check console output for detailed error messages and debugging information.

## License

MIT License - see LICENSE file for details.

## Support

- Create an issue for bugs or feature requests
- Join our Discord for community support
- Check the documentation for detailed guides

## Acknowledgments

- Highrise SDK for bot functionality
- shadcn/ui for beautiful UI components
- Contributors and community members