import { getDb } from '../db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sql = getDb();
    const limit = parseInt(req.query.limit) || 5;

    const words = await sql`
      SELECT id, word, COALESCE(view_count, 0) as view_count
      FROM words
      WHERE COALESCE(view_count, 0) > 0
      ORDER BY view_count DESC, word ASC
      LIMIT ${limit}
    `;

    const result = words.map(item => ({
      id: item.id,
      word: item.word,
      count: parseInt(item.view_count) || 0
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
