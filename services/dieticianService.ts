import { supabase } from '../supabaseClient';

// Diyetisyen giriş kontrol fonksiyonu - aktif durum kontrolü ile
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
  
  // Aktif durum kontrolü
  if (!diyetisyen.aktif_durum) return 'inactive';
  
  // Onay durumu kontrolü
  if (!diyetisyen.onay_durumu) return 'not-approved';
  
  return 'success';
}

// Diyetisyen kayıt fonksiyonu
export async function registerDiyetisyen({
  isim,
  soyisim,
  eposta,
  sifre,
  telefon,
  uzmanlik_alani,
  deneyim_yili,
  lisans_no,
  mezun_oldugu_okul
}: {
  isim: string;
  soyisim: string;
  eposta: string;
  sifre: string;
  telefon?: string;
  uzmanlik_alani?: string;
  deneyim_yili?: number;
  lisans_no?: string;
  mezun_oldugu_okul?: string;
}) {
  // E-posta zaten var mı kontrol et
  const { data: existing, error: existErr } = await supabase
    .from('diyetisyenler')
    .select('id')
    .eq('eposta', eposta)
    .single();
  if (existing) return 'exists';
  if (existErr && existErr.code !== 'PGRST116') return 'error';

  // Yeni diyetisyen ekle
  const { error } = await supabase.from('diyetisyenler').insert({
    isim,
    soyisim,
    eposta,
    sifre,
    telefon,
    uzmanlik_alani,
    deneyim_yili,
    lisans_no,
    mezun_oldugu_okul,
    onay_durumu: false, // Başlangıçta onay bekliyor
    aktif_durum: true, // Başlangıçta aktif
    danisan_sayisi: 0
  });
  
  if (error) return 'error';
  return 'success';
}

// Diyetisyen bilgilerini getirme fonksiyonu
export async function getDiyetisyenById(id: string) {
  const { data: diyetisyen, error } = await supabase
    .from('diyetisyenler')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) throw new Error(error.message);
  return diyetisyen;
}

// Diyetisyen bilgilerini güncelleme fonksiyonu
export async function updateDiyetisyen(id: string, updates: any) {
  const { error } = await supabase
    .from('diyetisyenler')
    .update(updates)
    .eq('id', id);
    
  if (error) throw new Error(error.message);
  return true;
}

// Diyetisyenin danışan sayısını güncelleme fonksiyonu
export async function updateDiyetisyenDanisanSayisi(diyetisyenId: string) {
  const { data: danisanSayisi, error: countError } = await supabase
    .from('users')
    .select('id', { count: 'exact' })
    .eq('diyetisyen_id', diyetisyenId);
    
  if (countError) throw new Error(countError.message);
  
  const { error: updateError } = await supabase
    .from('diyetisyenler')
    .update({ danisan_sayisi: danisanSayisi?.length || 0 })
    .eq('id', diyetisyenId);
    
  if (updateError) throw new Error(updateError.message);
  return true;
}
