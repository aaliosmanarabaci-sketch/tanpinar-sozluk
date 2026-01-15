// Günün kelimesini hesapla (tarihe göre sabit, alfabetik sırayla)
export const getDailyWord = (words) => {
  if (!words || words.length === 0) return null;
  
  // Kelimeleri alfabetik sıraya göre sırala (Türkçe karakter desteği ile)
  const sortedWords = [...words].sort((a, b) => {
    return a.word.localeCompare(b.word, 'tr-TR', { sensitivity: 'base' });
  });
  
  // Yılın kaçıncı günü olduğunu hesapla (1 Ocak = 1, 31 Aralık = 365/366)
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = today - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  // Alfabetik sıralı diziden yılın gününe göre kelime seç
  // Her gün bir sonraki alfabetik kelimeyi gösterir
  const index = dayOfYear % sortedWords.length;
  return sortedWords[index];
};

// İlgili kelimeleri getir (otomatik ilişkilendirme)
export const getRelatedWords = (word, allWords) => {
  if (!word || !allWords || allWords.length === 0) return [];

  // Manuel relations varsa önce onları kullan
  if (word.relations && word.relations.length > 0) {
    return word.relations.map(id => allWords.find(w => w.id === id)).filter(Boolean);
  }

  // Kelime ID'sini seed olarak kullan (her kelime için tutarlı ama farklı sonuçlar)
  const seed = word.id;
  const seededRandom = (index) => {
    const x = Math.sin(seed * 9999 + index * 7777) * 10000;
    return x - Math.floor(x);
  };

  // 1. Aynı kategorideki kelimeler (en güçlü ilişki)
  const sameCategory = word.category
    ? allWords.filter(w => w.id !== word.id && w.category === word.category)
    : [];

  // 2. Aynı kitaptaki ama farklı kategorideki kelimeler
  const sameBook = allWords.filter(w =>
    w.id !== word.id &&
    w.book === word.book &&
    w.category !== word.category
  );

  // 3. Farklı kitaptan ama aynı kategorideki kelimeler
  const sameCategoryDiffBook = word.category
    ? allWords.filter(w =>
        w.id !== word.id &&
        w.category === word.category &&
        w.book !== word.book
      )
    : [];

  // Her gruptan seeded-random ile seç
  const shuffleWithSeed = (arr, seedOffset) => {
    return [...arr].sort((a, b) => seededRandom(a.id + seedOffset) - seededRandom(b.id + seedOffset));
  };

  const result = [];

  // Aynı kategoriden 2-3 kelime
  const shuffledCategory = shuffleWithSeed(sameCategory, 1);
  result.push(...shuffledCategory.slice(0, 3));

  // Aynı kitaptan (farklı kategori) 1-2 kelime
  const shuffledBook = shuffleWithSeed(sameBook, 2);
  result.push(...shuffledBook.slice(0, 2));

  // Farklı kitaptan aynı kategoriden 1 kelime
  const shuffledCategoryDiffBook = shuffleWithSeed(sameCategoryDiffBook, 3);
  result.push(...shuffledCategoryDiffBook.slice(0, 1));

  // Eğer hala 6'dan az varsa, rastgele kelimeler ekle
  if (result.length < 6) {
    const remaining = allWords.filter(w =>
      w.id !== word.id && !result.find(r => r.id === w.id)
    );
    const shuffledRemaining = shuffleWithSeed(remaining, 4);
    result.push(...shuffledRemaining.slice(0, 6 - result.length));
  }

  return result.slice(0, 6);
};

// İstatistikleri hesapla
export const calculateStats = (words) => {
  if (!words || words.length === 0) {
    return { totalWords: 0, bookCounts: {}, categoryCounts: {} };
  }

  const bookCounts = {};
  const categoryCounts = {};

  words.forEach(item => {
    bookCounts[item.book] = (bookCounts[item.book] || 0) + 1;
    if (item.category) {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    }
  });

  return {
    totalWords: words.length,
    bookCounts,
    categoryCounts
  };
};

// Kelimeleri filtrele (client-side)
export const filterWords = (words, searchTerm) => {
  if (!words) return [];
  if (!searchTerm) return words;

  const lowerSearch = searchTerm.toLocaleLowerCase('tr-TR');
  return words.filter(item =>
    item.word.toLocaleLowerCase('tr-TR').includes(lowerSearch) ||
    item.meaning.toLocaleLowerCase('tr-TR').includes(lowerSearch)
  );
};
