import { getDb, transformWord } from '../db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const sql = getDb();
    // Vercel dynamic route: [id].js için req.query.id kullanılır
    const id = req.query.id || req.query[Object.keys(req.query)[0]];

    if (req.method === 'GET') {
      // Tek kelime getir
      const words = await sql`SELECT * FROM words WHERE id = ${id}`;
      
      if (words.length === 0) {
        return res.status(404).json({ error: 'Word not found' });
      }
      
      res.status(200).json(transformWord(words[0]));
    } else if (req.method === 'PUT') {
      // Kelime güncelle (admin)
      const { word, meaning, source, example, category } = req.body;
      
      const result = await sql`
        UPDATE words
        SET word = ${word},
            meaning = ${meaning},
            source = ${source || null},
            example = ${example || null},
            category = ${category || null}
        WHERE id = ${id}
        RETURNING *
      `;
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Word not found' });
      }
      
      res.status(200).json(transformWord(result[0]));
    } else if (req.method === 'DELETE') {
      // Kelime sil (admin)
      await sql`DELETE FROM words WHERE id = ${id}`;
      res.status(200).json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
