# Deployment Rehberi - Vercel + GitHub

Bu rehber, Tanpınar Sözlüğü projesini Vercel ve GitHub kullanarak deploy etmek için adım adım talimatlar içerir.

## Ön Hazırlık

### 1. GitHub Repository Oluşturma

1. [GitHub](https://github.com) hesabınıza giriş yapın
2. Yeni bir repository oluşturun:
   - Repository adı: `tanpinar-sozlugu` (veya istediğiniz isim)
   - Public veya Private (tercihinize göre)
   - README, .gitignore, license eklemeyin (zaten var)

### 2. Local Repository'yi GitHub'a Push Etme

```bash
# Git başlat (eğer yapılmadıysa)
git init

# Tüm dosyaları ekle
git add .

# İlk commit
git commit -m "Initial commit: Tanpınar Sözlüğü"

# GitHub repository'nizi remote olarak ekleyin
git remote add origin https://github.com/KULLANICI_ADI/tanpinar-sozlugu.git

# Main branch'e push edin
git branch -M main
git push -u origin main
```

## Vercel Deployment

### 1. Vercel Hesabı Oluşturma

1. [Vercel](https://vercel.com) hesabı oluşturun
2. GitHub hesabınızla giriş yapın (önerilir)

### 2. Projeyi Vercel'e Bağlama

1. Vercel dashboard'a gidin
2. "Add New..." → "Project" tıklayın
3. GitHub repository'nizi seçin
4. "Import" tıklayın

### 3. Build Ayarları

Vercel otomatik olarak şunları algılayacak:
- **Framework Preset**: Vite
- **Build Command**: `npm run build` (otomatik)
- **Output Directory**: `dist` (otomatik)
- **Install Command**: `npm install` (otomatik)

**Not**: `vercel.json` dosyası zaten mevcut, otomatik kullanılacak.

### 4. Environment Variables Ekleme

Vercel'de proje ayarlarına gidin:

1. **Settings** → **Environment Variables**
2. Şu değişkenleri ekleyin:

#### Production Environment Variables

```
VITE_DATABASE_URL = postgresql://neondb_owner:npg_nwv6rZhCic4y@ep-soft-surf-ag0s5h38-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Önemli**: 
- Database URL'ini production Neon Database URL'i ile değiştirin
- Şifre ve connection string'i güvenli tutun

#### Preview/Development (Opsiyonel)

Aynı değişkenleri Preview ve Development için de ekleyebilirsiniz.

### 5. İlk Deployment

1. Environment variables ekledikten sonra
2. "Deploy" butonuna tıklayın
3. Vercel otomatik olarak build edecek ve deploy edecek
4. Deployment tamamlandığında bir URL alacaksınız: `https://tanpinar-sozlugu.vercel.app`

## Otomatik Deployment

Vercel, GitHub repository'nize her push yaptığınızda otomatik olarak:
- Yeni deployment yapacak
- Preview URL'i oluşturacak (PR'lar için)
- Production'a merge edildiğinde otomatik deploy edecek

## Custom Domain (Opsiyonel)

1. Vercel dashboard → **Settings** → **Domains**
2. Domain'inizi ekleyin
3. DNS ayarlarını yapın (Vercel size talimat verecek)

## Environment Variables Yönetimi

### Production vs Preview

- **Production**: Ana domain için kullanılır
- **Preview**: Her PR için ayrı preview URL'i oluşturur
- **Development**: Local development için (kullanılmaz)

### Güvenli Değişkenler

Sensitive bilgileri (database URL, şifreler) asla:
- ❌ Kod içine yazmayın
- ❌ GitHub'a commit etmeyin
- ✅ Sadece Vercel Environment Variables'da tutun

## Troubleshooting

### Build Hataları

1. **"Module not found"**: `npm install` çalıştırın
2. **"Environment variable missing"**: Vercel'de environment variables'ı kontrol edin
3. **"Database connection failed"**: Database URL'ini kontrol edin

### Runtime Hataları

1. **"404 on routes"**: `vercel.json` dosyasının doğru olduğundan emin olun
2. **"Database error"**: Neon Database connection string'ini kontrol edin

## Deployment Checklist

- [ ] GitHub repository oluşturuldu
- [ ] Kod GitHub'a push edildi
- [ ] Vercel hesabı oluşturuldu
- [ ] Vercel'de proje import edildi
- [ ] Environment variables eklendi (`VITE_DATABASE_URL`)
- [ ] İlk deployment başarılı
- [ ] Site test edildi
- [ ] Custom domain eklendi (opsiyonel)

## Sonraki Adımlar

1. **Analytics**: Vercel Analytics ekleyebilirsiniz
2. **Monitoring**: Vercel'de error tracking aktif
3. **Performance**: Vercel otomatik olarak CDN ve optimizasyon sağlar
4. **Backups**: Neon Database'inizde otomatik backup var

## Destek

Sorun yaşarsanız:
- Vercel dokümantasyonu: https://vercel.com/docs
- Vercel Discord: https://vercel.com/discord
