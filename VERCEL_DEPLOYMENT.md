# Vercel Deployment Guide for Highrise Music Bot

## Overview
Deploying to Vercel requires adapting the architecture since Vercel specializes in serverless functions and static sites. This guide shows how to deploy the frontend and API routes to Vercel while running the Python bot separately.

## Architecture for Vercel
- **Frontend**: React app deployed as static site
- **API Routes**: Node.js serverless functions
- **Database**: External PostgreSQL (Neon, PlanetScale, or Supabase)
- **Bot**: Deployed separately (Railway, Heroku, or VPS)

## Prerequisites
- Vercel account (free tier available)
- External PostgreSQL database
- Separate hosting for Python bot component

## Step 1: Prepare Project Structure

Create Vercel configuration files:

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "server/api/**/*.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/client/dist/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### package.json (Root)
Add Vercel build script:
```json
{
  "scripts": {
    "vercel-build": "npm run build:client && npm run build:api",
    "build:client": "cd client && npm run build",
    "build:api": "cd server && npm run build"
  }
}
```

## Step 2: Adapt API Routes for Serverless

Create serverless API structure:

### server/api/bot/status.ts
```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Bot status logic here
    const botStatus = {
      totalBots: 0,
      onlineBots: 0,
      rooms: []
    };
    
    res.status(200).json(botStatus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bot status' });
  }
}
```

### server/api/queue/index.ts
```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      // Fetch queue logic
      const queue = [];
      res.status(200).json(queue);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
}
```

## Step 3: Database Configuration for Vercel

### Use External Database Service

#### Option A: Neon (Recommended)
```bash
# Create account at neon.tech
# Get connection string
DATABASE_URL=postgresql://user:pass@host.neon.tech/dbname?sslmode=require
```

#### Option B: PlanetScale
```bash
# Create account at planetscale.com
# Get connection string
DATABASE_URL=mysql://user:pass@host.planetscale.com/dbname?sslmode=require
```

#### Option C: Supabase
```bash
# Create account at supabase.com
# Get PostgreSQL connection string
DATABASE_URL=postgresql://postgres:pass@host.supabase.co:5432/postgres
```

## Step 4: Deploy to Vercel

### Method 1: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add YOUTUBE_API_KEY
vercel env add SPOTIFY_CLIENT_ID
vercel env add SPOTIFY_CLIENT_SECRET

# Deploy production
vercel --prod
```

### Method 2: GitHub Integration
1. Connect GitHub repository to Vercel
2. Import project: `hr-music-bot`
3. Configure build settings:
   - **Framework**: Other
   - **Root Directory**: `/`
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `client/dist`
4. Add environment variables in Vercel dashboard
5. Deploy

## Step 5: Deploy Python Bot Separately

Since Vercel doesn't support Python runtime, deploy the bot component elsewhere:

### Option A: Railway (Recommended)
```bash
# Create separate repository for bot
git subtree push --prefix=bot origin bot-main

# Deploy to Railway
# Connect bot repository to Railway
# Add environment variables
```

### Option B: Heroku
```bash
# Create Heroku app for bot
heroku create hr-music-bot-python

# Add Python buildpack
heroku buildpacks:set heroku/python

# Deploy bot code
git subtree push --prefix=bot heroku main
```

### Option C: DigitalOcean Functions
```bash
# Package bot as serverless function
# Deploy to DigitalOcean Functions
```

## Step 6: Environment Variables for Vercel

Set these in Vercel dashboard:

```env
# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# External APIs
YOUTUBE_API_KEY=your_youtube_api_key
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Bot Communication (if needed)
BOT_API_URL=https://your-bot-service.railway.app
BOT_API_KEY=your_bot_api_key

# Vercel specific
VERCEL_URL=auto-populated
```

## Step 7: Frontend Configuration

Update frontend API calls to work with Vercel:

### client/src/lib/api.ts
```typescript
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://your-vercel-app.vercel.app/api'
  : '/api';

export const api = {
  get: async (endpoint: string) => {
    const response = await fetch(`${API_BASE}${endpoint}`);
    return response.json();
  },
  post: async (endpoint: string, data: any) => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};
```

## Step 8: WebSocket Alternative

Since Vercel doesn't support WebSocket connections, use alternatives:

### Option A: Server-Sent Events (SSE)
```typescript
// server/api/events.ts
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Send periodic updates
  const interval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'update' })}\n\n`);
  }, 5000);

  req.on('close', () => clearInterval(interval));
}
```

### Option B: Polling
```typescript
// client/src/hooks/usePolling.ts
export const usePolling = (endpoint: string, interval = 5000) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const poll = async () => {
      const response = await api.get(endpoint);
      setData(response);
    };

    poll();
    const intervalId = setInterval(poll, interval);
    return () => clearInterval(intervalId);
  }, [endpoint, interval]);

  return data;
};
```

## Step 9: Build and Test

### Local Testing
```bash
# Install Vercel CLI
npm i -g vercel

# Test locally
vercel dev

# Test production build
vercel build
```

### Production Deployment
```bash
# Deploy to production
vercel --prod

# Check deployment
vercel ls
vercel logs
```

## Step 10: Custom Domain (Optional)

```bash
# Add custom domain
vercel domains add yourdomain.com

# Configure DNS
# Add CNAME record: www -> cname.vercel-dns.com
```

## Limitations and Considerations

### Vercel Limitations
- **No persistent connections**: WebSocket requires alternatives
- **Function timeout**: 10s on hobby plan, 60s on pro
- **Cold starts**: First request may be slower
- **No Python runtime**: Bot must be deployed separately

### Recommended Architecture
```
Frontend (Vercel) → API Routes (Vercel) → Database (Neon)
                 ↗
Bot Service (Railway/Heroku) → Database (Neon)
```

## Cost Estimation

### Vercel Pricing
- **Hobby**: Free for personal projects
- **Pro**: $20/month for teams
- **Enterprise**: Custom pricing

### External Services
- **Neon**: Free tier + $0.102/GB
- **Railway**: $5/month + usage
- **Total**: ~$5-25/month depending on usage

## Troubleshooting

### Common Issues
1. **API routes not working**: Check vercel.json routing
2. **Database connection**: Ensure SSL mode enabled
3. **Environment variables**: Set in Vercel dashboard
4. **Build failures**: Check build logs in Vercel

### Debug Commands
```bash
vercel logs
vercel env ls
vercel inspect [deployment-url]
```

## Performance Optimization

### Edge Functions
```typescript
// Use edge runtime for faster responses
export const config = {
  runtime: 'edge',
};
```

### CDN Configuration
```json
// vercel.json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "s-maxage=60" }
      ]
    }
  ]
}
```

This setup gives you a scalable, serverless deployment on Vercel while maintaining the full functionality of your Highrise Music Bot!