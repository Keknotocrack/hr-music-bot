#!/usr/bin/env python3

import asyncio
import os
import sys

async def test_highrise_connection():
    """Test Highrise API token and connection"""
    
    room_id = "6568702a4edd2c9dcfce647e"
    api_token = os.getenv('HIGHRISE_API_TOKEN')
    
    if not api_token:
        print("❌ HIGHRISE_API_TOKEN not set")
        return False
    
    print(f"Testing connection...")
    print(f"Room ID: {room_id}")
    print(f"Token length: {len(api_token)} characters")
    print(f"Token pattern: {api_token[:8]}...")
    
    try:
        from highrise import BaseBot
        from highrise.models import SessionMetadata
        
        class TestBot(BaseBot):
            async def on_start(self, session_metadata: SessionMetadata):
                print("✅ Bot connected successfully!")
                print(f"Room: {session_metadata.room_info.name}")
                print(f"Room ID: {session_metadata.room_info.id}")
                # Exit after successful connection
                await asyncio.sleep(2)
                os._exit(0)
            
            async def on_error(self, error):
                print(f"❌ Bot error: {error}")
                os._exit(1)
        
        bot = TestBot()
        
        # Try to connect
        await bot.start(room_id, api_token)
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        
        if "string didn't match expected pattern" in str(e).lower():
            print("\n🔧 API Token Format Issue:")
            print("- Your API token format may be incorrect")
            print("- Highrise tokens should be 40+ characters")
            print("- Check if there are extra spaces or characters")
            
        elif "unauthorized" in str(e).lower():
            print("\n🔧 Authorization Issue:")
            print("- API token may be invalid or expired")
            print("- Check your Highrise account settings")
            
        elif "room" in str(e).lower():
            print("\n🔧 Room Access Issue:")
            print("- You may not have access to this room")
            print("- Try a different room ID")
            
        return False
    
    return True

if __name__ == "__main__":
    try:
        success = asyncio.run(test_highrise_connection())
        if not success:
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n🛑 Test cancelled")
    except Exception as e:
        print(f"❌ Test failed: {e}")
        sys.exit(1)