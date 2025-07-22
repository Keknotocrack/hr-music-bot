# Deployment Guide

## GitHub Deployment Options

### Option 1: Manual VPS Deployment

1. **Prepare your VPS**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python
sudo apt install python3 python3-pip python3-dev build-essential

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib
```

2. **Clone and setup**
```bash
git clone https://github.com/yourusername/highrise-music-bot.git
cd highrise-music-bot
npm install
pip3 install -r requirements.txt
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your credentials
nano .env
```

4. **Setup database**
```bash
sudo -u postgres createdb highrise_bot
npm run db:push
```

5. **Start with PM2**
```bash
npm install -g pm2
pm2 start npm --name "highrise-bot" -- run start
pm2 save
pm2 startup
```

### Option 2: Railway Deployment

1. **Connect GitHub repository to Railway**
2. **Set environment variables in Railway dashboard**
3. **Deploy automatically on push**

Railway configuration:
```
Build Command: npm run build
Start Command: npm start
```

### Option 3: Heroku Deployment

1. **Create Heroku app**
```bash
heroku create your-app-name
```

2. **Add PostgreSQL addon**
```bash
heroku addons:create heroku-postgresql:mini
```

3. **Set environment variables**
```bash
heroku config:set HIGHRISE_API_TOKEN=your_token
heroku config:set YOUTUBE_API_KEY=your_key
```

4. **Deploy**
```bash
git push heroku main
```

### Option 4: Docker Deployment

1. **Build and run with Docker**
```bash
docker build -t highrise-music-bot .
docker run -p 5000:5000 --env-file .env highrise-music-bot
```

2. **Or use Docker Compose**
```bash
docker-compose up -d
```

### Option 5: DigitalOcean App Platform

1. **Connect GitHub repository**
2. **Configure build settings**:
   - Build Command: `npm run build`
   - Run Command: `npm start`
3. **Set environment variables**
4. **Deploy**

### Option 6: Vercel (Serverless Deployment)

Deploy frontend and API as serverless functions:

1. **Prepare for serverless architecture**
   - Frontend: React static site
   - API: Serverless functions
   - Bot: Deploy separately (Railway/Heroku)
   - Database: External PostgreSQL (Neon/Supabase)

2. **Deploy with Vercel CLI**
```bash
npm i -g vercel
vercel login
vercel
```

3. **Or connect GitHub repository to Vercel**
   - Import project from GitHub
   - Configure build settings
   - Add environment variables
   - Deploy automatically

4. **Set environment variables in Vercel dashboard**

**Note**: See `VERCEL_DEPLOYMENT.md` for complete serverless setup guide.

## Environment Variables

Required for all deployments:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Highrise Bot
HIGHRISE_API_TOKEN=your_highrise_token

# Optional but recommended
YOUTUBE_API_KEY=your_youtube_api_key
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Production settings
NODE_ENV=production
```

## SSL/HTTPS Setup

For production deployments, ensure HTTPS:

### With Nginx
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring and Logging

### PM2 Monitoring
```bash
pm2 monit
pm2 logs
pm2 restart all
```

### Health Checks
The application includes health check endpoints:
- `GET /api/bot/status` - Bot status
- `GET /health` - Application health

### Log Management
Configure log rotation and monitoring:
```bash
# Install logrotate
sudo apt install logrotate

# Configure rotation
sudo nano /etc/logrotate.d/highrise-bot
```

## Backup Strategy

### Database Backup
```bash
# Automated backup script
#!/bin/bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Configuration Backup
- Backup environment variables
- Backup bot configurations
- Backup user data

## Security Considerations

1. **Environment Variables**: Never commit secrets to Git
2. **Database Security**: Use strong passwords and restrict access
3. **API Keys**: Rotate keys regularly
4. **HTTPS**: Always use SSL in production
5. **Firewall**: Restrict unnecessary ports
6. **Updates**: Keep dependencies updated

## Scaling

### Horizontal Scaling
- Load balance multiple instances
- Use Redis for session storage
- Database read replicas

### Performance Optimization
- Enable gzip compression
- Use CDN for static assets
- Optimize database queries
- Cache frequently accessed data

## Troubleshooting

### Common Issues
1. **Port already in use**: Change PORT environment variable
2. **Database connection failed**: Check DATABASE_URL
3. **Bot not responding**: Verify HIGHRISE_API_TOKEN
4. **Build failures**: Check Node.js and Python versions

### Debug Mode
```bash
DEBUG=* npm run dev
```

## Post-Deployment

1. **Test all functionality**
2. **Monitor logs for errors**
3. **Set up automated backups**
4. **Configure monitoring/alerting**
5. **Document your deployment process**