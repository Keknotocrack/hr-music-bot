export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({
      totalBots: 0,
      onlineBots: 0,
      rooms: []
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}