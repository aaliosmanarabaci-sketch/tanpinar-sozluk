import { getDb } from '../db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sql = getDb();
    const { wordId } = req.body;

    if (!wordId) {
      return res.status(400).json({ error: 'wordId is required' });
    }

    // view_count kolonunu kontrol et ve gerekirse oluştur
    try {
      await sql`
        UPDATE words 
        SET view_count = COALESCE(view_count, 0) + 1
        WHERE id = ${wordId}
      `;
    } catch (err) {
      // Eğer view_count kolonu yoksa, oluştur ve tekrar dene
      if (err.message && err.message.includes('view_count')) {
        try {
          await sql`ALTER TABLE words ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0`;
          await sql`
            UPDATE words 
            SET view_count = COALESCE(view_count, 0) + 1
            WHERE id = ${wordId}
          `;
        } catch (alterError) {
          console.error('view_count kolonu oluşturulamadı:', alterError);
          // Devam et, hata verme
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
