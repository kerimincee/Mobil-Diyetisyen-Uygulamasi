import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { supabase } from '../supabaseClient';

export default function RegisterScreen() {
  const router = useRouter();
  const [isim, setIsim] = useState('');
  const [soyisim, setSoyisim] = useState('');
  const [eposta, setEposta] = useState('');
  const [telefon, setTelefon] = useState('');
  const [sifre, setSifre] = useState('');
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [boy, setBoy] = useState('');
  const [kilo, setKilo] = useState('');
  const [yas, setYas] = useState('');
  const [cinsiyet, setCinsiyet] = useState<'erkek' | 'kadın'>('erkek');

  const formatPhone = (text: string) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    
    // Limit to 11 digits
    const limited = cleaned.slice(0, 11);
    
    // Format the phone number
    let formatted = limited;
    if (limited.length > 0) {
      // Ensure it starts with 0
      if (!limited.startsWith('0')) {
        formatted = '0' + limited;
      }
      
      // Add spaces for formatting
      if (formatted.length > 4) {
        formatted = formatted.slice(0, 4) + ' ' + formatted.slice(4);
      }
      if (formatted.length > 8) {
        formatted = formatted.slice(0, 8) + ' ' + formatted.slice(8);
      }
    }
    
    return formatted;
  };

  const validatePassword = (pw: string) => {
    const hasLetter = /[a-zA-Z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    return pw.length >= 8 && hasLetter && hasNumber;
  };

  // Şifre hash fonksiyonu - artık kullanılmıyor (düz metin olarak kaydediliyor)
  // const hashPassword = async (password: string): Promise<string> => {
  //   const hash = await Crypto.digestStringAsync(
  //     Crypto.CryptoDigestAlgorithm.SHA256,
  //     password
  //   );
  //   return hash;
  // };

  const handleRegister = async () => {
    if (!isim || !soyisim || !eposta || !telefon || !sifre || !boy || !kilo || !yas || !cinsiyet) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(eposta)) {
      Alert.alert('Hata', 'Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }
    if (!validatePassword(sifre)) {
      Alert.alert('Hata', 'Şifre en az 8 karakter olmalı ve harf ile sayı içermelidir.');
      return;
    }

    console.log('Kayıt işlemi başladı');
    console.log('E-posta:', eposta);
    console.log('Şifre:', sifre);

    // Önce e-posta adresinin zaten kayıtlı olup olmadığını kontrol et
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('eposta')
      .eq('eposta', eposta)
      .single();

    if (existingUser) {
      Alert.alert('Hata', 'Bu e-posta ile zaten bir hesap var.');
      return;
    }

    console.log('Şifre (düz metin):', sifre);

    // Users tablosuna direkt kayıt (şifre hash olmadan)
    const { error: dbError } = await supabase.from('users').insert({
      isim,
      soyisim,
      eposta,
      sifre: sifre, // Düz metin şifre
      boy: Number(boy),
      kilo: Number(kilo),
      yas: Number(yas),
      cinsiyet,
      telefon
    });

    if (dbError) {
      console.error('Veritabanı hatası:', dbError);
      Alert.alert('Hata', 'Kayıt sırasında hata oluştu: ' + dbError.message);
      return;
    }

    console.log('Kayıt başarılı!');
    Alert.alert('Başarılı', 'Kayıt başarılı! Giriş yapabilirsiniz.', [
      { text: 'Tamam', onPress: () => router.replace('/GirisScreen') }
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Kayıt Ol',
          headerBackTitle: 'Giriş Yap',
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#fff' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Image source={require('../assets/images/logo.png')} style={styles.logo} />
          <Text style={styles.title}>Hesap Oluştur</Text>
          <Text style={styles.subtitle}>Yeni bir başlangıç için formu doldur</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={22} color="#6C6C6C" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="İsim" placeholderTextColor="#999" value={isim} onChangeText={setIsim} />
          </View>
          
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={22} color="#6C6C6C" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Soyisim" placeholderTextColor="#999" value={soyisim} onChangeText={setSoyisim} />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={22} color="#6C6C6C" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="E-posta" placeholderTextColor="#999" value={eposta} onChangeText={setEposta} keyboardType="email-address" autoCapitalize="none" />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={22} color="#6C6C6C" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Telefon"
              placeholderTextColor="#999"
              value={telefon}
              onChangeText={text => setTelefon(formatPhone(text))}
              keyboardType="number-pad"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={22} color="#6C6C6C" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Şifre" placeholderTextColor="#999" value={sifre} onChangeText={setSifre} secureTextEntry={!isPasswordVisible} />
            <TouchableOpacity onPress={() => setPasswordVisible(!isPasswordVisible)}>
              <Ionicons name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} size={22} color="#6C6C6C" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="body-outline" size={22} color="#6C6C6C" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Boy (cm)"
              placeholderTextColor="#999"
              value={boy}
              onChangeText={setBoy}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="fitness-outline" size={22} color="#6C6C6C" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Kilo (kg)"
              placeholderTextColor="#999"
              value={kilo}
              onChangeText={setKilo}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="calendar-outline" size={22} color="#6C6C6C" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Yaş"
              placeholderTextColor="#999"
              value={yas}
              onChangeText={setYas}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>
          <View style={[styles.inputContainer, { justifyContent: 'flex-start' }]}> 
            <Ionicons name="male-female-outline" size={22} color="#6C6C6C" style={styles.inputIcon} />
            <TouchableOpacity
              style={[styles.genderButton, cinsiyet === 'erkek' && styles.genderButtonSelected]}
              onPress={() => setCinsiyet('erkek')}
            >
              <Text style={[styles.genderText, cinsiyet === 'erkek' && styles.genderTextSelected]}>Erkek</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderButton, cinsiyet === 'kadın' && styles.genderButtonSelected]}
              onPress={() => setCinsiyet('kadın')}
            >
              <Text style={[styles.genderText, cinsiyet === 'kadın' && styles.genderTextSelected]}>Kadın</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>Kayıt Ol</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 30,
    textAlign: 'center'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    backgroundColor: '#F7F7F7',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#4B6C4B',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  genderButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 10,
    backgroundColor: '#f7f7f7',
  },
  genderButtonSelected: {
    backgroundColor: '#4B6C4B',
    borderColor: '#4B6C4B',
  },
  genderText: {
    color: '#333',
    fontWeight: 'bold',
  },
  genderTextSelected: {
    color: '#fff',
  },
}); 