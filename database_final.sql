-- DiyetApp Final Veritabanı Şeması
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- Mevcut tabloları sil (eğer varsa)
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS meals CASCADE;
DROP TABLE IF EXISTS diet_plans CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS diyetisyenler CASCADE;

-- Users tablosu - UUID primary key, e-posta ayrı alan
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eposta TEXT UNIQUE NOT NULL,
  isim TEXT NOT NULL,
  soyisim TEXT,
  sifre TEXT NOT NULL,  -- Düz metin şifre (hashing kaldırıldı)
  boy INTEGER,
  kilo INTEGER,
  yas INTEGER,
  cinsiyet TEXT,
  telefon TEXT,
  profil_foto TEXT,
  diyetisyen_id UUID REFERENCES diyetisyenler(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Diyetisyenler tablosu
CREATE TABLE diyetisyenler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eposta TEXT UNIQUE NOT NULL,
  isim TEXT NOT NULL,
  soyisim TEXT,
  sifre TEXT NOT NULL,
  telefon TEXT,
  uzmanlik_alani TEXT,
  deneyim_yili INTEGER,
  profil_foto TEXT,
  onay_durumu BOOLEAN DEFAULT false,
  danisan_sayisi INTEGER DEFAULT 0,
  aktif_durum BOOLEAN DEFAULT true,
  lisans_no TEXT,
  mezun_oldugu_okul TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Diet Plans tablosu - user_id UUID olarak tanımlanır
CREATE TABLE diet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  breakfast TEXT,
  snack1 TEXT,
  lunch TEXT,
  snack2 TEXT,
  dinner TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Meals tablosu - user_id UUID olarak tanımlanır
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  calorie INTEGER,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Appointments tablosu - randevular için
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diyetisyen_id UUID NOT NULL REFERENCES diyetisyenler(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tarih DATE NOT NULL,
  giris_saati TIME NOT NULL,
  cikis_saati TIME NOT NULL,
  notlar TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- İndeksler oluştur
CREATE INDEX idx_diet_plans_user_date ON diet_plans(user_id, date);
CREATE INDEX idx_meals_user_id ON meals(user_id);
CREATE INDEX idx_appointments_diyetisyen_id ON appointments(diyetisyen_id);
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_tarih ON appointments(tarih);
CREATE INDEX idx_users_email ON users(eposta);
CREATE INDEX idx_users_diyetisyen_id ON users(diyetisyen_id);
CREATE INDEX idx_diyetisyenler_eposta ON diyetisyenler(eposta);

-- RLS'yi etkinleştir ama basit politikalar ekle
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE diyetisyenler ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Basit politikalar - tüm kullanıcılar tüm işlemleri yapabilir
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on diyetisyenler" ON diyetisyenler FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on diet_plans" ON diet_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on meals" ON meals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on appointments" ON appointments FOR ALL USING (true) WITH CHECK (true);

-- Diyetisyen danışan sayısını otomatik güncelleyen fonksiyon
CREATE OR REPLACE FUNCTION update_diyetisyen_danisan_sayisi()
RETURNS TRIGGER AS $$
BEGIN
  -- Eğer yeni kayıt ekleniyorsa
  IF TG_OP = 'INSERT' THEN
    UPDATE diyetisyenler 
    SET danisan_sayisi = danisan_sayisi + 1 
    WHERE id = NEW.diyetisyen_id;
    RETURN NEW;
  END IF;
  
  -- Eğer kayıt güncelleniyorsa
  IF TG_OP = 'UPDATE' THEN
    -- Eski diyetisyenin sayısını azalt
    IF OLD.diyetisyen_id IS NOT NULL THEN
      UPDATE diyetisyenler 
      SET danisan_sayisi = danisan_sayisi - 1 
      WHERE id = OLD.diyetisyen_id;
    END IF;
    
    -- Yeni diyetisyenin sayısını artır
    IF NEW.diyetisyen_id IS NOT NULL THEN
      UPDATE diyetisyenler 
      SET danisan_sayisi = danisan_sayisi + 1 
      WHERE id = NEW.diyetisyen_id;
    END IF;
    RETURN NEW;
  END IF;
  
  -- Eğer kayıt siliniyorsa
  IF TG_OP = 'DELETE' THEN
    IF OLD.diyetisyen_id IS NOT NULL THEN
      UPDATE diyetisyenler 
      SET danisan_sayisi = danisan_sayisi - 1 
      WHERE id = OLD.diyetisyen_id;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı oluştur
CREATE TRIGGER trigger_update_diyetisyen_danisan_sayisi
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_diyetisyen_danisan_sayisi();

-- Test diyetisyeni oluştur
-- Şifre: 123456 (düz metin)
INSERT INTO diyetisyenler (eposta, isim, soyisim, sifre, telefon, uzmanlik_alani, deneyim_yili, onay_durumu, lisans_no, mezun_oldugu_okul) 
VALUES (
  'diyetisyen@gmail.com', 
  'Ayşe', 
  'Yılmaz', 
  '123456', 
  '0555 987 65 43',
  'Kilo Verme ve Beslenme',
  5,
  true,
  'DYT-2024-001',
  'Hacettepe Üniversitesi Beslenme ve Diyetetik Bölümü'
);

-- Test kullanıcısı oluştur
-- Şifre: 123456 (düz metin)
INSERT INTO users (eposta, isim, soyisim, sifre, boy, kilo, yas, cinsiyet, telefon, diyetisyen_id) 
VALUES (
  'kerim@gmail.com', 
  'Kerim', 
  'Test', 
  '123456', 
  170, 
  70, 
  25, 
  'erkek', 
  '0555 123 45 67',
  (SELECT id FROM diyetisyenler WHERE eposta = 'diyetisyen@gmail.com')
);

-- Kullanıcıları kontrol et
SELECT * FROM users;
SELECT * FROM diyetisyenler;

-- Diyetisyen-danışan ilişkisini kontrol et
SELECT 
  d.isim || ' ' || d.soyisim as diyetisyen_adi,
  d.danisan_sayisi,
  u.isim || ' ' || u.soyisim as danisan_adi,
  u.eposta as danisan_email
FROM diyetisyenler d
LEFT JOIN users u ON d.id = u.diyetisyen_id
ORDER BY d.isim, u.isim;
