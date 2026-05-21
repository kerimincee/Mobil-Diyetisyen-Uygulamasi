import { ThemedText } from '@/components/ThemedText';
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Linking, Modal, NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  users?: {
    id: string;
    isim: string;
    soyisim: string;
    telefon: string;
    eposta: string;
    profil_foto?: string;
  };
  diyetisyenler?: {
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
  const { setShowLoading } = useLoading();

  // Randevu state'leri
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  
  // Diyetisyen listesi state'leri
  const [availableDieticians, setAvailableDieticians] = useState<any[]>([]);
  const [dieticiansLoading, setDieticiansLoading] = useState(false);
  const [selectedDietician, setSelectedDietician] = useState<any>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  
  // Danışan için randevu state'leri
  const [userAppointments, setUserAppointments] = useState<Appointment[]>([]);
  const [userAppointmentsLoading, setUserAppointmentsLoading] = useState(false);
  
  // Kullanıcının diyetisyeni
  const [userDietician, setUserDietician] = useState<any>(null);
  const [userDieticianLoading,  setUserDieticianLoading] = useState(false);

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
        router.replace('/');
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

  // Bugünkü randevuları çek (Diyetisyen için)
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
            isim,
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

  // Danışan için randevuları çek (sadece bugün ve gelecekteki randevular)
  const fetchUserAppointments = async (userId: string) => {
    setUserAppointmentsLoading(true);
    try {
      // Bugünün tarihini al (YYYY-MM-DD formatında)
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select(`
          *,
          diyetisyenler(
            id,
            isim,
            soyisim,
            eposta,
            telefon,
            profil_foto
          )
        `)
        .eq('user_id', userId)
        .gte('tarih', todayString) // Sadece bugün ve gelecekteki randevular
        .order('tarih', { ascending: true })
        .order('giris_saati', { ascending: true })
        .limit(5); // Sonraki 5 randevuyu göster

      if (error) {
        console.error('Danışan randevuları yüklenirken hata:', error);
      } else {
        setUserAppointments(appointmentsData || []);
      }
    } catch (error) {
      console.error('Danışan randevuları yüklenirken hata:', error);
    }
    setUserAppointmentsLoading(false);
  };

  // Kullanıcının diyetisyenini getir
  const fetchUserDietician = async () => {
    if (!user || userType !== 'user' || !user.diyetisyen_id) return;
    
    setUserDieticianLoading(true);
    try {
      const { data, error } = await supabase
        .from('diyetisyenler')
        .select('*')
        .eq('id', user.diyetisyen_id)
        .single();

      if (error) {
        console.error('Diyetisyen getirme hatası:', error);
      } else {
        setUserDietician(data);
      }
    } catch (error) {
      console.error('Diyetisyen getirme hatası:', error);
    }
    setUserDieticianLoading(false);
  };

  // Mevcut diyetisyenleri getir (diyetisyeni olmayan kullanıcılar için)
  const fetchAvailableDieticians = async () => {
    if (!user || userType !== 'user' || user.diyetisyen_id) return;
    
    setDieticiansLoading(true);
    try {
      const { data, error } = await supabase
        .from('diyetisyenler')
        .select('*')
        .eq('aktif_durum', true)
        .order('isim', { ascending: true });

      if (error) {
        console.error('Diyetisyen getirme hatası:', error);
      } else {
        setAvailableDieticians(data || []);
      }
    } catch (error) {
      console.error('Diyetisyen getirme hatası:', error);
    }
    setDieticiansLoading(false);
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
          setUser(userData);
          // Danışan için randevuları çek
          fetchUserAppointments(userData.id);
          // Diyetisyeni olan kullanıcılar için diyetisyen bilgisini çek
          if (userData.diyetisyen_id) {
            fetchUserDietician();
          } else {
            // Diyetisyeni olmayan kullanıcılar için diyetisyenleri çek
            fetchAvailableDieticians();
          }
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
      router.push('/');
    }
  };

  const handleProfileIconPress = async () => {
    const currentUser = await AsyncStorage.getItem('currentUser');
    if (currentUser) {
      // Giriş yapmışsa profil sayfasına yönlendirme veya başka bir işlem yapılabilir
    } else {
      router.push('/');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('rememberedEmail');
    await AsyncStorage.removeItem('rememberedPassword');
    await AsyncStorage.removeItem('currentUser');
    await AsyncStorage.removeItem('currentDiyetisyen');
    await AsyncStorage.removeItem('userType');
    router.replace('/UserLogin');
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
      {/* Sabit Header */}
      {user && (
        <View style={styles.fixedHeader}>
          {/* Sol taraf - Kullanıcı bilgisi */}
          <View style={styles.userInfoContainer}>
            {user.profil_foto ? (
              <Image source={{ uri: user.profil_foto }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileIcon}>👤</Text>
              </View>
            )}
            <View style={styles.userTextContainer}>
              <Text style={styles.welcomeText}>
                Merhaba! {user.isim}
              </Text>
              <Text style={styles.userTypeText}>
                {userType === 'dietician' ? 'Diyetisyen' : 'Danışman'}
              </Text>
            </View>
          </View>

          {/* Sağ taraf - İkonlar */}
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={() => {
                if (userType === 'dietician') {
                  router.push('/DieticianProfile');
                } else {
                  router.push('/Profile');
                }
              }}
            >
              <Ionicons name="person-outline" size={24} color="#4B6C4B" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={24} color="#4B6C4B" />
            </TouchableOpacity>
          </View>
        </View>
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
                  <Ionicons name="people" size={28} color="#4B6C4B" />
                </View>
                <Text style={styles.statNumber}>{stats.totalClients}</Text>
                <Text style={styles.statLabel}>Toplam Danışan</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="calendar" size={28} color="#4B6C4B" />
                </View>
                <Text style={styles.statNumber}>{stats.totalAppointments}</Text>
                <Text style={styles.statLabel}>Toplam Randevu</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="today" size={28} color="#4B6C4B" />
                </View>
                <Text style={styles.statNumber}>{stats.todayAppointments}</Text>
                <Text style={styles.statLabel}>Bugünkü Randevu</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="time" size={28} color="#4B6C4B" />
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
                        {appointment.users?.profil_foto ? (
                          <Image 
                            source={{ uri: appointment.users.profil_foto }} 
                            style={styles.clientAvatar} 
                          />
                        ) : (
                          <View style={styles.clientAvatarPlaceholder}>
                            <Text style={styles.clientAvatarText}>
                              {appointment.users?.isim?.charAt(0)}{appointment.users?.soyisim?.charAt(0)}
                            </Text>
                          </View>
                        )}
                        <View style={styles.clientDetails}>
                          <Text style={styles.clientName}>
                            {appointment.users?.isim} {appointment.users?.soyisim}
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

        {/* Danışan için randevular */}
        {userType === 'user' && (
          <View style={styles.appointmentsBox}>
            <View style={styles.appointmentsHeader}>
              <Text style={styles.appointmentsTitle}>Randevularım</Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={() => user && fetchUserAppointments(user.id)}
                disabled={userAppointmentsLoading}
              >
                <Ionicons 
                  name="refresh" 
                  size={20} 
                  color="#4B6C4B" 
                  style={userAppointmentsLoading ? { opacity: 0.5 } : {}} 
                />
              </TouchableOpacity>
            </View>
            
            {userAppointmentsLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Randevular yükleniyor...</Text>
              </View>
            ) : userAppointments.length > 0 ? (
              <View style={styles.appointmentsList}>
                {userAppointments.map((appointment) => (
                  <View key={appointment.id} style={styles.appointmentItem}>
                    <View style={styles.appointmentHeader}>
                      <View style={styles.clientInfo}>
                        {appointment.diyetisyenler?.profil_foto ? (
                          <Image 
                            source={{ uri: appointment.diyetisyenler.profil_foto }} 
                            style={styles.clientAvatar} 
                          />
                        ) : (
                          <View style={styles.clientAvatarPlaceholder}>
                            <Text style={styles.clientAvatarText}>
                              {appointment.diyetisyenler?.isim?.charAt(0)}{appointment.diyetisyenler?.soyisim?.charAt(0)}
                            </Text>
                          </View>
                        )}
                        <View style={styles.clientDetails}>
                          <Text style={styles.clientName}>
                            Dr. {appointment.diyetisyenler?.isim} {appointment.diyetisyenler?.soyisim}
                          </Text>
                          <Text style={styles.appointmentTime}>
                            {new Date(appointment.tarih).toLocaleDateString('tr-TR')} - {appointment.giris_saati} - {appointment.cikis_saati}
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
            ) : user?.diyetisyen_id ? (
              <View style={styles.noAppointmentsContainer}>
                <Ionicons name="calendar-outline" size={48} color="#B0B0B0" />
                <Text style={styles.noAppointmentsText}>Randevunuz bulunmuyor</Text>
                <Text style={styles.noAppointmentsSubtext}>Diyetisyeninizden randevu alın</Text>
              </View>
            ) : (
              <View style={styles.noAppointmentsContainer}>
                <Ionicons name="person-add-outline" size={48} color="#B0B0B0" />
                <Text style={styles.noAppointmentsText}>Henüz diyetisyeniniz yok</Text>
                <Text style={styles.noAppointmentsSubtext}>Diyetisyenlerimizle İletişime Geçin</Text>
              </View>
            )}
          </View>
        )}

        {/* Diyetisyeni olan kullanıcılar için diyetisyen bilgisi */}
        {userType === 'user' && user?.diyetisyen_id && (
          <View style={styles.myDieticianBox}>
            <View style={styles.myDieticianHeader}>
              <Text style={styles.myDieticianTitle}>Diyetisyenim</Text>
            </View>
            
            {userDieticianLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Diyetisyen bilgileri yükleniyor...</Text>
              </View>
            ) : userDietician ? (
              <View style={styles.myDieticianContent}>
                <View style={styles.myDieticianInfo}>
                  {userDietician.profil_foto ? (
                    <Image 
                      source={{ uri: userDietician.profil_foto }} 
                      style={styles.myDieticianAvatar} 
                    />
                  ) : (
                    <View style={styles.myDieticianAvatarPlaceholder}>
                      <Text style={styles.myDieticianAvatarText}>
                        {userDietician.isim?.charAt(0)}{userDietician.soyisim?.charAt(0)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.myDieticianDetails}>
                    <Text style={styles.myDieticianName}>
                      Dr. {userDietician.isim} {userDietician.soyisim}
                    </Text>
                    <Text style={styles.myDieticianSpecialty}>
                      {userDietician.uzmanlik_alani || 'Genel Beslenme'}
                    </Text>
                    <Text style={styles.myDieticianExperience}>
                      {userDietician.deneyim_yili} yıl deneyim
                    </Text>
                  </View>
                </View>
                
                {(userDietician.adres || userDietician.telefon) && (
                  <View style={styles.myDieticianContactSection}>
                    {userDietician.adres && (
                      <View style={styles.myDieticianContactItem}>
                        <Ionicons name="location-outline" size={18} color="#4B6C4B" />
                        <Text style={styles.myDieticianContactText}>
                          {userDietician.adres}
                        </Text>
                      </View>
                    )}
                    {userDietician.ilce && userDietician.sehir && (
                      <View style={styles.myDieticianContactItem}>
                        <Ionicons name="location" size={18} color="#4B6C4B" />
                        <Text style={styles.myDieticianContactText}>
                          {userDietician.ilce}, {userDietician.sehir}
                        </Text>
                      </View>
                    )}
                    {userDietician.telefon && (
                      <TouchableOpacity 
                        style={styles.myDieticianContactItem}
                        onPress={() => Linking.openURL(`tel:${userDietician.telefon}`)}
                      >
                        <Ionicons name="call-outline" size={18} color="#4B6C4B" />
                        <Text style={[styles.myDieticianContactText, { color: '#4B6C4B', fontWeight: '600' }]}>
                          {userDietician.telefon}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {userDietician.enlem && userDietician.boylam && (
                      <TouchableOpacity
                        style={styles.myDieticianMapButton}
                        onPress={() => {
                          const url = `https://maps.google.com/?q=${userDietician.enlem},${userDietician.boylam}`;
                          Linking.openURL(url);
                        }}
                      >
                        <Ionicons name="map" size={18} color="#fff" />
                        <Text style={styles.myDieticianMapButtonText}>Haritada Göster</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.noAppointmentsContainer}>
                <Ionicons name="person-outline" size={48} color="#B0B0B0" />
                <Text style={styles.noAppointmentsText}>Diyetisyen bilgisi bulunamadı</Text>
              </View>
            )}
          </View>
        )}

        {/* Diyetisyeni olmayan kullanıcılar için diyetisyen listesi */}
        {userType === 'user' && !user?.diyetisyen_id && (
          <View style={styles.dieticiansBox}>
            <View style={styles.dieticiansHeader}>
              <Text style={styles.dieticiansTitle}>Diyetisyenlerimiz</Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={fetchAvailableDieticians}
                disabled={dieticiansLoading}
              >
                <Ionicons 
                  name="refresh" 
                  size={20} 
                  color="#4B6C4B" 
                  style={dieticiansLoading ? { opacity: 0.5 } : {}} 
                />
              </TouchableOpacity>
            </View>
            
            {dieticiansLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Diyetisyenler yükleniyor...</Text>
              </View>
            ) : availableDieticians.length > 0 ? (
              <View style={styles.dieticiansList}>
                {availableDieticians.map((dietician) => (
                  <View 
                    key={dietician.id} 
                    style={styles.dieticianItem}
                  >
                    <View style={styles.dieticianInfo}>
                      {dietician.profil_foto ? (
                        <Image 
                          source={{ uri: dietician.profil_foto }} 
                          style={styles.dieticianAvatar} 
                        />
                      ) : (
                        <View style={styles.dieticianAvatarPlaceholder}>
                          <Text style={styles.dieticianAvatarText}>
                            {dietician.isim?.charAt(0)}{dietician.soyisim?.charAt(0)}
                          </Text>
                        </View>
                      )}
                      <View style={styles.dieticianDetails}>
                        <Text style={styles.dieticianName}>
                          Dr. {dietician.isim} {dietician.soyisim}
                        </Text>
                        <Text style={styles.dieticianSpecialty}>
                          {dietician.uzmanlik_alani || 'Genel Beslenme'}
                        </Text>
                        <Text style={styles.dieticianExperience}>
                          {dietician.deneyim_yili} yıl deneyim
                        </Text>
                        {dietician.telefon && (
                          <TouchableOpacity 
                            style={styles.locationContainer}
                            onPress={() => Linking.openURL(`tel:${dietician.telefon}`)}
                          >
                            <Ionicons name="call-outline" size={14} color="#4B6C4B" />
                            <Text style={[styles.dieticianLocation, { color: '#4B6C4B', fontWeight: '600' }]}>
                              {dietician.telefon}
                            </Text>
                          </TouchableOpacity>
                        )}
                        {dietician.adres && (
                          <View style={styles.locationContainer}>
                            <Ionicons name="location-outline" size={14} color="#666" />
                            <Text style={styles.dieticianLocation}>
                              {dietician.ilce}, {dietician.sehir}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.dieticianActions}>
                      {dietician.enlem && dietician.boylam && (
                        <TouchableOpacity 
                          style={styles.mapButton}
                          onPress={() => {
                            setSelectedDietician(dietician);
                            setShowMapModal(true);
                          }}
                        >
                          <Ionicons name="map-outline" size={20} color="#4B6C4B" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noAppointmentsContainer}>
                <Ionicons name="person-outline" size={48} color="#B0B0B0" />
                <Text style={styles.noAppointmentsText}>Diyetisyen bulunamadı</Text>
                <Text style={styles.noAppointmentsSubtext}>Lütfen daha sonra tekrar deneyin</Text>
              </View>
            )}
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


      {/* Harita Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowMapModal(false)}
      >
        <View style={styles.dieticianModalOverlay}>
          <View style={styles.mapModalContent}>
            <View style={styles.dieticianModalHeader}>
              <Text style={styles.dieticianModalTitle}>Konum</Text>
              <TouchableOpacity onPress={() => setShowMapModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedDietician && selectedDietician.enlem && selectedDietician.boylam && (
              <View style={styles.mapContainer}>
                <Text style={styles.mapText}>
                  {selectedDietician.isim} {selectedDietician.soyisim} diyetisyeninin konumu:
                </Text>
                <Text style={styles.coordinatesText}>
                  Enlem: {selectedDietician.enlem.toFixed(6)}
                </Text>
                <Text style={styles.coordinatesText}>
                  Boylam: {selectedDietician.boylam.toFixed(6)}
                </Text>
                <TouchableOpacity
                  style={[styles.dieticianModalButton, styles.mapButton]}
                  onPress={() => {
                    const url = `https://maps.google.com/?q=${selectedDietician.enlem},${selectedDietician.boylam}`;
                    Linking.openURL(url);
                  }}
                >
                  <Ionicons name="map" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.modalButtonText}>Haritada Aç</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Font ailesi ayarları
const getFontFamily = () => {
  return Platform.OS === 'ios' ? 'System' : 'Roboto';
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F8FF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF',
    padding: 20,
    paddingTop: 140,
  },
  // Sabit Header Stilleri
  fixedHeader: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#4B6C4B',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(75, 108, 75, 0.1)',
    backdropFilter: 'blur(20px)',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    borderWidth: 3,
    borderColor: 'rgba(75, 108, 75, 0.2)',
  },
  profileImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(75, 108, 75, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 3,
    borderColor: 'rgba(75, 108, 75, 0.2)',
  },
  profileIcon: {
    fontSize: 24,
    color: '#4B6C4B',
  },
  userTextContainer: {
    flex: 1,
  },
  welcomeText: {
    color: '#2C5530',
    fontFamily: getFontFamily(),
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  userTypeText: {
    color: '#5A6B5A',
    fontFamily: getFontFamily(),
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(75, 108, 75, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    borderWidth: 2,
    borderColor: 'rgba(75, 108, 75, 0.15)',
    shadowColor: '#4B6C4B',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#4B6C4B',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(75, 108, 75, 0.1)',
  },
  appointmentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(75, 108, 75, 0.1)',
  },
  appointmentsTitle: {
    fontSize: 22,
    fontFamily: getFontFamily(),
    fontWeight: '700',
    color: '#2C5530',
    letterSpacing: 0.5,
  },
  refreshButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(75, 108, 75, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(75, 108, 75, 0.2)',
    shadowColor: '#4B6C4B',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
    backgroundColor: 'rgba(248, 255, 254, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 5,
    borderLeftColor: '#4B6C4B',
    borderWidth: 1,
    borderColor: 'rgba(75, 108, 75, 0.1)',
    shadowColor: '#4B6C4B',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
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
    paddingVertical: 40,
    backgroundColor: 'rgba(248, 255, 254, 0.5)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(75, 108, 75, 0.1)',
    borderStyle: 'dashed',
  },
  noAppointmentsText: {
    fontSize: 18,
    fontFamily: getFontFamily(),
    color: '#5A6B5A',
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  noAppointmentsSubtext: {
    fontSize: 14,
    fontFamily: getFontFamily(),
    color: '#8A9B8A',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  // İstatistik kartları stilleri
  statsContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#4B6C4B',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(75, 108, 75, 0.1)',
  },
  statsTitle: {
    fontSize: 22,
    fontFamily: getFontFamily(),
    fontWeight: '700',
    color: '#2C5530',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'linear-gradient(135deg, #F8FFFE 0%, #E8F5E8 100%)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(75, 108, 75, 0.1)',
    shadowColor: '#4B6C4B',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(75, 108, 75, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(75, 108, 75, 0.2)',
  },
  statNumber: {
    fontSize: 28,
    fontFamily: getFontFamily(),
    fontWeight: '800',
    color: '#2C5530',
    marginBottom: 6,
    textShadowColor: 'rgba(75, 108, 75, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: getFontFamily(),
    color: '#5A6B5A',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  // Diyetisyenim (kullanıcının diyetisyeni) stilleri
  myDieticianBox: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 25,
    marginBottom: 25,
    shadowColor: '#4B6C4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(75, 108, 75, 0.1)',
  },
  myDieticianHeader: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(75, 108, 75, 0.1)',
  },
  myDieticianTitle: {
    fontSize: 22,
    fontFamily: getFontFamily(),
    fontWeight: '700',
    color: '#2C5530',
    letterSpacing: 0.5,
  },
  myDieticianContent: {
    gap: 20,
  },
  myDieticianInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  myDieticianAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 20,
    borderWidth: 3,
    borderColor: 'rgba(75, 108, 75, 0.2)',
  },
  myDieticianAvatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(75, 108, 75, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    borderWidth: 3,
    borderColor: 'rgba(75, 108, 75, 0.2)',
  },
  myDieticianAvatarText: {
    color: '#4B6C4B',
    fontSize: 24,
    fontWeight: 'bold',
  },
  myDieticianDetails: {
    flex: 1,
  },
  myDieticianName: {
    fontSize: 20,
    fontFamily: getFontFamily(),
    fontWeight: '700',
    color: '#2C5530',
    marginBottom: 6,
  },
  myDieticianSpecialty: {
    fontSize: 15,
    fontFamily: getFontFamily(),
    color: '#4B6C4B',
    fontWeight: '600',
    marginBottom: 4,
  },
  myDieticianExperience: {
    fontSize: 14,
    fontFamily: getFontFamily(),
    color: '#666',
  },
  myDieticianContactSection: {
    backgroundColor: 'rgba(248, 255, 254, 0.8)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  myDieticianContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  myDieticianContactText: {
    fontSize: 14,
    fontFamily: getFontFamily(),
    color: '#666',
    flex: 1,
  },
  myDieticianMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4B6C4B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  myDieticianMapButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: getFontFamily(),
    fontWeight: '600',
  },
  // Diyetisyen listesi stilleri
  dieticiansBox: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 25,
    marginBottom: 25,
    shadowColor: '#4B6C4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(75, 108, 75, 0.1)',
  },
  dieticiansHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(75, 108, 75, 0.1)',
  },
  dieticiansTitle: {
    fontSize: 22,
    fontFamily: getFontFamily(),
    fontWeight: '700',
    color: '#2C5530',
    letterSpacing: 0.5,
  },
  dieticiansList: {
    maxHeight: 400,
  },
  dieticianItem: {
    backgroundColor: 'rgba(248, 255, 254, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(75, 108, 75, 0.1)',
    shadowColor: '#4B6C4B',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  dieticianInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dieticianAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(75, 108, 75, 0.2)',
  },
  dieticianAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(75, 108, 75, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(75, 108, 75, 0.2)',
  },
  dieticianAvatarText: {
    color: '#4B6C4B',
    fontSize: 20,
    fontWeight: 'bold',
  },
  dieticianDetails: {
    flex: 1,
  },
  dieticianName: {
    fontSize: 18,
    fontFamily: getFontFamily(),
    fontWeight: '700',
    color: '#2C5530',
    marginBottom: 4,
  },
  dieticianSpecialty: {
    fontSize: 14,
    fontFamily: getFontFamily(),
    color: '#4B6C4B',
    fontWeight: '600',
    marginBottom: 4,
  },
  dieticianExperience: {
    fontSize: 13,
    fontFamily: getFontFamily(),
    color: '#666',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dieticianLocation: {
    fontSize: 12,
    fontFamily: getFontFamily(),
    color: '#666',
    marginLeft: 4,
  },
  dieticianActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mapButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(75, 108, 75, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(75, 108, 75, 0.2)',
  },
  // Diyetisyen Modal stilleri
  dieticianModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dieticianModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxHeight: '80%',
  },
  mapModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxHeight: '70%',
  },
  dieticianModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dieticianModalTitle: {
    fontSize: 20,
    fontFamily: getFontFamily(),
    fontWeight: '700',
    color: '#2C5530',
  },
  dieticianModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 12,
  },
  mapContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  mapText: {
    fontSize: 16,
    fontFamily: getFontFamily(),
    color: '#2C5530',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  coordinatesText: {
    fontSize: 14,
    fontFamily: getFontFamily(),
    color: '#666',
    marginBottom: 8,
  },
});
