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

// Diyetisyen giriş kontrol fonksiyonu
export async function checkDiyetisyenLogin(eposta: string, sifre: string) {
  const { data: diyetisyen, error } = await supabase
    .from('diyetisyenler')
    .select('*')
    .eq('eposta', eposta)
    .single();
  if (error && error.code === 'PGRST116') return 'no-user';
  if (error) return 'error';
  if (!diyetisyen) return 'no-user';
  if (diyetisyen.sifre !== sifre) return 'wrong-password';
  return 'success';
}

// Diyetisyene bağlı danışanları getirme fonksiyonu
export async function getDiyetisyenDanisanlari(diyetisyenId: string) {
  const { data: danisanlar, error } = await supabase
    .from('users')
    .select('id, isim, soyisim, eposta, telefon, boy, kilo, yas, cinsiyet, profil_foto, diyetisyen_id, created_at')
    .eq('diyetisyen_id', diyetisyenId)
    .order('isim', { ascending: true });
  if (error) throw new Error(error.message);
  return danisanlar;
}

// Diyetisyene bağlı tüm danışanların yemeklerini getirme fonksiyonu
export async function getDiyetisyenDanisanlariMeals(diyetisyenId: string) {
  const { data: meals, error } = await supabase
    .from('meals')
    .select(`
      *,
      users!inner(
        id,
        isim,
        soyisim,
        eposta,
        profil_foto
      )
    `)
    .eq('users.diyetisyen_id', diyetisyenId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return meals;
} 