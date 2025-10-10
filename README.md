# 🥗 DiyetApp - Akıllı Diyet Asistanı

<div align="center">


**Sağlıklı yaşam için geliştirilmiş kapsamlı diyet ve beslenme uygulaması**

[![React Native](https://img.shields.io/badge/React%20Native-0.79.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-53.0.17-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.50.5-green.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## 📱 Uygulama Özellikleri

### 🏠 Ana Sayfa
- **Kişiselleştirilmiş Karşılama**: Kullanıcı adına özel hoş geldin mesajları
- **Motivasyonel İçerik**: Günlük değişen motivasyon mesajları
- **Hızlı Erişim**: Tüm özelliklere kolay erişim
- **Görsel Slider**: Diyetisyenlik ile ilgili görseller

### 🧮 BMI Hesaplayıcı
- **Vücut Kitle İndeksi Hesaplama**: Boy, kilo ve yaş bazlı hesaplama
- **Görsel Sonuçlar**: Renkli kategoriler ve açıklamalar
- **Kişiselleştirilmiş Öneriler**: BMI sonucuna göre sağlık tavsiyeleri
- **Slider Kontrolleri**: Kolay kullanım için kaydırıcılar

### 📸 AI Destekli Kalori Analizi
- **Fotoğraf Analizi**: Yemek fotoğraflarından kalori tahmini
- **Gemini AI Entegrasyonu**: Google'ın gelişmiş AI modeli
- **Kamera ve Galeri Desteği**: Fotoğraf çekme ve seçme
- **Otomatik Kaydetme**: Analiz edilen yemekleri veritabanına kaydetme

### 🤖 Diyet Asistanı (Chatbot)
- **AI Destekli Sohbet**: Beslenme konularında uzman tavsiyeler
- **Markdown Desteği**: Zengin metin formatlaması
- **Gerçek Zamanlı Yanıtlar**: Anında beslenme önerileri
- **Kişiselleştirilmiş Deneyim**: Kullanıcı geçmişine dayalı öneriler

### 📅 Diyet Takvimi
- **Günlük Planlama**: Kahvaltı, öğle, akşam yemeği planları
- **Ara Öğün Takibi**: Snack zamanları
- **Görsel Takvim**: Planlanan günlerin işaretlenmesi
- **Düzenleme ve Silme**: Mevcut planları güncelleme

### 👤 Profil Yönetimi
- **Kullanıcı Bilgileri**: Kişisel bilgileri düzenleme
- **Hedef Belirleme**: Kilo hedefleri ve tercihler
- **İstatistikler**: İlerleme takibi
- **Güvenli Çıkış**: Oturum yönetimi

---

## 🛠️ Teknolojiler

### Frontend
- **React Native 0.79.5**: Cross-platform mobil uygulama geliştirme
- **Expo 53.0.17**: Geliştirme platformu ve araçları
- **TypeScript 5.8.3**: Tip güvenliği ve geliştirici deneyimi
- **React Navigation 7.x**: Navigasyon yönetimi

### Backend & Veritabanı
- **Supabase 2.50.5**: Backend-as-a-Service platformu
- **PostgreSQL**: Güçlü veritabanı sistemi
- **Real-time Subscriptions**: Gerçek zamanlı veri güncellemeleri

### AI & Makine Öğrenmesi
- **Google Gemini AI**: Gelişmiş yapay zeka modeli
- **Gemini Vision API**: Görsel analiz ve kalori tahmini
- **Gemini 2.5 Pro**: Gelişmiş sohbet asistanı

### UI/UX Kütüphaneleri
- **Expo Vector Icons**: İkon kütüphanesi
- **React Native Calendars**: Takvim bileşenleri
- **Expo Linear Gradient**: Gradient efektleri
- **React Native Markdown**: Zengin metin görüntüleme

---

## 🚀 Kurulum

### Gereksinimler
- Node.js (v18 veya üzeri)
- npm veya yarn
- Expo CLI
- iOS Simulator (macOS) veya Android Emulator

### Adım Adım Kurulum

1. **Projeyi klonlayın**
   ```bash
   git clone https://github.com/kerimincee/Mobil-Diyetisyen-Uygulamasi
   cd DiyetApp
   ```

2. **Bağımlılıkları yükleyin**
   ```bash
   npm install
   ```

3. **Environment değişkenlerini ayarlayın**
   ```bash
   # .env dosyası oluşturun
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Uygulamayı başlatın**
   ```bash
   npx expo start
   ```

5. **Platform seçenekleri**
   - **iOS Simulator**: `i` tuşuna basın
   - **Android Emulator**: `a` tuşuna basın
   - **Web**: `w` tuşuna basın
   - **Expo Go**: QR kodu tarayın

---

## 📊 Veritabanı Şeması

### Users Tablosu
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eposta TEXT UNIQUE NOT NULL,
  isim TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Diet Plans Tablosu
```sql
CREATE TABLE diet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  breakfast TEXT,
  snack1 TEXT,
  lunch TEXT,
  snack2 TEXT,
  dinner TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Meals Tablosu
```sql
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  meal_name TEXT NOT NULL,
  calories INTEGER,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔧 Geliştirme

### Proje Yapısı
```
DiyetApp/
├── app/                    # Ana uygulama dosyaları
│   ├── (tabs)/            # Tab navigasyonu
│   │   ├── index.tsx      # Ana sayfa
│   │   ├── BMI.tsx        # BMI hesaplayıcı
│   │   ├── Kalori.tsx     # Kalori analizi
│   │   ├── Chatbot.tsx    # AI asistan
│   │   └── Takvim.tsx     # Diyet takvimi
│   ├── index.tsx          # Kullanıcı giriş ekranı (Ana giriş)
│   ├── Profile.tsx        # Profil sayfası
│   ├── DieticianLogin.js  # Diyetisyen giriş ekranı
│   └── Register.tsx       # Kayıt ekranı
├── components/            # Yeniden kullanılabilir bileşenler
├── services/             # API servisleri
├── contexts/             # React Context'leri
├── hooks/                # Custom React hooks
├── constants/            # Sabitler
└── assets/               # Görseller ve kaynaklar
```

### Kullanılabilir Scriptler
```bash
npm start          # Expo development server'ı başlat
npm run android    # Android emulator'da çalıştır
npm run ios        # iOS simulator'da çalıştır
npm run web        # Web tarayıcısında çalıştır
npm run lint       # ESLint ile kod kontrolü
```

---

## 🎨 Tasarım Sistemi

### Renk Paleti
- **Primary**: `#4B6C4B` (Yeşil)
- **Secondary**: `#6b8e5e` (Açık Yeşil)
- **Background**: `#ffffff` (Beyaz)
- **Text**: `#333333` (Koyu Gri)
- **Accent**: `#ff6b6b` (Kırmızı)

### Tipografi
- **Font Family**: Poppins
- **Weights**: 400 (Regular), 600 (SemiBold), 700 (Bold)

### Bileşenler
- Modern ve minimal tasarım
- Yuvarlatılmış köşeler
- Gölge efektleri
- Gradient arka planlar

---

## 🔒 Güvenlik

- **Supabase Auth**: Güvenli kullanıcı kimlik doğrulama
- **Row Level Security (RLS)**: Veritabanı güvenliği
- **API Key Management**: Güvenli API anahtarı yönetimi
- **Input Validation**: Kullanıcı girdisi doğrulama

---

## 📱 Platform Desteği

- ✅ **iOS**: iPhone ve iPad
- ✅ **Android**: Tüm Android cihazlar
- ✅ **Web**: Modern web tarayıcıları

---

## 🤝 Katkıda Bulunma

1. Bu repository'yi fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'inizi push edin (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

### Geliştirme Kuralları
- TypeScript kullanın
- ESLint kurallarına uyun
- Test yazın
- Dokümantasyon güncelleyin

---

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

## 📞 İletişim

- **Geliştirici**: [Kerim Ince]
- **Email**: [incekerim49@gmail.com]
- **LinkedIn**: [https://www.linkedin.com/in/kerim-ince/]
- **GitHub**: [https://github.com/kerimincee]

---

## 🙏 Teşekkürler

- [Expo](https://expo.dev/) - Harika geliştirme platformu
- [Supabase](https://supabase.com/) - Güçlü backend çözümü
- [Google Gemini](https://ai.google.dev/) - Gelişmiş AI teknolojisi
- [React Native](https://reactnative.dev/) - Cross-platform geliştirme

---

<div align="center">

**⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!**

</div>
