import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { checkDiyetisyenLogin } from '../services/dieticianService';
import { supabase } from '../supabaseClient';

export default function DieticianLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);

  // Telefon ve WhatsApp fonksiyonları
  const phoneNumber = '+905551112233';
  const whatsappNumber = '905551112233';

  const handlePhonePress = () => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleWhatsAppPress = () => {
    Linking.openURL(`https://wa.me/${whatsappNumber}`);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Lütfen e-posta ve şifre giriniz.');
      return;
    }

    try {
      const loginResult = await checkDiyetisyenLogin(email, password);
      
      if (loginResult === 'no-user') {
        alert('E-posta veya şifre yanlış.');
        return;
      }
      
      if (loginResult === 'wrong-password') {
        alert('E-posta veya şifre yanlış.');
        return;
      }
      
      if (loginResult === 'inactive') {
        alert('Lisansınız bitmiştir. Lütfen yönetici ile iletişime geçin.');
        return;
      }
      
      if (loginResult === 'not-approved') {
        alert('Hesabınız henüz onaylanmamış. Lütfen yönetici ile iletişime geçin.');
        return;
      }
      
      if (loginResult === 'error') {
        alert('Giriş yapılırken bir hata oluştu.');
        return;
      }

      // Başarılı giriş - diyetisyen bilgilerini al
      const { data: diyetisyenData, error: diyetisyenError } = await supabase
        .from('diyetisyenler')
        .select('*')
        .eq('eposta', email)
        .single();

      if (diyetisyenError || !diyetisyenData) {
        alert('Kullanıcı bilgileri alınamadı.');
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

      await AsyncStorage.setItem('currentDiyetisyen', JSON.stringify(diyetisyenData));
      await AsyncStorage.setItem('userType', 'dietician');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Giriş hatası:', error);
      alert('Giriş yapılırken bir hata oluştu.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Image source={require('../assets/images/logo.png')} style={styles.logo} />
          <Text style={styles.title}>Diyetisyen Girişi</Text>
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
          
          <TouchableOpacity onPress={() => setContactModalVisible(true)}>
            <Text style={styles.registerText}>
              Diyetisyen misiniz? <Text style={{fontWeight: 'bold'}}>Kayıt ol</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>

        {/* Diyetisyen Kayıt İletişim Modal */}
        <Modal
          visible={contactModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setContactModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Pressable style={styles.closeButton} onPress={() => setContactModalVisible(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </Pressable>
              <Text style={styles.modalTitle}>Diyetisyen Kayıt</Text>
              <View style={styles.modalDivider} />
              <Text style={styles.modalText}>
                Diyetisyen hesabı oluşturmak için aşağıdaki iletişim kanallarından bize ulaşabilirsiniz.
              </Text>
              <View style={styles.modalButtonRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalButton,
                    styles.whatsappButton,
                    pressed && styles.modalButtonPressed,
                  ]}
                  onPress={handleWhatsAppPress}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.modalButtonText}>WhatsApp</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalButton,
                    styles.phoneButton,
                    pressed && styles.modalButtonPressed,
                  ]}
                  onPress={handlePhonePress}
                >
                  <Ionicons name="call" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.modalButtonText}>Telefon Et</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 32,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
    position: 'relative',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4B6C4B',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDivider: {
    width: '40%',
    height: 2,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 22,
  },
  modalButtonRow: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 0,
    width: 200,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    marginVertical: 2,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  phoneButton: {
    backgroundColor: '#4B6C4B',
  },
  modalButtonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    padding: 4,
  },
});