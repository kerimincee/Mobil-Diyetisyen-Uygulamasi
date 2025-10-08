import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function LoginScreen() {
  const router = useRouter();

  const handleUserLogin = () => {
    router.push('/UserLogin');
  };

  const handleDieticianLogin = () => {
    router.push('/DieticianLogin');
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'DiyetAPP',
          headerShown: false,
        }}
      />
      <View style={styles.container}>
        {/* Logo ve Başlık */}
        <View style={styles.header}>
          <Image source={require('../assets/images/logo.png')} style={styles.logo} />
          <Text style={styles.title}>DiyetAPP'e Hoş Geldiniz</Text>
          <Text style={styles.subtitle}>Hesap türünüzü seçin</Text>
        </View>

        {/* Ana İçerik - İki Bölüm */}
        <View style={styles.mainContent}>
          {/* Sol Taraf - Kullanıcı */}
          <TouchableOpacity style={styles.userSection} onPress={handleUserLogin} activeOpacity={0.8}>
            <View style={styles.imageContainer}>
              <Image 
                source={require('../assets/images/profil.png')} 
                style={styles.userImage}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay}>
                <Ionicons name="person" size={40} color="#fff" />
              </View>
            </View>
            <Text style={styles.sectionTitle}>Kullanıcı</Text>
            <Text style={styles.sectionDescription}>Diyet takibi ve sağlıklı yaşam</Text>
            <View style={styles.loginButton}>
              <Text style={styles.buttonText}>Giriş Yap</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </View>
          </TouchableOpacity>

          {/* Orta Ayırıcı */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>VEYA</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sağ Taraf - Diyetisyen */}
          <TouchableOpacity style={styles.dieticianSection} onPress={handleDieticianLogin} activeOpacity={0.8}>
            <View style={styles.imageContainer}>
              <Image 
                source={require('../assets/images/diyetasistani.png')} 
                style={styles.dieticianImage}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay}>
                <Ionicons name="medical" size={40} color="#fff" />
              </View>
            </View>
            <Text style={styles.sectionTitle}>Diyetisyen</Text>
            <Text style={styles.sectionDescription}>Profesyonel diyet danışmanlığı</Text>
            <View style={styles.loginButton}>
              <Text style={styles.buttonText}>Giriş Yap</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Alt Bilgi */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Sağlıklı yaşam için DiyetAPP</Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF7',
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4B6C4B',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  userSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 10,
    padding: 20,
    shadowColor: '#4B6C4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  dieticianSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    marginLeft: 10,
    padding: 20,
    shadowColor: '#4B6C4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#E6F0E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  dieticianImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(75, 108, 75, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 60,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4B6C4B',
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4B6C4B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    shadowColor: '#4B6C4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  dividerLine: {
    width: 2,
    height: 60,
    backgroundColor: '#E0E0E0',
    marginVertical: 5,
  },
  dividerText: {
    fontSize: 12,
    color: '#999',
    fontWeight: 'bold',
    marginVertical: 5,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
}); 