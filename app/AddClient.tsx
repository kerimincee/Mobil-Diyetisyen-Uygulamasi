import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLoading } from '../contexts/LoadingContext';
import { supabase } from '../supabaseClient';

export default function AddClientScreen() {
  const router = useRouter();
  const { setShowLoading, showLoading } = useLoading();
  const [dietician, setDietician] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [isim, setIsim] = useState('');
  const [soyisim, setSoyisim] = useState('');
  const [eposta, setEposta] = useState('');
  const [telefon, setTelefon] = useState('');
  const [sifre, setSifre] = useState('');
  const [boy, setBoy] = useState('');
  const [kilo, setKilo] = useState('');
  const [yas, setYas] = useState('');

  useEffect(() => {
    const checkDietician = async () => {
      setShowLoading(true);
      const currentDiyetisyen = await AsyncStorage.getItem('currentDiyetisyen');
      const userType = await AsyncStorage.getItem('userType');

      if (!currentDiyetisyen || userType !== 'dietician') {
        setShowLoading(false);
        setLoading(false);
        router.replace('/');
        return;
      }

      const dieticianData = JSON.parse(currentDiyetisyen);
      setDietician(dieticianData);
      setShowLoading(false);
      setLoading(false);
    };
    checkDietician();
  }, []);

  const formatPhone = (text: string) => {
    // Sadece rakamları al
    const cleaned = text.replace(/[^0-9]/g, '');

    // Eğer silme işlemi yapılıyorsa ve uzunluk 11'den azsa, temizlenmiş hali döndür
    if (cleaned.length < telefon.length) {
      return cleaned;
    }

    // 11 haneden fazla olmasına izin verme
    if (cleaned.length > 11) {
      return telefon;
    }

    // Eğer 0 ile başlamıyorsa ve uzunluk 10 ise, başına 0 ekle
    if (cleaned.length === 10 && !cleaned.startsWith('0')) {
      return '0' + cleaned;
    }

    return cleaned;
  };

  const handleSave = async () => {
    if (!dietician) return;

    // Validation
    if (!isim.trim() || !soyisim.trim() || !eposta.trim() || !sifre.trim()) {
      Alert.alert('Hata', 'İsim, soyisim, e-posta ve şifre alanları boş bırakılamaz.');
      return;
    }

    if (sifre.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
      return;
    }

    if (eposta && !/\S+@\S+\.\S+/.test(eposta)) {
      Alert.alert('Hata', 'Geçerli bir e-posta adresi giriniz.');
      return;
    }

    // E-posta kontrolü
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('eposta', eposta)
      .single();

    if (existingUser) {
      Alert.alert('Hata', 'Bu e-posta adresi zaten kullanılıyor.');
      return;
    }

    setSaving(true);

    try {
      const newUser = {
        isim: isim.trim(),
        soyisim: soyisim.trim(),
        eposta: eposta.trim(),
        telefon: telefon.trim() || null,
        sifre: sifre,
        boy: boy ? Number(boy) : null,
        kilo: kilo ? Number(kilo) : null,
        yas: yas ? Number(yas) : null,
        diyetisyen_id: dietician.id,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

      if (error) {
        console.error('Kullanıcı eklenirken hata:', error);
        Alert.alert('Hata', 'Danışan eklenirken bir hata oluştu: ' + error.message);
      } else {
        Alert.alert(
          'Başarılı',
          'Danışan başarıyla eklendi!',
          [
            {
              text: 'Tamam',
              onPress: () => {
                // Formu temizle
                setIsim('');
                setSoyisim('');
                setEposta('');
                setTelefon('');
                setSifre('');
                setBoy('');
                setKilo('');
                setYas('');

                // Diyetisyen profil sayfasına dön
                router.push('/DieticianProfile');
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Beklenmeyen hata:', error);
      Alert.alert('Hata', 'Beklenmeyen bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || showLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' }}>
        <Text>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f2f5' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Ionicons name="person-add-outline" size={40} color="#fff" />
              <Text style={styles.headerTitle}>Yeni Danışan Ekle</Text>
              <Text style={styles.headerSubtitle}>Danışanınızın bilgilerini girin</Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ad *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={isim}
                  onChangeText={setIsim}
                  placeholder="Danışanın adı"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Soyad *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={soyisim}
                  onChangeText={setSoyisim}
                  placeholder="Danışanın soyadı"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-posta *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={eposta}
                  onChangeText={setEposta}
                  keyboardType="email-address"
                  placeholder="E-posta adresi"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefon</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={telefon}
                  onChangeText={(text) => setTelefon(formatPhone(text))}
                  keyboardType="number-pad"
                  placeholder="Telefon numarası (5XX XXX XX XX)"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Şifre *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={sifre}
                  onChangeText={setSifre}
                  secureTextEntry
                  placeholder="Şifre (en az 6 karakter)"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Boy (cm)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="resize-outline" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={boy}
                    onChangeText={setBoy}
                    keyboardType="number-pad"
                    placeholder="Boy"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.label}>Kilo (kg)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="scale-outline" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={kilo}
                    onChangeText={setKilo}
                    keyboardType="number-pad"
                    placeholder="Kilo"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Yaş</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="calendar-outline" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={yas}
                  onChangeText={setYas}
                  keyboardType="number-pad"
                  placeholder="Yaş"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Text style={styles.buttonText}>Ekleniyor...</Text>
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Danışanı Kaydet</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back-outline" size={20} color="#4B6C4B" />
              <Text style={styles.cancelButtonText}>İptal</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={20} color="#4B6C4B" />
            <Text style={styles.infoText}>
              * işaretli alanlar zorunludur. Danışan otomatik olarak size atanacaktır.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#4B6C4B',
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    marginHorizontal: 20,
    marginTop: -20,
    shadowColor: '#4B6C4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6f7fb',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    width: '100%',
  },
  inputIcon: {
    fontSize: 22,
    color: '#999',
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    minWidth: 0,
    textAlign: 'left',
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4B6C4B',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#4B6C4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4B6C4B',
  },
  cancelButtonText: {
    color: '#4B6C4B',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F0E6',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 15,
    borderRadius: 12,
  },
  infoText: {
    color: '#4B6C4B',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
});
