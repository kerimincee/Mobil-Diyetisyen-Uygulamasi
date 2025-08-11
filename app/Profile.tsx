import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLoading } from '../contexts/LoadingContext';
import { supabase } from '../supabaseClient';

export default function ProfileScreen() {
  const router = useRouter();
  const { setShowLoading, showLoading } = useLoading();
  const [user, setUser] = useState<any>(null);
  const [isim, setIsim] = useState('');
  const [soyisim, setSoyisim] = useState('');
  const [eposta, setEposta] = useState('');
  const [telefon, setTelefon] = useState('');
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editBoy, setEditBoy] = useState('');
  const [editKilo, setEditKilo] = useState('');
  const [editYas, setEditYas] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setShowLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setShowLoading(false);
        setLoading(false);
        router.replace('/GirisScreen');
        return;
      }
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error || !data) {
        setShowLoading(false);
        setLoading(false);
        await AsyncStorage.removeItem('rememberedEmail');
        await AsyncStorage.removeItem('rememberedPassword');
        router.replace('/GirisScreen');
        return;
      }
      setUser(data);
      setIsim(data.isim);
      setSoyisim(data.soyisim || '');
      setEposta(data.eposta);
      setTelefon(data.telefon || '');
      setProfilePhoto(data.profil_foto || null);
      setShowLoading(false);
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    if (!isim.trim() || !soyisim.trim() || !eposta.trim()) {
      Alert.alert('Hata', 'İsim, soyisim ve e-posta alanları boş bırakılamaz.');
      return;
    }
    const { error } = await supabase
      .from('users')
      .update({ isim, soyisim, eposta, telefon })
      .eq('id', user.id);
    if (error) {
      Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu.');
    } else {
      setUser({ ...user, isim, soyisim, eposta, telefon });
      await AsyncStorage.setItem('rememberedEmail', eposta);
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
            await AsyncStorage.removeItem('rememberedEmail');
            await AsyncStorage.removeItem('rememberedPassword');
            router.replace('/GirisScreen');
          }
        },
      ]
    );
  };

  // Modal açıldığında mevcut değerleri doldur
  const openEditModal = () => {
    setEditBoy(user?.boy ? String(user.boy) : '');
    setEditKilo(user?.kilo ? String(user.kilo) : '');
    setEditYas(user?.yas ? String(user.yas) : '');
    setEditModalVisible(true);
  };

  const handleSavePhysical = async () => {
    if (!user) return;
    if (!editBoy || !editKilo || !editYas) {
      Alert.alert('Hata', 'Boy, kilo ve yaş alanları boş bırakılamaz.');
      return;
    }
    const { error } = await supabase
      .from('users')
      .update({ boy: Number(editBoy), kilo: Number(editKilo), yas: Number(editYas) })
      .eq('id', user.id);
    if (error) {
      Alert.alert('Hata', 'Bilgiler güncellenirken bir hata oluştu.');
    } else {
      setUser({ ...user, boy: Number(editBoy), kilo: Number(editKilo), yas: Number(editYas) });
      setEditModalVisible(false);
      Alert.alert('Başarılı', 'Boy, kilo ve yaş bilgileriniz güncellendi.');
    }
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
    // Önce mevcut şifreyle tekrar giriş yaparak doğrula
    const { data: authUser, error: authError } = await supabase.auth.signInWithPassword({
      email: eposta,
      password: currentPassword,
    });
    if (authError) {
      setPasswordLoading(false);
      Alert.alert('Hata', 'Mevcut şifreniz yanlış.');
      return;
    }
    // Şifreyi güncelle
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordLoading(false);
      Alert.alert('Hata', 'Şifre güncellenemedi: ' + error.message);
      return;
    }
    // (İsteğe bağlı) users tablosunda da şifreyi güncelle
    await supabase.from('users').update({ sifre: newPassword }).eq('id', user.id);
    setPasswordLoading(false);
    setShowPasswordSection(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    Alert.alert('Başarılı', 'Şifreniz güncellendi!');
  };

  if (loading || showLoading) {
    return <Stack.Screen options={{ headerShown: false }} />;
  }

  const getInitials = (isim: string) => {
    const names = isim.split(' ');
    const initials = names.map(n => n[0]).join('').toUpperCase();
    return initials.length > 2 ? initials.substring(0, 2) : initials;
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Profilim',
          headerBackTitle: 'Geri',
          headerTransparent: true,
          headerTitleStyle: { color: '#fff' },
          headerTintColor: '#fff',
        }}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{getInitials(isim)}</Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ad</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" style={styles.inputIcon} />
                <TextInput style={styles.input} value={isim} onChangeText={setIsim} placeholder="Adınız" />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Soyad</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" style={styles.inputIcon} />
                <TextInput style={styles.input} value={soyisim} onChangeText={setSoyisim} placeholder="Soyadınız" />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-posta</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" style={styles.inputIcon} />
                <TextInput style={styles.input} value={eposta} onChangeText={setEposta} keyboardType="email-address" placeholder="E-posta adresiniz" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefon</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={telefon}
                  onChangeText={(text) => setTelefon(text.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  placeholder="Telefon numaranız"
                  maxLength={11}
                />
              </View>
            </View>
          </View>
          
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Ionicons name="save-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Değişiklikleri Kaydet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveButton, {backgroundColor: '#fff', borderWidth: 1, borderColor: '#4B6C4B'}]} onPress={openEditModal}>
              <Ionicons name="create-outline" size={20} color="#4B6C4B" />
              <Text style={[styles.buttonText, {color: '#4B6C4B'}]}>Boy / Kilo / Yaş Değiştir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveButton, {backgroundColor: '#fff', borderWidth: 1, borderColor: '#4B6C4B'}]} onPress={() => setShowPasswordSection(v => !v)}>
              <Ionicons name="key-outline" size={20} color="#4B6C4B" />
              <Text style={[styles.buttonText, {color: '#4B6C4B'}]}>Şifreyi Değiştir</Text>
            </TouchableOpacity>
            {showPasswordSection && (
              <View style={{ width: '100%', backgroundColor: '#F6F7FB', borderRadius: 12, padding: 16, marginTop: 10 }}>
                <Text style={{ color: '#4B6C4B', fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>Şifre Değiştir</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: '#4B6C4B', borderRadius: 8, padding: 8, fontSize: 15, marginBottom: 8, color: '#333' }}
                  placeholder="Mevcut Şifre"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                />
                <TextInput
                  style={{ borderWidth: 1, borderColor: '#4B6C4B', borderRadius: 8, padding: 8, fontSize: 15, marginBottom: 8, color: '#333' }}
                  placeholder="Yeni Şifre"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
                <TextInput
                  style={{ borderWidth: 1, borderColor: '#4B6C4B', borderRadius: 8, padding: 8, fontSize: 15, marginBottom: 8, color: '#333' }}
                  placeholder="Yeni Şifre (Tekrar)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
                <TouchableOpacity style={[styles.saveButton, { marginTop: 8, backgroundColor: '#4B6C4B', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]} onPress={handlePasswordChange} disabled={passwordLoading}>
                  <Ionicons name="checkmark-outline" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Şifreyi Kaydet</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
        <Modal
          visible={editModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.2)'}}>
            <View style={{backgroundColor:'#fff', borderRadius:20, padding:24, width:'85%', alignItems:'center'}}>
              <Text style={{fontSize:18, fontWeight:'bold', color:'#4B6C4B', marginBottom:16}}>Boy / Kilo / Yaş Bilgilerini Düzenle</Text>
              <View style={{width:'100%', marginBottom:12}}>
                <Text style={{color:'#4B6C4B', marginBottom:4}}>Boy (cm)</Text>
                <TextInput
                  style={{borderWidth:1, borderColor:'#4B6C4B', borderRadius:8, padding:8, fontSize:16, color:'#333'}} 
                  value={editBoy}
                  onChangeText={setEditBoy}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
              <View style={{width:'100%', marginBottom:12}}>
                <Text style={{color:'#4B6C4B', marginBottom:4}}>Kilo (kg)</Text>
                <TextInput
                  style={{borderWidth:1, borderColor:'#4B6C4B', borderRadius:8, padding:8, fontSize:16, color:'#333'}} 
                  value={editKilo}
                  onChangeText={setEditKilo}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
              <View style={{width:'100%', marginBottom:20}}>
                <Text style={{color:'#4B6C4B', marginBottom:4}}>Yaş</Text>
                <TextInput
                  style={{borderWidth:1, borderColor:'#4B6C4B', borderRadius:8, padding:8, fontSize:16, color:'#333'}} 
                  value={editYas}
                  onChangeText={setEditYas}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
              <View style={{flexDirection:'row', justifyContent:'space-between', width:'100%'}}>
                <TouchableOpacity style={{flex:1, backgroundColor:'#4B6C4B', padding:12, borderRadius:8, marginRight:8, alignItems:'center'}} onPress={handleSavePhysical}>
                  <Text style={{color:'#fff', fontWeight:'bold', fontSize:16}}>Kaydet</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{flex:1, backgroundColor:'#eee', padding:12, borderRadius:8, marginLeft:8, alignItems:'center'}} onPress={()=>setEditModalVisible(false)}>
                  <Text style={{color:'#4B6C4B', fontWeight:'bold', fontSize:16}}>İptal</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </>
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
    paddingTop: 80, // azaltıldı
    paddingBottom: 40, // azaltıldı
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
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    marginHorizontal: 20,
    marginTop: -20, // azaltıldı
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4B6C4B',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  logoutButtonText: {
    color: '#4B6C4B',
  },
}); 