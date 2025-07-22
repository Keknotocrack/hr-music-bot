# Highrise Music Bot - Windows 10 Setup Guide

## Prerequisites

### 1. Install Node.js
- Download Node.js from: https://nodejs.org/
- Choose the LTS version (recommended)
- Run the installer and follow the setup wizard
- Verify installation by opening Command Prompt and typing:
  ```cmd
  node --version
  npm --version
  ```

### 2. Install Python 3.11+
- Download Python from: https://www.python.org/downloads/
- **Important**: Check "Add Python to PATH" during installation
- Verify installation:
  ```cmd
  python --version
  pip --version
  ```

### 3. Install PostgreSQL
- Download PostgreSQL from: https://www.postgresql.org/download/windows/
- During installation, remember your password for the `postgres` user
- Default port is 5432
- Create a database for your bot:
  ```sql
  CREATE DATABASE highrise_bot;
  ```

### 4. Install Git (Optional but recommended)
- Download from: https://git-scm.com/download/win
- Use default settings during installation

## Project Setup

### Step 1: Download the Project
Option A - If you have Git:
```cmd
git clone [your-repository-url]
cd highrise-music-bot
```

Option B - Manual download:
- Download the project files from Replit
- Extract to a folder like `C:\highrise-music-bot`
- Open Command Prompt in that folder

### Step 2: Install Node.js Dependencies
```cmd
npm install
```

### Step 3: Install Python Dependencies
```cmd
pip install -r requirements.txt
```
Or install manually:
```cmd
pip install highrise-bot-sdk numpy pandas psycopg2-binary python-dotenv requests scikit-learn spotipy youtube-dl
```

### Step 4: Environment Configuration
Create a file called `.env` in the project root with:
```env
# Database Configuration
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/highrise_bot

# Highrise Bot Configuration
HIGHRISE_API_TOKEN=your_highrise_token_here

# Optional Music Platform APIs
YOUTUBE_API_KEY=your_youtube_api_key
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Development Settings
NODE_ENV=development
```

### Step 5: Database Setup
```cmd
npm run db:push
```

## Running the Application

### Method 1: Development Mode (Recommended)
Open Command Prompt in the project folder and run:
```cmd
npm run dev
```

This will start:
- Web dashboard at: http://localhost:5000
- API server for bot management
- Hot reload for development

### Method 2: Individual Components
If you prefer to run components separately:

**Terminal 1 - Backend Server:**
```cmd
npm run server
```

**Terminal 2 - Frontend (if separate):**
```cmd
npm run client
```

**Terminal 3 - Bot Runner:**
```cmd
python run-bot.py
```

## Getting Your Highrise API Token

1. Go to https://highrise.game/
2. Log in to your account
3. Navigate to Creator Portal > Bot Development
4. Create a new bot application
5. Copy your API token to the `.env` file

## Troubleshooting

### Common Issues:

**"npm is not recognized"**
- Reinstall Node.js and ensure it's added to PATH
- Restart Command Prompt

**"python is not recognized"**
- Reinstall Python with "Add to PATH" checked
- Or use `py` instead of `python`

**Database connection errors:**
- Ensure PostgreSQL service is running
- Check your password and database name
- Verify the DATABASE_URL in `.env`

**Port already in use:**
- Close other applications using port 5000
- Or change the port in the configuration

### Performance Tips:
- Use Windows Terminal instead of Command Prompt for better experience
- Consider using VS Code as your editor with the project folder
- Install Windows Subsystem for Linux (WSL2) for better Node.js performance

## Project Structure
```
highrise-music-bot/
├── bot/                 # Python bot code
├── client/             # React frontend
├── server/             # Node.js backend
├── shared/             # Shared types and schemas
├── package.json        # Node.js dependencies
├── pyproject.toml      # Python dependencies
├── .env               # Environment variables
└── README.md          # Project documentation
```

## Usage After Setup

1. **Access Web Dashboard**: Open http://localhost:5000
2. **Configure Bot Room**: Go to Bot Setup page
3. **Add Room ID**: Enter your Highrise room ID
4. **Start Bot**: Click the start button
5. **Monitor**: Use the dashboard to manage music queue and bot status

## Additional Features Setup

### YouTube Music Integration:
1. Go to Google Cloud Console
2. Enable YouTube Data API v3
3. Create API credentials
4. Add the key to your `.env` file

### Spotify Integration:
1. Go to Spotify Developer Dashboard
2. Create a new app
3. Get Client ID and Client Secret
4. Add to your `.env` file

## Windows-Specific Notes

- Use backslashes in file paths: `C:\Users\YourName\highrise-bot`
- Run Command Prompt as Administrator if you encounter permission issues
- Windows Defender might flag the bot - add an exception if needed
- Consider using PowerShell for better command support

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Ensure all prerequisites are correctly installed
3. Verify your environment variables are set correctly
4. Check the console output for specific error messages

The bot should now be fully functional on your Windows 10 system!