import { neon } from '@neondatabase/serverless';

// Connection string'i temizle ve formatla
const getDatabaseUrl = () => {
  const url = import.meta.env.VITE_DATABASE_URL;
  if (!url) return null;
  
  try {
    // URL'i parse et
    const urlObj = new URL(url);
    
    // channel_binding parametresini kaldır (Neon serverless ile uyumlu değil)
    urlObj.searchParams.delete('channel_binding');
    
    // Temizlenmiş URL'i döndür
    return urlObj.toString();
  } catch (error) {
    // URL parse edilemezse, basit string replacement yap
    const cleanUrl = url.replace(/[?&]channel_binding=[^&]*/g, '');
    return cleanUrl;
  }
};

// SQL client'ı güvenli şekilde oluştur
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

// Tüm kelimeleri getir
export async function getAllWords() {
  if (!sql) {
    throw new Error('Database connection not available');
  }
  
  try {
    const words = await sql`SELECT * FROM words ORDER BY word ASC`;
    return words.map(transformWord);
  } catch (error) {
    console.error('Veritabanı hatası:', error);
    throw error;
  }
}

// Tek kelime getir
export async function getWordById(id) {
  if (!sql) {
    throw new Error('Database connection not available');
  }
  
  try {
    const words = await sql`SELECT * FROM words WHERE id = ${id}`;
    return words[0] ? transformWord(words[0]) : null;
  } catch (error) {
    console.error('Veritabanı hatası:', error);
    throw error;
  }
}

// Kelime ara
export async function searchWords(query) {
  if (!sql) {
    throw new Error('Database connection not available');
  }
  
  try {
    const searchTerm = `%${query}%`;
    const words = await sql`
      SELECT * FROM words
      WHERE word ILIKE ${searchTerm} OR meaning ILIKE ${searchTerm}
      ORDER BY word ASC
    `;
    return words.map(transformWord);
  } catch (error) {
    console.error('Arama hatası:', error);
    throw error;
  }
}

// Kategoriye göre getir
export async function getWordsByCategory(category) {
  if (!sql) {
    throw new Error('Database connection not available');
  }
  
  try {
    const words = await sql`
      SELECT * FROM words
      WHERE category = ${category}
      ORDER BY word ASC
    `;
    return words.map(transformWord);
  } catch (error) {
    console.error('Kategori hatası:', error);
    throw error;
  }
}

// Kitaba göre getir
export async function getWordsByBook(book) {
  if (!sql) {
    throw new Error('Database connection not available');
  }
  
  try {
    const words = await sql`
      SELECT * FROM words
      WHERE source = ${book}
      ORDER BY word ASC
    `;
    return words.map(transformWord);
  } catch (error) {
    console.error('Kitap hatası:', error);
    throw error;
  }
}

// Günün kelimesini getir
export async function getWordOfTheDay() {
  if (!sql) {
    throw new Error('Database connection not available');
  }
  
  try {
    // Önce is_word_of_day true olanı kontrol et
    let words = await sql`SELECT * FROM words WHERE is_word_of_day = true LIMIT 1`;

    if (words.length === 0) {
      // Yoksa tarihe göre rastgele bir kelime seç
      const today = new Date();
      const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
      const totalWords = await sql`SELECT COUNT(*) as count FROM words`;
      const index = dayOfYear % totalWords[0].count;

      words = await sql`SELECT * FROM words ORDER BY id LIMIT 1 OFFSET ${index}`;
    }

    return words[0] ? transformWord(words[0]) : null;
  } catch (error) {
    console.error('Günün kelimesi hatası:', error);
    throw error;
  }
}

// Tüm kategorileri getir
export async function getAllCategories() {
  if (!sql) {
    throw new Error('Database connection not available');
  }
  
  try {
    const categories = await sql`SELECT DISTINCT category FROM words WHERE category IS NOT NULL ORDER BY category`;
    return categories.map(c => c.category);
  } catch (error) {
    console.error('Kategori listesi hatası:', error);
    throw error;
  }
}

// Tüm kitapları getir
export async function getAllBooks() {
  if (!sql) {
    throw new Error('Database connection not available');
  }
  
  try {
    const books = await sql`SELECT DISTINCT source FROM words WHERE source IS NOT NULL ORDER BY source`;
    return books.map(b => b.source);
  } catch (error) {
    console.error('Kitap listesi hatası:', error);
    throw error;
  }
}

// Kelime ekle
export async function addWord(wordData) {
  if (!sql) {
    throw new Error('Database connection not available');
  }
  
  try {
    const result = await sql`
      INSERT INTO words (word, meaning, source, example, category)
      VALUES (${wordData.word}, ${wordData.meaning}, ${wordData.source}, ${wordData.example}, ${wordData.category})
      RETURNING *
    `;
    return transformWord(result[0]);
  } catch (error) {
    console.error('Kelime ekleme hatası:', error);
    throw error;
  }
}

// Kelime güncelle
export async function updateWord(id, wordData) {
  if (!sql) {
    throw new Error('Database connection not available');
  }
  
  try {
    const result = await sql`
      UPDATE words
      SET word = ${wordData.word},
          meaning = ${wordData.meaning},
          source = ${wordData.source},
          example = ${wordData.example},
          category = ${wordData.category}
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0] ? transformWord(result[0]) : null;
  } catch (error) {
    console.error('Kelime güncelleme hatası:', error);
    throw error;
  }
}

// Kelime sil
export async function deleteWord(id) {
  if (!sql) {
    throw new Error('Database connection not available');
  }
  
  try {
    await sql`DELETE FROM words WHERE id = ${id}`;
    return true;
  } catch (error) {
    console.error('Kelime silme hatası:', error);
    throw error;
  }
}

// Neon formatını uygulama formatına dönüştür
function transformWord(dbWord) {
  return {
    id: dbWord.id,
    word: dbWord.word,
    meaning: dbWord.meaning,
    book: dbWord.source,      // source -> book
    quote: dbWord.example,    // example -> quote
    category: dbWord.category,
    isWordOfDay: dbWord.is_word_of_day,
    relations: []             // Neon'da relations yok, boş array
  };
}
