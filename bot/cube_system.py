import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any

class CubeSystem:
    def __init__(self):
        self.data_file = "cube_data.json"
        self.daily_limit = 50
        self.load_data()

    def load_data(self) -> None:
        """Load cube data from file"""
        if os.path.exists(self.data_file):
            with open(self.data_file, 'r') as f:
                self.data = json.load(f)
        else:
            self.data = {}

    def save_data(self) -> None:
        """Save cube data to file"""
        with open(self.data_file, 'w') as f:
            json.dump(self.data, f, indent=2, default=str)

    async def initialize_room(self, room_id: str) -> None:
        """Initialize cube system for a room"""
        if room_id not in self.data:
            self.data[room_id] = {
                'users': {},
                'total_cubes_distributed': 0,
                'daily_reset_time': datetime.now().isoformat()
            }
            self.save_data()

    async def get_user_cubes(self, username: str, room_id: str = "default") -> int:
        """Get user's cube balance"""
        if room_id not in self.data:
            await self.initialize_room(room_id)
        
        users = self.data[room_id]['users']
        if username not in users:
            users[username] = {
                'cubes': self.daily_limit,
                'last_daily_reward': None,
                'total_earned': self.daily_limit,
                'total_spent': 0
            }
            self.save_data()
        
        return users[username]['cubes']

    async def add_cubes(self, username: str, amount: int, room_id: str = "default") -> bool:
        """Add cubes to user's balance"""
        if room_id not in self.data:
            await self.initialize_room(room_id)
        
        users = self.data[room_id]['users']
        if username not in users:
            users[username] = {
                'cubes': 0,
                'last_daily_reward': None,
                'total_earned': 0,
                'total_spent': 0
            }
        
        users[username]['cubes'] += amount
        users[username]['total_earned'] += amount
        self.data[room_id]['total_cubes_distributed'] += amount
        self.save_data()
        return True

    async def spend_cubes(self, username: str, amount: int, room_id: str = "default") -> bool:
        """Spend cubes from user's balance"""
        current_cubes = await self.get_user_cubes(username, room_id)
        
        if current_cubes < amount:
            return False
        
        users = self.data[room_id]['users']
        users[username]['cubes'] -= amount
        users[username]['total_spent'] += amount
        self.save_data()
        return True

    async def check_daily_reward(self, username: str, room_id: str = "default") -> bool:
        """Check and grant daily cube reward"""
        if room_id not in self.data:
            await self.initialize_room(room_id)
        
        users = self.data[room_id]['users']
        if username not in users:
            await self.get_user_cubes(username, room_id)  # Initialize user
        
        user_data = users[username]
        last_reward = user_data.get('last_daily_reward')
        
        if last_reward:
            last_reward_date = datetime.fromisoformat(last_reward)
            if datetime.now() - last_reward_date < timedelta(days=1):
                return False  # Already claimed today
        
        # Grant daily reward
        await self.add_cubes(username, self.daily_limit, room_id)
        user_data['last_daily_reward'] = datetime.now().isoformat()
        self.save_data()
        return True

    async def get_user_stats(self, username: str, room_id: str = "default") -> Dict[str, Any]:
        """Get user's cube statistics"""
        if room_id not in self.data:
            await self.initialize_room(room_id)
        
        await self.get_user_cubes(username, room_id)  # Ensure user exists
        
        user_data = self.data[room_id]['users'][username]
        return {
            'current_cubes': user_data['cubes'],
            'total_earned': user_data['total_earned'],
            'total_spent': user_data['total_spent'],
            'last_daily_reward': user_data.get('last_daily_reward'),
            'can_claim_daily': await self.can_claim_daily_reward(username, room_id)
        }

    async def can_claim_daily_reward(self, username: str, room_id: str = "default") -> bool:
        """Check if user can claim daily reward"""
        if room_id not in self.data:
            return True
        
        users = self.data[room_id]['users']
        if username not in users:
            return True
        
        last_reward = users[username].get('last_daily_reward')
        if not last_reward:
            return True
        
        last_reward_date = datetime.fromisoformat(last_reward)
        return datetime.now() - last_reward_date >= timedelta(days=1)

    async def get_room_stats(self, room_id: str = "default") -> Dict[str, Any]:
        """Get room cube statistics"""
        if room_id not in self.data:
            await self.initialize_room(room_id)
        
        room_data = self.data[room_id]
        active_users = len(room_data['users'])
        total_cubes = sum(user['cubes'] for user in room_data['users'].values())
        
        return {
            'active_users': active_users,
            'total_cubes_in_circulation': total_cubes,
            'total_cubes_distributed': room_data['total_cubes_distributed'],
            'daily_reset_time': room_data.get('daily_reset_time')
        }

    async def reset_daily_cubes(self, room_id: str = "default") -> None:
        """Reset daily cube limits (called by scheduler)"""
        if room_id not in self.data:
            return
        
        # Reset last daily reward for all users to allow new claims
        for username in self.data[room_id]['users']:
            user_data = self.data[room_id]['users'][username]
            # Don't reset if already claimed today
            last_reward = user_data.get('last_daily_reward')
            if last_reward:
                last_reward_date = datetime.fromisoformat(last_reward)
                if datetime.now() - last_reward_date >= timedelta(days=1):
                    # User is eligible for new daily reward
                    pass
        
        self.data[room_id]['daily_reset_time'] = datetime.now().isoformat()
        self.save_data()
