# How to Listen to Music with the Highrise Bot

## 🎵 Overview
This bot provides music coordination for Highrise rooms - it helps everyone discover and share music together, but you need to manually play the actual audio.

## 🔗 Where to Find Music URLs

### Method 1: Web Dashboard (Recommended)
1. **Open the Web Dashboard**: Go to your app URL (in Replit or localhost:5000)
2. **Navigate to Queue Manager**: Click on "Queue Manager" in the navigation
3. **Find "Listen Now" Buttons**: 
   - **Currently Playing**: Green "Listen Now" button next to active songs
   - **Queue Items**: Blue "Listen Now" button next to each queued song
4. **Click to Listen**: Opens YouTube/Spotify/SoundCloud directly in new tab

### Method 2: In Highrise Chat
When someone adds a song, the bot automatically posts the URL:
```
🎵 Song Title by Artist added to queue by Username!
🔗 Listen here: https://youtube.com/watch?v=...
```

### Method 3: Bot Commands
Use these commands in Highrise chat:
- **`-link`** - Get current playing song URL
- **`-url`** - Same as -link command
- **`-queue`** - See all upcoming songs (URLs in web dashboard)

## 🎧 How to Use

### Step 1: Request Music
```
-play despacito
-play taylor swift shake it off
-play any song name
```

### Step 2: Get the Link
The bot will respond with:
```
🎵 Song added to queue!
🔗 Listen here: [clickable URL]
```

### Step 3: Listen
- **Click the URL** - Opens in YouTube/Spotify/SoundCloud
- **Use Web Dashboard** - Click "Listen Now" buttons
- **Copy/Share Links** - Share URLs with friends

## 💎 Music Economy

### Cube System
- **Regular Users**: Need 10 cubes per song request
- **VIP Users**: Unlimited requests
- **Owners**: Unlimited requests + admin controls

### Getting Cubes
- **Tip the Bot**: 10 gold = 1 cube, 100 gold = 10 cubes
- **Daily Reward**: Login daily for free cubes
- **New Users**: Start with 50 cubes

## 🎮 Bot Commands

### Music Commands
- **`-play [song]`** - Request a song (costs 10 cubes)
- **`-queue`** - View upcoming songs
- **`-skip`** - Skip current song (VIP/Owner only)
- **`-like`** - Like the current song
- **`-link`** - Get current song URL
- **`-search [song]`** - Search without adding to queue

### Platform-Specific
- **`-youtube [song]`** - Search only YouTube
- **`-spotify [song]`** - Search only Spotify  
- **`-soundcloud [song]`** - Search only SoundCloud

### User Commands
- **`-cubes`** - Check your cube balance
- **`-buy`** - Info about buying cubes
- **`-help`** - Show all commands

## 🌐 Multi-Platform Support

The bot searches across:
- **YouTube** - Music videos and audio
- **Spotify** - Tracks and playlists  
- **SoundCloud** - Independent artists and remixes

## 📱 Best Experience

### For Listeners:
1. **Keep Web Dashboard Open** - Real-time queue updates with clickable links
2. **Use Mobile/Desktop** - Works on all devices
3. **Bookmark URLs** - Save favorite songs for later

### For Room Owners:
1. **Promote Registration** - Users must send `-buyvisa` in PM first
2. **Monitor Web Dashboard** - See all bot activity and statistics
3. **Manage Queue** - Remove inappropriate songs if needed

## 🚀 Quick Start

1. **Send `-buyvisa` in PM** to the bot (required for new users)
2. **Request music**: `-play your favorite song`
3. **Click the URL** the bot provides
4. **Enjoy listening** while socializing in Highrise!

## 💡 Pro Tips

- **Share Playlists**: Request multiple songs in a row
- **Coordinate with Friends**: Plan music sessions together
- **Use Search First**: `-search [song]` to preview options
- **Save Favorite URLs**: Bookmark good songs for later
- **Check Queue Regularly**: See what's coming up next

## ❓ Troubleshooting

**"No URL available"**: Some songs may not have direct links
**"Not enough cubes"**: Tip the bot or wait for daily reward
**"Registration required"**: Send `-buyvisa` in private message
**"Bot not responding"**: Check web dashboard for bot status

---

**Remember**: This is a social music coordination system - the bot helps you discover and share music, but you play the actual audio yourself using the provided links!