import { neon } from '@neondatabase/serverless';

const sql = neon(import.meta.env.VITE_DATABASE_URL);

// Tüm kelimeleri getir
export async function getAllWords() {
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
