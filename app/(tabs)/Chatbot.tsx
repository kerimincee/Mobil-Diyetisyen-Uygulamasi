import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../supabaseClient';

const GEMINI_API_KEY = 'AIzaSyDF0l8JeAJ0a38qGmKd4yCX-ROG4NW8xrY';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=' + GEMINI_API_KEY;

export default function ChatbotScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Merhaba! Ben sizin diyet asistanınızım. Size nasıl yardımcı olabilirim?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Diyetisyen özellikleri için state'ler
  const [isDiyetisyen, setIsDiyetisyen] = useState(false);
  const [diyetisyenId, setDiyetisyenId] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [dietPlanModalVisible, setDietPlanModalVisible] = useState(false);
  const [generatedDietPlan, setGeneratedDietPlan] = useState<string>('');
  const [dietPlanLoading, setDietPlanLoading] = useState(false);
  const [addingToCalendar, setAddingToCalendar] = useState(false);
  
  // Tarih seçimi için state'ler
  const [dateSelectionModalVisible, setDateSelectionModalVisible] = useState(false);
  const [selectedDateForDiet, setSelectedDateForDiet] = useState<Date>(new Date());
  const [dietPlanToSave, setDietPlanToSave] = useState<any>(null);
  const [savingDietPlan, setSavingDietPlan] = useState(false);

  // Diyetisyen kontrolü
  useEffect(() => {
    checkUserType();
  }, []);

  // selectedClient değiştiğinde diyet planı oluştur
  useEffect(() => {
    if (selectedClient && !dietPlanModalVisible) {
      console.log('selectedClient değişti, diyet planı oluşturuluyor:', selectedClient);
      generateDietPlan();
    }
  }, [selectedClient]);

  const checkUserType = async () => {
    try {
      const currentDiyetisyen = await AsyncStorage.getItem('currentDiyetisyen');
      const userType = await AsyncStorage.getItem('userType');
      
      console.log('currentDiyetisyen:', currentDiyetisyen);
      console.log('userType:', userType);
      
      if (currentDiyetisyen && userType === 'dietician') {
        const diyetisyenData = JSON.parse(currentDiyetisyen);
        console.log('diyetisyenData:', diyetisyenData);
        setIsDiyetisyen(true);
        setDiyetisyenId(diyetisyenData.id);
        fetchClients(diyetisyenData.id);
      }
    } catch (error) {
      console.error('Kullanıcı tipi kontrol edilirken hata:', error);
    }
  };

  // Danışanları çek
  const fetchClients = async (diyetisyenId: string) => {
    try {
      console.log('fetchClients çağrıldı, diyetisyenId:', diyetisyenId);
      const { data: clientsData, error } = await supabase
        .from('users')
        .select('*')
        .eq('diyetisyen_id', diyetisyenId);

      console.log('clientsData:', clientsData);
      console.log('error:', error);

      if (error) {
        console.error('Danışanlar yüklenirken hata:', error);
      } else {
        setClients(clientsData || []);
        console.log('Danışanlar ayarlandı:', clientsData?.length || 0);
      }
    } catch (error) {
      console.error('Danışanlar yüklenirken hata:', error);
    }
  };

  // Diyet planı oluştur
  const generateDietPlan = async () => {
    console.log('generateDietPlan çağrıldı, selectedClient:', selectedClient);
    
    if (!selectedClient) {
      console.log('selectedClient bulunamadı, hata veriliyor');
      Alert.alert('Hata', 'Lütfen bir danışan seçin.');
      return;
    }

    console.log('generateDietPlan çağrıldı, selectedClient:', selectedClient);
    setDietPlanLoading(true);
    
    // Yükleme mesajını chat'e ekle
    const loadingMessage = { role: 'model', text: '🤖 Diyet planınız hazırlanıyor... Lütfen bekleyin.' };
    setMessages(prev => [...prev, loadingMessage]);
    
    try {
      const clientInfo = `
Danışan Bilgileri:
- Ad Soyad: ${selectedClient.isim} ${selectedClient.soyisim}
- Yaş: ${selectedClient.yas || 'Belirtilmemiş'}
- Cinsiyet: ${selectedClient.cinsiyet || 'Belirtilmemiş'}
- Boy: ${selectedClient.boy || 'Belirtilmemiş'} cm
- Kilo: ${selectedClient.kilo || 'Belirtilmemiş'} kg

Bu danışan için günlük bir diyet planı hazırla. Lütfen TAM OLARAK aşağıdaki formatta yaz:

Kahvaltı:
- [besin adı]
- [besin adı]

Ara Öğün 1:
- [besin adı]
- [besin adı]

Öğle Yemeği:
- [besin adı]
- [besin adı]

Ara Öğün 2:
- [besin adı]
- [besin adı]

Akşam Yemeği:
- [besin adı]
- [besin adı]

ÖNEMLİ: Başlıkları tam olarak yaz (Kahvaltı:, Ara Öğün 1:, Öğle Yemeği:, Ara Öğün 2:, Akşam Yemeği:). Sadece besin isimlerini yaz, miktar ve kalori bilgisi verme.
`;

      console.log('API çağrısı yapılıyor...');
      const res = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: clientInfo }] }
          ]
        })
      });

      const data = await res.json();
      console.log('API response:', data);
      
      // Yükleme mesajını kaldır
      setMessages(prev => prev.filter(msg => msg.text !== '🤖 Diyet planınız hazırlanıyor... Lütfen bekleyin.'));
      
      if (data.error) {
        console.error('API Hatası:', data.error);
        const errorMessage = { role: 'model', text: '❌ Diyet planı oluşturulurken bir hata oluştu: ' + data.error.message };
        setMessages(prev => [...prev, errorMessage]);
        Alert.alert('Hata', 'Diyet planı oluşturulurken bir hata oluştu: ' + data.error.message);
      } else {
        const dietPlan = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Diyet planı oluşturulamadı.';
        console.log('Oluşturulan diyet planı:', dietPlan);
        
        // Başarılı mesajını chat'e ekle
        const successMessage = { role: 'model', text: '✅ Diyet planınız hazır! Aşağıdaki butonları kullanarak takvime ekleyebilir veya yeni plan oluşturabilirsiniz.' };
        setMessages(prev => [...prev, successMessage]);
        
        setGeneratedDietPlan(dietPlan);
        setDietPlanModalVisible(true);
      }
    } catch (error) {
      console.error('Diyet planı oluşturma hatası:', error);
      
      // Yükleme mesajını kaldır
      setMessages(prev => prev.filter(msg => msg.text !== '🤖 Diyet planınız hazırlanıyor... Lütfen bekleyin.'));
      
      // Hata mesajını chat'e ekle
      const errorMessage = { role: 'model', text: '❌ Diyet planı oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.' };
      setMessages(prev => [...prev, errorMessage]);
      
      Alert.alert('Hata', 'Diyet planı oluşturulurken bir hata oluştu: ' + error);
    }
    setDietPlanLoading(false);
  };

  // Diyet planını takvime ekle
  const addDietPlanToCalendar = async () => {
    if (!selectedClient || !generatedDietPlan) return;

    console.log('addDietPlanToCalendar çağrıldı');
    console.log('selectedClient:', selectedClient);
    console.log('generatedDietPlan:', generatedDietPlan);

    // Diyet planını parçala
    const lines = generatedDietPlan.split('\n');
    let breakfast = '', snack1 = '', lunch = '', snack2 = '', dinner = '';
    let currentMeal = '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      const lowerLine = trimmedLine.toLowerCase();
      
      // Öğün başlıklarını tespit et
      if (lowerLine === 'kahvaltı:' || lowerLine === 'breakfast:') {
        currentMeal = 'breakfast';
        console.log('Kahvaltı tespit edildi');
        continue;
      } else if (lowerLine === 'ara öğün 1:' || lowerLine === 'snack 1:') {
        currentMeal = 'snack1';
        console.log('Ara öğün 1 tespit edildi');
        continue;
      } else if (lowerLine === 'öğle yemeği:' || lowerLine === 'lunch:') {
        currentMeal = 'lunch';
        console.log('Öğle tespit edildi');
        continue;
      } else if (lowerLine === 'ara öğün 2:' || lowerLine === 'snack 2:') {
        currentMeal = 'snack2';
        console.log('Ara öğün 2 tespit edildi');
        continue;
      } else if (lowerLine === 'akşam yemeği:' || lowerLine === 'dinner:') {
        currentMeal = 'dinner';
        console.log('Akşam tespit edildi');
        continue;
      }

      // Eğer bir öğün seçilmişse ve satır tire ile başlıyorsa, besin ismini çıkar
      if (currentMeal && trimmedLine.startsWith('-')) {
        // Tire'yi kaldır ve besin ismini al
        let foodItem = trimmedLine.substring(1).trim();
        
        // Sadece besin ismini al (miktar, kalori vb. kaldır)
        foodItem = extractFoodName(foodItem);
        
        if (foodItem) {
          console.log(`${currentMeal} öğününe eklenen besin: ${foodItem}`);
          switch (currentMeal) {
            case 'breakfast':
              breakfast += foodItem + '\n';
              break;
            case 'snack1':
              snack1 += foodItem + '\n';
              break;
            case 'lunch':
              lunch += foodItem + '\n';
              break;
            case 'snack2':
              snack2 += foodItem + '\n';
              break;
            case 'dinner':
              dinner += foodItem + '\n';
              break;
          }
        }
      }
    }

    // Diyet planı verilerini state'e kaydet
    const dietPlanData = {
      breakfast: breakfast.trim(),
      snack1: snack1.trim(),
      lunch: lunch.trim(),
      snack2: snack2.trim(),
      dinner: dinner.trim()
    };

    console.log('Parse edilen besinler:', dietPlanData);

    // Tarih seçim modal'ını aç
    setSelectedDateForDiet(new Date());
    setDietPlanToSave(dietPlanData);
    setDateSelectionModalVisible(true);
    setDietPlanModalVisible(false);
  };

  // Besin ismini çıkaran yardımcı fonksiyon
  const extractFoodName = (line: string): string => {
    // Gereksiz kelimeleri kaldır
    const removeWords = [
      'gram', 'g', 'ml', 'adet', 'dilim', 'kaşık', 'çay kaşığı', 'tatlı kaşığı', 'yemek kaşığı',
      'su bardağı', 'fincan', 'kase', 'porsiyon', 'kalori', 'kcal', 'protein', 'karbonhidrat', 'yağ',
      'vitamin', 'mineral', 'fiber', 'lif', 'şeker', 'tuz', 'sodyum', 'potasyum', 'kalsiyum',
      'demir', 'çinko', 'magnezyum', 'fosfor', 'selenyum', 'bakır', 'manganez', 'krom', 'molibden',
      'iyot', 'flor', 'klor', 'sülfür', 'kobalt', 'nikel', 'vanadyum', 'silikon', 'bor',
      'veya', 've', 'ile', 'birlikte', 'yanında', 'üzerine', 'içinde', 'arasında', 'kadar',
      'yaklaşık', 'ortalama', 'tahmini', 'yaklaşık', 'civarında', 'dolayında', 'kadar',
      'az', 'çok', 'fazla', 'az miktarda', 'bol miktarda', 'yeterli', 'yeterince',
      'taze', 'tazeliğinde', 'soğuk', 'sıcak', 'ılık', 'donmuş', 'konserve', 'kurutulmuş',
      'haşlanmış', 'kızartılmış', 'fırınlanmış', 'ızgara', 'sote', 'kavrulmuş', 'çiğ',
      'organik', 'doğal', 'katkısız', 'koruyucusuz', 'gluten', 'laktoz', 'şeker', 'tuz',
      'yağ', 'kalori', 'enerji', 'besin', 'gıda', 'yiyecek', 'içecek', 'meyve', 'sebze',
      'protein', 'karbonhidrat', 'yağ', 'vitamin', 'mineral', 'lif', 'fiber', 'antioksidan',
      'omega', 'doymuş', 'doymamış', 'trans', 'hidrojenize', 'rafine', 'işlenmiş', 'doğal',
      'tam', 'kepekli', 'beyaz', 'kahverengi', 'siyah', 'kırmızı', 'yeşil', 'sarı', 'turuncu',
      'mor', 'mavi', 'beyaz', 'gri', 'kahverengi', 'siyah', 'açık', 'koyu', 'orta',
      'büyük', 'küçük', 'orta boy', 'küçük boy', 'büyük boy', 'jumbo', 'mini', 'mikro',
      'ekstra', 'süper', 'ultra', 'mega', 'giga', 'nano', 'piko', 'femto', 'atto',
      'milyon', 'milyar', 'trilyon', 'katrilyon', 'kentilyon', 'seksilyon', 'septilyon',
      'oktilyon', 'nonilyon', 'desilyon', 'undesilyon', 'dodesilyon', 'tredesilyon',
      'katordesilyon', 'kendesilyon', 'seksdesilyon', 'septendesilyon', 'oktodesilyon',
      'novemdesilyon', 'vigintilyon', 'unvigintilyon', 'dovigintilyon', 'trevigintilyon',
      'katovigintilyon', 'kenvigintilyon', 'seksvigintilyon', 'septenvigintilyon',
      'oktovigintilyon', 'novemvigintilyon', 'trigintilyon', 'untrigintilyon',
      'dotrigintilyon', 'tretrigintilyon', 'katotrigintilyon', 'kentrigintilyon',
      'sekstrigintilyon', 'septentrigintilyon', 'oktotrigintilyon', 'novemtrigintilyon',
      'quadragintilyon', 'unquadragintilyon', 'doquadragintilyon', 'trequadragintilyon',
      'katoquadragintilyon', 'kenquadragintilyon', 'seksquadragintilyon', 'septenquadragintilyon',
      'oktoquadragintilyon', 'novemquadragintilyon', 'quinquagintilyon', 'unquinquagintilyon',
      'doquinquagintilyon', 'trequinquagintilyon', 'katoquinquagintilyon', 'kenquinquagintilyon',
      'seksquinquagintilyon', 'septenquinquagintilyon', 'oktoquinquagintilyon', 'novemquinquagintilyon',
      'sexagintilyon', 'unsexagintilyon', 'dosexagintilyon', 'tresexagintilyon', 'katosexagintilyon',
      'kensexagintilyon', 'sekssexagintilyon', 'septensexagintilyon', 'oktosexagintilyon',
      'novemsexagintilyon', 'septuagintilyon', 'unseptuagintilyon', 'doseptuagintilyon',
      'treseptuagintilyon', 'katoseptuagintilyon', 'kenseptuagintilyon', 'seksseptuagintilyon',
      'septenseptuagintilyon', 'oktoseptuagintilyon', 'novemseptuagintilyon', 'octogintilyon',
      'unoctogintilyon', 'dooctogintilyon', 'treoctogintilyon', 'katooctogintilyon',
      'kenoctogintilyon', 'seksoctogintilyon', 'septenoctogintilyon', 'oktooctogintilyon',
      'novemoctogintilyon', 'nonagintilyon', 'unnonagintilyon', 'dononagintilyon',
      'trenonagintilyon', 'katononagintilyon', 'kennonagintilyon', 'seksnonagintilyon',
      'septennonagintilyon', 'oktononagintilyon', 'novemnonagintilyon', 'centillion',
      'uncentillion', 'docentillion', 'trecentillion', 'katocentillion', 'kencentillion',
      'sekscentillion', 'septencentillion', 'oktocentillion', 'novemcentillion'
    ];

    let cleanedLine = line.toLowerCase();
    
    // Sayıları kaldır (Türkçe harfleri koru)
    cleanedLine = cleanedLine.replace(/\d+/g, ' '); // Sayıları boşlukla değiştir
    
    // Gereksiz kelimeleri kaldır
    removeWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      cleanedLine = cleanedLine.replace(regex, '');
    });
    
    // Özel karakterleri kaldır (Türkçe harfleri koru)
    cleanedLine = cleanedLine.replace(/[^\w\sçğıöşüÇĞIİÖŞÜ]/g, ' ');
    
    // Fazla boşlukları temizle
    cleanedLine = cleanedLine.replace(/\s+/g, ' ').trim();
    
    // İlk harfi büyük yap (Türkçe harfler için)
    if (cleanedLine.length > 0) {
      const firstChar = cleanedLine.charAt(0);
      const restOfString = cleanedLine.slice(1);
      
      // Türkçe harfleri doğru şekilde büyük harfe çevir
      let upperFirstChar = firstChar;
      if (firstChar === 'ç') upperFirstChar = 'Ç';
      else if (firstChar === 'ğ') upperFirstChar = 'Ğ';
      else if (firstChar === 'ı') upperFirstChar = 'I';
      else if (firstChar === 'ö') upperFirstChar = 'Ö';
      else if (firstChar === 'ş') upperFirstChar = 'Ş';
      else if (firstChar === 'ü') upperFirstChar = 'Ü';
      else upperFirstChar = firstChar.toUpperCase();
      
      cleanedLine = upperFirstChar + restOfString;
    }
    
    return cleanedLine;
  };

  // Diyet planını veritabanına kaydet
  const saveDietPlanToDatabase = async () => {
    if (!selectedClient || !dietPlanToSave || !selectedDateForDiet) return;

    setSavingDietPlan(true);
    try {
      const dateString = selectedDateForDiet.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('diet_plans')
        .upsert({
          user_id: selectedClient.id,
          date: dateString,
          breakfast: dietPlanToSave.breakfast,
          snack1: dietPlanToSave.snack1,
          lunch: dietPlanToSave.lunch,
          snack2: dietPlanToSave.snack2,
          dinner: dietPlanToSave.dinner
        }, { 
          onConflict: 'user_id,date',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error('Diyet planı kaydetme hatası:', error);
        Alert.alert('Hata', `Diyet planı kaydedilirken bir hata oluştu: ${error.message}`);
      } else {
        console.log('Diyet planı başarıyla kaydedildi:', data);
        Alert.alert(
          'Başarılı', 
          `${selectedClient.isim} ${selectedClient.soyisim} için diyet planı ${dateString} tarihine kaydedildi!`
        );
        
        // Modal'ları kapat ve state'leri temizle
        setDateSelectionModalVisible(false);
        setDietPlanModalVisible(false);
        setGeneratedDietPlan('');
        setSelectedClient(null);
        setDietPlanToSave(null);
        setSelectedDateForDiet(new Date());
      }
    } catch (error) {
      console.error('Diyet planı kaydetme hatası:', error);
      Alert.alert('Hata', 'Diyet planı kaydedilirken bir hata oluştu.');
    }
    setSavingDietPlan(false);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
            { role: 'user', parts: [{ text: input }] }
          ]
        })
      });
      const data = await res.json();
      if (data.error) {
        setMessages(prev => [...prev, { role: 'model', text: 'API Hatası: ' + (data.error.message || JSON.stringify(data.error)) }]);
      } else {
        let geminiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Bir hata oluştu.';
        setMessages(prev => [...prev, { role: 'model', text: geminiText }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: 'Bir hata oluştu. Lütfen tekrar deneyin.' }]);
    }
    setLoading(false);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View pointerEvents="none" style={styles.bgIconWrapper}>
        <Image source={require('@/assets/images/diyetasistani.png')} style={styles.bgIcon} />
      </View>
      <View style={styles.header}> 
        <Markdown style={markdownStyles.headerTitle}>Diyet Asistanı</Markdown>
      </View>
      <View style={styles.divider} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', paddingBottom: 16 }}
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg, idx) => (
            <View key={idx} style={[styles.messageRow, msg.role === 'user' ? styles.messageRowUser : styles.messageRowModel]}> 
              {msg.role === 'user' ? (
                <View style={[styles.avatarCircle, styles.avatarUser]}> 
                  <Ionicons name={'person'} size={28} color={'#fff'} />
                </View>
              ) : (
                <View style={[styles.avatarCircle, styles.avatarModel]}> 
                  <Image source={require('@/assets/images/diyetasistani.png')} style={styles.modelAvatarImg} />
                </View>
              )}
              <View style={[styles.messageBubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleModel]}> 
                <Markdown style={msg.role === 'user' ? markdownStyles.user : markdownStyles.model}>
                  {msg.text}
                </Markdown>
              </View>
            </View>
          ))}
          {loading && (
            <View style={styles.messageRowModel}>
              <View style={[styles.avatarCircle, styles.avatarModel]}>
                <Image source={require('@/assets/images/diyetasistani.png')} style={styles.modelAvatarImg} />
              </View>
              <View style={[styles.messageBubble, styles.bubbleModel]}>
                <ActivityIndicator size="small" color="#6b8e5e" />
              </View>
            </View>
          )}
        </ScrollView>
        
        {/* Diyetisyen için hazır mesaj butonu */}
        {isDiyetisyen && (
          <View style={styles.quickMessageContainer}>
            <TouchableOpacity 
              style={styles.quickMessageButton}
              onPress={() => {
                console.log('Diyet Hazırla butonuna tıklandı');
                console.log('isDiyetisyen:', isDiyetisyen);
                console.log('clients:', clients);
                setShowClientModal(true);
              }}
            >
              <Ionicons name="restaurant-outline" size={20} color="#fff" />
              <Text style={styles.quickMessageText}>Diyet Hazırla</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.inputBarWrapper, { paddingBottom: insets.bottom + 12, marginBottom: 12 }]}> 
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Mesajınızı yazın..."
              placeholderTextColor="#bdbdbd"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={sendMessage}
              editable={!loading}
              returnKeyType="send"
            />
            <Pressable style={styles.sendButton} onPress={sendMessage} disabled={loading || !input.trim()}>
              <Ionicons name="send" size={22} color="#fff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Danışan Seçimi Modal */}
      <Modal
        visible={showClientModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowClientModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Danışan Seçin</Text>
              <TouchableOpacity onPress={() => setShowClientModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.clientList}>
              {clients.map((client) => (
                <TouchableOpacity
                  key={client.id}
                  style={styles.clientItem}
                  onPress={() => {
                    setSelectedClient(client);
                    setShowClientModal(false);
                  }}
                >
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>
                      {client.isim} {client.soyisim}
                    </Text>
                    <Text style={styles.clientDetails}>
                      {client.yas ? `${client.yas} yaş` : ''} {client.cinsiyet ? `• ${client.cinsiyet}` : ''}
                      {client.boy ? ` • ${client.boy}cm` : ''} {client.kilo ? ` • ${client.kilo}kg` : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Diyet Planı Modal */}
      <Modal
        visible={dietPlanModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDietPlanModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedClient ? `${selectedClient.isim} ${selectedClient.soyisim} - Diyet Planı` : 'Diyet Planı'}
              </Text>
              <TouchableOpacity onPress={() => setDietPlanModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.dietPlanContent}>
              {dietPlanLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#467631" />
                  <Text style={styles.loadingText}>Diyet planınız hazırlanıyor...</Text>
                  <Text style={styles.loadingSubtext}>Bu işlem birkaç saniye sürebilir</Text>
                </View>
              ) : (
                <Text style={styles.dietPlanText}>{generatedDietPlan}</Text>
              )}
            </ScrollView>
            
            <View style={styles.dietPlanActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.addButton]}
                onPress={addDietPlanToCalendar}
                disabled={addingToCalendar}
              >
                {addingToCalendar ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="calendar-outline" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Takvime Ekle</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.refreshButton]}
                onPress={() => {
                  setDietPlanModalVisible(false);
                  generateDietPlan();
                }}
                disabled={dietPlanLoading}
              >
                {dietPlanLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="refresh-outline" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Yenile</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
              </Modal>

        {/* Tarih Seçimi Modal */}
        <Modal
          visible={dateSelectionModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setDateSelectionModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '60%' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedClient ? `${selectedClient.isim} ${selectedClient.soyisim} - Tarih Seçin` : 'Tarih Seçin'}
                </Text>
                <TouchableOpacity onPress={() => setDateSelectionModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.dateSelectionContent}>
                <Text style={styles.dateSelectionText}>
                  Diyet planını hangi tarihe kaydetmek istiyorsunuz?
                </Text>
                
                <View style={styles.datePickerContainer}>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => {
                      const newDate = new Date(selectedDateForDiet);
                      newDate.setDate(newDate.getDate() - 1);
                      setSelectedDateForDiet(newDate);
                    }}
                  >
                    <Ionicons name="chevron-back" size={24} color="#4B6C4B" />
                  </TouchableOpacity>
                  
                  <View style={styles.selectedDateDisplay}>
                    <Text style={styles.selectedDateText}>
                      {selectedDateForDiet.toLocaleDateString('tr-TR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => {
                      const newDate = new Date(selectedDateForDiet);
                      newDate.setDate(newDate.getDate() + 1);
                      setSelectedDateForDiet(newDate);
                    }}
                  >
                    <Ionicons name="chevron-forward" size={24} color="#4B6C4B" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.dietPlanActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => setDateSelectionModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>İptal</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.addButton]}
                  onPress={saveDietPlanToDatabase}
                  disabled={savingDietPlan}
                >
                  {savingDietPlan ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="calendar-outline" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Kaydet</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

const FONT_FAMILY = Platform.select({ ios: 'Nunito', android: 'Nunito', default: 'Nunito' });

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#23272f',
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  bgIconWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
    opacity: 0.10,
  },
  bgIcon: {
    width: 260,
    height: 260,
    resizeMode: 'contain',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    gap: 8,
  },
  divider: {
    height: 2,
    backgroundColor: '#3a3f47',
    marginBottom: 8,
    marginHorizontal: 24,
    borderRadius: 2,
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowModel: {
    justifyContent: 'flex-start',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    backgroundColor: 'transparent',
  },
  avatarUser: {
    backgroundColor: '#467631',
  },
  avatarModel: {
    backgroundColor: '#2e333d',
  },
  modelAvatarImg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    resizeMode: 'contain',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bubbleUser: {
    backgroundColor: '#467631',
    borderBottomRightRadius: 6,
    alignSelf: 'flex-end',
  },
  bubbleModel: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 6,
    alignSelf: 'flex-start',
  },
  inputBarWrapper: {
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2e333d',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontFamily: FONT_FAMILY,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  sendButton: {
    backgroundColor: '#6b8e5e',
    borderRadius: 16,
    padding: 8,
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Diyetisyen özellikleri için stiller
  quickMessageContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  quickMessageButton: {
    backgroundColor: '#467631',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 8,
  },
  quickMessageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#23272f',
    fontFamily: FONT_FAMILY,
  },
  clientList: {
    maxHeight: 400,
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#23272f',
    marginBottom: 4,
    fontFamily: FONT_FAMILY,
  },
  clientDetails: {
    fontSize: 14,
    color: '#666',
    fontFamily: FONT_FAMILY,
  },
  dietPlanContent: {
    maxHeight: 300,
    marginBottom: 16,
  },
  dietPlanText: {
    fontSize: 14,
    color: '#23272f',
    lineHeight: 20,
    fontFamily: FONT_FAMILY,
  },
  dietPlanActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButton: {
    backgroundColor: '#467631',
  },
  refreshButton: {
    backgroundColor: '#6b8e5e',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#467631',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: FONT_FAMILY,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    fontFamily: FONT_FAMILY,
  },
  // Tarih seçimi modal stilleri
  dateSelectionContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  dateSelectionText: {
    fontSize: 16,
    color: '#23272f',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: FONT_FAMILY,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  datePickerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6F0E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDateDisplay: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B6C4B',
    textAlign: 'center',
    fontFamily: FONT_FAMILY,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
});

const markdownStyles = {
  headerTitle: {
    body: {
      fontSize: 24,
      fontWeight: 'bold' as 'bold',
      color: '#6b8e5e',
      letterSpacing: 0.5,
      fontFamily: FONT_FAMILY,
      textAlign: 'center' as 'center',
    },
  },
  user: {
    body: {
      color: '#fff',
      fontSize: 15,
      fontFamily: FONT_FAMILY,
    },
    strong: { color: '#fff', fontWeight: 'bold' as 'bold' },
    em: { color: '#fff', fontStyle: 'italic' as 'italic' },
    heading1: { color: '#fff', fontSize: 18, fontWeight: 'bold' as 'bold' },
    heading2: { color: '#fff', fontSize: 17, fontWeight: 'bold' as 'bold' },
    heading3: { color: '#fff', fontSize: 16, fontWeight: 'bold' as 'bold' },
    bullet_list: { color: '#fff' },
    ordered_list: { color: '#fff' },
    list_item: { color: '#fff' },
  },
  model: {
    body: {
      color: '#23272f',
      fontSize: 15,
      fontFamily: FONT_FAMILY,
    },
    strong: { color: '#23272f', fontWeight: 'bold' as 'bold' },
    em: { color: '#23272f', fontStyle: 'italic' as 'italic' },
    heading1: { color: '#467631', fontSize: 18, fontWeight: 'bold' as 'bold' },
    heading2: { color: '#467631', fontSize: 17, fontWeight: 'bold' as 'bold' },
    heading3: { color: '#467631', fontSize: 16, fontWeight: 'bold' as 'bold' },
    bullet_list: { color: '#23272f' },
    ordered_list: { color: '#23272f' },
    list_item: { color: '#23272f' },
  },
}; 