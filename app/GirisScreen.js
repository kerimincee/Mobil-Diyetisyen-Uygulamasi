import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../supabaseClient';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    // AsyncStorage'da email ve şifre varsa otomatik giriş
    const checkRememberedUser = async () => {
      const rememberedEmail = await AsyncStorage.getItem('rememberedEmail');
      const rememberedPassword = await AsyncStorage.getItem('rememberedPassword');
      if (rememberedEmail && rememberedPassword) {
        const { error } = await supabase.auth.signInWithPassword({
          email: rememberedEmail,
          password: rememberedPassword,
        });
        if (!error) {
          router.replace('/');
        }
      }
    };
    checkRememberedUser();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Lütfen e-posta ve şifre giriniz.');
      return;
    }
    // 1. Supabase Auth ile giriş yap
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        alert('E-posta veya şifre yanlış.');
      } else {
        alert('Giriş sırasında bir hata oluştu: ' + error.message);
      }
      return;
    }
    // 2. Auth başarılıysa, kendi users tablosundan kullanıcıyı çek
    const authUserId = data.user?.id;
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUserId)
      .single();
    if (userError || !userData) {
      alert('Kullanıcı bilgileri bulunamadı. Lütfen tekrar kayıt olun.');
      return;
    }
    // 3. Giriş başarılı, rememberMe ise kaydet
    if (rememberMe) {
      await AsyncStorage.setItem('rememberedEmail', email);
      await AsyncStorage.setItem('rememberedPassword', password);
    } else {
      await AsyncStorage.removeItem('rememberedEmail');
      await AsyncStorage.removeItem('rememberedPassword');
    }
    router.replace('/');
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Giriş Yap',
          headerBackTitle: 'Geri',
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
          <Text style={styles.title}>Giriş Yap</Text>
          <Text style={styles.subtitle}>Hesabınıza giriş yapın</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={22} color="#6C6C6C" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="E-posta"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={22} color="#6C6C6C" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Şifre"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!isPasswordVisible}
            />
            <TouchableOpacity onPress={() => setPasswordVisible(!isPasswordVisible)}>
              <Ionicons name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} size={22} color="#6C6C6C" />
            </TouchableOpacity>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginLeft: 15, marginBottom: 5 }}>
            <TouchableOpacity onPress={() => setRememberMe(!rememberMe)} style={{ marginRight: 8 }}>
              <Ionicons name={rememberMe ? 'checkbox' : 'square-outline'} size={22} color="#007AFF" />
            </TouchableOpacity>
            <Text style={{ color: '#333', fontSize: 16 }}>Beni Hatırla</Text>
          </View>
          
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Giriş Yap</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => router.push('/Register')}>
            <Text style={styles.registerText}>
              Hesabın yok mu? <Text style={{fontWeight: 'bold'}}>Kayıt ol</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 20,
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
  registerText: {
    marginTop: 20,
    color: 'gray',
    fontSize: 16,
  },
}); 