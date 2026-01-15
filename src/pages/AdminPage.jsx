import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Edit2, Trash2, Save, Lock, LogOut, Loader2 } from 'lucide-react';
import { getAllWords, addWord, updateWord, deleteWord, getAllBooks, getAllCategories } from '../services/database.js';

const AdminPage = () => {
  const navigate = useNavigate();
  
  // Authentication state'ini LocalStorage'dan yükle
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('admin-authenticated') === 'true';
    } catch {
      return false;
    }
  });
  
  const [password, setPassword] = useState('');
  const [words, setWords] = useState([]);
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingWord, setEditingWord] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    word: '',
    meaning: '',
    book: '',
    quote: '',
    relations: '',
    category: ''
  });

  // Şifre kontrolü - Environment variable'dan al veya varsayılan kullan
  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'tanpinar2024';

  // Authentication state değiştiğinde LocalStorage'a kaydet
  useEffect(() => {
    try {
      if (isAuthenticated) {
        localStorage.setItem('admin-authenticated', 'true');
      } else {
        localStorage.removeItem('admin-authenticated');
      }
    } catch (err) {
      console.error('LocalStorage hatası:', err);
    }
  }, [isAuthenticated]);

  // Sayfa yüklendiğinde eğer authenticated ise kelimeleri yükle
  useEffect(() => {
    if (isAuthenticated) {
      loadWords();
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      loadWords();
    } else {
      alert('Şifre yanlış!');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    try {
      localStorage.removeItem('admin-authenticated');
    } catch (err) {
      console.error('LocalStorage temizleme hatası:', err);
    }
    navigate('/');
  };

  // Kelimeleri yükle
  const loadWords = async () => {
    try {
      setLoading(true);
      const data = await getAllWords();
      setWords(data || []);
      
      // Kitapları ve kategorileri de yükle
      try {
        const booksData = await getAllBooks();
        setBooks(booksData || []);
      } catch (err) {
        console.error('Kitaplar yüklenemedi:', err);
        // Mevcut kelimelerden kitapları çıkar
        const uniqueBooks = [...new Set((data || []).map(w => w.book).filter(Boolean))];
        setBooks(uniqueBooks.sort());
      }
      
      try {
        const categoriesData = await getAllCategories();
        setCategories(categoriesData || []);
      } catch (err) {
        console.error('Kategoriler yüklenemedi:', err);
        // Mevcut kelimelerden kategorileri çıkar
        const uniqueCategories = [...new Set((data || []).map(w => w.category).filter(Boolean))];
        setCategories(uniqueCategories.sort());
      }
    } catch (error) {
      console.error('Kelimeler yüklenemedi:', error);
      alert('Kelimeler yüklenemedi. Veritabanı bağlantısını kontrol edin.');
      setWords([]);
    } finally {
      setLoading(false);
    }
  };

  // Yeni kelime ekle
  const handleAddWord = async () => {
    if (!formData.word || !formData.meaning || !formData.book || !formData.quote) {
      alert('Lütfen tüm zorunlu alanları doldurun (Kelime, Anlam, Kitap, Alıntı)');
      return;
    }

    try {
      setSaving(true);
      const relations = formData.relations 
        ? formData.relations.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
        : [];

      await addWord({
        word: formData.word,
        meaning: formData.meaning,
        source: formData.book, // Neon'da 'source' olarak kaydediliyor
        example: formData.quote, // Neon'da 'example' olarak kaydediliyor
        category: formData.category || null,
        relations: relations
      });

      // Başarılı - kelimeleri yeniden yükle
      await loadWords();
      setFormData({ word: '', meaning: '', book: '', quote: '', relations: '', category: '' });
      setShowAddForm(false);
      alert('Kelime başarıyla eklendi!');
    } catch (error) {
      console.error('Kelime eklenemedi:', error);
      alert('Kelime eklenemedi: ' + (error.message || 'Bilinmeyen hata'));
      // Hata durumunda saving state'ini resetle
      setSaving(false);
    } finally {
      setSaving(false);
    }
  };

  // Kelime düzenle
  const handleEditWord = (word) => {
    // Eğer zaten bir işlem yapılıyorsa, edit yapmaya izin verme
    if (saving) {
      return;
    }
    
    // Eğer aynı kelime zaten düzenleniyorsa, düzenlemeyi iptal et
    if (editingWord?.id === word.id) {
      handleCancel();
      return;
    }
    
    try {
      setEditingWord(word);
      setFormData({
        word: word.word || '',
        meaning: word.meaning || '',
        book: word.book || '',
        quote: word.quote || '',
        relations: word.relations && Array.isArray(word.relations) ? word.relations.join(', ') : '',
        category: word.category || ''
      });
      setShowAddForm(false); // Yeni kelime formunu kapat
    } catch (error) {
      console.error('Edit hatası:', error);
      alert('Kelime düzenlenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Kelime güncelle
  const handleUpdateWord = async () => {
    if (!formData.word || !formData.meaning || !formData.book || !formData.quote) {
      alert('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    if (!editingWord || !editingWord.id) {
      alert('Düzenlenecek kelime bulunamadı. Lütfen tekrar deneyin.');
      return;
    }

    try {
      setSaving(true);
      const relations = formData.relations 
        ? formData.relations.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
        : [];

      await updateWord(editingWord.id, {
        word: formData.word,
        meaning: formData.meaning,
        source: formData.book,
        example: formData.quote,
        category: formData.category || null,
        relations: relations
      });

      // Kelimeleri yeniden yükle
      await loadWords();
      
      // Formu kapat
      setEditingWord(null);
      setFormData({ word: '', meaning: '', book: '', quote: '', relations: '', category: '' });
    } catch (error) {
      console.error('Kelime güncellenemedi:', error);
      alert('Kelime güncellenemedi: ' + (error.message || 'Bilinmeyen hata'));
      // Hata durumunda saving state'ini resetle
      setSaving(false);
    } finally {
      setSaving(false);
    }
  };

  // Kelime sil
  const handleDeleteWord = async (id) => {
    if (!confirm('Bu kelimeyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    if (!id) {
      alert('Silinecek kelime bulunamadı.');
      return;
    }

    try {
      setSaving(true);
      await deleteWord(id);
      await loadWords();
      alert('Kelime silindi!');
    } catch (error) {
      console.error('Kelime silinemedi:', error);
      alert('Kelime silinemedi: ' + (error.message || 'Bilinmeyen hata'));
      // Hata durumunda saving state'ini resetle
      setSaving(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Eğer bir işlem yapılıyorsa iptal etme
    if (saving) {
      return;
    }
    
    setEditingWord(null);
    setShowAddForm(false);
    setFormData({ word: '', meaning: '', book: '', quote: '', relations: '', category: '' });
    setSaving(false); // Güvenlik için saving state'ini de resetle
  };

  // Şifre ekranı
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Lock className="w-12 h-12 text-amber-600 mx-auto mb-4" />
            <h1 className="text-2xl font-serif font-bold text-stone-800">Admin Girişi</h1>
            <p className="text-stone-500 text-sm mt-2">Tanpınar Sözlüğü Yönetim Paneli</p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Şifrenizi girin"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 transition-colors font-medium"
            >
              Giriş Yap
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Admin paneli
  return (
    <div className="min-h-screen bg-[#f7f5f0] p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-serif font-bold">Admin Paneli</h2>
                <p className="text-sm opacity-90">Kelime Yönetimi</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Çıkış
            </button>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-amber-200">
            <p className="text-sm text-amber-700 font-medium mb-1">Toplam Kelime</p>
            <p className="text-3xl font-bold text-amber-800">{words.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-stone-200">
            <p className="text-sm text-stone-700 font-medium mb-1">Kitaplar</p>
            <p className="text-3xl font-bold text-stone-800">
              {new Set(words.map(w => w.book)).size}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-200">
            <p className="text-sm text-blue-700 font-medium mb-1">Kategoriler</p>
            <p className="text-3xl font-bold text-blue-800">
              {new Set(words.filter(w => w.category).map(w => w.category)).size}
            </p>
          </div>
        </div>

        {/* Yeni Kelime Ekleme Formu */}
        {showAddForm && !editingWord && (
          <div className="bg-white p-6 rounded-xl shadow-lg border border-stone-200 mb-6">
            <h3 className="text-lg font-bold text-stone-800 mb-4">
              Yeni Kelime Ekle
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Kelime *
                  </label>
                  <input
                    type="text"
                    value={formData.word}
                    onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                    className="w-full p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Kelime"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Kitap *
                  </label>
                  <select
                    value={formData.book}
                    onChange={(e) => setFormData({ ...formData, book: e.target.value })}
                    className="w-full p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  >
                    <option value="">Kitap seçin...</option>
                    {books.map((book) => (
                      <option key={book} value={book}>
                        {book}
                      </option>
                    ))}
                  </select>
                  {books.length === 0 && (
                    <p className="text-xs text-stone-500 mt-1">Henüz kitap yok. İlk kelimeyi eklerken manuel girebilirsiniz.</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Anlam *
                </label>
                <input
                  type="text"
                  value={formData.meaning}
                  onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                  className="w-full p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Kelimenin anlamı"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Alıntı *
                </label>
                <textarea
                  value={formData.quote}
                  onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                  className="w-full p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 min-h-[100px]"
                  placeholder="Kitaptan alıntı"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    İlişkili Kelimeler (ID'ler, virgülle ayırın)
                  </label>
                  <input
                    type="text"
                    value={formData.relations}
                    onChange={(e) => setFormData({ ...formData, relations: e.target.value })}
                    className="w-full p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Örn: 1, 2, 3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Kategori (Opsiyonel)
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  >
                    <option value="">Kategori seçin (opsiyonel)...</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {categories.length === 0 && (
                    <p className="text-xs text-stone-500 mt-1">Henüz kategori yok. İlk kelimeyi eklerken manuel girebilirsiniz.</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={editingWord ? handleUpdateWord : handleAddWord}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingWord ? 'Güncelle' : 'Ekle'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-4 py-2 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 transition-colors font-medium disabled:opacity-50"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Kelime Listesi */}
        <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-stone-800">Kelimeler ({words.length})</h3>
            {!showAddForm && !editingWord && (
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setEditingWord(null);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Yeni Kelime Ekle
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {words.map((word) => (
                <div
                  key={word.id}
                  className="bg-stone-50 border border-stone-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                          ID: {word.id}
                        </span>
                        <h4 className="text-lg font-serif font-bold text-stone-800">{word.word}</h4>
                      </div>
                      <p className="text-stone-600 text-sm mb-1">{word.meaning}</p>
                      <p className="text-xs text-stone-500 italic mb-2">"{word.quote}"</p>
                      <div className="flex items-center gap-4 text-xs text-stone-400">
                        <span>{word.book}</span>
                        {word.category && (
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                            #{word.category}
                          </span>
                        )}
                        {word.relations && word.relations.length > 0 && (
                          <span>İlişkiler: {word.relations.join(', ')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEditWord(word)}
                        disabled={saving || (showAddForm && !editingWord) || (editingWord && editingWord.id !== word.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={editingWord && editingWord.id !== word.id ? "Önce mevcut düzenlemeyi bitirin" : editingWord?.id === word.id ? "Düzenlemeyi iptal et" : "Düzenle"}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteWord(word.id)}
                        disabled={saving || showAddForm || editingWord}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={editingWord ? "Önce mevcut düzenlemeyi bitirin" : "Sil"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Inline Edit Formu - Sadece bu kelime düzenleniyorsa göster */}
                  {editingWord?.id === word.id && (
                    <div className="mt-4 pt-4 border-t border-stone-300">
                      <h4 className="text-md font-bold text-stone-800 mb-4">Kelime Düzenle</h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                              Kelime *
                            </label>
                            <input
                              type="text"
                              value={formData.word}
                              onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                              className="w-full p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                              placeholder="Kelime"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                              Kitap *
                            </label>
                            <select
                              value={formData.book}
                              onChange={(e) => setFormData({ ...formData, book: e.target.value })}
                              className="w-full p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                            >
                              <option value="">Kitap seçin...</option>
                              {books.map((book) => (
                                <option key={book} value={book}>
                                  {book}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-1">
                            Anlam *
                          </label>
                          <input
                            type="text"
                            value={formData.meaning}
                            onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                            className="w-full p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            placeholder="Kelimenin anlamı"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-1">
                            Alıntı *
                          </label>
                          <textarea
                            value={formData.quote}
                            onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                            className="w-full p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 min-h-[100px]"
                            placeholder="Kitaptan alıntı"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                              İlişkili Kelimeler (ID'ler, virgülle ayırın)
                            </label>
                            <input
                              type="text"
                              value={formData.relations}
                              onChange={(e) => setFormData({ ...formData, relations: e.target.value })}
                              className="w-full p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                              placeholder="Örn: 1, 2, 3"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                              Kategori (Opsiyonel)
                            </label>
                            <select
                              value={formData.category}
                              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                              className="w-full p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                            >
                              <option value="">Kategori seçin (opsiyonel)...</option>
                              {categories.map((category) => (
                                <option key={category} value={category}>
                                  {category}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleUpdateWord}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium disabled:opacity-50"
                          >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Güncelle
                          </button>
                          <button
                            onClick={handleCancel}
                            disabled={saving}
                            className="px-4 py-2 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 transition-colors font-medium disabled:opacity-50"
                          >
                            İptal
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
