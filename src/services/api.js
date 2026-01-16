// Client-side API client - Database connection string artık browser'a gitmez!

const API_BASE = '/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed (${endpoint}):`, error);
    throw error;
  }
}

// Tüm kelimeleri getir
export async function getAllWords() {
  return apiCall('/words');
}

// Tek kelime getir
export async function getWordById(id) {
  return apiCall(`/words/${id}`);
}

// Tüm kategorileri getir
export async function getAllCategories() {
  return apiCall('/categories');
}

// Tüm kitapları getir
export async function getAllBooks() {
  return apiCall('/books');
}

// Popüler kelimeleri getir
export async function getPopularWords(limit = 5) {
  return apiCall(`/words/popular?limit=${limit}`);
}

// Kelime görüntülenme sayısını artır
export async function incrementWordView(wordId) {
  try {
    await apiCall('/words/view', {
      method: 'POST',
      body: JSON.stringify({ wordId }),
    });
    return true;
  } catch (error) {
    console.error('Görüntülenme sayısı artırılamadı:', error);
    return false;
  }
}

// Kelime ekle (admin)
export async function addWord(wordData) {
  return apiCall('/words', {
    method: 'POST',
    body: JSON.stringify({
      word: wordData.word,
      meaning: wordData.meaning,
      source: wordData.source || wordData.book,
      example: wordData.example || wordData.quote,
      category: wordData.category,
    }),
  });
}

// Kelime güncelle (admin)
export async function updateWord(id, wordData) {
  return apiCall(`/words/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      word: wordData.word,
      meaning: wordData.meaning,
      source: wordData.source || wordData.book,
      example: wordData.example || wordData.quote,
      category: wordData.category,
    }),
  });
}

// Kelime sil (admin)
export async function deleteWord(id) {
  return apiCall(`/words/${id}`, {
    method: 'DELETE',
  });
}
