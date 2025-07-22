# Multi-stage build for Node.js and Python
FROM node:20-bullseye-slim AS base

# Install Python and system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pyproject.toml ./

# Install Node.js dependencies
RUN npm ci --only=production

# Install Python dependencies
RUN pip3 install --no-cache-dir \
    highrise-bot-sdk>=24.1.0 \
    numpy>=2.3.1 \
    pandas>=2.3.1 \
    psycopg2-binary>=2.9.10 \
    python-dotenv>=1.1.1 \
    requests>=2.32.4 \
    scikit-learn>=1.7.1 \
    spotipy>=2.25.1 \
    youtube-dl>=2021.12.17

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/bot/status || exit 1

# Start the application
CMD ["npm", "start"]