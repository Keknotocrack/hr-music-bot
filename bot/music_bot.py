import asyncio
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta

from highrise import BaseBot, User, Item, Position, CurrencyItem, Reaction
from highrise.models import SessionMetadata

from cube_system import CubeSystem
from music_platforms import MusicPlatforms

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HighriseMusicBot(BaseBot):
    def __init__(self, config: Dict[str, Any] = None):
        super().__init__()
        self.config = config or {}
        self.cube_system = CubeSystem()
        self.music_platforms = MusicPlatforms()
        self.room_id = None
        self.current_song = None
        self.music_queue = []
        self.competitions = {}
        self.user_data = {}
        self.vip_users = set()
        self.owner_users = set()
        self.registered_users = set()  # Users who sent -buyvisa in PM
        self.is_dancing = False
        self.dance_emotes = [
            "dance-tiktok2", "dance-tiktok8", "dance-tiktok10", 
            "dance-blackpink", "dance-weird", "dance-pinguin",
            "dance-anime", "dance-russian", "dance-shoppingcart"
        ]
        self.current_dance_index = 0
        
        # Load configuration
        self.welcome_message = self.config.get('welcomeMessage', '🎵 Welcome! Use cubes to request songs!')
        self.max_queue_size = self.config.get('maxQueueSize', 50)
        self.song_cost = self.config.get('songCost', 10)
        self.enable_competitions = self.config.get('enableCompetitions', True)
        self.platform_preference = self.config.get('platformPreference', 'all')
        
        # Command handlers
        self.commands = {
            '-play': self.handle_play_command,
            '-queue': self.handle_queue_command,
            '-skip': self.handle_skip_command,
            '-like': self.handle_like_command,
            '-cubes': self.handle_cubes_command,
            '-buy': self.handle_buy_cubes,
            '-search': self.handle_search_command,
            '-recommend': self.handle_recommend_command,
            '-youtube': self.handle_youtube_command,
            '-spotify': self.handle_spotify_command,
            '-soundcloud': self.handle_soundcloud_command,
            '-startcomp': self.handle_start_competition,
            '-endcomp': self.handle_end_competition,
            '-leaderboard': self.handle_leaderboard,
            '-createlink': self.handle_create_link,
            '-joinroom': self.handle_join_room,
            '-syncmusic': self.handle_sync_music,
            '-vip': self.handle_vip_command,
            '-inv': self.handle_invite_command,
            '-followme': self.handle_follow_command,
            '-dance': self.handle_dance_command,
            '-stopdance': self.handle_stop_dance_command,
            '-link': self.handle_song_link,
            '-url': self.handle_song_link,
            '-help': self.handle_help_command
        }

    async def on_start(self, session_metadata: SessionMetadata) -> None:
        logger.info(f"Bot started successfully!")
        logger.info(f"Configuration: Max queue: {self.max_queue_size}, Song cost: {self.song_cost} cubes")
        
        # Store session metadata and extract room ID
        self.session_metadata = session_metadata
        self.room_id = getattr(session_metadata.room_info, 'id', 'unknown')
        
        # Initialize room data  
        try:
            await self.cube_system.initialize_room(self.room_id)
        except Exception as e:
            logger.error(f"Failed to initialize cube system: {e}")
            # Continue without cube system for now
        
        # Send welcome message using the proper SDK method
        await asyncio.sleep(2)  # Wait a moment before sending welcome
        
        try:
            if self.welcome_message:
                await self.highrise.chat(self.welcome_message)
            
            await self.highrise.chat("🎵 Highrise Music Bot is now online! Type -help for commands.")
            await self.highrise.chat("📧 Send me '-buyvisa' in PM to register and access the bot!")
        except AttributeError:
            # Fallback if highrise attribute not available yet
            logger.warning("Highrise client not available yet, welcome messages will be sent later")

    async def on_user_join(self, user: User, position: Position) -> None:
        """Handle user joining the room"""
        logger.info(f"User joined: {user.username}")
        
        # Initialize user if not exists
        if user.username not in self.user_data:
            # Check if user is an owner
            user_role = 'owner' if user.username in ['OLD_SINNER_', 'admin'] else 'regular'
            starting_cubes = 999999 if user_role == 'owner' else 50
            
            self.user_data[user.username] = {
                'user_id': user.id,
                'cubes': starting_cubes,
                'songs_played': 0,
                'songs_liked': 0,
                'last_daily_reward': None,
                'role': user_role
            }
            
            # Add to owner set if owner
            if user_role == 'owner':
                self.owner_users.add(user.username)
                self.registered_users.add(user.username)  # Owners are auto-registered
            
            # Grant daily cubes if it's a new day
            await self.cube_system.check_daily_reward(user.username)
        
        user_cubes = self.user_data[user.username]['cubes']
        user_role = self.user_data[user.username]['role']
        
        if user_role == 'owner':
            await self.highrise.chat(f"Welcome {user.username}! 👑 You have UNLIMITED cubes as an owner.")
        else:
            await self.highrise.chat(f"Welcome {user.username}! 🎵 You have {user_cubes} cubes.")

    async def on_user_leave(self, user: User) -> None:
        """Handle user leaving the room"""
        logger.info(f"User left: {user.username}")

    async def on_chat(self, user: User, message: str) -> None:
        """Handle chat messages and commands"""
        logger.info(f"Chat from {user.username}: {message}")
        
        # Check if message is a command
        if message.startswith('-'):
            command_parts = message.split(' ', 1)
            command = command_parts[0].lower()
            args = command_parts[1] if len(command_parts) > 1 else ""
            
            if command in self.commands:
                try:
                    await self.commands[command](user, args)
                except Exception as e:
                    logger.error(f"Error executing command {command}: {e}")
                    await self.highrise.chat(f"Error: {str(e)}")
            else:
                await self.highrise.chat(f"Unknown command: {command}. Type -help for available commands.")

    async def on_tip(self, sender: User, receiver: User, tip: CurrencyItem) -> None:
        """Handle tip reactions for cube purchases"""
        if receiver.username == "musicbot":  # Bot's username
            logger.info(f"Tip received from {sender.username}: {tip.amount} gold")
            
            # Convert gold to cubes (10 gold = 1 cube, 100 gold = 10 cubes)
            if tip.amount >= 10:
                cubes_to_add = 0
                if tip.amount >= 100:
                    cubes_to_add = 10
                elif tip.amount >= 50:
                    cubes_to_add = 5
                elif tip.amount >= 10:
                    cubes_to_add = 1
                
                if cubes_to_add > 0:
                    await self.cube_system.add_cubes(sender.username, cubes_to_add)
                    await self.highrise.chat(f"🎁 {sender.username} received {cubes_to_add} cubes! Thanks for the tip!")
            else:
                await self.highrise.chat(f"💝 Thanks for the tip {sender.username}! Tip 10+ gold to get cubes.")

    async def on_message(self, user_id: str, conversation_id: str, is_new_conversation: bool) -> None:
        """Handle private messages"""
        try:
            # Get messages from this conversation
            messages = await self.highrise.get_messages(conversation_id, last_id=None)
            
            if messages and len(messages.messages) > 0:
                latest_message = messages.messages[0]  # Most recent message
                message_content = latest_message.content.lower().strip()
                
                # Get user info from the message
                sender_username = latest_message.user_id  # This would need proper user lookup
                
                # Handle -buyvisa registration
                if message_content == '-buyvisa':
                    # Add user to registered users
                    self.registered_users.add(sender_username)
                    
                    # Send confirmation message
                    await self.highrise.send_message(
                        conversation_id=conversation_id,
                        message="✅ Registration successful! You can now use the music bot in the room. Welcome to the community!",
                        type="text"
                    )
                    
                    logger.info(f"User {sender_username} registered via -buyvisa in PM")
                else:
                    # Send help message for unrecognized commands
                    await self.highrise.send_message(
                        conversation_id=conversation_id,
                        message="📧 Send '-buyvisa' to register and access the music bot features!",
                        type="text"
                    )
                    
        except Exception as e:
            logger.error(f"Error handling private message: {e}")

    async def handle_play_command(self, user: User, args: str) -> None:
        """Handle -play command"""
        if not args:
            await self.highrise.chat("Usage: -play <song name>")
            return
        
        # Check if user is registered (sent -buyvisa in PM)
        if user.username not in self.registered_users and user.username not in ['OLD_SINNER_', 'admin']:
            await self.highrise.chat(f"❌ {user.username}, you must send me '-buyvisa' in PM first to use the bot!")
            return

        # Check if user has enough cubes (unless VIP/Owner)
        user_role = self.user_data.get(user.username, {}).get('role', 'regular')
        if user_role not in ['owner', 'vip']:
            user_cubes = self.user_data.get(user.username, {}).get('cubes', 0)
            if user_cubes < 10:
                await self.highrise.chat(f"❌ {user.username}, you need 10 cubes to request a song. You have {user_cubes}.")
                return
        
        # Search for the song
        search_results = await self.music_platforms.search_all_platforms(args)
        
        if not search_results:
            await self.highrise.chat(f"❌ No songs found for '{args}'")
            return
        
        # Use the first result
        song = search_results[0]
        
        # Deduct cubes if not VIP/Owner
        if user_role not in ['owner', 'vip']:
            await self.cube_system.spend_cubes(user.username, 10)
        
        # Add to queue
        queue_item = {
            'song': song,
            'requested_by': user.username,
            'likes': 0,
            'timestamp': datetime.now(),
            'cubes_spent': 0 if user_role in ['owner', 'vip'] else 10
        }
        
        self.music_queue.append(queue_item)
        
        await self.highrise.chat(f"🎵 {song['title']} by {song['artist']} added to queue by {user.username}!")
        # Share the direct link for listening
        if song.get('url'):
            await self.highrise.chat(f"🔗 Listen here: {song['url']}")
        
        # Start playing if nothing is currently playing
        if not self.current_song:
            await self.play_next_song()

    async def handle_queue_command(self, user: User, args: str) -> None:
        """Handle -queue command"""
        if not self.music_queue:
            await self.highrise.chat("🎵 The music queue is empty. Use -play to add songs!")
            return
        
        queue_text = "🎵 **Music Queue:**\n"
        for i, item in enumerate(self.music_queue[:5], 1):
            song = item['song']
            queue_text += f"{i}. {song['title']} by {song['artist']} (👤 {item['requested_by']}, ❤️ {item['likes']})\n"
        
        if len(self.music_queue) > 5:
            queue_text += f"... and {len(self.music_queue) - 5} more songs"
        
        await self.highrise.chat(queue_text)

    async def handle_skip_command(self, user: User, args: str) -> None:
        """Handle -skip command"""
        if not self.current_song:
            await self.highrise.chat("❌ No song is currently playing.")
            return
        
        # Only VIP/Owner can skip, or if majority vote
        user_role = self.user_data.get(user.username, {}).get('role', 'regular')
        if user_role in ['owner', 'vip']:
            await self.highrise.chat(f"⏭️ {user.username} skipped the current song.")
            await self.play_next_song()
        else:
            await self.highrise.chat("❌ Only VIP/Owner users can skip songs.")

    async def handle_like_command(self, user: User, args: str) -> None:
        """Handle -like command"""
        if not self.current_song:
            await self.highrise.chat("❌ No song is currently playing to like.")
            return
        
        # Find current song in queue and increment likes
        for item in self.music_queue:
            if item == self.current_song:
                item['likes'] += 1
                break
        
        await self.highrise.chat(f"❤️ {user.username} liked the current song! ({self.current_song['likes']} likes)")

    async def handle_cubes_command(self, user: User, args: str) -> None:
        """Handle -cubes command"""
        user_cubes = self.user_data.get(user.username, {}).get('cubes', 0)
        user_role = self.user_data.get(user.username, {}).get('role', 'regular')
        
        role_text = ""
        if user_role in ['owner', 'vip']:
            role_text = f" ({user_role.upper()} - Unlimited cubes!)"
        
        await self.highrise.chat(f"💎 {user.username} has {user_cubes} cubes{role_text}")

    async def handle_buy_cubes(self, user: User, args: str) -> None:
        """Handle -buy command"""
        await self.highrise.chat(f"💰 {user.username}, tip the bot gold to get cubes!\n💎 10 gold = 1 cube\n💎 50 gold = 5 cubes\n💎 100 gold = 10 cubes")

    async def handle_song_link(self, user: User, args: str) -> None:
        """Handle -link/-url command to get current song URL"""
        if not self.current_song:
            await self.highrise.chat("❌ No song is currently playing.")
            return
        
        song = self.current_song['song']
        if song.get('url'):
            await self.highrise.chat(f"🔗 Current song: {song['title']} by {song['artist']}")
            await self.highrise.chat(f"🎧 Listen here: {song['url']}")
        else:
            await self.highrise.chat("❌ No URL available for the current song.")

    async def handle_search_command(self, user: User, args: str) -> None:
        """Handle -search command"""
        if not args:
            await self.highrise.chat("Usage: -search <song name>")
            return
        
        search_results = await self.music_platforms.search_all_platforms(args, limit=3)
        
        if not search_results:
            await self.highrise.chat(f"❌ No songs found for '{args}'")
            return
        
        response = f"🔍 Search results for '{args}':\n"
        for i, song in enumerate(search_results, 1):
            response += f"{i}. {song['title']} by {song['artist']} ({song['platform']})\n"
        
        response += "\nUse -play <song name> to add to queue!"
        await self.highrise.chat(response)

    async def handle_recommend_command(self, user: User, args: str) -> None:
        """Handle -recommend command"""
        # Get AI recommendations based on user history
        recommendations = await self.music_platforms.get_recommendations(user.username)
        
        if not recommendations:
            recommendations = [
                {"title": "Blinding Lights", "artist": "The Weeknd", "platform": "YouTube"},
                {"title": "Good 4 U", "artist": "Olivia Rodrigo", "platform": "Spotify"},
                {"title": "Levitating", "artist": "Dua Lipa", "platform": "SoundCloud"}
            ]
        
        response = f"🤖 AI Recommendations for {user.username}:\n"
        for i, song in enumerate(recommendations[:3], 1):
            response += f"{i}. {song['title']} by {song['artist']} ({song['platform']})\n"
        
        await self.highrise.chat(response)

    async def handle_youtube_command(self, user: User, args: str) -> None:
        """Handle -youtube command"""
        if not args:
            await self.highrise.chat("Usage: -youtube <song name>")
            return
        
        results = await self.music_platforms.search_youtube(args, limit=1)
        if results:
            await self.handle_play_command(user, results[0]['title'])
        else:
            await self.highrise.chat(f"❌ No YouTube results for '{args}'")

    async def handle_spotify_command(self, user: User, args: str) -> None:
        """Handle -spotify command"""
        if not args:
            await self.highrise.chat("Usage: -spotify <song name>")
            return
        
        results = await self.music_platforms.search_spotify(args, limit=1)
        if results:
            await self.handle_play_command(user, results[0]['title'])
        else:
            await self.highrise.chat(f"❌ No Spotify results for '{args}'")

    async def handle_soundcloud_command(self, user: User, args: str) -> None:
        """Handle -soundcloud command"""
        if not args:
            await self.highrise.chat("Usage: -soundcloud <song name>")
            return
        
        results = await self.music_platforms.search_soundcloud(args, limit=1)
        if results:
            await self.handle_play_command(user, results[0]['title'])
        else:
            await self.highrise.chat(f"❌ No SoundCloud results for '{args}'")

    async def handle_start_competition(self, user: User, args: str) -> None:
        """Handle -startcomp command"""
        user_role = self.user_data.get(user.username, {}).get('role', 'regular')
        if user_role not in ['owner', 'vip']:
            await self.highrise.chat("❌ Only VIP/Owner users can start competitions.")
            return
        
        if 'music_comp' in self.competitions:
            await self.highrise.chat("❌ A competition is already active!")
            return
        
        comp_name = args if args else "Music Competition"
        self.competitions['music_comp'] = {
            'name': comp_name,
            'start_time': datetime.now(),
            'participants': {},
            'active': True
        }
        
        await self.highrise.chat(f"🏆 {comp_name} started! Most liked song wins. Duration: 10 minutes.")

    async def handle_end_competition(self, user: User, args: str) -> None:
        """Handle -endcomp command"""
        user_role = self.user_data.get(user.username, {}).get('role', 'regular')
        if user_role not in ['owner', 'vip']:
            await self.highrise.chat("❌ Only VIP/Owner users can end competitions.")
            return
        
        if 'music_comp' not in self.competitions:
            await self.highrise.chat("❌ No active competition.")
            return
        
        # Find winner (most liked song)
        winner = None
        max_likes = 0
        
        for item in self.music_queue:
            if item['likes'] > max_likes:
                max_likes = item['likes']
                winner = item['requested_by']
        
        if winner:
            await self.cube_system.add_cubes(winner, 100)  # Prize: 100 cubes
            await self.highrise.chat(f"🏆 Competition ended! Winner: {winner} with {max_likes} likes! Prize: 100 cubes!")
        else:
            await self.highrise.chat("🏆 Competition ended! No winner this time.")
        
        del self.competitions['music_comp']

    async def handle_leaderboard(self, user: User, args: str) -> None:
        """Handle -leaderboard command"""
        # Sort users by cubes
        sorted_users = sorted(
            self.user_data.items(),
            key=lambda x: x[1]['cubes'],
            reverse=True
        )
        
        response = "🏆 **Leaderboard (Top Cubes):**\n"
        for i, (username, data) in enumerate(sorted_users[:5], 1):
            response += f"{i}. {username}: {data['cubes']} cubes\n"
        
        await self.highrise.chat(response)

    async def handle_create_link(self, user: User, args: str) -> None:
        """Handle -createlink command"""
        user_role = self.user_data.get(user.username, {}).get('role', 'regular')
        if user_role not in ['owner', 'vip']:
            await self.highrise.chat("❌ Only VIP/Owner users can create room links.")
            return
        
        # Generate a shareable link (would integrate with web backend)
        link_code = f"hr{self.room_id[-6:]}"
        await self.highrise.chat(f"🔗 Room link created: hr.gg/music/{link_code}")

    async def handle_join_room(self, user: User, args: str) -> None:
        """Handle -joinroom command"""
        if not args:
            await self.highrise.chat("Usage: -joinroom <room_code>")
            return
        
        await self.highrise.chat(f"🌐 Use the web dashboard to join room: {args}")

    async def handle_sync_music(self, user: User, args: str) -> None:
        """Handle -syncmusic command"""
        if self.current_song:
            song = self.current_song['song']
            await self.highrise.chat(f"🎵 Now Playing: {song['title']} by {song['artist']} ({song['platform']})")
        else:
            await self.highrise.chat("🎵 No song currently playing.")

    async def handle_invite_command(self, user: User, args: str) -> None:
        """Handle -inv command (owner only)"""
        user_role = self.user_data.get(user.username, {}).get('role', 'regular')
        if user_role != 'owner':
            await self.highrise.chat("❌ Only room owners can use invite commands.")
            return
        
        if args.strip().lower() == 'all':
            if len(self.registered_users) == 0:
                await self.highrise.chat("❌ No registered users to invite.")
                return
            
            # Send room invite to all registered users
            await self.highrise.chat(f"📨 Sending room invites to {len(self.registered_users)} registered users...")
            
            invite_count = 0
            try:
                # Get all conversations and send room invites
                conversations = await self.highrise.get_conversations(not_joined=False)
                
                for conversation in conversations.conversations:
                    if hasattr(conversation, 'id'):
                        try:
                            # Send room invite message
                            await self.highrise.send_message(
                                conversation_id=conversation.id,
                                message=f"🎵 You're invited to join our music room! Come listen and request songs!",
                                type="invite",
                                room_id=self.room_id
                            )
                            invite_count += 1
                        except Exception as e:
                            logger.error(f"Failed to send invite to conversation {conversation.id}: {e}")
                
                await self.highrise.chat(f"✅ Room invites sent to {invite_count} registered users!")
                
            except Exception as e:
                logger.error(f"Error sending room invites: {e}")
                # Fallback to chat notification
                registered_list = ', '.join(list(self.registered_users)[:10])
                if len(self.registered_users) > 10:
                    registered_list += f" and {len(self.registered_users) - 10} more"
                await self.highrise.chat(f"📋 Registered users: {registered_list}")
        else:
            await self.highrise.chat("Usage: -inv all (invites all registered users)")

    async def handle_vip_command(self, user: User, args: str) -> None:
        """Handle -vip command (owner only)"""
        user_role = self.user_data.get(user.username, {}).get('role', 'regular')
        if user_role != 'owner':
            await self.highrise.chat("❌ Only room owners can grant VIP status.")
            return
        
        if not args:
            await self.highrise.chat("Usage: -vip <username>")
            return
        
        target_username = args.strip()
        if target_username in self.user_data:
            self.user_data[target_username]['role'] = 'vip'
            await self.highrise.chat(f"👑 {target_username} is now VIP! Unlimited cubes and special privileges.")
        else:
            await self.highrise.chat(f"❌ User {target_username} not found.")

    async def handle_follow_command(self, user: User, args: str) -> None:
        """Handle -followme command (owner only)"""
        user_role = self.user_data.get(user.username, {}).get('role', 'regular')
        if user_role != 'owner':
            await self.highrise.chat("❌ Only room owners can make the bot follow them.")
            return
        
        try:
            # Get the user's current position
            room_users = await self.highrise.get_room_users()
            user_position = None
            
            for room_user in room_users.content:
                if room_user[0].username == user.username:
                    user_position = room_user[1]
                    break
            
            if user_position:
                # Move bot to user's position (slightly offset)
                new_position = Position(
                    x=user_position.x + 1,  # Slightly offset
                    y=user_position.y,
                    z=user_position.z + 1,
                    facing=user_position.facing
                )
                
                await self.highrise.walk_to(new_position)
                await self.highrise.chat(f"🤖 Following {user.username}! I'm right behind you!")
            else:
                await self.highrise.chat(f"❌ Could not find {user.username}'s position.")
                
        except Exception as e:
            logger.error(f"Error in follow command: {e}")
            await self.highrise.chat("❌ Failed to follow. Make sure I have movement permissions!")

    async def handle_dance_command(self, user: User, args: str) -> None:
        """Handle -dance command (owner only)"""
        user_role = self.user_data.get(user.username, {}).get('role', 'regular')
        if user_role != 'owner':
            await self.highrise.chat("❌ Only room owners can make the bot dance.")
            return
        
        if self.is_dancing:
            await self.highrise.chat("🕺 I'm already dancing! Use -stopdance to stop me.")
            return
        
        self.is_dancing = True
        await self.highrise.chat("🕺 Let's dance! Starting my dance moves!")
        
        # Start dancing with emotes in background
        try:
            # Start the dance loop as a background task
            asyncio.create_task(self.start_dance_loop())
        except Exception as e:
            logger.error(f"Error starting dance: {e}")
            self.is_dancing = False
            await self.highrise.chat("❌ Failed to start dancing!")

    async def handle_stop_dance_command(self, user: User, args: str) -> None:
        """Handle -stopdance command (owner only)"""
        user_role = self.user_data.get(user.username, {}).get('role', 'regular')
        if user_role != 'owner':
            await self.highrise.chat("❌ Only room owners can stop the bot's dancing.")
            return
        
        if not self.is_dancing:
            await self.highrise.chat("💤 I'm not dancing right now!")
            return
        
        self.is_dancing = False
        await self.highrise.chat("🛑 Dance stopped! Thanks for the fun!")

    async def start_dance_loop(self) -> None:
        """Start the dance loop with different emotes"""        
        while self.is_dancing:
            try:
                # Get current dance emote
                dance_emote = self.dance_emotes[self.current_dance_index]
                
                # Perform the dance emote
                await self.highrise.send_emote(dance_emote)
                
                # Move to next dance emote
                self.current_dance_index = (self.current_dance_index + 1) % len(self.dance_emotes)
                
                # Wait before next dance move
                await asyncio.sleep(3)
                
            except Exception as e:
                logger.error(f"Error in dance loop: {e}")
                await asyncio.sleep(2)  # Wait a bit before retrying

    async def handle_help_command(self, user: User, args: str) -> None:
        """Handle -help command"""
        help_text = """🎵 **Highrise Music Bot Commands:**

**Music Commands:**
-play <song> - Add song to queue (10 cubes)
-queue - Show current music queue
-skip - Skip current song (VIP/Owner only)
-like - Like the current song
-link / -url - Get current song URL to listen
-search <song> - Search for songs
-recommend - Get AI recommendations

**Platform Commands:**
-youtube <song> - Search YouTube specifically
-spotify <song> - Search Spotify specifically
-soundcloud <song> - Search SoundCloud specifically

**Cube System:**
-cubes - Check your cube balance
-buy - Info on buying cubes with gold tips

**Competition Commands:**
-startcomp [name] - Start competition (VIP/Owner)
-endcomp - End competition (VIP/Owner)
-leaderboard - Show top users

**Room Commands:**
-createlink - Create shareable room link (VIP/Owner)
-syncmusic - Show current playing song
-vip <user> - Grant VIP status (Owner only)
-inv all - Invite all registered users (Owner only)
-followme - Make bot follow you (Owner only)
-dance - Start bot dancing (Owner only)
-stopdance - Stop bot dancing (Owner only)

**Registration:**
Send me '-buyvisa' in PM to register and use the bot!

**Free cubes for VIP/Owner users!**
Tip the bot 10+ gold to buy cubes!"""
        
        await self.highrise.chat(help_text)

    async def play_next_song(self) -> None:
        """Play the next song in queue"""
        if not self.music_queue:
            self.current_song = None
            await self.highrise.chat("🎵 Queue is empty. Add songs with -play!")
            return
        
        # Get next song
        next_item = self.music_queue.pop(0)
        self.current_song = next_item
        
        song = next_item['song']
        await self.highrise.chat(f"🎵 Now Playing: {song['title']} by {song['artist']} (Requested by {next_item['requested_by']})")
        
        # Simulate song duration (in a real bot, this would be the actual song length)
        song_duration = song.get('duration', 180)  # Default 3 minutes
        
        # Schedule next song
        asyncio.create_task(self.schedule_next_song(song_duration))

    async def schedule_next_song(self, duration: int) -> None:
        """Schedule the next song to play"""
        await asyncio.sleep(duration)
        await self.play_next_song()

    async def start(self, room_id: str, api_token: str) -> None:
        """Start the bot"""
        try:
            await self.highrise.start(room_id, api_token)
        except Exception as e:
            logger.error(f"Failed to start bot: {e}")
            raise
