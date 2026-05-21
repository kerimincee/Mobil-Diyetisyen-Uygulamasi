import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { addDietPlan } from '../services/dietPlanService';

export default function DiyetEkle() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [form, setForm] = useState({
    breakfast: '',
    snack1: '',
    lunch: '',
    snack2: '',
    dinner: '',
  });
  const [saving, setSaving] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  // Sayfa yüklendiğinde kullanıcı kontrolü
  useEffect(() => {
    checkUserLogin();
  }, []);

  const checkUserLogin = async () => {
    try {
      const currentUser = await AsyncStorage.getItem('currentUser');
      if (currentUser) {
        const userData = JSON.parse(currentUser);
        if (userData.id) {
          setIsLoggedIn(true);
          console.log('Kullanıcı giriş yapmış:', userData.eposta, 'ID:', userData.id);
        } else {
          setIsLoggedIn(false);
          console.log('Kullanıcı ID bilgisi eksik');
        }
      } else {
        setIsLoggedIn(false);
        console.log('Kullanıcı giriş yapmamış');
      }
    } catch (error) {
      console.error('Kullanıcı kontrolü hatası:', error);
      setIsLoggedIn(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const currentUser = await AsyncStorage.getItem('currentUser');
      console.log('AsyncStorage currentUser:', currentUser);

      if (!currentUser) {
        Alert.alert('Giriş Gerekli', 'Diyet planı eklemek için önce giriş yapmalısınız.', [
          { text: 'Tamam', onPress: () => router.replace('/(tabs)') }
        ]);
        return;
      }

      const userData = JSON.parse(currentUser);
      console.log('User data:', userData);

      if (!userData.id) {
        Alert.alert('Kullanıcı Bilgisi Eksik', 'Kullanıcı bilgileriniz eksik. Lütfen tekrar giriş yapın.', [
          { text: 'Tamam', onPress: () => router.replace('/(tabs)') }
        ]);
        return;
      }

      console.log('Diyet planı ekleniyor:', {
        user_id: userData.id,
        date,
        form
      });

      await addDietPlan({
        user_id: userData.id, // UUID'yi user_id olarak kullan
        date,
        ...form,
      });
      Alert.alert('Tebrikler!', 'Diyet programı başarıyla kaydedildi! 🎉', [
        { text: 'Tamam', onPress: () => router.replace('/(tabs)/Takvim') }
      ]);
    } catch (e: any) {
      console.error('Diyet ekleme hatası:', e);
      console.error('Hata detayları:', {
        message: e.message,
        code: e.code,
        details: e.details,
        hint: e.hint
      });
      Alert.alert('Hata', e.message || 'Kayıt sırasında hata oluştu.');
    }
    setSaving(false);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Diyet Ekle', headerBackTitle: 'Geri' }} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>🎯 Yeni Diyet Planı Ekle</Text>
        <Text style={styles.subtitle}>Her gün için sağlıklı ve eğlenceli bir plan oluştur!</Text>

        {!isLoggedIn && (
          <View style={styles.warningBox}>
            <Ionicons name="warning" size={24} color="#FF6B6B" style={{ marginRight: 10 }} />
            <Text style={styles.warningText}>Diyet planı eklemek için önce giriş yapmalısınız!</Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.replace('/(tabs)')}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>Ana Sayfaya Git</Text>
            </TouchableOpacity>
          </View>
        )}
        {isLoggedIn && (
          <>
            <View style={styles.calendarWrap}>
              <Calendar
                onDayPress={d => setDate(d.dateString)}
                markedDates={{ [date]: { selected: true, selectedColor: '#4B6C4B' } }}
                theme={{
                  selectedDayBackgroundColor: '#4B6C4B',
                  todayTextColor: '#4B6C4B',
                  arrowColor: '#4B6C4B',
                  monthTextColor: '#4B6C4B',
                  textMonthFontWeight: 'bold',
                  textDayFontWeight: '500',
                  textDayHeaderFontWeight: '500',
                  backgroundColor: 'transparent',
                  calendarBackground: 'transparent',
                }}
              />
            </View>
            <View style={styles.formBox}>
              <View style={styles.inputRow}>
                <Ionicons name="sunny" size={22} color="#A3C76D" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Kahvaltı (örn: Yumurta...)"
                  value={form.breakfast}
                  onChangeText={t => setForm(f => ({ ...f, breakfast: t }))}
                  placeholderTextColor="#A3C76D"
                />
              </View>
              <View style={styles.inputRow}>
                <Ionicons name="nutrition" size={22} color="#F7B801" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ara Öğün (örn: 1 elma...)"
                  value={form.snack1}
                  onChangeText={t => setForm(f => ({ ...f, snack1: t }))}
                  placeholderTextColor="#F7B801"
                />
              </View>
              <View style={styles.inputRow}>
                <Ionicons name="restaurant" size={22} color="#5A7742" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Öğle (örn: Salata...)"
                  value={form.lunch}
                  onChangeText={t => setForm(f => ({ ...f, lunch: t }))}
                  placeholderTextColor="#5A7742"
                />
              </View>
              <View style={styles.inputRow}>
                <Ionicons name="nutrition" size={22} color="#F7B801" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ara Öğün (örn: 1 muz...)"
                  value={form.snack2}
                  onChangeText={t => setForm(f => ({ ...f, snack2: t }))}
                  placeholderTextColor="#F7B801"
                />
              </View>
              <View style={styles.inputRow}>
                <Ionicons name="moon" size={22} color="#7A8B7A" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Akşam (örn: Çorba...)"
                  value={form.dinner}
                  onChangeText={t => setForm(f => ({ ...f, dinner: t }))}
                  placeholderTextColor="#7A8B7A"
                />
              </View>
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
              <Ionicons name="checkmark-circle" size={28} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.saveButtonText}>{saving ? 'Kaydediliyor...' : 'Kaydet ve Motive Ol!'}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#F8FAF7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 24,
    paddingBottom: 10,
    paddingHorizontal: 10,
    backgroundColor: '#F8FAF7',
    borderBottomWidth: 1,
    borderBottomColor: '#E6EFE2',
    zIndex: 10,
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4B6C4B',
    flex: 1,
    textAlign: 'left',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4B6C4B',
    marginBottom: 6,
    textAlign: 'center',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#7A8B7A',
    marginBottom: 18,
    textAlign: 'center',
  },
  calendarWrap: {
    borderRadius: 18,
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 18,
    shadowColor: '#4B6C4B',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  formBox: {
    backgroundColor: '#F6FAF2',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#4B6C4B',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: '#A3C76D',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#4B6C4B',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 6,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#4B6C4B',
    borderRadius: 16,
    paddingVertical: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4B6C4B',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  warningBox: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFE5E5',
    alignItems: 'center',
  },
  warningText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  loginButton: {
    backgroundColor: '#4B6C4B',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
}); 