import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const DATABASE_URL = process.env.VITE_DATABASE_URL || 'postgresql://neondb_owner:npg_nwv6rZhCic4y@ep-soft-surf-ag0s5h38-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const sql = neon(DATABASE_URL);

// getDailyWord fonksiyonunu simüle et
async function getDailyWord(words) {
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
  const index = dayOfYear % sortedWords.length;
  return { word: sortedWords[index], index, dayOfYear, totalWords: sortedWords.length };
}

async function test() {
  try {
    // Tüm kelimeleri getir
    const words = await sql`SELECT word FROM words`;
    const wordObjects = words.map(w => ({ word: w.word }));
    
    const result = await getDailyWord(wordObjects);
    
    console.log('📅 Bugün:', new Date().toLocaleDateString('tr-TR'));
    console.log('🔢 Yılın günü:', result.dayOfYear);
    console.log('📊 Toplam kelime:', result.totalWords);
    console.log('📊 Index:', result.index);
    console.log('');
    console.log('✅ Bugün gösterilen kelime:', result.word);
    console.log('');
    
    // Yarınki kelimeyi hesapla
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startTomorrow = new Date(tomorrow.getFullYear(), 0, 0);
    const diffTomorrow = tomorrow - startTomorrow;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYearTomorrow = Math.floor(diffTomorrow / oneDay);
    
    const sortedWords = [...wordObjects].sort((a, b) => {
      return a.word.localeCompare(b.word, 'tr-TR', { sensitivity: 'base' });
    });
    
    const tomorrowIndex = dayOfYearTomorrow % sortedWords.length;
    const tomorrowWord = sortedWords[tomorrowIndex];
    
    console.log('📅 Yarın:', tomorrow.toLocaleDateString('tr-TR'));
    console.log('🔢 Yarının gün numarası:', dayOfYearTomorrow);
    console.log('📊 Yarının index:', tomorrowIndex);
    console.log('✅ Yarın gösterilecek kelime:', tomorrowWord.word);
    console.log('');
    
    // "Daüssıla"nın konumunu bul
    const daüssılaIndex = sortedWords.findIndex(w => w.word === 'Daüssıla');
    if (daüssılaIndex !== -1) {
      console.log(`📌 "Daüssıla" alfabetik sırada ${daüssılaIndex + 1}. kelime`);
      console.log(`📌 "Daüssıla"nın index'i: ${daüssılaIndex}`);
      console.log('');
      
      if (result.index === daüssılaIndex) {
        console.log('✅ Doğru! Bugün "Daüssıla" gösteriliyor.');
        console.log(`✅ Yarın "${tomorrowWord.word}" gösterilecek.`);
      } else {
        console.log(`⚠️  Uyumsuzluk: Bugün "${result.word}" gösteriliyor ama "Daüssıla" görülüyor.`);
        console.log(`   Bu, tarih hesaplamasında veya kelime sıralamasında bir fark olabilir.`);
      }
    }
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  }
}

test();
