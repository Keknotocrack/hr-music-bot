#!/bin/bash

# Highrise Music Bot Deployment Script
echo "🚀 Starting Highrise Music Bot deployment..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    git branch -M main
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Copying from .env.example..."
    cp .env.example .env
    echo "✏️  Please edit .env file with your credentials before continuing."
    echo "📝 Required: DATABASE_URL and HIGHRISE_API_TOKEN"
    read -p "Press Enter after editing .env file..."
fi

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

echo "🐍 Installing Python dependencies..."
pip install highrise-bot-sdk>=24.1.0 numpy>=2.3.1 pandas>=2.3.1 psycopg2-binary>=2.9.10 python-dotenv>=1.1.1 requests>=2.32.4 scikit-learn>=1.7.1 spotipy>=2.25.1 youtube-dl>=2021.12.17

# Setup database (if local)
echo "🗄️  Setting up database..."
npm run db:push

# Build the application
echo "🔨 Building application..."
npm run build

# Git setup
echo "📝 Preparing Git commit..."
git add .
git status

echo "✅ Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Create a GitHub repository"
echo "2. git remote add origin https://github.com/yourusername/repository-name.git"
echo "3. git commit -m 'Initial commit: Highrise Music Bot Platform'"
echo "4. git push -u origin main"
echo ""
echo "Deployment options:"
echo "- Railway: Connect GitHub repo → Deploy"
echo "- Heroku: heroku create → git push heroku main"
echo "- VPS: Clone repo → npm install → npm start"
echo "- Docker: docker build -t bot . → docker run"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"