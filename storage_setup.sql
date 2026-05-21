-- Supabase Storage Bucket Oluşturma
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- Storage bucket oluştur
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profil_foto', 'profil_foto', true);

-- Upload policy - Kullanıcılar kendi fotoğraflarını yükleyebilir
CREATE POLICY "Users can upload their own profile photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profil_foto' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Update policy - Kullanıcılar kendi fotoğraflarını güncelleyebilir
CREATE POLICY "Users can update their own profile photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profil_foto' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- View policy - Herkes profil fotoğraflarını görüntüleyebilir
CREATE POLICY "Anyone can view profile photos" ON storage.objects
FOR SELECT USING (bucket_id = 'profil_foto');

-- Delete policy - Kullanıcılar kendi fotoğraflarını silebilir
CREATE POLICY "Users can delete their own profile photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profil_foto' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);