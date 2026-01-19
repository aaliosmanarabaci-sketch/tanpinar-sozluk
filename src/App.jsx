import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, BookOpen, Feather, Info, X, Compass, BarChart2, Shuffle, TrendingUp, Heart, Save, FileText, Network, Loader2, AlertCircle, ChevronDown, ArrowUpAZ } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';

// Database ve Utilities
import { getAllWords, incrementWordView, getPopularWords } from './services/api.js';
import { DICTIONARY_DATA } from './data/dictionary.js';
import { textSizeClass, titleSizeClass } from './utils/constants.js';
import { getDailyWord, getRelatedWords, calculateStats, filterWords } from './utils/helpers.js';

const App = () => {
  const [activeTab, setActiveTab] = useState('dictionary');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWord, setSelectedWord] = useState(null);
  const [randomWord, setRandomWord] = useState(null);
  const [fontSize, setFontSize] = useState('medium');

  // Veritabanı state'leri
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Yeni Modallar
  const [showNetworkView, setShowNetworkView] = useState(false);

  // Sıralama ve filtreleme
  const [sortBy, setSortBy] = useState('random'); // 'random', 'alphabetic'
  const [selectedBook, setSelectedBook] = useState(null); // Eser filtresi
  const [showBookDropdown, setShowBookDropdown] = useState(false);
  const [showAllWords, setShowAllWords] = useState(false); // Tüm kelimeleri göster
  const WORDS_PER_PAGE = 8;

  // LocalStorage'dan başlangıç değerlerini al
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('tanpinar-favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('tanpinar-notes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Popüler aramalar (veritabanından)
  const [popularSearches, setPopularSearches] = useState([]);

  const [currentNote, setCurrentNote] = useState("");
  const [isNoteSaved, setIsNoteSaved] = useState(false);
  const noteSaveTimeoutRef = useRef(null);

  // Favoriler değiştiğinde LocalStorage'a kaydet
  useEffect(() => {
    try {
      localStorage.setItem('tanpinar-favorites', JSON.stringify(favorites));
    } catch (err) {
      console.error('Favoriler kaydedilemedi:', err);
    }
  }, [favorites]);

  // Notlar değiştiğinde LocalStorage'a kaydet
  useEffect(() => {
    try {
      localStorage.setItem('tanpinar-notes', JSON.stringify(notes));
    } catch (err) {
      console.error('Notlar kaydedilemedi:', err);
    }
  }, [notes]);

  // Veritabanından kelimeleri çek
  useEffect(() => {
    const fetchWords = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllWords();
        setWords(data);
      } catch (err) {
        console.error('Veritabanı hatası, yerel veriye düşülüyor:', err);
        // Yerel sözlük verisine düş
        setWords(DICTIONARY_DATA);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchWords();
  }, []);

  // Popüler aramaları veritabanından çek
  useEffect(() => {
    const fetchPopularSearches = async () => {
      try {
        const popular = await getPopularWords(5);
        setPopularSearches(popular);
      } catch (err) {
        console.error('Popüler aramalar yüklenirken hata:', err);
        // Hata durumunda boş array bırak
        setPopularSearches([]);
      }
    };

    // Kelimeler yüklendikten sonra popüler aramaları çek
    if (words.length > 0) {
      fetchPopularSearches();
    }
  }, [words]);

  // Günün Kelimesi Hesabı (Tarihe göre sabit)
  const dailyWord = useMemo(() => getDailyWord(words), [words]);

  // Filtrelenmiş kelimeler (arama + eser filtresi)
  const filteredData = useMemo(() => {
    let result = filterWords(words, searchTerm);
    if (selectedBook) {
      result = result.filter(w => w.book === selectedBook);
    }
    return result;
  }, [words, searchTerm, selectedBook]);

  // Benzersiz kitap listesi
  const bookList = useMemo(() => {
    if (!words || words.length === 0) return [];
    const books = [...new Set(words.map(w => w.book))];
    return books.sort((a, b) => a.localeCompare(b, 'tr-TR'));
  }, [words]);

  // Sıralanmış kelimeler
  const sortedData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    let sorted = [...filteredData];

    if (sortBy === 'alphabetic') {
      sorted.sort((a, b) => a.word.localeCompare(b.word, 'tr-TR'));
    } else {
      // random - her sayfa yüklemede karışık ama tutarlı
      sorted.sort((a, b) => {
        const hashA = (a.id * 2654435761) % 2147483647;
        const hashB = (b.id * 2654435761) % 2147483647;
        return hashA - hashB;
      });
    }

    return sorted;
  }, [filteredData, sortBy]);

  // Görüntülenecek kelimeler (sayfalama)
  const displayedWords = useMemo(() => {
    // Arama veya eser seçiliyse veya "tümünü göster" aktifse tümünü göster
    if (searchTerm || selectedBook || showAllWords) return sortedData;
    // Ana sayfada sadece 8 kelime
    return sortedData.slice(0, WORDS_PER_PAGE);
  }, [sortedData, searchTerm, selectedBook, showAllWords, WORDS_PER_PAGE]);

  // İstatistikler
  const stats = useMemo(() => calculateStats(words), [words]);


  const handleRandomWord = () => {
    if (words.length === 0) return;
    const randomIndex = Math.floor(Math.random() * words.length);
    setRandomWord(words[randomIndex]);
  };

  useEffect(() => {
    if (activeTab === 'discover' && !randomWord) {
      handleRandomWord();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (selectedWord) {
      setCurrentNote(notes[selectedWord.id] || "");
      setIsNoteSaved(false);
      setShowNetworkView(false); // Modal açıldığında varsayılan görünüm
      
      // Kelime görüntüleme sayısını veritabanında artır
      incrementWordView(selectedWord.id).then(() => {
        // Popüler aramaları yeniden yükle (güncel sayıları görmek için)
        getPopularWords(5).then(popular => {
          setPopularSearches(popular);
        }).catch(err => {
          console.error('Popüler aramalar güncellenirken hata:', err);
        });
      }).catch(err => {
        console.error('Görüntülenme sayısı artırılırken hata:', err);
      });
    }
  }, [selectedWord, notes]);

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showBookDropdown && !e.target.closest('.relative')) {
        setShowBookDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showBookDropdown]);

  const toggleFavorite = (e, id) => {
    e && e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]
    );
  };

  // Otomatik kaydetme fonksiyonu
  const autoSaveNote = (noteText) => {
    if (selectedWord) {
      setNotes(prev => ({
        ...prev,
        [selectedWord.id]: noteText
      }));
      setIsNoteSaved(true);
      setTimeout(() => setIsNoteSaved(false), 2000);
    }
  };

  // Not değiştiğinde otomatik kaydet (debounce ile)
  useEffect(() => {
    if (!selectedWord) return;
    
    // Önceki timeout'u temizle
    if (noteSaveTimeoutRef.current) {
      clearTimeout(noteSaveTimeoutRef.current);
    }
    
    // 500ms sonra otomatik kaydet
    noteSaveTimeoutRef.current = setTimeout(() => {
      autoSaveNote(currentNote);
    }, 500);
    
    // Cleanup
    return () => {
      if (noteSaveTimeoutRef.current) {
        clearTimeout(noteSaveTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNote]);



  const renderContent = () => {
    // Loading durumu
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-amber-600 animate-spin mb-4" />
          <p className="text-stone-500 text-lg">Kelimeler yükleniyor...</p>
        </div>
      );
    }

    // Hata durumu
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Sayfayı Yenile
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dictionary':
        return (
          <>
            {/* Search Bar - Daha kompakt */}
            <div className="max-w-xl mx-auto bg-white rounded-lg shadow-md p-1.5 mb-4 flex items-center border border-stone-200 relative z-20 mt-4">
              <Search className="w-5 h-5 text-stone-400 ml-3" />
              <input
                type="text"
                placeholder="Kelime veya anlam ara..."
                className="w-full p-3 outline-none text-base bg-transparent placeholder-stone-400 text-stone-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-stone-500" />
                </button>
              )}
            </div>

            {/* Günün Kelimesi Bölümü - Daha kompakt */}
            {!searchTerm && dailyWord && (
              <div className="max-w-2xl mx-auto mb-6">
                {/* Başlık */}
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-300 to-amber-300"></div>
                  <div className="flex items-center gap-2 bg-amber-500 text-white px-4 py-1 rounded-full shadow-sm text-xs uppercase tracking-wider font-bold">
                    <Feather className="w-3.5 h-3.5" />
                    Günün Kelimesi
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent via-amber-300 to-amber-300"></div>
                </div>

                {/* Kompakt Kart */}
                <div
                  onClick={() => setSelectedWord(dailyWord)}
                  className="bg-white rounded-lg p-5 text-center cursor-pointer shadow-md hover:shadow-lg transition-all duration-300 group border border-amber-100"
                >
                  <h2 className="text-2xl md:text-3xl font-serif font-bold mb-2 text-amber-800 group-hover:text-amber-900 transition-colors">
                    {dailyWord.word}
                  </h2>
                  <p className="text-stone-600 italic font-serif text-base opacity-90 max-w-lg mx-auto leading-relaxed mb-3">
                    "{dailyWord.meaning}"
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-amber-700 font-semibold bg-amber-50 px-3 py-1 rounded-full">
                    <BookOpen className="w-3 h-3" /> {dailyWord.book}
                  </span>
                </div>
              </div>
            )}

            {/* Sıralama ve Bilgi Çubuğu */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 bg-white rounded-lg p-3 shadow-sm border border-stone-100">
              {/* Sol: Sonuç bilgisi */}
              <div className="text-stone-500 text-sm flex items-center gap-2 flex-wrap">
                {filteredData.length > 0 ? (
                  <>
                    <span>
                      {searchTerm ? `${filteredData.length} sonuç bulundu` : (
                        selectedBook ? `${filteredData.length} kelime` : `${displayedWords.length} / ${words.length} kelime`
                      )}
                    </span>
                    {selectedBook && (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        {selectedBook}
                        <button
                          onClick={() => setSelectedBook(null)}
                          className="hover:bg-amber-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </>
                ) : (
                  <span>Sonuç bulunamadı</span>
                )}
              </div>

              {/* Sağ: Sıralama butonları */}
              <div className="flex items-center gap-1 flex-wrap justify-center sm:justify-end">
                <span className="text-xs text-stone-400 mr-2 hidden sm:inline">Sırala:</span>
                <button
                  onClick={() => { setSortBy('random'); setSelectedBook(null); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    sortBy === 'random' && !selectedBook
                      ? 'bg-amber-600 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <Shuffle className="w-3 h-3 inline mr-1" />
                  Karışık
                </button>
                <button
                  onClick={() => { setSortBy('alphabetic'); setSelectedBook(null); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    sortBy === 'alphabetic' && !selectedBook
                      ? 'bg-amber-600 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <ArrowUpAZ className="w-3 h-3 inline mr-1" />
                  A-Z
                </button>

                {/* Eser Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowBookDropdown(!showBookDropdown)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                      selectedBook
                        ? 'bg-amber-600 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    <BookOpen className="w-3 h-3" />
                    {selectedBook ? selectedBook.substring(0, 12) + (selectedBook.length > 12 ? '...' : '') : 'Eser'}
                    <ChevronDown className={`w-3 h-3 transition-transform ${showBookDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showBookDropdown && (
                    <div className="absolute right-0 top-full mt-2 bg-[#2c241b] rounded-xl shadow-2xl border border-amber-900/30 py-2 z-30 min-w-[220px] max-h-[320px] overflow-y-auto">
                      <div className="px-4 py-2 border-b border-amber-800/30 mb-1">
                        <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Eser Seçin</span>
                      </div>
                      <button
                        onClick={() => { setSelectedBook(null); setShowBookDropdown(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          !selectedBook ? 'text-amber-400 font-medium bg-amber-900/30' : 'text-stone-300 hover:bg-amber-900/20 hover:text-amber-300'
                        }`}
                      >
                        Tüm Eserler
                      </button>
                      <div className="h-px bg-amber-800/30 my-1"></div>
                      {bookList.map(book => (
                        <button
                          key={book}
                          onClick={() => { setSelectedBook(book); setShowBookDropdown(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            selectedBook === book ? 'text-amber-400 font-medium bg-amber-900/30' : 'text-stone-300 hover:bg-amber-900/20 hover:text-amber-300'
                          }`}
                        >
                          {book}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Grid Layout - Daha kompakt */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayedWords.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-amber-600 group cursor-pointer flex flex-col relative min-h-[140px]"
                  onClick={() => setSelectedWord(item)}
                >
                  <button
                    onClick={(e) => toggleFavorite(e, item.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-stone-100 transition-colors z-10 group/btn"
                    title={favorites.includes(item.id) ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                  >
                    <Heart
                      className={`w-4 h-4 transition-all duration-300 ${
                        favorites.includes(item.id)
                          ? 'text-amber-600 fill-current scale-110'
                          : 'text-stone-300 group-hover/btn:text-amber-400'
                      }`}
                    />
                  </button>

                  <div className="p-4">
                    <h2 className="text-lg font-bold font-serif text-[#2c241b] group-hover:text-amber-700 transition-colors pr-6 mb-1">
                      {item.word}
                    </h2>

                    <p className="text-stone-600 text-sm leading-snug line-clamp-2 mb-2">
                      {item.meaning}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs text-stone-400">
                       <BookOpen className="w-3 h-3" />
                       <span className="truncate">{item.book}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tümünü göster butonu */}
            {!searchTerm && !selectedBook && !showAllWords && filteredData.length > WORDS_PER_PAGE && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setShowAllWords(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-full hover:bg-amber-700 transition-all shadow-lg hover:shadow-xl font-medium"
                >
                  <BookOpen className="w-4 h-4" />
                  Tüm Listeyi Göster ({filteredData.length} kelime)
                </button>
              </div>
            )}

            {/* Daha az göster butonu */}
            {!searchTerm && !selectedBook && showAllWords && (
              <div className="text-center mt-8">
                <button
                  onClick={() => {
                    setShowAllWords(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-stone-200 text-stone-700 rounded-full hover:bg-stone-300 transition-all font-medium"
                >
                  <X className="w-4 h-4" />
                  Daha Az Göster
                </button>
              </div>
            )}
          </>
        );
      
      case 'discover':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center mb-8">
               <button 
                 onClick={handleRandomWord}
                 className="flex items-center gap-2 px-6 py-3 bg-amber-700 text-white rounded-full hover:bg-amber-800 transition-all shadow-lg hover:shadow-amber-900/20 active:scale-95"
               >
                 <Shuffle className="w-5 h-5" />
                 Rastgele Kelime Getir
               </button>
            </div>

            {randomWord && (
               <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-200 mb-12 relative">
                 <button 
                   onClick={(e) => toggleFavorite(e, randomWord.id)}
                   className="absolute top-6 right-6 p-3 rounded-full hover:bg-stone-100 transition-all z-10 group"
                 >
                   <Heart 
                     className={`w-8 h-8 transition-colors ${
                       favorites.includes(randomWord.id) 
                         ? 'text-amber-600 fill-amber-600' 
                         : 'text-stone-300 group-hover:text-amber-400'
                     }`} 
                   />
                 </button>

                 <div className="bg-stone-100 p-8 text-center border-b border-stone-200">
                    <h2 className="text-5xl font-serif font-bold text-amber-800 mb-4">{randomWord.word}</h2>
                    <p className={`text-stone-600 italic font-serif ${textSizeClass[fontSize]}`}>"{randomWord.meaning}"</p>
                 </div>
                 <div className="p-8 md:p-12 bg-[#fffdf9]">
                    <div className="flex items-start gap-4">
                       <div className="bg-amber-100 p-3 rounded-full hidden md:block">
                          <BookOpen className="w-6 h-6 text-amber-800" />
                       </div>
                       <div>
                          <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-3">
                             {randomWord.book}
                          </h3>
                          <p className={`font-serif leading-loose text-stone-800 italic ${titleSizeClass[fontSize === 'large' ? 'medium' : fontSize]}`}>
                             "{randomWord.quote}"
                          </p>
                       </div>
                    </div>
                 </div>
               </div>
            )}
          </div>
        );

      case 'stats':
        return (
           <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-serif font-bold text-center text-stone-800 mb-10">Sözlük İstatistikleri</h2>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
               <div className="bg-white p-8 rounded-2xl shadow-lg border border-stone-100 flex items-center justify-between">
                  <div>
                     <p className="text-stone-500 font-medium mb-1">Toplam Kelime</p>
                     <p className="text-5xl font-bold text-amber-700">{stats.totalWords}</p>
                  </div>
                  <div className="bg-amber-100 p-4 rounded-full">
                     <Feather className="w-8 h-8 text-amber-700" />
                  </div>
               </div>
               <div className="bg-white p-8 rounded-2xl shadow-lg border border-stone-100 flex items-center justify-between">
                  <div>
                     <p className="text-stone-500 font-medium mb-1">Favori Kelime</p>
                     <p className="text-5xl font-bold text-red-500">{favorites.length}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-full">
                     <Heart className="w-8 h-8 text-red-500" />
                  </div>
               </div>
               <div className="bg-white p-8 rounded-2xl shadow-lg border border-stone-100 flex items-center justify-between">
                  <div>
                     <p className="text-stone-500 font-medium mb-1">Alınan Notlar</p>
                     <p className="text-5xl font-bold text-stone-700">{Object.keys(notes).length}</p>
                  </div>
                  <div className="bg-stone-200 p-4 rounded-full">
                     <FileText className="w-8 h-8 text-stone-700" />
                  </div>
               </div>
            </div>
            {/* Alt ızgara (Kitaplar ve Popüler) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-stone-100 h-full">
                   <h3 className="text-xl font-bold text-stone-800 mb-6 border-b pb-2 border-stone-100 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-amber-600" />
                      Kitaplara Göre Dağılım
                   </h3>
                   <div className="space-y-4">
                      {Object.entries(stats.bookCounts).map(([book, count]) => (
                         <div key={book}>
                            <div className="flex justify-between text-sm mb-1">
                               <span className="font-medium text-stone-700">{book}</span>
                               <span className="text-stone-500">{count} Kelime</span>
                            </div>
                            <div className="w-full bg-stone-100 rounded-full h-3">
                               <div 
                                  className="bg-amber-600 h-3 rounded-full transition-all duration-1000" 
                                  style={{ width: `${(count / stats.totalWords) * 100}%` }}
                               ></div>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-lg border border-stone-100 h-full">
                   <h3 className="text-xl font-bold text-stone-800 mb-6 border-b pb-2 border-stone-100 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                      Popüler Aramalar
                   </h3>
                   {popularSearches.length > 0 ? (
                      <div className="space-y-3">
                         {popularSearches.map((item, index) => {
                            const maxCount = popularSearches[0]?.count || 1;
                            return (
                               <div 
                                  key={item.id} 
                                  className="flex items-center justify-between p-3 hover:bg-stone-50 rounded-lg transition-colors group cursor-pointer"
                                  onClick={() => {
                                     const word = words.find(w => w.id === item.id);
                                     if (word) setSelectedWord(word);
                                  }}
                               >
                                  <div className="flex items-center gap-3">
                                     <span className="flex items-center justify-center w-6 h-6 rounded-full bg-stone-100 text-stone-500 text-xs font-bold group-hover:bg-amber-100 group-hover:text-amber-700 transition-colors">{index + 1}</span>
                                     <span className="font-medium text-stone-700 font-serif text-lg">{item.word}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                     <div className="w-16 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                        <div className="bg-amber-400 h-full rounded-full" style={{ width: `${(item.count / maxCount) * 100}%` }}></div>
                                     </div>
                                     <span className="text-sm text-stone-400 font-medium min-w-[3rem] text-right">{item.count}</span>
                                  </div>
                               </div>
                            );
                         })}
                      </div>
                   ) : (
                      <div className="text-center py-8 text-stone-400">
                         <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                         <p>Henüz kelime açılmadı.</p>
                         <p className="text-sm mt-1">Kelimelere tıklayarak popüler aramaları oluşturun.</p>
                      </div>
                   )}
                </div>
            </div>

            {/* Favoriler ve Notlar Bölümü */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
               {/* Favori Kelimeler */}
               <div className="bg-white p-8 rounded-2xl shadow-lg border border-stone-100">
                  <h3 className="text-xl font-bold text-stone-800 mb-6 border-b pb-2 border-stone-100 flex items-center gap-2">
                     <Heart className="w-5 h-5 text-red-500" />
                     Favori Kelimelerim
                  </h3>
                  {favorites.length > 0 ? (
                     <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {favorites.map(favId => {
                           const favWord = words.find(w => w.id === favId);
                           if (!favWord) return null;
                           return (
                              <div
                                 key={favId}
                                 onClick={() => setSelectedWord(favWord)}
                                 className="flex items-center justify-between p-3 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer group border border-transparent hover:border-amber-200"
                              >
                                 <div className="flex items-center gap-3">
                                    <Heart className="w-4 h-4 text-red-400 fill-red-400" />
                                    <span className="font-serif font-medium text-stone-700 group-hover:text-amber-700">{favWord.word}</span>
                                 </div>
                                 <span className="text-xs text-stone-400 bg-stone-100 px-2 py-1 rounded group-hover:bg-amber-100 group-hover:text-amber-600">{favWord.book}</span>
                              </div>
                           );
                        })}
                     </div>
                  ) : (
                     <div className="text-center py-8 text-stone-400">
                        <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>Henüz favori kelime eklemediniz.</p>
                        <p className="text-sm mt-1">Kelimelerin yanındaki kalp ikonuna tıklayarak favorilere ekleyebilirsiniz.</p>
                     </div>
                  )}
               </div>

               {/* Notlarım */}
               <div className="bg-white p-8 rounded-2xl shadow-lg border border-stone-100">
                  <h3 className="text-xl font-bold text-stone-800 mb-6 border-b pb-2 border-stone-100 flex items-center gap-2">
                     <FileText className="w-5 h-5 text-stone-600" />
                     Notlarım
                  </h3>
                  {Object.keys(notes).length > 0 ? (
                     <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {Object.entries(notes).map(([wordId, note]) => {
                           const noteWord = words.find(w => w.id === parseInt(wordId));
                           if (!noteWord || !note) return null;
                           return (
                              <div
                                 key={wordId}
                                 onClick={() => setSelectedWord(noteWord)}
                                 className="p-4 hover:bg-stone-50 rounded-lg transition-colors cursor-pointer group border border-stone-100 hover:border-amber-200"
                              >
                                 <div className="flex items-center justify-between mb-2">
                                    <span className="font-serif font-bold text-amber-700">{noteWord.word}</span>
                                    <span className="text-xs text-stone-400">{noteWord.book}</span>
                                 </div>
                                 <p className="text-sm text-stone-600 line-clamp-2">{note}</p>
                              </div>
                           );
                        })}
                     </div>
                  ) : (
                     <div className="text-center py-8 text-stone-400">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>Henüz not eklemediniz.</p>
                        <p className="text-sm mt-1">Kelime detayında "Kişisel Notlarınız" bölümünden not ekleyebilirsiniz.</p>
                     </div>
                  )}
               </div>
            </div>
           </div>
        );

      case 'about':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-6 text-white">
                <h2 className="text-2xl font-serif font-bold flex items-center gap-3">
                  <Info className="w-6 h-6" /> Hakkında
                </h2>
              </div>
              <div className="p-8 md:p-10 space-y-8">
                {/* Site Hakkında */}
                <div>
                  <div className="prose prose-stone max-w-none">
                    <p className="text-stone-700 leading-relaxed">
                      <strong>Tanpınar Sözlüğü</strong>, Türk edebiyatının önemli isimlerinden biri olan <strong>Ahmet Hamdi Tanpınar</strong>'ın eserlerinde geçen özel kelimelerin interaktif bir sözlüğüdür.
                    </p>
                    <p className="text-stone-700 leading-relaxed mt-4">
                      Bu sözlük, Tanpınar'ın romanlarında, hikayelerinde ve denemelerinde kullandığı kelimeleri derleyerek, okurların bu kelimelerin anlamlarını, hangi eserlerde geçtiğini ve birbirleriyle olan ilişkilerini keşfetmelerine olanak tanır.
                    </p>
                    <p className="text-stone-700 leading-relaxed mt-4">
                      Her kelime için eserden alıntılar, anlamlar ve ilişkili kelimeler sunularak, Tanpınar'ın dil zenginliğini ve kelime seçimlerindeki inceliği gözler önüne seriyoruz.
                    </p>
                  </div>
                </div>

                {/* Alıntı */}
                <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
                  <p className="text-center text-stone-600 italic font-serif leading-relaxed">
                    "Hayır muhakkak ki bu eski şeyleri kendileri için sevmiyoruz. Bizi onlara doğru çeken bıraktıkları boşluğun kendisidir. Ortada izi bulunsun veya bulunmasın, içimizdeki didişmeden kayıp olduğunu sandığımız bir tarafımızı onlarda arıyoruz."
                  </p>
                  <p className="text-center text-stone-500 text-sm mt-2">
                    — Ahmet Hamdi Tanpınar
                  </p>
                </div>

                <div className="h-px bg-stone-200"></div>

                {/* Ahmet Hamdi Tanpınar Hakkında */}
                <div>
                  <h3 className="text-xl font-serif font-bold text-stone-800 mb-4 flex items-center gap-2">
                    <Feather className="w-5 h-5 text-amber-600" /> Ahmet Hamdi Tanpınar Kimdir?
                  </h3>
                  <div className="prose prose-stone max-w-none">
                    <p className="text-stone-700 leading-relaxed">
                      <strong>Ahmet Hamdi Tanpınar</strong> (23 Haziran 1901 - 24 Ocak 1962), Türk şair, romancı, deneme yazarı, edebiyat tarihçisi ve siyasetçidir.
                    </p>
                    <p className="text-stone-700 leading-relaxed mt-4">
                      İstanbul Üniversitesi'nde edebiyat profesörü olarak görev yapan Tanpınar, Türk edebiyatının en önemli isimlerinden biridir. Eserlerinde zaman, mekan, ruh hali ve kültürel değişim temalarını işlemiştir.
                    </p>
                    <p className="text-stone-700 leading-relaxed mt-4">
                      <strong>Başlıca Eserleri:</strong>
                    </p>
                    <ul className="list-disc list-inside text-stone-700 space-y-2 mt-2 ml-4">
                      <li><strong>Romanlar:</strong> Huzur, Saatleri Ayarlama Enstitüsü, Mahur Beste, Sahnenin Dışındakiler</li>
                      <li><strong>Şiir:</strong> Şiirler</li>
                      <li><strong>Deneme:</strong> Beş Şehir, Yaşadığım Gibi</li>
                      <li><strong>Edebiyat Tarihi:</strong> XIX. Asır Türk Edebiyatı Tarihi</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-stone-800 font-sans selection:bg-amber-200 flex flex-col">
      {/* Header Section - Daha kompakt */}
      <header className="bg-gradient-to-b from-[#1a1612] to-[#2c241b] text-stone-100 pt-6 pb-10 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
           <div className="w-72 h-72 bg-amber-400 rounded-full blur-3xl absolute -top-20 -left-20"></div>
           <div className="w-72 h-72 bg-stone-400 rounded-full blur-3xl absolute bottom-0 right-0"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2 tracking-wide text-amber-50">
            Tanpınar Sözlüğü
          </h1>
          <p className="text-stone-400 max-w-xl mx-auto text-base italic font-serif">
            "Ne içindeyim zamanın, ne de büsbütün dışında..."
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pt-6 flex-grow relative z-20">
        {renderContent()}
      </main>

      {/* DETAY MODAL */}
      {selectedWord && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setSelectedWord(null)}>
          <div className="bg-[#fffdf9] w-full max-w-lg rounded-2xl shadow-2xl relative border border-stone-200 my-8 flex flex-col" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header Actions */}
            <div className="flex justify-between items-center p-4 border-b border-stone-100">
               <div className="flex gap-2">
                 <button 
                    onClick={() => setShowNetworkView(!showNetworkView)}
                    className={`p-2 rounded-full transition-colors flex items-center gap-1 text-sm font-bold ${showNetworkView ? 'bg-amber-100 text-amber-700' : 'hover:bg-stone-100 text-stone-500'}`}
                 >
                    <Network className="w-4 h-4" />
                    {showNetworkView ? "Detay" : "İlişkiler"}
                 </button>
               </div>
               <div className="flex gap-2">
                 <button 
                    onClick={(e) => toggleFavorite(e, selectedWord.id)}
                    className="p-2 rounded-full hover:bg-stone-100 transition-colors"
                 >
                    <Heart 
                      className={`w-5 h-5 transition-all ${favorites.includes(selectedWord.id) ? 'text-amber-600 fill-amber-600' : 'text-stone-400'}`} 
                    />
                 </button>
                 <button 
                    onClick={() => setSelectedWord(null)}
                    className="p-2 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors"
                 >
                    <X className="w-5 h-5 text-stone-600" />
                 </button>
               </div>
            </div>

            {/* İçerik Değişimi: Detay vs İlişki Ağı */}
            <div className="p-8 overflow-y-auto max-h-[70vh]">
              {!showNetworkView ? (
                <>
                  <div className="text-center mb-8">
                     <h2 className={`${titleSizeClass[fontSize === 'small' ? 'medium' : 'large']} font-serif font-bold text-amber-800 mb-2`}>{selectedWord.word}</h2>
                     <div className="h-1 w-24 bg-amber-200 mx-auto rounded-full"></div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-widest mb-1">Anlamı</h3>
                      <p className={`${textSizeClass[fontSize === 'small' ? 'medium' : 'large']} text-stone-800 font-medium`}>{selectedWord.meaning}</p>
                    </div>

                    <div className="bg-stone-100 p-6 rounded-xl border-l-4 border-amber-600">
                      <h3 className="text-xs font-bold text-amber-700 uppercase mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" /> 
                        {selectedWord.book}
                      </h3>
                      <p className={`font-serif text-stone-700 italic leading-relaxed ${textSizeClass[fontSize]}`}>
                        "{selectedWord.quote}"
                      </p>
                    </div>

                    {/* Not Alma */}
                    <div className="border-t border-stone-200 pt-6 mt-6">
                      <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Kişisel Notlarınız
                      </h3>
                      <div className="relative">
                        <div className="relative">
                          <textarea 
                            className="w-full bg-white border border-stone-200 rounded-lg p-4 text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-sans text-sm min-h-[100px] resize-y"
                            placeholder="Bu kelime ile ilgili aklınıza gelen notları buraya yazabilirsiniz..."
                            value={currentNote}
                            onChange={(e) => setCurrentNote(e.target.value)}
                          />
                          {isNoteSaved && (
                            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium animate-fade-in">
                              <Save className="w-3 h-3" />
                              Kaydedildi
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* İlişki Ağı Görünümü */
                <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                   <div className="relative w-full h-[300px] flex items-center justify-center">
                      {/* Merkez Düğüm */}
                      <div className="z-10 bg-amber-800 text-white w-24 h-24 rounded-full flex items-center justify-center shadow-xl border-4 border-amber-100">
                         <span className="font-serif font-bold text-center px-2">{selectedWord.word}</span>
                      </div>
                      
                      {/* Bağlantılar ve Yan Düğümler */}
                      {getRelatedWords(selectedWord, words).map((rel, index, arr) => {
                         const angle = (index / arr.length) * 2 * Math.PI;
                         const radius = 120; // Yarıçap
                         const x = Math.cos(angle) * radius;
                         const y = Math.sin(angle) * radius;
                         
                         return (
                            <React.Fragment key={rel.id}>
                               {/* Çizgi */}
                               <div 
                                  className="absolute bg-stone-300 h-0.5 origin-left"
                                  style={{
                                     width: '120px',
                                     transform: `rotate(${angle * (180/Math.PI)}deg)`,
                                     left: '50%',
                                     top: '50%',
                                     zIndex: 0
                                  }}
                               ></div>
                               {/* Yan Düğüm */}
                               <button
                                  onClick={() => setSelectedWord(rel)}
                                  className="absolute w-20 h-20 bg-white border-2 border-stone-300 text-stone-700 rounded-full flex items-center justify-center shadow-md hover:scale-110 hover:border-amber-500 hover:text-amber-700 transition-all z-10 text-sm font-bold font-serif"
                                  style={{
                                     transform: `translate(${x}px, ${y}px)`
                                  }}
                               >
                                  {rel.word}
                               </button>
                            </React.Fragment>
                         );
                      })}
                      
                      {getRelatedWords(selectedWord, words).length === 0 && (
                         <p className="absolute mt-32 text-stone-400 text-sm italic">Bu kelime için tanımlı ilişki bulunamadı.</p>
                      )}
                   </div>
                   <p className="text-stone-500 text-sm mt-8 text-center px-8">
                      İlişkili kelimelere tıklayarak sözlükte gezinebilirsiniz.
                   </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Dock - Sabit Alt Çubuk */}
      {!selectedWord && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <div className="bg-[#2c241b]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-amber-900/30 px-2 py-2 flex items-center gap-1">
            {[
              { id: 'dictionary', label: 'Sözlük', icon: BookOpen },
              { id: 'discover', label: 'Keşfet', icon: Compass },
              { id: 'stats', label: 'İstatistik', icon: BarChart2 },
              { id: 'about', label: 'Hakkında', icon: Info },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-white shadow-lg scale-105'
                    : 'text-stone-300 hover:bg-amber-900/40 hover:text-amber-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-stone-200 py-6 mt-12 pb-24">
        <div className="container mx-auto px-4 text-center">
          <p className="text-stone-500 text-sm flex items-center justify-center gap-2">
            <Info className="w-4 h-4" />
            Ahmet Hamdi Tanpınar'ın aziz hatırasına saygıyla.
          </p>
        </div>
      </footer>

      {/* Vercel Web Analytics */}
      <Analytics />
    </div>
  );
};

export default App;
