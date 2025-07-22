# Highrise Music Bot Management System

## Overview

This is a comprehensive music bot management system designed for Highrise virtual world rooms. The application consists of a Python-based bot that integrates with Highrise's API to manage music requests, queues, and user interactions, paired with a web-based dashboard built with React for real-time monitoring and control.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### July 22, 2025
- Enhanced music listening experience with clickable "Listen Now" buttons in web dashboard
- Bot now automatically shares YouTube/Spotify/SoundCloud URLs when songs are added
- Added new bot commands: "-link" and "-url" to get current song URLs
- Updated help command to include new URL commands
- Created comprehensive GitHub deployment package with README, Dockerfile, deployment guides
- Added .gitignore, .env.example, and deployment scripts for easy setup
- Implemented real-time queue management with direct music platform links
- Enhanced queue manager UI with green "Listen Now" buttons for current songs
- Added blue "Listen Now" buttons for all queued songs
- Created HOW_TO_LISTEN.md guide explaining the music coordination system

### July 18, 2025
- Added room ID 6568702a4edd2c9dcfce647e as "Main Music Room"
- Integrated Highrise API token for bot authentication
- Added @OLD_SINNER_ as owner with unlimited cubes and full privileges
- Configured bot to recognize owners automatically
- Bot successfully connects to Highrise rooms using official SDK
- Implemented private message registration system requiring "-buyvisa" command to use bot features
- Added "-inv all" command for owners to invite all registered users to the room
- Enhanced database with user registration tracking
- Owners automatically registered and have access to all features
- Added "-followme" command for owners to move bot to their position
- Implemented "-dance" and "-stopdance" commands with 9 different dance emotes
- Bot can cycle through TikTok, anime, and other popular dance moves
- Created persistent bot configuration storage system with database integration
- Added "Saved Configs" page for managing bot settings across multiple rooms
- Implemented API routes for creating, updating, and deleting bot configurations
- Bot manager now uses stored configurations and API tokens from database
- Added Start/Stop bot buttons in the web interface with real-time status
- Fixed environment variable handling for secure API token storage

## System Architecture

The system uses a modern full-stack architecture with clear separation between the bot logic, web interface, and data management:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and bundling
- **Real-time Updates**: WebSocket connection for live bot status and queue updates

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **WebSocket**: Native WebSocket server for real-time communication
- **Bot Runtime**: Python with asyncio for Highrise API integration

### Bot Architecture
- **Language**: Python 3 with asyncio
- **Framework**: Highrise Bot SDK
- **Music Integration**: Multi-platform support (YouTube, Spotify, SoundCloud)
- **AI/ML**: Scikit-learn for music recommendations
- **Data Processing**: Pandas and NumPy for analytics

## Key Components

### Music Bot (Python)
The core bot handles all Highrise room interactions including:
- Music queue management with cube-based economy
- Multi-platform music search and playback coordination
- User role management (regular, VIP, owner)
- Competition system for music battles
- Machine learning-based recommendation engine
- Real-time command processing and response

### Web Dashboard (React)
Provides comprehensive management interface featuring:
- Real-time bot status monitoring across multiple rooms
- Music queue visualization and management
- Analytics dashboard with platform usage statistics
- Room management with custom URL generation
- Bot configuration and deployment controls

### Database Layer (PostgreSQL + Drizzle)
Structured data management with tables for:
- Users with cube balances and roles
- Rooms with settings and current playback state
- Music queue with position tracking and likes
- Competitions with leaderboards
- Cube transactions for economic tracking
- Bot statistics and analytics data

### API Services
Modular service architecture including:
- Bot management service for process control
- Music service for multi-platform search integration
- ML recommendations service for personalized suggestions
- URL generator service for shareable room links
- Storage service with comprehensive data access layer

## Data Flow

1. **Bot Commands**: Users issue commands in Highrise rooms → Bot processes via Python handlers → Database updates via API calls
2. **Web Interface**: Dashboard makes REST API calls → Express server queries database → Real-time updates pushed via WebSocket
3. **Music Integration**: Search requests → Multi-platform API calls → Consolidated results → Queue management
4. **Real-time Sync**: Bot status changes → WebSocket broadcast → Dashboard updates → User notifications

## External Dependencies

### Music Platform APIs
- **YouTube Data API v3**: Video search and metadata retrieval
- **Spotify Web API**: Track search and playlist integration
- **SoundCloud API**: Audio track discovery and streaming URLs

### Highrise Integration
- **Highrise Bot SDK**: Room connection and user interaction
- **API Token Authentication**: Secure bot-to-platform communication

### Database and Infrastructure
- **Neon Database**: PostgreSQL hosting with connection pooling
- **Drizzle Kit**: Database migrations and schema management

### Development Tools
- **Replit Integration**: Development environment with hot reload
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Production bundling for Node.js backend

## Deployment Strategy

### Development Environment
- Unified development server running both frontend (Vite) and backend (Express)
- Hot module replacement for React components
- Automatic TypeScript compilation and error reporting
- Integrated database migrations with Drizzle Kit

### Production Deployment
- **Frontend**: Static build served from Express backend
- **Backend**: Compiled JavaScript bundle with external dependencies
- **Bot**: Python process managed by Node.js backend
- **Database**: Persistent PostgreSQL with automated backups

### Environment Configuration
- Database URL for PostgreSQL connection
- External API keys for music platform integration
- Highrise API tokens for bot authentication
- Base URL configuration for shareable links

The architecture prioritizes real-time responsiveness, scalability across multiple rooms, and maintainability through clear service boundaries and type safety.