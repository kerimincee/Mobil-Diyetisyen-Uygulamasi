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
    let cleaned = text.replace(/\D/g, '').slice(0, 11);
    if (!cleaned.startsWith('0')) cleaned = '0' + cleaned;
    let formatted = cleaned;
    if (cleaned.length > 3) formatted = cleaned.slice(0, 4) + ' ' + cleaned.slice(4);
    if (cleaned.length > 6) formatted = formatted.slice(0, 8) + ' ' + formatted.slice(8);
    return formatted;
  };

  const validatePassword = (pw: string) => {
    const hasLetter = /[a-zA-Z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    return pw.length >= 8 && hasLetter && hasNumber;
  };

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
    // Önce Supabase Auth ile kayıt
    const { error: authError, data } = await supabase.auth.signUp({
      email: eposta,
      password: sifre,
    });
    if (authError) {
      if (authError.message.toLowerCase().includes('user already registered')) {
        Alert.alert('Hata', 'Bu e-posta ile zaten bir hesap var.');
      } else {
        Alert.alert('Hata', 'Kayıt sırasında hata oluştu: ' + authError.message);
      }
      return;
    }
    // Auth başarılıysa, users tablosuna Auth user id ile ekle
    const authUserId = data.user?.id;
    const { error: dbError } = await supabase.from('users').insert({
      id: authUserId,
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
    if (dbError) {
      Alert.alert('Hata', 'Kullanıcı veritabanına eklenirken hata oluştu: ' + dbError.message);
      return;
    }
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
            <TextInput style={styles.input} placeholder="İsim" value={isim} onChangeText={setIsim} />
          </View>
          
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={22} color="#6C6C6C" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Soyisim" value={soyisim} onChangeText={setSoyisim} />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={22} color="#6C6C6C" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="E-posta" value={eposta} onChangeText={setEposta} keyboardType="email-address" autoCapitalize="none" />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={22} color="#6C6C6C" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Telefon"
              value={telefon}
              onChangeText={text => setTelefon(formatPhone(text))}
              keyboardType="number-pad"
              maxLength={13}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={22} color="#6C6C6C" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Şifre" value={sifre} onChangeText={setSifre} secureTextEntry={!isPasswordVisible} />
            <TouchableOpacity onPress={() => setPasswordVisible(!isPasswordVisible)}>
              <Ionicons name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} size={22} color="#6C6C6C" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="body-outline" size={22} color="#6C6C6C" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Boy (cm)"
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