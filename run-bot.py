#!/usr/bin/env python3

"""
Proper Highrise bot runner using the SDK command line interface
"""

import os
import sys
import subprocess

def run_bot():
    """Run the bot using the Highrise SDK CLI"""
    
    room_id = "6568702a4edd2c9dcfce647e"
    api_token = os.getenv('HIGHRISE_API_TOKEN')
    
    if not api_token:
        print("❌ Error: HIGHRISE_API_TOKEN environment variable not set")
        return False
    
    print("🎵 Starting Highrise Music Bot...")
    print(f"Room ID: {room_id}")
    print(f"Bot file: bot/music_bot.py")
    print(f"Token: {api_token[:8]}...")
    
    try:
        # Use the highrise CLI command
        cmd = [
            'python', '-m', 'highrise',
            room_id,
            api_token,
            '--classname', 'HighriseMusicBot',
            '--module', 'bot.music_bot'
        ]
        
        print(f"Running command: {' '.join(cmd[:4])} ... [HIDDEN_TOKEN] ...")
        
        # Run the bot
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print("✅ Bot started successfully!")
            print("Output:", result.stdout)
        else:
            print("❌ Bot failed to start")
            print("Error:", result.stderr)
            
            if "pattern" in result.stderr.lower():
                print("\n🔧 Troubleshooting:")
                print("- Check your API token format")
                print("- Ensure token has no extra spaces")
                print("- Verify token is exactly 64 characters")
            
        return result.returncode == 0
        
    except subprocess.TimeoutExpired:
        print("⏰ Bot startup timed out - this might mean it's connecting...")
        return True
    except Exception as e:
        print(f"❌ Failed to run bot: {e}")
        return False

if __name__ == "__main__":
    success = run_bot()
    sys.exit(0 if success else 1)