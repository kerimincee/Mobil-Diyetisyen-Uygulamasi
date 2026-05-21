import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { addMeal } from '../../services/mealService';
import { getDiyetisyenDanisanlariMeals } from '../../services/userService';

const GEMINI_API_KEY = 'AIzaSyDF0l8JeAJ0a38qGmKd4yCX-ROG4NW8xrY';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=' + GEMINI_API_KEY;

interface Meal {
  id: string;
  food_name: string;
  calorie: number;
  image_url?: string;
  created_at: string;
  users: {
    id: string;
    isim: string;
    soyisim: string;
    eposta: string;
    profil_foto?: string;
  };
}

export default function Kalori() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDiyetisyen, setIsDiyetisyen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [danisanMeals, setDanisanMeals] = useState<Meal[]>([]);
  const [mealsLoading, setMealsLoading] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Sayfa yüklendiğinde kullanıcı kontrolü
  useEffect(() => {
    checkUserLogin();
  }, []);

  const checkUserLogin = async () => {
    try {
      const currentUserStr = await AsyncStorage.getItem('currentUser');
      const currentDiyetisyenStr = await AsyncStorage.getItem('currentDiyetisyen');
      const userType = await AsyncStorage.getItem('userType');
      
      // Önce diyetisyen kontrolü yap
      if (currentDiyetisyenStr && userType === 'dietician') {
        const diyetisyenData = JSON.parse(currentDiyetisyenStr);
        if (diyetisyenData.id) {
          setIsLoggedIn(true);
          setIsDiyetisyen(true);
          setCurrentUser(diyetisyenData);
          console.log('Diyetisyen giriş yapmış:', diyetisyenData.eposta, 'ID:', diyetisyenData.id);
          // Diyetisyen danışanlarının yemeklerini yükle
          loadDanisanMeals(diyetisyenData.id);
          return;
        }
      }
      
      // Normal kullanıcı kontrolü
      if (currentUserStr && userType !== 'dietician') {
        const userData = JSON.parse(currentUserStr);
        if (userData.id) {
          setIsLoggedIn(true);
          setIsDiyetisyen(false);
          setCurrentUser(userData);
          console.log('Kullanıcı giriş yapmış:', userData.eposta, 'ID:', userData.id);
        } else {
          setIsLoggedIn(false);
          setIsDiyetisyen(false);
          console.log('Kullanıcı ID bilgisi eksik');
        }
      } else {
        setIsLoggedIn(false);
        setIsDiyetisyen(false);
        console.log('Kullanıcı giriş yapmamış');
      }
    } catch (error) {
      console.error('Kullanıcı kontrolü hatası:', error);
      setIsLoggedIn(false);
      setIsDiyetisyen(false);
    }
  };

  // Diyetisyen danışanlarının yemeklerini yükleme
  const loadDanisanMeals = async (diyetisyenId: string) => {
    setMealsLoading(true);
    try {
      const meals = await getDiyetisyenDanisanlariMeals(diyetisyenId);
      setDanisanMeals(meals);
      console.log('Danışan yemekleri yüklendi:', meals.length);
    } catch (error) {
      console.error('Danışan yemekleri yükleme hatası:', error);
    }
    setMealsLoading(false);
  };

  // --- YENİLEME FONKSİYONU ---
  const handleRefresh = () => {
    setImage(null);
    setResult('');
    setLoading(false);
    setMessages([]);
    setInput('');
    setSaveLoading(false);
    setSaveSuccess(null);
    if (isDiyetisyen && currentUser) {
      loadDanisanMeals(currentUser.id);
    }
  };

  // Fotoğraf seçme
  const pickImageFromGallery = async () => {
    // Galeri izni iste
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Galeri izni verilmedi!');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });
    setPickerVisible(false); // İşlem bittikten sonra modalı kapat
    if (!result.canceled && result.assets && result.assets[0].base64) {
      setImage('data:image/jpeg;base64,' + result.assets[0].base64);
      setResult('');
    }
  };

  const takePhotoWithCamera = async () => {
    // Kamera izni iste
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Kamera izni verilmedi!');
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });
    setPickerVisible(false); // İşlem bittikten sonra modalı kapat
    if (!result.canceled && result.assets && result.assets[0].base64) {
      setImage('data:image/jpeg;base64,' + result.assets[0].base64);
      setResult('');
    }
  };

  // Gemini Vision API ile fotoğraftan kalori tahmini ve otomatik kaydetme
  const analyzeImage = async () => {
    if (!image) return;
    setLoading(true);
    setResult('');
    setSaveSuccess(null);
    
    try {
      const body = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: image.replace('data:image/jpeg;base64,', ''),
                },
              },
              {
                text: 'Bu yemeğin adını ve yaklaşık kalorisini Türkçe olarak kısa ve net bir şekilde belirt.'
              }
            ],
          },
        ],
      };
      const res = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      console.log('Gemini yanıtı:', data);
      let geminiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Bir hata oluştu.';
      setResult(geminiText);
      
      // Kalori analizi başarılıysa ve kullanıcı giriş yapmışsa otomatik olarak kaydet
      if (geminiText && !geminiText.includes('Bir hata oluştu') && isLoggedIn) {
        console.log('Otomatik kaydetme başlıyor...');
        await handleSaveMeal(geminiText);
      } else if (!isLoggedIn) {
        console.log('Kullanıcı giriş yapmamış, kaydetme yapılmayacak');
      }
    } catch (e) {
      console.log('Gemini hata:', e);
      setResult('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
    setLoading(false);
  };

  // Yemeği kaydet fonksiyonu
  const handleSaveMeal = async (geminiResult?: string) => {
    console.log('handleSaveMeal çağrıldı, geminiResult:', geminiResult);
    setSaveLoading(true);
    setSaveSuccess(null);
    try {
      const currentUserStr = await AsyncStorage.getItem('currentUser');
      console.log('AsyncStorage currentUser:', currentUserStr);
      
      if (!currentUserStr) {
        console.log('Kullanıcı bulunamadı');
        return;
      }
      
      const userData = JSON.parse(currentUserStr);
      console.log('User data:', userData);
      
      if (!userData.id) {
        console.log('Kullanıcı ID bilgisi eksik');
        return;
      }
      
      // Yemek adı ve kalori Gemini'den gelen metinden ayrıştırılmalı
      // Basit bir ayrıştırma: ilk cümlede yemek adı, ikinci cümlede kalori aralığı
      let food_name = '';
      let calorie = null;
      const resultText = geminiResult || result;
      
      if (resultText) {
        const match = resultText.match(/^(.*?)[\.!?]\s*(.*?kalori.*?)(\d+[\-–]?\d*)?/i);
        food_name = match?.[1]?.replace(/^Bu[,\s]*/i, '').trim() || 'Yemek';
        const calMatch = resultText.match(/(\d+[\-–]?\d*)\s*kalori/);
        if (calMatch) {
          const calStr = calMatch[1];
          if (calStr.includes('-') || calStr.includes('–')) {
            // aralık varsa ortalamasını al
            const [min, max] = calStr.split(/[-–]/).map(Number);
            calorie = Math.round((min + max) / 2);
          } else {
            calorie = Number(calStr);
          }
        }
      }
      
      console.log('Yemek kaydediliyor:', {
        food_name,
        calorie: calorie ?? 0,
        user_id: userData.id
      });
      
      console.log('addMeal çağrılıyor...');
      await addMeal({
        food_name,
        calorie: calorie ?? 0,
        image_url: image || undefined,
        user_id: userData.id, // UUID'yi user_id olarak kullan
      });
      console.log('addMeal başarılı!');
      // setSaveSuccess('Yemek başarıyla kaydedildi!'); // Mesajı kaldırdık
    } catch (e: any) {
      console.error('Kalori kaydetme hatası:', e);
      console.error('Hata detayları:', {
        message: e.message,
        code: e.code,
        details: e.details,
        hint: e.hint
      });
      // setSaveSuccess('Kayıt hatası: ' + (e.message || 'Bilinmeyen hata.')); // Hata mesajını da kaldırdık
    }
    console.log('handleSaveMeal tamamlandı');
    setSaveLoading(false);
  };

  // Tarih formatla
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Detay modalını aç
  const openDetailModal = (meal: Meal) => {
    setSelectedMeal(meal);
    setDetailModalVisible(true);
  };

  // Detay modalını kapat
  const closeDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedMeal(null);
  };

  // Diyetisyen için danışan yemekleri görüntüleme
  if (isDiyetisyen) {
    return (
      <LinearGradient colors={["#F8FAF7", "#E6F0E6"]} style={{ flex: 1 }}>
        {/* Sağ üstte yenileme butonu */}
        <TouchableOpacity
          style={{ position: 'absolute', top: 65, right: 24, zIndex: 10, borderRadius: 22, padding: 8, shadowColor: '#4B6C4B', shadowOpacity: 0.13, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 }}
          onPress={handleRefresh}
          activeOpacity={0.7}
          accessibilityLabel="Sayfayı yenile"
        >
          <Ionicons name="refresh" size={26} color="#4B6C4B" />
        </TouchableOpacity>

        <View style={styles.container}>
          <Text style={styles.title}>Danışan Yemekleri</Text>
          <View style={styles.divider} />
          <Text style={styles.subtitle}>Danışanlarınızın kaydettiği yemekler</Text>

          {mealsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4B6C4B" />
              <Text style={styles.loadingText}>Yemekler yükleniyor...</Text>
            </View>
          ) : danisanMeals.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={60} color="#A0BFA0" />
              <Text style={styles.emptyText}>Henüz yemek kaydı bulunmuyor</Text>
              <Text style={styles.emptySubtext}>Danışanlarınız yemek fotoğrafı yüklediğinde burada görünecek</Text>
            </View>
          ) : (
            <ScrollView style={styles.chatContainer} showsVerticalScrollIndicator={false}>
              {danisanMeals.map((meal) => (
                <TouchableOpacity 
                  key={meal.id} 
                  style={styles.mealMessage}
                  onPress={() => openDetailModal(meal)}
                  activeOpacity={0.8}
                >
                  <View style={styles.mealHeader}>
                    <View style={styles.userInfo}>
                      {meal.users.profil_foto ? (
                        <Image source={{ uri: meal.users.profil_foto }} style={styles.userAvatar} />
                      ) : (
                        <View style={styles.userAvatarPlaceholder}>
                          <Ionicons name="person" size={20} color="#4B6C4B" />
                        </View>
                      )}
                      <View>
                        <Text style={styles.userName}>{meal.users.isim} {meal.users.soyisim}</Text>
                        <Text style={styles.mealTime}>{formatDate(meal.created_at)}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.mealContent}>
                    {meal.image_url && (
                      <Image source={{ uri: meal.image_url }} style={styles.mealImage} />
                    )}
                    <View style={styles.mealDetails}>
                      <Text style={styles.foodName}>{meal.food_name}</Text>
                      <View style={styles.calorieInfo}>
                        <Ionicons name="flame" size={16} color="#FF6B6B" />
                        <Text style={styles.calorieText}>{meal.calorie} kalori</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Detay Modal */}
        <Modal
          visible={detailModalVisible}
          transparent
          animationType="slide"
          onRequestClose={closeDetailModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.detailModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Yemek Detayı</Text>
                <TouchableOpacity onPress={closeDetailModal} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#4B6C4B" />
                </TouchableOpacity>
              </View>

              {selectedMeal && (
                <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                  {/* Danışan Bilgileri */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Danışan Bilgileri</Text>
                    <View style={styles.clientInfoRow}>
                      {selectedMeal.users.profil_foto ? (
                        <Image source={{ uri: selectedMeal.users.profil_foto }} style={styles.modalUserAvatar} />
                      ) : (
                        <View style={styles.modalUserAvatarPlaceholder}>
                          <Ionicons name="person" size={24} color="#4B6C4B" />
                        </View>
                      )}
                      <View style={styles.modalUserInfo}>
                        <Text style={styles.modalUserName}>{selectedMeal.users.isim} {selectedMeal.users.soyisim}</Text>
                        <Text style={styles.modalUserEmail}>{selectedMeal.users.eposta}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Yemek Fotoğrafı */}
                  {selectedMeal.image_url && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Yemek Fotoğrafı</Text>
                      <Image source={{ uri: selectedMeal.image_url }} style={styles.modalMealImage} />
                    </View>
                  )}

                  {/* Yemek Bilgileri */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Yemek Bilgileri</Text>
                    <View style={styles.mealInfoGrid}>
                      <View style={styles.mealInfoItem}>
                        <Ionicons name="restaurant" size={20} color="#4B6C4B" />
                        <Text style={styles.mealInfoLabel}>Yemek Adı</Text>
                        <Text style={styles.mealInfoValue}>{selectedMeal.food_name}</Text>
                      </View>
                      <View style={styles.mealInfoItem}>
                        <Ionicons name="flame" size={20} color="#FF6B6B" />
                        <Text style={styles.mealInfoLabel}>Kalori</Text>
                        <Text style={styles.mealInfoValue}>{selectedMeal.calorie} kcal</Text>
                      </View>
                      <View style={styles.mealInfoItem}>
                        <Ionicons name="time" size={20} color="#4B6C4B" />
                        <Text style={styles.mealInfoLabel}>Kayıt Tarihi</Text>
                        <Text style={styles.mealInfoValue}>{formatDate(selectedMeal.created_at)}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Beslenme Değerlendirmesi */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Beslenme Değerlendirmesi</Text>
                    <View style={styles.nutritionAssessment}>
                      <View style={styles.assessmentItem}>
                        <Text style={styles.assessmentLabel}>Kalori Değerlendirmesi</Text>
                        <View style={styles.assessmentBar}>
                          <View 
                            style={[
                              styles.assessmentFill, 
                              { 
                                width: `${Math.min((selectedMeal.calorie / 800) * 100, 100)}%`,
                                backgroundColor: selectedMeal.calorie > 600 ? '#FF6B6B' : selectedMeal.calorie > 400 ? '#FFA500' : '#4CAF50'
                              }
                            ]} 
                          />
                        </View>
                        <Text style={styles.assessmentText}>
                          {selectedMeal.calorie > 600 ? 'Yüksek kalorili' : selectedMeal.calorie > 400 ? 'Orta kalorili' : 'Düşük kalorili'} yemek
                        </Text>
                      </View>
                    </View>
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </LinearGradient>
    );
  }

  // Normal kullanıcı için mevcut arayüz
  return (
    <LinearGradient colors={["#F8FAF7", "#E6F0E6"]} style={{ flex: 1 }}>
      {/* Sağ üstte yenileme butonu */}
      <TouchableOpacity
        style={{ position: 'absolute', top: 65, right: 24, zIndex: 10, borderRadius: 22, padding: 8, shadowColor: '#4B6C4B', shadowOpacity: 0.13, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 }}
        onPress={handleRefresh}
        activeOpacity={0.7}
        accessibilityLabel="Sayfayı yenile"
      >
        <Ionicons name="refresh" size={26} color="#4B6C4B" />
      </TouchableOpacity>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Kalori Hesaplama</Text>
          <View style={styles.divider} />
          <Text style={styles.subtitle}>Yemek fotoğrafını yükle, Diyet Asistanı ile kalorisini öğren!</Text>
          <TouchableOpacity style={styles.imagePicker} onPress={() => setPickerVisible(true)} activeOpacity={0.8}>
            {image ? (
              <Image source={{ uri: image }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={60} color="#A0BFA0" style={{ marginBottom: 8, opacity: 0.7 }} />
                <Text style={{ color: '#A0BFA0', fontWeight: 'bold', fontSize: 16 }}>Fotoğraf Yükle</Text>
              </View>
            )}
          </TouchableOpacity>
          {/* Fotoğraf seçme modalı */}
          <Modal
            visible={pickerVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setPickerVisible(false)}
          >
            <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' }} onPress={() => setPickerVisible(false)} />
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 24, alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#4B6C4B', marginBottom: 18 }}>Fotoğraf Ekle</Text>
              <TouchableOpacity style={{ width: '100%', padding: 14, borderRadius: 10, backgroundColor: '#E6F0E6', alignItems: 'center', marginBottom: 10 }} onPress={pickImageFromGallery}>
                <Ionicons name="images-outline" size={22} color="#4B6C4B" style={{ marginBottom: 4 }} />
                <Text style={{ color: '#4B6C4B', fontWeight: 'bold', fontSize: 16 }}>Galeriden Seç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ width: '100%', padding: 14, borderRadius: 10, backgroundColor: '#E6F0E6', alignItems: 'center' }} onPress={takePhotoWithCamera}>
                <Ionicons name="camera-outline" size={22} color="#4B6C4B" style={{ marginBottom: 4 }} />
                <Text style={{ color: '#4B6C4B', fontWeight: 'bold', fontSize: 16 }}>Kamera ile Çek</Text>
              </TouchableOpacity>
            </View>
          </Modal>
          {image && (
            <TouchableOpacity style={styles.analyzeButton} onPress={analyzeImage} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.analyzeButtonText}>Fotoğraftan Kalori Hesapla ve Kaydet</Text>}
            </TouchableOpacity>
          )}
          {result ? (
            <View style={styles.resultBox}>
              <Ionicons name="restaurant" size={32} color="#4B6C4B" style={{ marginBottom: 6 }} />
              <Text style={styles.resultTitle}>Sonuç</Text>
              <Markdown style={markdownStyles}>{result}</Markdown>
              {!isLoggedIn && (
                <View style={styles.warningBox}>
                  <Ionicons name="warning" size={20} color="#FF6B6B" style={{ marginRight: 8 }} />
                  <Text style={styles.warningText}>Yemeği kaydetmek için giriş yapmalısınız!</Text>
                </View>
              )}
              {/* saveSuccess mesajını kaldırdık */}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
    paddingTop: 50, // üstte daha fazla boşluk
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#4B6C4B',
    marginTop: 24,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  
  divider: {
    width: '70%',
    height: 2,
    backgroundColor: '#E6F0E6',
    alignSelf: 'center',
    marginBottom: 16,
    borderRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#4B6C4B',
    marginBottom: 32,
    textAlign: 'center',
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  imagePicker: {
    width: 230,
    height: 230,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E6F0E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    overflow: 'hidden',
    shadowColor: '#4B6C4B',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  image: {
    width: 230,
    height: 230,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  analyzeButton: {
    backgroundColor: '#4B6C4B',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginBottom: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4B6C4B',
    shadowOpacity: 0.13,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  resultBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 22,
    marginBottom: 22,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#4B6C4B',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4B6C4B',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 17,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  chatContainer: {
    width: '100%',
    marginTop: 18,
    backgroundColor: '#E6F0E6',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#4B6C4B',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B6C4B',
    marginBottom: 10,
  },
  chatBox: {
    minHeight: 60,
    maxHeight: 180,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#4B6C4B',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  messageRow: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 2,
  },
  userMsg: {
    alignSelf: 'flex-end',
    backgroundColor: '#4B6C4B',
    borderRadius: 12,
    padding: 10,
    marginLeft: 40,
    marginRight: 0,
    flexDirection: 'row',
  },
  botMsg: {
    alignSelf: 'flex-start',
    backgroundColor: '#E6F0E6',
    borderRadius: 12,
    padding: 10,
    marginLeft: 0,
    marginRight: 40,
    borderWidth: 1,
    borderColor: '#CDE6C1',
    flexDirection: 'row',
  },
  userText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  botText: {
    color: '#4B6C4B',
    fontSize: 15,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    
  },
  input: {
    flex: 1,
    height: 46,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E6F0E6',
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#4B6C4B',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4B6C4B',
    shadowOpacity: 0.10,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  warningBox: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FFE5E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#4B6C4B',
    fontSize: 18,
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#4B6C4B',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },
  emptySubtext: {
    color: '#4B6C4B',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 5,
  },
  mealMessage: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#4B6C4B',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  userAvatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E6F0E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4B6C4B',
  },
  mealTime: {
    fontSize: 12,
    color: '#A0BFA0',
    marginTop: 2,
  },
  mealContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
  },
  mealDetails: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  calorieInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calorieText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E6F0E6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4B6C4B',
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 25,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B6C4B',
    marginBottom: 15,
  },
  clientInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
  },
  modalUserAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  modalUserAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E6F0E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  modalUserInfo: {
    flex: 1,
  },
  modalUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  modalUserEmail: {
    fontSize: 14,
    color: '#666',
  },
  modalMealImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  mealInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  mealInfoItem: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  mealInfoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 5,
  },
  mealInfoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4B6C4B',
    textAlign: 'center',
  },
  nutritionAssessment: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
  },
  assessmentItem: {
    marginBottom: 10,
  },
  assessmentLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  assessmentBar: {
    height: 8,
    backgroundColor: '#E6F0E6',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  assessmentFill: {
    height: '100%',
    borderRadius: 4,
  },
  assessmentText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

const markdownStyles = {
  text: {
    color: '#222',
    fontSize: 16,
    fontWeight: '700' as '700',
    textAlign: 'center' as const,
    lineHeight: 28,
    letterSpacing: 0.1,
  },
  strong: {
    color: '#4B6C4B',
    fontWeight: '700' as '700',
  },
  
}; 
