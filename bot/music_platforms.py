import os
import json
import asyncio
import aiohttp
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class MusicPlatforms:
    def __init__(self):
        self.youtube_api_key = os.getenv('YOUTUBE_API_KEY', '')
        self.spotify_client_id = os.getenv('SPOTIFY_CLIENT_ID', '')
        self.spotify_client_secret = os.getenv('SPOTIFY_CLIENT_SECRET', '')
        self.soundcloud_client_id = os.getenv('SOUNDCLOUD_CLIENT_ID', '')
        self.spotify_token = None

    async def search_all_platforms(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search all platforms for music"""
        results = []
        
        # Search each platform concurrently
        tasks = [
            self.search_youtube(query, limit=limit//3 + 1),
            self.search_spotify(query, limit=limit//3 + 1),
            self.search_soundcloud(query, limit=limit//3 + 1)
        ]
        
        platform_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Combine results
        for platform_result in platform_results:
            if isinstance(platform_result, list):
                results.extend(platform_result)
        
        return results[:limit]

    async def search_youtube(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search YouTube for music"""
        if not self.youtube_api_key:
            logger.warning("YouTube API key not configured")
            return []
        
        try:
            url = f"https://www.googleapis.com/youtube/v3/search"
            params = {
                'part': 'snippet',
                'q': query,
                'type': 'video',
                'videoCategoryId': '10',  # Music category
                'maxResults': limit,
                'key': self.youtube_api_key
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        results = []
                        for item in data.get('items', []):
                            results.append({
                                'id': item['id']['videoId'],
                                'title': item['snippet']['title'],
                                'artist': item['snippet']['channelTitle'],
                                'duration': 180,  # Default duration
                                'platform': 'YouTube',
                                'url': f"https://www.youtube.com/watch?v={item['id']['videoId']}",
                                'thumbnail': item['snippet']['thumbnails'].get('medium', {}).get('url', '')
                            })
                        
                        return results
                    else:
                        logger.error(f"YouTube API error: {response.status}")
                        return []
        
        except Exception as e:
            logger.error(f"YouTube search error: {e}")
            return []

    async def search_spotify(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search Spotify for music"""
        if not self.spotify_client_id or not self.spotify_client_secret:
            logger.warning("Spotify credentials not configured")
            return []
        
        try:
            await self._ensure_spotify_token()
            
            url = "https://api.spotify.com/v1/search"
            params = {
                'q': query,
                'type': 'track',
                'limit': limit
            }
            headers = {
                'Authorization': f'Bearer {self.spotify_token}'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        results = []
                        for item in data.get('tracks', {}).get('items', []):
                            results.append({
                                'id': item['id'],
                                'title': item['name'],
                                'artist': ', '.join([artist['name'] for artist in item['artists']]),
                                'duration': item['duration_ms'] // 1000,
                                'platform': 'Spotify',
                                'url': item['external_urls']['spotify'],
                                'thumbnail': item['album']['images'][1]['url'] if len(item['album']['images']) > 1 else ''
                            })
                        
                        return results
                    else:
                        logger.error(f"Spotify API error: {response.status}")
                        return []
        
        except Exception as e:
            logger.error(f"Spotify search error: {e}")
            return []

    async def search_soundcloud(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search SoundCloud for music"""
        if not self.soundcloud_client_id:
            logger.warning("SoundCloud client ID not configured")
            return []
        
        try:
            url = "https://api.soundcloud.com/tracks"
            params = {
                'q': query,
                'client_id': self.soundcloud_client_id,
                'limit': limit
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        results = []
                        for item in data:
                            results.append({
                                'id': str(item['id']),
                                'title': item['title'],
                                'artist': item['user']['username'],
                                'duration': item['duration'] // 1000,
                                'platform': 'SoundCloud',
                                'url': item['permalink_url'],
                                'thumbnail': item.get('artwork_url', '')
                            })
                        
                        return results
                    else:
                        logger.error(f"SoundCloud API error: {response.status}")
                        return []
        
        except Exception as e:
            logger.error(f"SoundCloud search error: {e}")
            return []

    async def _ensure_spotify_token(self) -> None:
        """Ensure Spotify access token is valid"""
        if self.spotify_token:
            return
        
        url = "https://accounts.spotify.com/api/token"
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        auth = aiohttp.BasicAuth(self.spotify_client_id, self.spotify_client_secret)
        data = {'grant_type': 'client_credentials'}
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, auth=auth, data=data) as response:
                if response.status == 200:
                    token_data = await response.json()
                    self.spotify_token = token_data['access_token']
                    
                    # Schedule token refresh
                    expires_in = token_data.get('expires_in', 3600)
                    asyncio.create_task(self._refresh_spotify_token(expires_in - 60))
                else:
                    logger.error(f"Spotify token error: {response.status}")

    async def _refresh_spotify_token(self, delay: int) -> None:
        """Refresh Spotify token after delay"""
        await asyncio.sleep(delay)
        self.spotify_token = None
        await self._ensure_spotify_token()

    async def get_recommendations(self, username: str) -> List[Dict[str, Any]]:
        """Get AI-powered music recommendations for user"""
        # This would integrate with the ML service
        # For now, return popular recommendations
        
        popular_songs = [
            {
                'title': 'Blinding Lights',
                'artist': 'The Weeknd',
                'platform': 'YouTube',
                'reason': 'Trending now'
            },
            {
                'title': 'Good 4 U',
                'artist': 'Olivia Rodrigo',
                'platform': 'Spotify',
                'reason': 'Popular choice'
            },
            {
                'title': 'Levitating',
                'artist': 'Dua Lipa',
                'platform': 'SoundCloud',
                'reason': 'Crowd favorite'
            }
        ]
        
        return popular_songs

    async def get_song_info(self, platform: str, song_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific song"""
        if platform.lower() == 'youtube':
            return await self._get_youtube_song_info(song_id)
        elif platform.lower() == 'spotify':
            return await self._get_spotify_song_info(song_id)
        elif platform.lower() == 'soundcloud':
            return await self._get_soundcloud_song_info(song_id)
        
        return None

    async def _get_youtube_song_info(self, video_id: str) -> Optional[Dict[str, Any]]:
        """Get YouTube video information"""
        if not self.youtube_api_key:
            return None
        
        try:
            url = f"https://www.googleapis.com/youtube/v3/videos"
            params = {
                'part': 'snippet,contentDetails',
                'id': video_id,
                'key': self.youtube_api_key
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get('items'):
                            item = data['items'][0]
                            return {
                                'title': item['snippet']['title'],
                                'artist': item['snippet']['channelTitle'],
                                'duration': self._parse_youtube_duration(item['contentDetails']['duration']),
                                'thumbnail': item['snippet']['thumbnails'].get('medium', {}).get('url', '')
                            }
            
            return None
        
        except Exception as e:
            logger.error(f"YouTube song info error: {e}")
            return None

    def _parse_youtube_duration(self, duration_str: str) -> int:
        """Parse YouTube duration string (PT4M13S) to seconds"""
        import re
        
        pattern = r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?'
        match = re.match(pattern, duration_str)
        
        if not match:
            return 180  # Default 3 minutes
        
        hours = int(match.group(1) or 0)
        minutes = int(match.group(2) or 0)
        seconds = int(match.group(3) or 0)
        
        return hours * 3600 + minutes * 60 + seconds

    async def _get_spotify_song_info(self, track_id: str) -> Optional[Dict[str, Any]]:
        """Get Spotify track information"""
        # Implementation similar to search but for specific track
        return None

    async def _get_soundcloud_song_info(self, track_id: str) -> Optional[Dict[str, Any]]:
        """Get SoundCloud track information"""
        # Implementation similar to search but for specific track
        return None
