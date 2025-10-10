import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
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

export default function UserLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Lütfen e-posta ve şifre giriniz.');
      return;
    }

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('eposta', email)
        .eq('sifre', password)
        .single();

      if (userError || !userData) {
        alert('E-posta veya şifre yanlış.');
        return;
      }

      // Giriş başarılı, rememberMe ise kaydet
      if (rememberMe) {
        await AsyncStorage.setItem('rememberedEmail', email);
        await AsyncStorage.setItem('rememberedPassword', password);
      } else {
        await AsyncStorage.removeItem('rememberedEmail');
        await AsyncStorage.removeItem('rememberedPassword');
      }

      await AsyncStorage.setItem('currentUser', JSON.stringify(userData));
      await AsyncStorage.setItem('userType', 'user');
      router.replace('/' as any);
    } catch (error) {
      console.error('Giriş hatası:', error);
      alert('Giriş yapılırken bir hata oluştu.');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Kullanıcı Girişi',
          headerBackTitle: 'Geri',
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => router.push('/DieticianLogin' as any)}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="medical-outline" size={24} color="#4B6C4B" />
            </TouchableOpacity>
          ),
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
          <Text style={styles.title}>Kullanıcı Girişi</Text>
          <Text style={styles.subtitle}>Hesabınıza giriş yapın</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={22} color="#6C6C6C" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="E-posta"
              placeholderTextColor="#999"
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
              placeholderTextColor="#999"
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
          
          <TouchableOpacity onPress={() => router.push('/Register' as any)}>
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
    width: 180,
    height: 180,
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
    shadowColor: '#4B6C4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
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
