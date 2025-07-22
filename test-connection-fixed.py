#!/usr/bin/env python3

import asyncio
import os
import sys

async def test_connection():
    """Test bot connection using the correct SDK method"""
    
    room_id = "6568702a4edd2c9dcfce647e"
    api_token = os.getenv('HIGHRISE_API_TOKEN')
    
    if not api_token:
        print("❌ HIGHRISE_API_TOKEN not set")
        return
    
    print(f"🔄 Testing connection...")
    print(f"Room ID: {room_id}")
    print(f"Token length: {len(api_token)} characters")
    
    try:
        from highrise.__main__ import arun
        
        # Create a minimal test bot
        sys.path.append('bot')
        from music_bot import HighriseMusicBot
        
        # Create bot with configuration
        bot = HighriseMusicBot({
            "welcomeMessage": "🎵 Test connection successful!",
            "maxQueueSize": 25,
            "songCost": 10
        })
        
        # Use the SDK's arun method
        await arun(bot, room_id, api_token)
        
    except Exception as e:
        print(f"❌ Connection test failed: {e}")
        
        if "pattern" in str(e).lower():
            print("🔧 Token format issue - check your API token")
        elif "unauthorized" in str(e).lower():
            print("🔧 Authorization failed - check token validity")
        elif "room" in str(e).lower():
            print("🔧 Room access issue - check room ID and permissions")

if __name__ == "__main__":
    try:
        asyncio.run(test_connection())
    except KeyboardInterrupt:
        print("\n🛑 Test stopped")