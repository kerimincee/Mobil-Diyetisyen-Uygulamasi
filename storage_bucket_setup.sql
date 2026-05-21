-- Supabase Storage Bucket Oluşturma ve Politika Ayarları
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Storage bucket oluştur (eğer yoksa)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profil_foto', 'profil_foto', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Mevcut politikaları sil (eğer varsa)
DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;

-- 3. Yeni politikalar oluştur
-- Upload policy - Herkes profil fotoğrafı yükleyebilir (test için)
CREATE POLICY "Anyone can upload profile photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'profil_foto');

-- Update policy - Herkes profil fotoğrafını güncelleyebilir (test için)
CREATE POLICY "Anyone can update profile photos" ON storage.objects
FOR UPDATE USING (bucket_id = 'profil_foto');

-- View policy - Herkes profil fotoğraflarını görüntüleyebilir
CREATE POLICY "Anyone can view profile photos" ON storage.objects
FOR SELECT USING (bucket_id = 'profil_foto');

-- Delete policy - Herkes profil fotoğrafını silebilir (test için)
CREATE POLICY "Anyone can delete profile photos" ON storage.objects
FOR DELETE USING (bucket_id = 'profil_foto');

-- 4. Bucket'ın public olduğundan emin ol
UPDATE storage.buckets 
SET public = true 
WHERE id = 'profil_foto';
