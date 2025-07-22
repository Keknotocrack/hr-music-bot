#!/usr/bin/env python3

import sys
import os
import asyncio
import json
from music_bot import HighriseMusicBot

async def main():
    # Get configuration from environment variables
    room_id = os.getenv('HIGHRISE_ROOM_ID')
    api_token = os.getenv('HIGHRISE_API_TOKEN')
    bot_config_str = os.getenv('BOT_CONFIG', '{}')
    
    if not room_id or not api_token:
        print("Error: Missing required environment variables:")
        print("- HIGHRISE_ROOM_ID:", room_id)
        print("- HIGHRISE_API_TOKEN:", "SET" if api_token else "NOT SET")
        sys.exit(1)
    
    try:
        bot_config = json.loads(bot_config_str)
        print(f"Starting bot for room {room_id} with config:")
        print(f"- Welcome message: {bot_config.get('welcomeMessage', 'Default')}")
        print(f"- Max queue size: {bot_config.get('maxQueueSize', 50)}")
        print(f"- Song cost: {bot_config.get('songCost', 10)} cubes")
        print(f"- Competitions enabled: {bot_config.get('enableCompetitions', True)}")
    except json.JSONDecodeError:
        print("Warning: Invalid bot configuration, using defaults")
        bot_config = {}
    
    # Create and start the bot
    bot = HighriseMusicBot(config=bot_config)
    
    try:
        print(f"Connecting to Highrise room: {room_id}")
        # Use the proper SDK connection method
        from highrise.__main__ import main as highrise_main
        
        # Set up system arguments that the SDK expects
        original_argv = sys.argv.copy()
        sys.argv = ['bot', room_id, api_token]
        
        # Import and run the bot
        await highrise_main()
        
    except Exception as e:
        print(f"Failed to connect to Highrise: {e}")
        print("Error details:", str(e))
        
        if "string didn't match expected pattern" in str(e).lower():
            print("\nAPI Token Issue:")
            print("- Check your Highrise API token format")
            print("- Tokens should be 64 characters long")
            print("- Remove any extra spaces or characters")
        elif "unauthorized" in str(e).lower():
            print("\nAuthorization Issue:")
            print("- API token may be invalid or expired")
            print("- Check your Highrise developer settings")
        elif "room" in str(e).lower():
            print("\nRoom Access Issue:")
            print("- You may not have access to this room")
            print("- Check if the room ID is correct")
        
        sys.argv = original_argv
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
