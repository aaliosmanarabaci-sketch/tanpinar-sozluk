import { getDb, transformWord } from './db.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const sql = getDb();

    if (req.method === 'GET') {
      // Tüm kelimeleri getir
      const words = await sql`SELECT * FROM words ORDER BY word ASC`;
      const transformedWords = words.map(transformWord);
      
      res.status(200).json(transformedWords);
    } else if (req.method === 'POST') {
      // Kelime ekle (admin)
      const { word, meaning, source, example, category } = req.body;
      
      if (!word || !meaning) {
        return res.status(400).json({ error: 'Word and meaning are required' });
      }

      const result = await sql`
        INSERT INTO words (word, meaning, source, example, category)
        VALUES (${word}, ${meaning}, ${source || null}, ${example || null}, ${category || null})
        RETURNING *
      `;
      
      res.status(201).json(transformWord(result[0]));
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
