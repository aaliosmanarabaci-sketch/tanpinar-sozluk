# Tanpınar Sözlüğü

Ahmet Hamdi Tanpınar'ın eserlerinden derlenmiş kelimelerin interaktif sözlüğü.

## Özellikler

- 📚 Tanpınar'ın eserlerinden kelimeler (155+ kelime)
- 🔍 Gelişmiş arama fonksiyonu
- ❤️ Favorilere ekleme (LocalStorage)
- 📝 Kişisel notlar (Otomatik kaydetme)
- 🔗 Kelime ilişkileri ağı
- 📊 İstatistikler ve analizler
- 📅 Günün kelimesi (Her gün alfabetik sırayla)
- 🎨 Modern ve şık tasarım

## Kurulum

```bash
npm install
```

## Environment Variables

`.env` dosyası oluşturun:

```bash
cp .env.example .env
```

Gerekli değişkenler:
- `VITE_DATABASE_URL`: Neon Database bağlantı string'i

## Çalıştırma

### Development
```bash
npm run dev
```

Tarayıcıda `http://localhost:5173` adresini açın.

### Production Build
```bash
npm run build
npm run preview
```

## Deployment (Vercel + GitHub)

### Hızlı Başlangıç

1. **GitHub Repository Oluşturun**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/KULLANICI_ADI/tanpinar-sozlugu.git
   git push -u origin main
   ```

2. **Vercel'e Bağlayın**
   - [Vercel](https://vercel.com) hesabı oluşturun
   - GitHub ile giriş yapın
   - "Add New Project" → Repository'nizi seçin
   - "Import" tıklayın

3. **Environment Variables Ekleyin**
   - Vercel Dashboard → Settings → Environment Variables
   - `VITE_DATABASE_URL` ekleyin (Neon Database connection string)

4. **Deploy!**
   - Vercel otomatik olarak build edip deploy edecek
   - Her GitHub push'unda otomatik deploy olur

### Detaylı Rehber

Detaylı deployment adımları için [`DEPLOYMENT.md`](./DEPLOYMENT.md) dosyasına bakın.

### Özellikler

- ✅ Otomatik deployment (her push'da)
- ✅ Preview deployments (PR'lar için)
- ✅ CDN ve global edge network
- ✅ HTTPS otomatik
- ✅ Custom domain desteği

## Teknolojiler

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Neon Database** - PostgreSQL database
- **React Router** - Routing

## Lisans

Bu proje eğitim amaçlıdır.
