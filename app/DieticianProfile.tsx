import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchCameraAsync, launchImageLibraryAsync, MediaTypeOptions, requestCameraPermissionsAsync, requestMediaLibraryPermissionsAsync } from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLoading } from '../contexts/LoadingContext';
import { supabase } from '../supabaseClient';

export default function DieticianProfileScreen() {
  const router = useRouter();
  const { setShowLoading, showLoading } = useLoading();
  const [dietician, setDietician] = useState<any>(null);
  const [isim, setIsim] = useState('');
  const [soyisim, setSoyisim] = useState('');
  const [eposta, setEposta] = useState('');
  const [telefon, setTelefon] = useState('');
  const [uzmanlik_alani, setUzmanlikAlani] = useState('');
  const [deneyim_yili, setDeneyimYili] = useState('');
  const [mezun_oldugu_okul, setMezunOlduguOkul] = useState('');
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    const fetchDietician = async () => {
      setShowLoading(true);
      const currentDiyetisyen = await AsyncStorage.getItem('currentDiyetisyen');
      
      if (!currentDiyetisyen) {
        setShowLoading(false);
        setLoading(false);
        router.replace('/');
        return;
      }
      
      const dieticianData = JSON.parse(currentDiyetisyen);
      setDietician(dieticianData);
      setIsim(dieticianData.isim);
      setSoyisim(dieticianData.soyisim || '');
      setEposta(dieticianData.eposta);
      setTelefon(dieticianData.telefon || '');
      setUzmanlikAlani(dieticianData.uzmanlik_alani || '');
      setDeneyimYili(dieticianData.deneyim_yili ? String(dieticianData.deneyim_yili) : '');
      setMezunOlduguOkul(dieticianData.mezun_oldugu_okul || '');
      
      // Danışanları getir
      await fetchClients(dieticianData.id);
      
      setShowLoading(false);
      setLoading(false);
    };
    fetchDietician();
  }, []);

  const fetchClients = async (dieticianId: string) => {
    try {
      const { data: clientsData, error } = await supabase
        .from('users')
        .select('*')
        .eq('diyetisyen_id', dieticianId);

      if (error) {
        console.error('Danışanlar getirilirken hata:', error);
      } else {
        setClients(clientsData || []);
      }
    } catch (error) {
      console.error('Danışanlar getirilirken hata:', error);
    }
  };

  const handleSave = async () => {
    if (!dietician) return;
    if (!isim.trim() || !soyisim.trim() || !eposta.trim()) {
      Alert.alert('Hata', 'İsim, soyisim ve e-posta alanları boş bırakılamaz.');
      return;
    }
    
    const { error } = await supabase
      .from('diyetisyenler')
      .update({ 
        isim, 
        soyisim, 
        eposta, 
        telefon,
        uzmanlik_alani,
        deneyim_yili: Number(deneyim_yili),
        mezun_oldugu_okul
      })
      .eq('id', dietician.id);
      
    if (error) {
      Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu.');
    } else {
      const updatedDietician = { 
        ...dietician, 
        isim, 
        soyisim, 
        eposta, 
        telefon,
        uzmanlik_alani,
        deneyim_yili: Number(deneyim_yili),
        mezun_oldugu_okul
      };
      setDietician(updatedDietician);
      await AsyncStorage.setItem('currentDiyetisyen', JSON.stringify(updatedDietician));
      Alert.alert('Başarılı', 'Profiliniz güncellendi.');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkmak istiyor musunuz?',
      [
        { text: 'Hayır', style: 'cancel' },
        { text: 'Evet', style: 'destructive', onPress: async () => {
            await AsyncStorage.removeItem('currentDiyetisyen');
            await AsyncStorage.removeItem('userType');
            router.replace('/');
          }
        },
      ]
    );
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Hata', 'Tüm şifre alanlarını doldurun.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Hata', 'Yeni şifre en az 8 karakter olmalı.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Hata', 'Yeni şifreler eşleşmiyor.');
      return;
    }
    setPasswordLoading(true);
    
    // Mevcut şifre kontrolü
    if (currentPassword !== dietician.sifre) {
      setPasswordLoading(false);
      Alert.alert('Hata', 'Mevcut şifreniz yanlış.');
      return;
    }
    
    // Şifreyi güncelle
    const { error } = await supabase
      .from('diyetisyenler')
      .update({ sifre: newPassword })
      .eq('id', dietician.id);
      
    if (error) {
      setPasswordLoading(false);
      Alert.alert('Hata', 'Şifre güncellenemedi: ' + error.message);
      return;
    }
    
    // AsyncStorage'ı güncelle
    const updatedDietician = { ...dietician, sifre: newPassword };
    await AsyncStorage.setItem('currentDiyetisyen', JSON.stringify(updatedDietician));
    setDietician(updatedDietician);
    
    setPasswordLoading(false);
    setShowPasswordSection(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    Alert.alert('Başarılı', 'Şifreniz güncellendi!');
  };

  const handlePhotoUpload = async () => {
    Alert.alert(
      'Profil Fotoğrafı',
      'Fotoğraf seçmek için bir seçenek belirleyin',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Kameradan Çek', 
          onPress: () => selectImage('camera')
        },
        { 
          text: 'Galeriden Seç', 
          onPress: () => selectImage('library')
        },
      ]
    );
  };

  const selectImage = async (source: 'camera' | 'library') => {
    try {
      setUploadingPhoto(true);
      
      // İzin iste
      const permissionResult = source === 'camera' 
        ? await requestCameraPermissionsAsync()
        : await requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('İzin Gerekli', 'Kamera/galeri erişimi için izin gereklidir.');
        return;
      }

      // Fotoğraf seç
      const result = source === 'camera'
        ? await launchCameraAsync({
            mediaTypes: MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await launchImageLibraryAsync({
            mediaTypes: MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (result.canceled || !result.assets[0]) {
        setUploadingPhoto(false);
        return;
      }

      const imageUri = result.assets[0].uri;
      
      // Geçici olarak test URL kullan (storage bucket kurulumu için)
      // TODO: Supabase storage bucket kurulduktan sonra bu kısmı aktif et
      const testUrl = imageUri; // Şimdilik local URI kullan
      
      // Supabase storage upload (şimdilik devre dışı)
      /*
      const fileName = `${dietician?.id}_${Date.now()}.jpg`;
      const filePath = `profil_foto/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profil_foto')
        .upload(filePath, {
          uri: imageUri,
          type: 'image/jpeg',
          name: fileName,
        } as any, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        Alert.alert('Hata', 'Fotoğraf yüklenirken bir hata oluştu: ' + uploadError.message);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('profil_foto')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      */
      
      // Veritabanını güncelle (test URL ile)
      const { error: dbError } = await supabase
        .from('diyetisyenler')
        .update({ profil_foto: testUrl })
        .eq('id', dietician.id);
        
      if (dbError) {
        Alert.alert('Hata', 'Veritabanı güncellenirken bir hata oluştu: ' + dbError.message);
        return;
      }
      
      // Local state'i güncelle
      const updatedDietician = { ...dietician, profil_foto: testUrl };
      setDietician(updatedDietician);
      await AsyncStorage.setItem('currentDiyetisyen', JSON.stringify(updatedDietician));
      
      Alert.alert('Başarılı', 'Profil fotoğrafınız güncellendi!');
      
    } catch (error) {
      console.error('Photo upload error:', error);
      Alert.alert('Hata', 'Fotoğraf yüklenirken bir hata oluştu.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading || showLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' }}>
        <Text>Yükleniyor...</Text>
      </View>
    );
  }

  const getInitials = (isim: string) => {
    const names = isim.split(' ');
    const initials = names.map(n => n[0]).join('').toUpperCase();
    return initials.length > 2 ? initials.substring(0, 2) : initials;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f2f5' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.avatarContainer} 
              onPress={handlePhotoUpload}
              disabled={uploadingPhoto}
            >
              {dietician?.profil_foto ? (
                <Image 
                  source={{ uri: dietician.profil_foto }} 
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarText}>{getInitials(isim)}</Text>
              )}
              {uploadingPhoto && (
                <View style={styles.uploadingOverlay}>
                  <Text style={styles.uploadingText}>Yükleniyor...</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.changePhotoButton}
              onPress={handlePhotoUpload}
              disabled={uploadingPhoto}
            >
              <Ionicons name="camera-outline" size={16} color="#4B6C4B" />
              <Text style={styles.changePhotoText}>Fotoğraf Değiştir</Text>
            </TouchableOpacity>
            <Text style={styles.dieticianTitle}>Diyetisyen</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ad</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" style={styles.inputIcon} />
                <TextInput style={styles.input} value={isim} onChangeText={setIsim} placeholder="Adınız" placeholderTextColor="#999" />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Soyad</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" style={styles.inputIcon} />
                <TextInput style={styles.input} value={soyisim} onChangeText={setSoyisim} placeholder="Soyadınız" placeholderTextColor="#999" />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-posta</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" style={styles.inputIcon} />
                <TextInput style={styles.input} value={eposta} onChangeText={setEposta} keyboardType="email-address" placeholder="E-posta adresiniz" placeholderTextColor="#999" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefon</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={telefon}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, '');
                    if (cleaned.length <= 11) {
                      setTelefon(cleaned);
                    }
                  }}
                  keyboardType="number-pad"
                  placeholder="Telefon numaranız"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Uzmanlık Alanı</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="medical-outline" style={styles.inputIcon} />
                <TextInput style={styles.input} value={uzmanlik_alani} onChangeText={setUzmanlikAlani} placeholder="Uzmanlık alanınız" placeholderTextColor="#999" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Deneyim Yılı</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="time-outline" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  value={deneyim_yili} 
                  onChangeText={setDeneyimYili} 
                  keyboardType="number-pad"
                  placeholder="Deneyim yılınız" 
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mezun Olduğu Okul</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="school-outline" style={styles.inputIcon} />
                <TextInput style={styles.input} value={mezun_oldugu_okul} onChangeText={setMezunOlduguOkul} placeholder="Mezun olduğunuz okul" placeholderTextColor="#999" />
              </View>
            </View>
          </View>

          {/* Danışanlar Bölümü */}
          <View style={styles.clientsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Danışanlarım ({clients.length})</Text>
              <TouchableOpacity 
                style={styles.addClientButton}
                onPress={() => router.push('/AddClient')}
              >
                <Ionicons name="add-outline" size={20} color="#fff" />
                <Text style={styles.addClientButtonText}>Danışan Ekle</Text>
              </TouchableOpacity>
            </View>
            {clients.length > 0 ? (
              clients.map((client, index) => (
                <View key={client.id} style={styles.clientCard}>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{client.isim} {client.soyisim}</Text>
                    <Text style={styles.clientEmail}>{client.eposta}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.viewClientButton}
                    onPress={() => router.push(`/ClientDetail?clientId=${client.id}`)}
                  >
                    <Ionicons name="eye-outline" size={20} color="#4B6C4B" />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.noClientsCard}>
                <Ionicons name="people-outline" size={40} color="#ccc" />
                <Text style={styles.noClientsText}>Henüz danışanınız bulunmuyor</Text>
                <TouchableOpacity 
                  style={styles.addFirstClientButton}
                  onPress={() => router.push('/AddClient')}
                >
                  <Ionicons name="add-outline" size={16} color="#4B6C4B" />
                  <Text style={styles.addFirstClientButtonText}>İlk Danışanınızı Ekleyin</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Ionicons name="save-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Değişiklikleri Kaydet</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.saveButton, {backgroundColor: '#fff', borderWidth: 1, borderColor: '#4B6C4B'}]} onPress={() => setShowPasswordSection(v => !v)}>
              <Ionicons name="key-outline" size={20} color="#4B6C4B" />
              <Text style={[styles.buttonText, {color: '#4B6C4B'}]}>Şifreyi Değiştir</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.saveButton, {backgroundColor: '#fff', borderWidth: 1, borderColor: '#4B6C4B'}]} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#4B6C4B" />
              <Text style={[styles.buttonText, {color: '#4B6C4B'}]}>Çıkış Yap</Text>
            </TouchableOpacity>

            {showPasswordSection && (
              <View style={styles.passwordSection}>
                <Text style={styles.passwordSectionTitle}>Şifre Değiştir</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Mevcut Şifre</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" style={styles.inputIcon} />
                    <TextInput 
                      style={styles.input} 
                      placeholder="Mevcut şifrenizi girin" 
                      placeholderTextColor="#999" 
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      secureTextEntry
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Yeni Şifre</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" style={styles.inputIcon} />
                    <TextInput 
                      style={styles.input} 
                      placeholder="Yeni şifrenizi girin" 
                      placeholderTextColor="#999" 
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Yeni Şifre (Tekrar)</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" style={styles.inputIcon} />
                    <TextInput 
                      style={styles.input} 
                      placeholder="Yeni şifrenizi tekrar girin" 
                      placeholderTextColor="#999" 
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.saveButton, styles.passwordSaveButton]} 
                  onPress={handlePasswordChange} 
                  disabled={passwordLoading}
                >
                  <Ionicons name="checkmark-outline" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Şifreyi Kaydet</Text>
                </TouchableOpacity>
              </View>
            )}
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
  },
  header: {
    backgroundColor: '#4B6C4B',
    paddingTop: -20,
    paddingBottom: 60,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(75, 108, 75, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4B6C4B',
  },
  avatarText: {
    color: '#4B6C4B',
    fontSize: 40,
    fontWeight: 'bold',
  },
  dieticianTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    marginHorizontal: 20,
    marginTop: -30,
    shadowColor: '#4B6C4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginLeft: 4
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
  clientsSection: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: '#4B6C4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B6C4B',
  },
  addClientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4B6C4B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addClientButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f6f7fb',
    borderRadius: 10,
    marginBottom: 10,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  clientEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  viewClientButton: {
    padding: 8,
  },
  noClientsCard: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noClientsText: {
    color: '#999',
    fontSize: 16,
    marginTop: 10,
    marginBottom: 15,
  },
  addFirstClientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F0E6',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B6C4B',
  },
  addFirstClientButtonText: {
    color: '#4B6C4B',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  buttonGroup: {
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 40,
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
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  // Şifre bölümü stilleri
  passwordSection: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    marginTop: 15,
    shadowColor: '#4B6C4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(75, 108, 75, 0.1)',
  },
  passwordSectionTitle: {
    color: '#4B6C4B',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  passwordSaveButton: {
    marginTop: 10,
    backgroundColor: '#4B6C4B',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Avatar ve fotoğraf stilleri
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(75, 108, 75, 0.3)',
  },
  changePhotoText: {
    color: '#4B6C4B',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});
