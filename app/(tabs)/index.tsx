import { ThemedText } from '@/components/ThemedText';
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Linking, Modal, NativeScrollEvent, NativeSyntheticEvent, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLoading } from '../../contexts/LoadingContext';
import { supabase } from '../../supabaseClient';


const images = [
  require('@/assets/images/diyetisyenlik1.jpg'),
  require('@/assets/images/diyetisyenlik2.jpg'),
  require('@/assets/images/diyetisyenlik3.jpg'),
  require('@/assets/images/diyetisyenlik4.jpg'),
];

const { width } = Dimensions.get('window');
const sliderHeight = 280;
const AUTO_SCROLL_INTERVAL = 3000;
const SLIDER_WIDTH = width * 0.9;
const SLIDER_MARGIN = width * 0.05;

const MOTIVATIONS = [
  'Her seçim, hedefine bir adım daha yaklaştırır.',
  'Bugünün disiplini, yarının başarısıdır.',
  'Zorlandığın an, değişimin başladığı andır.',
  'Kendin için en iyi versiyonunu yaratıyorsun.',
  'İçindeki gücü hatırla ve devam et!',
  'Sağlık bir alışkanlıktır, pes etme.',
  'Aynaya gururla bakacağın günler yakında.',
  'İlerleme, mükemmel olmaktan daha değerlidir.',
  'Bir öğün her şeyi bozmaz, bir karar her şeyi değiştirir.',
  'Dün ne yaptığın değil, bugün ne yapacağın önemli.',
  'Yavaş da olsa ilerliyorsan, doğru yoldasın.',
  'Her ter damlası, kararlılığının bir kanıtıdır.',
  'Kendine iyi bakmak bir önceliktir, lüks değil.',
  'Sağlıklı seçimler güçlü bir zihnin ürünüdür.',
  'Bu sadece diyet değil, bir yaşam biçimi.',
];

interface Appointment {
  id: string;
  tarih: string;
  giris_saati: string;
  cikis_saati: string;
  notlar?: string;
  users: {
    id: string;
    isim: string;
    soyisim: string;
    telefon: string;
    eposta: string;
    profil_foto?: string;
  };
}

export default function HomeScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [aboutVisible, setAboutVisible] = useState(false);
  const [contactVisible, setContactVisible] = useState(false);
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const { setShowLoading } = useLoading();

  // Randevu state'leri
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  // Diyetisyen istatistikleri
  const [stats, setStats] = useState({
    totalClients: 0,
    totalAppointments: 0,
    todayAppointments: 0,
    pendingAppointments: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // Giriş kontrolü: AsyncStorage'dan kullanıcı kontrolü
  useEffect(() => {
    (async () => {
      const currentUser = await AsyncStorage.getItem('currentUser');
      const currentDiyetisyen = await AsyncStorage.getItem('currentDiyetisyen');
      if (!currentUser && !currentDiyetisyen) {
        router.replace('/GirisScreen');
      }
    })();
  }, []);

  // Diyetisyen istatistiklerini çek
  const fetchDieticianStats = async (diyetisyenId: string) => {
    setStatsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Toplam danışan sayısı
      const { count: clientsCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('diyetisyen_id', diyetisyenId);

      // Toplam randevu sayısı
      const { count: appointmentsCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('diyetisyen_id', diyetisyenId);

      // Bugünkü randevu sayısı
      const { count: todayAppointmentsCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('diyetisyen_id', diyetisyenId)
        .eq('tarih', today);

      // Gelecek randevu sayısı (bugünden sonraki)
      const { count: pendingAppointmentsCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('diyetisyen_id', diyetisyenId)
        .gt('tarih', today);

      setStats({
        totalClients: clientsCount || 0,
        totalAppointments: appointmentsCount || 0,
        todayAppointments: todayAppointmentsCount || 0,
        pendingAppointments: pendingAppointmentsCount || 0
      });
    } catch (error) {
      console.error('İstatistikler yüklenirken hata:', error);
    }
    setStatsLoading(false);
  };

  // Bugünkü randevuları çek
  const fetchTodayAppointments = async (diyetisyenId: string) => {
    setAppointmentsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select(`
          *,
          users(
            id,
            soyisim,
            telefon,
            eposta,
            profil_foto
          )
        `)
        .eq('diyetisyen_id', diyetisyenId)
        .eq('tarih', today)
        .order('giris_saati', { ascending: true });

      if (error) {
        console.error('Bugünkü randevular yüklenirken hata:', error);
      } else {
        setTodayAppointments(appointmentsData || []);
      }
    } catch (error) {
      console.error('Bugünkü randevular yüklenirken hata:', error);
    }
    setAppointmentsLoading(false);
  };

  // Telefon ve WhatsApp fonksiyonları
  const phoneNumber = '+905551112233'; // örnek numara
  const whatsappNumber = '905551112233'; // başında ülke kodu olmadan çalışmaz
  const handlePhonePress = () => {
    Linking.openURL(`tel:${phoneNumber}`);
  };
  const handleWhatsAppPress = () => {
    Linking.openURL(`https://wa.me/${whatsappNumber}`);
  };



  // Her gün için sabit bir motivasyon göstermek için:
  const today = new Date();
  const index = (today.getDate() + today.getMonth() + today.getFullYear()) % MOTIVATIONS.length;
  const motivation = useMemo(() => MOTIVATIONS[index], [index]);

  // useEffect yerine useFocusEffect ile oturum ve kullanıcı adı güncellensin
  useFocusEffect(
    React.useCallback(() => {
      async function checkSession() {
        setShowLoading(true);
        const currentUser = await AsyncStorage.getItem('currentUser');
        const currentDiyetisyen = await AsyncStorage.getItem('currentDiyetisyen');
        const userTypeData = await AsyncStorage.getItem('userType');
        
        if (currentDiyetisyen && userTypeData === 'dietician') {
          const diyetisyenData = JSON.parse(currentDiyetisyen);
          setUserName(diyetisyenData.isim);
          setIsLoggedIn(true);
          setUserType(userTypeData);
          // Diyetisyen için verileri çek
          fetchTodayAppointments(diyetisyenData.id);
          fetchDieticianStats(diyetisyenData.id);
        } else if (currentUser && userTypeData !== 'dietician') {
          const userData = JSON.parse(currentUser);
          setUserName(userData.isim);
          setIsLoggedIn(true);
          setUserType(userTypeData);
        } else {
          setUserName(null);
          setIsLoggedIn(false);
          setUserType(null);
        }
        setShowLoading(false);
      }
      checkSession();
    }, [router])
  );

  useFocusEffect(
    React.useCallback(() => {
      async function fetchUser() {
        const currentUser = await AsyncStorage.getItem('currentUser');
        const currentDiyetisyen = await AsyncStorage.getItem('currentDiyetisyen');
        const userTypeData = await AsyncStorage.getItem('userType');
        
        if (currentDiyetisyen && userTypeData === 'dietician') {
          const diyetisyenData = JSON.parse(currentDiyetisyen);
          setUser(diyetisyenData);
        } else if (currentUser && userTypeData !== 'dietician') {
          const userData = JSON.parse(currentUser);
          setUser(userData);
        } else {
          setUser(null);
        }
      }
      fetchUser();
    }, [])
  );

  const handleProfilePress = () => {
    if (user) {
      router.push('/Profile');
    } else {
      router.push('/GirisScreen');
    }
  };

  const handleProfileIconPress = async () => {
    const currentUser = await AsyncStorage.getItem('currentUser');
    if (currentUser) {
      // Giriş yapmışsa profil sayfasına yönlendirme veya başka bir işlem yapılabilir
    } else {
      router.push('../GirisScreen');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('rememberedEmail');
    await AsyncStorage.removeItem('rememberedPassword');
    await AsyncStorage.removeItem('currentUser');
    await AsyncStorage.removeItem('currentDiyetisyen');
    await AsyncStorage.removeItem('userType');
    setUserMenuVisible(false);
    router.replace('/GirisScreen');
  };

  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = (currentIndex + 1) % images.length;
      scrollRef.current?.scrollTo({ x: nextIndex * (SLIDER_WIDTH + SLIDER_MARGIN * 2), animated: true });
      setCurrentIndex(nextIndex);
    }, AUTO_SCROLL_INTERVAL);
    return () => clearInterval(interval);
  }, [currentIndex]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(scrollPosition / (SLIDER_WIDTH + SLIDER_MARGIN * 2));
    if (newIndex >= 0 && newIndex < images.length) {
      setCurrentIndex(newIndex);
    }
  };

  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Sol üstte bulut ve kullanıcı bilgisi */}
      {user && (
        <>
          <TouchableOpacity
            style={{ position: 'absolute', top: 70, left: 18, zIndex: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#E6F0E6', borderRadius: 30, paddingVertical: 8, paddingHorizontal: 16, shadowColor: '#4B6C4B', shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 }}
            onPress={() => setUserMenuVisible((v) => !v)}
            activeOpacity={0.8}
          >
            {user.profil_foto ? (
              <Image source={{ uri: user.profil_foto }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 8, backgroundColor: '#fff' }} />
            ) : (
              <Text style={{ fontSize: 28, marginRight: 8 }}>👤</Text>
            )}
            <View>
              <Text style={{ color: '#4B6C4B', fontWeight: 'bold', fontSize: 15 }}>
                Merhaba! {user.isim}
              </Text>
              <Text style={{ color: '#4B6C4B', fontSize: 12 }}>
                {userType === 'dietician' ? 'Diyetisyen' : 'Kullanıcı'}
              </Text>
            </View>
          </TouchableOpacity>
          {userMenuVisible && (
            <View style={{ position: 'absolute', top: 90, left: 18, zIndex: 30, backgroundColor: '#fff', borderRadius: 18, paddingVertical: 12, paddingHorizontal: 24, shadowColor: '#4B6C4B', shadowOpacity: 0.13, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 6, minWidth: 180 }}>
              {/* Kullanıcı bilgi alanı */}
              <TouchableOpacity onPress={() => { 
                setUserMenuVisible(false); 
                if (userType === 'dietician') {
                  router.push('/DieticianProfile');
                } else {
                  router.push('/Profile');
                }
              }} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, marginBottom: 10 }}>
                <Text style={{ fontSize: 24, marginRight: 8 }}>{userType === 'dietician' ? '👩‍⚕️' : '👤'}</Text>
                <View>
                  <Text style={{ color: '#4B6C4B', fontWeight: 'bold', fontSize: 15 }}>{user.isim}</Text>
                  <Text style={{ color: '#4B6C4B', fontSize: 13 }}>
                    {userType === 'dietician' ? 'Diyetisyen Profili' : 'Profili Gör'}
                  </Text>
                </View>
              </TouchableOpacity>
              <View style={{ height: 1, backgroundColor: '#E6F0E6', marginVertical: 6 }} />
              <TouchableOpacity onPress={handleLogout} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
                <Ionicons name="log-out-outline" size={20} color="#4B6C4B" style={{ marginRight: 8 }} />
                <Text style={{ color: '#4B6C4B', fontWeight: 'bold', fontSize: 16 }}>Çıkış Yap</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={{ paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Diyetisyen için istatistikler */}
        {userType === 'dietician' && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>İstatistikler</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="people" size={24} color="#4B6C4B" />
                </View>
                <Text style={styles.statNumber}>{stats.totalClients}</Text>
                <Text style={styles.statLabel}>Toplam Danışan</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="calendar" size={24} color="#4B6C4B" />
                </View>
                <Text style={styles.statNumber}>{stats.totalAppointments}</Text>
                <Text style={styles.statLabel}>Toplam Randevu</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="today" size={24} color="#4B6C4B" />
                </View>
                <Text style={styles.statNumber}>{stats.todayAppointments}</Text>
                <Text style={styles.statLabel}>Bugünkü Randevu</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="time" size={24} color="#4B6C4B" />
                </View>
                <Text style={styles.statNumber}>{stats.pendingAppointments}</Text>
                <Text style={styles.statLabel}>Gelecek Randevu</Text>
              </View>
            </View>
          </View>
        )}

        {/* Diyetisyen için bugünkü randevular */}
        {userType === 'dietician' && (
          <View style={styles.appointmentsBox}>
            <View style={styles.appointmentsHeader}>
              <Text style={styles.appointmentsTitle}>Bugünkü Randevular</Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={() => user && fetchTodayAppointments(user.id)}
                disabled={appointmentsLoading}
              >
                <Ionicons 
                  name="refresh" 
                  size={20} 
                  color="#4B6C4B" 
                  style={appointmentsLoading ? { opacity: 0.5 } : {}} 
                />
              </TouchableOpacity>
            </View>
            
            {appointmentsLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Randevular yükleniyor...</Text>
              </View>
            ) : todayAppointments.length > 0 ? (
              <View style={styles.appointmentsList}>
                {todayAppointments.map((appointment) => (
                  <View key={appointment.id} style={styles.appointmentItem}>
                    <View style={styles.appointmentHeader}>
                      <View style={styles.clientInfo}>
                        {appointment.users.profil_foto ? (
                          <Image 
                            source={{ uri: appointment.users.profil_foto }} 
                            style={styles.clientAvatar} 
                          />
                        ) : (
                          <View style={styles.clientAvatarPlaceholder}>
                            <Text style={styles.clientAvatarText}>
                              {appointment.users.isim.charAt(0)}{appointment.users.soyisim.charAt(0)}
                            </Text>
                          </View>
                        )}
                        <View style={styles.clientDetails}>
                          <Text style={styles.clientName}>
                            {appointment.users.isim} {appointment.users.soyisim}
                          </Text>
                          <Text style={styles.appointmentTime}>
                            {appointment.giris_saati} - {appointment.cikis_saati}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {appointment.notlar && (
                      <Text style={styles.appointmentNotes} numberOfLines={2}>
                        {appointment.notlar}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noAppointmentsContainer}>
                <Ionicons name="calendar-outline" size={48} color="#B0B0B0" />
                <Text style={styles.noAppointmentsText}>Bugün randevunuz bulunmuyor</Text>
                <Text style={styles.noAppointmentsSubtext}>Yeni randevular için takvimi kontrol edin</Text>
              </View>
            )}
          </View>
        )}

        {/* Diyetisyen için hızlı erişim kartları */}
        {userType === 'dietician' && (
          <View style={styles.quickAccessContainer}>
            <Text style={styles.quickAccessTitle}>Hızlı Erişim</Text>
            <View style={styles.quickAccessGrid}>
              <TouchableOpacity 
                style={styles.quickAccessCard}
                onPress={() => router.push('/(tabs)/BMI')}
              >
                <View style={styles.quickAccessIconContainer}>
                  <Ionicons name="calendar-outline" size={28} color="#4B6C4B" />
                </View>
                <Text style={styles.quickAccessLabel}>Randevular</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickAccessCard}
                onPress={() => router.push('/(tabs)/Kalori')}
              >
                <View style={styles.quickAccessIconContainer}>
                  <Ionicons name="restaurant-outline" size={28} color="#4B6C4B" />
                </View>
                <Text style={styles.quickAccessLabel}>Danışan Yemekleri</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickAccessCard}
                onPress={() => router.push('/(tabs)/Takvim')}
              >
                <View style={styles.quickAccessIconContainer}>
                  <Ionicons name="nutrition-outline" size={28} color="#4B6C4B" />
                </View>
                <Text style={styles.quickAccessLabel}>Diyet Planları</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickAccessCard}
                onPress={() => router.push('/DieticianProfile')}
              >
                <View style={styles.quickAccessIconContainer}>
                  <Ionicons name="person-outline" size={28} color="#4B6C4B" />
                </View>
                <Text style={styles.quickAccessLabel}>Profil</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* HAKKIMIZDA MODAL */}
      <Modal
        visible={aboutVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAboutVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Pressable style={styles.closeButton} onPress={() => setAboutVisible(false)}>
              <Ionicons name="close" size={24} color="#888" />
            </Pressable>
            <ThemedText style={styles.modalTitle}>Bu Uygulama Hakkında</ThemedText>
            <View style={styles.modalDivider} />
            <ThemedText style={styles.modalText}>
              DiyetApp, sağlıklı beslenme alışkanlıkları kazanmanız ve hedeflerinize ulaşmanız için tasarlanmış bir mobil uygulamadır. Kişisel takvim, BMI hesaplama, chatbot ve daha fazlası ile her zaman yanınızda!
            </ThemedText>
          </View>
        </View>
      </Modal>

      {/* BİZE ULAŞIN MODAL */}
      <Modal
        visible={contactVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setContactVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Pressable style={styles.closeButton} onPress={() => setContactVisible(false)}>
              <Ionicons name="close" size={24} color="#888" />
            </Pressable>
            <ThemedText style={styles.modalTitle}>Bize Ulaşın</ThemedText>
            <View style={styles.modalDivider} />
            <ThemedText style={styles.modalText}>
              Aşağıdaki butonları kullanarak bize kolayca ulaşabilirsiniz.
            </ThemedText>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF7',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAF7',
    padding: 16,
    paddingTop: 100, // üstte daha fazla boşluk
  },
  motivationBox: {
    backgroundColor: '#E6EFE2',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    alignItems: 'center',
    shadowColor: '#5A7742',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  motivationTitle: {
    fontSize: 19,
    fontFamily: 'Poppins_700Bold',
    color: '#5A7742',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  motivationText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#4B5C4B',
    textAlign: 'center',
  },
  motivationTitleSmall: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B6C4B',
    textAlign: 'center',
    marginBottom: 4,
  },
  motivationTextSmall: {
    fontSize: 15,
    color: '#4B6C4B',
    textAlign: 'center',
    marginBottom: 0,
  },
  sliderWrapper: {
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  slider: {
    flexGrow: 0,
    width: '100%',
  },
  sliderContent: {
    alignItems: 'center',
    paddingHorizontal: SLIDER_MARGIN,
  },
  sliderImageWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: SLIDER_WIDTH,
    marginHorizontal: SLIDER_MARGIN,
  },
  sliderImage: {
    width: '100%',
    height: 180,
    borderRadius: 32,
    marginTop: 8,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.13,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    transform: [{ scale: 0.96 }],
    transitionProperty: 'transform',
    transitionDuration: '300ms',
  },
  sliderImageActive: {
    transform: [{ scale: 1 }],
    zIndex: 2,
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    width: '100%',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#d0cfcf',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#4B6C4B',
  },
  welcomeTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#5A7742',
    marginVertical: 12,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  infoBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#5A7742',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    width: '95%',
  },
  infoText: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#4B5C4B',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#5A7742',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 28,
    shadowColor: '#5A7742',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    letterSpacing: 0.2,
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
    letterSpacing: 0.2,
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
    fontWeight: '400',
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
    transitionProperty: 'transform',
    transitionDuration: '120ms',
  },
  whatsappButton: {
    backgroundColor: '#4B6C4B',
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
    letterSpacing: 0.1,
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    padding: 4,
  },
  // Randevular alanı stilleri
  appointmentsBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#5A7742',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  appointmentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  appointmentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B6C4B',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#E6F0E6',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  appointmentsList: {
    maxHeight: 300,
  },
  appointmentItem: {
    backgroundColor: '#F8FAF7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4B6C4B',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  clientAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4B6C4B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4B6C4B',
    marginBottom: 2,
  },
  appointmentTime: {
    fontSize: 14,
    color: '#666',
  },

  appointmentNotes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  noAppointmentsContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noAppointmentsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  noAppointmentsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  // İstatistik kartları stilleri
  statsContainer: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#5A7742',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B6C4B',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F8FAF7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6F0E6',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E6F0E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4B6C4B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  // Hızlı erişim kartları stilleri
  quickAccessContainer: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#5A7742',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  quickAccessTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B6C4B',
    marginBottom: 16,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAccessCard: {
    width: '48%',
    backgroundColor: '#F8FAF7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6F0E6',
  },
  quickAccessIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E6F0E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickAccessLabel: {
    fontSize: 12,
    color: '#4B6C4B',
    textAlign: 'center',
    fontWeight: '500',
  },
});
