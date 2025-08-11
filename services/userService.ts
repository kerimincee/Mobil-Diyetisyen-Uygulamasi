import { supabase } from '../supabaseClient';

// Kayıt fonksiyonu
export async function registerUser({ isim, soyisim, eposta, sifre, boy, kilo, yas, cinsiyet, telefon }: {
  isim: string;
  soyisim: string;
  eposta: string;
  sifre: string;
  boy: string | number;
  kilo: string | number;
  yas: string | number;
  cinsiyet: 'erkek' | 'kadın';
  telefon: string;
}) {
  // E-posta zaten var mı kontrol et
  const { data: existing, error: existErr } = await supabase
    .from('users')
    .select('id')
    .eq('eposta', eposta)
    .single();
  if (existing) return 'exists';
  if (existErr && existErr.code !== 'PGRST116') return 'error';

  // Yeni kullanıcı ekle
  const { error } = await supabase.from('users').insert({
    isim,
    soyisim,
    eposta,
    sifre,
    boy: Number(boy),
    kilo: Number(kilo),
    yas: Number(yas),
    cinsiyet,
    telefon
  });
  if (error) return 'error';
  return 'success';
}

// Giriş kontrol fonksiyonu
export async function checkUserLogin(eposta: string, sifre: string) {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('eposta', eposta)
    .single();
  if (error && error.code === 'PGRST116') return 'no-user';
  if (error) return 'error';
  if (!user) return 'no-user';
  if (user.sifre !== sifre) return 'wrong-password';
  return 'success';
} 