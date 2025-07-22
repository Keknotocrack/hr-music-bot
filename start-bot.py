#!/usr/bin/env python3

import asyncio
import sys
import os
sys.path.append('bot')

from bot.music_bot import HighriseMusicBot

async def main():
    """Simple bot starter script"""
    
    # Bot configuration
    room_id = "6568702a4edd2c9dcfce647e"  # Main Music Room
    api_token = os.getenv('HIGHRISE_API_TOKEN')
    
    if not api_token:
        print("❌ Error: HIGHRISE_API_TOKEN environment variable not set")
        print("Please set your Highrise API token first")
        return
    
    print("🎵 Starting Highrise Music Bot...")
    print(f"Room ID: {room_id}")
    print(f"API Token: {'*' * 20}")
    
    # Create bot with configuration
    config = {
        "welcomeMessage": "🎵 Welcome to the Main Music Room! Use cubes to request songs and join the fun!",
        "maxQueueSize": 25,
        "songCost": 10,
        "enableCompetitions": True,
        "platformPreference": "all"
    }
    
    bot = HighriseMusicBot(config=config)
    
    try:
        # Use the Highrise SDK's run function
        from highrise.__main__ import main as highrise_main
        
        # Set up arguments that the SDK expects
        sys.argv = [
            'bot', 
            room_id, 
            api_token,
            '--classname', 'HighriseMusicBot'
        ]
        
        await highrise_main()
        
    except ImportError:
        print("❌ Error: Unable to import Highrise SDK")
        print("Please install: pip install highrise-bot-sdk")
    except Exception as e:
        print(f"❌ Bot connection failed: {e}")
        print("\nTroubleshooting steps:")
        print("1. Check your API token is valid")
        print("2. Ensure you have access to the room")
        print("3. Verify room ID is correct")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Bot stopped by user")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")