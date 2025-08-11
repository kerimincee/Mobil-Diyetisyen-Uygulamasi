import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { addMeal } from '../../services/mealService';
import { supabase } from '../../supabaseClient';

const GEMINI_API_KEY = 'AIzaSyDF0l8JeAJ0a38qGmKd4yCX-ROG4NW8xrY';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=' + GEMINI_API_KEY;

export default function Kalori() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  // --- YENİLEME FONKSİYONU ---
  const handleRefresh = () => {
    setImage(null);
    setResult('');
    setLoading(false);
    setMessages([]);
    setInput('');
    setSaveLoading(false);
    setSaveSuccess(null);
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

  // Gemini Vision API ile fotoğraftan kalori tahmini
  const analyzeImage = async () => {
    if (!image) return;
    setLoading(true);
    setResult('');
    // Sohbet kaldırıldı
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
      // Sohbet kaldırıldı
    } catch (e) {
      console.log('Gemini hata:', e);
      setResult('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
    setLoading(false);
  };

  // Chatbot ile metinli soru
  // const sendMessage = async () => {
  //   if (!input.trim()) return;
  //   setMessages(prev => [...prev, { role: 'user', text: input }]);
  //   setLoading(true);
  //   try {
  //     const body = {
  //       contents: [
  //         ...messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] })),
  //         { role: 'user', parts: [{ text: input }] },
  //       ],
  //     };
  //     const res = await fetch(GEMINI_API_URL, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(body),
  //     });
  //     const data = await res.json();
  //     let geminiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Bir hata oluştu.';
  //     setMessages(prev => [...prev, { role: 'bot', text: geminiText }]);
  //   } catch (e) {
  //     setMessages(prev => [...prev, { role: 'bot', text: 'Bir hata oluştu. Lütfen tekrar deneyin.' }]);
  //   }
  //   setInput('');
  //   setLoading(false);
  // };

  // Yemeği kaydet fonksiyonu
  const handleSaveMeal = async () => {
    setSaveLoading(true);
    setSaveSuccess(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı.');
      // Yemek adı ve kalori Gemini'den gelen metinden ayrıştırılmalı
      // Basit bir ayrıştırma: ilk cümlede yemek adı, ikinci cümlede kalori aralığı
      let food_name = '';
      let calorie = null;
      if (result) {
        const match = result.match(/^(.*?)[\.!?]\s*(.*?kalori.*?)(\d+[\-–]?\d*)?/i);
        food_name = match?.[1]?.replace(/^Bu[,\s]*/i, '').trim() || 'Yemek';
        const calMatch = result.match(/(\d+[\-–]?\d*)\s*kalori/);
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
      await addMeal({
        food_name,
        calorie: calorie ?? 0,
        image_url: image || undefined,
        user_id: user.id,
      });
      setSaveSuccess('Yemek başarıyla kaydedildi!');
    } catch (e: any) {
      setSaveSuccess('Kayıt hatası: ' + (e.message || 'Bilinmeyen hata.'));
    }
    setSaveLoading(false);
  };

  return (
    <LinearGradient colors={["#F8FAF7", "#E6F0E6"]} style={{ flex: 1 }}>
      {/* Sağ üstte yenileme butonu */}
      <TouchableOpacity
        style={{ position: 'absolute', top: 44, right: 24, zIndex: 10, backgroundColor: '#fff', borderRadius: 22, padding: 8, shadowColor: '#4B6C4B', shadowOpacity: 0.13, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 }}
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
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.analyzeButtonText}>Fotoğraftan Kalori Hesapla</Text>}
            </TouchableOpacity>
          )}
          {result ? (
            <View style={styles.resultBox}>
              <Ionicons name="restaurant" size={32} color="#4B6C4B" style={{ marginBottom: 6 }} />
              <Text style={styles.resultTitle}>Sonuç</Text>
              <Markdown style={markdownStyles}>{result}</Markdown>
              <TouchableOpacity style={[styles.analyzeButton, { marginTop: 10, backgroundColor: '#A3C76D' }]} onPress={handleSaveMeal} disabled={saveLoading} activeOpacity={0.85}>
                {saveLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.analyzeButtonText}>Yemeği Kaydet</Text>}
              </TouchableOpacity>
              {saveSuccess && (
                <Text style={{ color: saveSuccess.startsWith('Yemek') ? '#4B6C4B' : 'red', marginTop: 8, fontWeight: 'bold', textAlign: 'center' }}>{saveSuccess}</Text>
              )}
            </View>
          ) : null}
          {/* Chatbot Alanı */}
          {/* <View style={styles.chatContainer}>
            <Text style={styles.chatTitle}>Kalori Botu ile Sohbet</Text>
            <View style={styles.chatBox}>
              {messages.map((msg, idx) => (
                <View key={idx} style={[styles.messageRow, msg.role === 'user' ? styles.userMsg : styles.botMsg]}>
                  <Ionicons name={msg.role === 'user' ? 'person' : 'chatbubble-ellipses-outline'} size={18} color={msg.role === 'user' ? '#4B6C4B' : '#A0BFA0'} style={{ marginRight: 6 }} />
                  <Text style={msg.role === 'user' ? styles.userText : styles.botText}>{msg.text}</Text>
                </View>
              ))}
              {loading && <ActivityIndicator size="small" color="#4B6C4B" style={{ marginTop: 8 }} />}
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Sorunu yaz..."
                value={input}
                onChangeText={setInput}
                editable={!loading}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
              />
              <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={loading || !input.trim()}>
                <Ionicons name="send" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View> */}
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
