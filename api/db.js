import { neon } from '@neondatabase/serverless';

// Connection string'i temizle ve formatla (sadece server-side)
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.delete('channel_binding');
    return urlObj.toString();
  } catch (error) {
    const cleanUrl = url.replace(/[?&]channel_binding=[^&]*/g, '');
    return cleanUrl;
  }
};

// SQL client'ı server-side oluştur
let sql = null;
try {
  const dbUrl = getDatabaseUrl();
  if (dbUrl) {
    sql = neon(dbUrl);
  }
} catch (error) {
  console.error('Database connection error:', error);
  sql = null;
}

// Neon formatını uygulama formatına dönüştür
export function transformWord(dbWord) {
  return {
    id: dbWord.id,
    word: dbWord.word,
    meaning: dbWord.meaning,
    book: dbWord.source,
    quote: dbWord.example,
    category: dbWord.category,
    isWordOfDay: dbWord.is_word_of_day,
    viewCount: dbWord.view_count || 0,
    relations: []
  };
}

// Database connection getter
export function getDb() {
  if (!sql) {
    throw new Error('Database connection not available');
  }
  return sql;
}
