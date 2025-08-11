import { ThemedText } from '@/components/ThemedText';
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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

export default function HomeScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [aboutVisible, setAboutVisible] = useState(false);
  const [contactVisible, setContactVisible] = useState(false);
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const { setShowLoading } = useLoading();

  // Giriş kontrolü: Auth user yoksa giriş ekranına yönlendir
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/GirisScreen');
      }
    })();
  }, []);

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
        const session = await supabase.auth.getSession();
        if (session.data.session) {
          const userEmail = session.data.session.user.email;
          const { data, error } = await supabase
            .from('users')
            .select('isim')
            .eq('eposta', userEmail)
            .single();
          if (data && data.isim) {
            setUserName(data.isim);
            setIsLoggedIn(true);
          } else {
            setUserName(null);
            setIsLoggedIn(false);
          }
        } else {
          setUserName(null);
          setIsLoggedIn(false);
        }
        setShowLoading(false);
      }
      checkSession();
    }, [router])
  );

  useFocusEffect(
    React.useCallback(() => {
      async function fetchUser() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
          if (data) setUser(data);
          else setUser(null);
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
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Giriş yapmışsa profil sayfasına yönlendirme veya başka bir işlem yapılabilir
    } else {
      router.push('../GirisScreen');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('rememberedEmail');
    await AsyncStorage.removeItem('rememberedPassword');
    setUserMenuVisible(false);
    router.replace('/GirisScreen');
  };

  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = (currentIndex + 1) % images.length;
      scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
      setCurrentIndex(nextIndex);
    }, AUTO_SCROLL_INTERVAL);
    return () => clearInterval(interval);
  }, [currentIndex]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(newIndex);
  };

  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  if (!fontsLoaded) {
    return null;
  }

  // const ListHeader = () => (
  //   <View style={{paddingHorizontal: 20, paddingTop: 10, marginBottom: 10}}>
  //     <View style={{flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center'}}>
  //       <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center', backgroundColor: '#E6F0E6', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6}} onPress={handleProfilePress}>
  //         {user ? (
  //           <>
  //             <ThemedText style={{color: '#4B6C4B', fontWeight: 'bold', marginRight: 8, fontSize: 16}}>{user.isim}</ThemedText>
  //             <Image source={require('../../assets/images/profil.png')} style={{width: 28, height: 28, borderRadius: 14}} />
  //           </>
  //         ) : (
  //           <>
  //             <ThemedText style={{color: '#4B6C4B', fontWeight: 'bold', marginRight: 8, fontSize: 16}}>Giriş Yap</ThemedText>
  //             <Image source={require('../../assets/images/profil.png')} style={{width: 28, height: 28, borderRadius: 14}} />
  //           </>
  //         )}
  //       </TouchableOpacity>
  //     </View>
  //   </View>
  // );

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
              <Text style={{ color: '#4B6C4B', fontWeight: 'bold', fontSize: 15 }}>Merhaba! {user.isim}</Text>
            </View>
          </TouchableOpacity>
          {userMenuVisible && (
            <View style={{ position: 'absolute', top: 90, left: 18, zIndex: 30, backgroundColor: '#fff', borderRadius: 18, paddingVertical: 12, paddingHorizontal: 24, shadowColor: '#4B6C4B', shadowOpacity: 0.13, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 6, minWidth: 180 }}>
              {/* Kullanıcı bilgi alanı */}
              <TouchableOpacity onPress={() => { setUserMenuVisible(false); router.push('/Profile'); }} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, marginBottom: 10 }}>
                <Text style={{ fontSize: 24, marginRight: 8 }}>👤</Text>
                <View>
                  <Text style={{ color: '#4B6C4B', fontWeight: 'bold', fontSize: 15 }}>{user.isim}</Text>
                  <Text style={{ color: '#4B6C4B', fontSize: 13 }}>Profili Gör</Text>
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
      {/* <ListHeader /> */}
      <View style={styles.container}>
        {/* Motivasyon kutusunu biraz aşağıya aldık */}
        <View style={{ height: 8 }} />
        <View style={styles.motivationBox}>
          <Text style={styles.motivationTitleSmall}>Günün Motivasyonu</Text>
          <Text style={styles.motivationTextSmall}>{motivation}</Text>
        </View>
        <ScrollView contentContainerStyle={{ alignItems: 'center' }} showsVerticalScrollIndicator={false}>
          {/* SLIDER */}
          <View style={styles.sliderWrapper}>
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
              style={styles.slider}
            >
              {images.map((img, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <View key={idx} style={styles.sliderImageWrapper}>
                    <Image
                      source={img}
                      style={[
                        styles.sliderImage,
                        isActive && styles.sliderImageActive,
                      ]}
                      contentFit="cover"
                    />
                    {/* Gradient Overlay */}
                    <LinearGradient
                      colors={["rgba(255,255,255,0.85)", "rgba(255,255,255,0)"]}
                      style={styles.gradientOverlay}
                      pointerEvents="none"
                    />
                  </View>
                );
              })}
            </ScrollView>
            <View style={styles.dotsContainer}>
              {images.map((_, idx) => (
                <View
                  key={idx}
                  style={[styles.dot, currentIndex === idx && styles.activeDot]}
                />
              ))}
            </View>
          </View>
          {/* BAŞLIK ve HOŞGELDİNİZ */}
          <Text style={styles.welcomeTitle}>Hoş Geldiniz!</Text>
          {/* AÇIKLAMA KUTUSU */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Beslenme alışkanlıklarınızı düzenlemek, ideal kilonuza ulaşmak ve daha enerjik bir yaşam sürmek ister misiniz?{"\n"}
              DiyetAPP sizin yanınızda!
            </Text>
          </View>
          {/* BUTONLAR */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={() => setContactVisible(true)}>
              <Text style={styles.buttonText}>Bize Ulaşın</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => setAboutVisible(true)}>
              <Text style={styles.buttonText}>Hakkımızda</Text>
            </TouchableOpacity>
          </View>
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
      </View>
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
  },
  slider: {
    flexGrow: 0,
  },
  sliderImageWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderImage: {
    width: width * 0.9,
    height: 180,
    borderRadius: 32,
    marginHorizontal: width * 0.05,
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
    width: width * 0.9,
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
});
