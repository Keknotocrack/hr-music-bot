@echo off
echo ====================================
echo Highrise Music Bot - Windows Setup
echo ====================================
echo.

echo Installing Node.js dependencies...
npm install
if %ERRORLEVEL% neq 0 (
    echo Error: Failed to install Node.js dependencies
    pause
    exit /b 1
)

echo.
echo Installing Python dependencies...
pip install highrise-bot-sdk>=24.1.0 numpy>=2.3.1 pandas>=2.3.1 psycopg2-binary>=2.9.10 python-dotenv>=1.1.1 requests>=2.32.4 scikit-learn>=1.7.1 spotipy>=2.25.1 youtube-dl>=2021.12.17
if %ERRORLEVEL% neq 0 (
    echo Error: Failed to install Python dependencies
    echo Make sure Python and pip are installed and added to PATH
    pause
    exit /b 1
)

echo.
echo Checking if .env file exists...
if not exist .env (
    echo Creating .env file template...
    echo # Database Configuration > .env
    echo DATABASE_URL=postgresql://postgres:your_password@localhost:5432/highrise_bot >> .env
    echo. >> .env
    echo # Highrise Bot Configuration >> .env
    echo HIGHRISE_API_TOKEN=your_highrise_token_here >> .env
    echo. >> .env
    echo # Optional Music Platform APIs >> .env
    echo YOUTUBE_API_KEY=your_youtube_api_key >> .env
    echo SPOTIFY_CLIENT_ID=your_spotify_client_id >> .env
    echo SPOTIFY_CLIENT_SECRET=your_spotify_client_secret >> .env
    echo. >> .env
    echo # Development Settings >> .env
    echo NODE_ENV=development >> .env
    echo.
    echo .env file created! Please edit it with your actual credentials.
) else (
    echo .env file already exists.
)

echo.
echo Setup complete!
echo.
echo Next steps:
echo 1. Edit the .env file with your actual credentials
echo 2. Make sure PostgreSQL is running
echo 3. Run: npm run db:push
echo 4. Run: npm run dev
echo.
pause