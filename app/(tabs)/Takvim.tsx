import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { addDietPlan, deleteDietPlan, getDietPlanByDate, updateDietPlan } from '../../services/dietPlanService';
import { getDiyetisyenDanisanlari } from '../../services/userService';

export default function Takvim() {
  const [selected, setSelected] = useState('');
  const [dietPlan, setDietPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    breakfast: '',
    snack1: '',
    lunch: '',
    snack2: '',
    dinner: '',
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    breakfast: '',
    snack1: '',
    lunch: '',
    snack2: '',
    dinner: '',
  });
  
  // Diyetisyen için yeni state'ler
  const [userType, setUserType] = useState<string>('');
  const [diyetisyenId, setDiyetisyenId] = useState<string | null>(null);
  const [danisanlar, setDanisanlar] = useState<any[]>([]);
  const [selectedDanisan, setSelectedDanisan] = useState<any>(null);
  const [showDanisanModal, setShowDanisanModal] = useState(false);
  const [loadingDanisanlar, setLoadingDanisanlar] = useState(false);
  const [isClient, setIsClient] = useState(false); // Danışan olup olmadığını kontrol etmek için
  
  const router = useRouter();

  // Kullanıcının tüm diyet planlarını çek ve işaretle
  const fetchMarkedDates = async (userId: string) => {
    // Veritabanını kullanmak için Supabase import'u ekleyelim
    const { supabase } = await import('../../supabaseClient');
    
    const { data, error } = await supabase
      .from('diet_plans')
      .select('date')
      .eq('user_id', userId);
    if (error) return;
    
    // Önce tüm mevcut işaretleri temizle
    setMarkedDates({});
    
    const marks: any = {};
    data?.forEach((plan: any) => {
      // Sadece nokta göster, seçili değilse daire gösterme
      marks[plan.date] = { 
        marked: true, 
        dotColor: '#4B6C4B'
      };
    });
    setMarkedDates(marks);
  };

  // Chatbot'tan gelen diyet planı verilerini kontrol et
  const checkForGeneratedDietPlan = async () => {
    try {
      const selectedClientStr = await AsyncStorage.getItem('selectedClientForDiet');
      const generatedDietPlanStr = await AsyncStorage.getItem('generatedDietPlan');
      
      if (selectedClientStr && generatedDietPlanStr) {
        const selectedClient = JSON.parse(selectedClientStr);
        const generatedDietPlan = JSON.parse(generatedDietPlanStr);
        
        console.log('Chatbot\'tan gelen veriler bulundu:', { selectedClient, generatedDietPlan });
        
        // Seçilen danışanı ayarla
        setSelectedDanisan(selectedClient);
        
        // Form'u diyet planı ile doldur
        setForm({
          breakfast: generatedDietPlan.breakfast || '',
          snack1: generatedDietPlan.snack1 || '',
          lunch: generatedDietPlan.lunch || '',
          snack2: generatedDietPlan.snack2 || '',
          dinner: generatedDietPlan.dinner || '',
        });
        
        // Bugünün tarihini seç
        const today = new Date().toISOString().split('T')[0];
        setSelected(today);
        
        // AsyncStorage'dan verileri temizle
        await AsyncStorage.removeItem('selectedClientForDiet');
        await AsyncStorage.removeItem('generatedDietPlan');
        
        // Kullanıcıya bilgi ver
        Alert.alert(
          'Diyet Planı Hazır', 
          `${selectedClient.isim} ${selectedClient.soyisim} için hazırlanan diyet planı yüklendi. İstediğiniz günü seçip kaydedebilirsiniz.`,
          [
            { text: 'Tamam', onPress: () => {} }
          ]
        );
      }
    } catch (error) {
      console.error('Generated diet plan kontrol hatası:', error);
    }
  };

  // Diyetisyen danışanlarını getir
  const fetchDanisanlar = async (diyetisyenId: string) => {
    setLoadingDanisanlar(true);
    try {
      console.log('fetchDanisanlar çağrıldı, diyetisyenId:', diyetisyenId);
      const danisanlarData = await getDiyetisyenDanisanlari(diyetisyenId);
      console.log('Gelen danışanlar:', danisanlarData);
      setDanisanlar(danisanlarData || []);
    } catch (error: any) {
      console.error('Danışanlar getirilemedi:', error);
      Alert.alert('Hata', 'Danışanlar yüklenirken hata oluştu: ' + (error?.message || 'Bilinmeyen hata'));
    } finally {
      setLoadingDanisanlar(false);
    }
  };

  useEffect(() => {
    (async () => {
      const currentUser = await AsyncStorage.getItem('currentUser');
      const currentDiyetisyen = await AsyncStorage.getItem('currentDiyetisyen');
      const userTypeData = await AsyncStorage.getItem('userType');
      
      setUserType(userTypeData || '');
      
      if (currentDiyetisyen && userTypeData === 'dietician') {
        const diyetisyenData = JSON.parse(currentDiyetisyen);
        setDiyetisyenId(diyetisyenData.id);
        setUserId(diyetisyenData.id);
        setIsClient(false); // Diyetisyen değil
        // Başlangıçta diyetisyenin kendi diyet planlarını yükleme
        // fetchMarkedDates(diyetisyenData.id);
        fetchDanisanlar(diyetisyenData.id);
        
        // Chatbot'tan gelen diyet planı verilerini kontrol et
        checkForGeneratedDietPlan();
      } else if (currentUser && userTypeData !== 'dietician') {
        const userData = JSON.parse(currentUser);
        setUserId(userData.id); // UUID'yi user_id olarak kullan
        
        // Kullanıcının diyetisyen_id'si var mı kontrol et
        if (userData.diyetisyen_id) {
          setIsClient(true); // Bu bir danışan
        } else {
          setIsClient(false); // Bağımsız kullanıcı
        }
        
        fetchMarkedDates(userData.id);
      }
    })();
  }, []);

  useEffect(() => {
    if (selected && userId) {
      setLoading(true);
      // Diyetisyen ise seçili danışanın ID'sini kullan, değilse kendi ID'sini
      const targetUserId = userType === 'dietician' && selectedDanisan ? selectedDanisan.id : userId;
      
      getDietPlanByDate(targetUserId, selected)
        .then(plan => {
          setDietPlan(plan);
          if (plan) {
            setForm({
              breakfast: plan.breakfast || '',
              snack1: plan.snack1 || '',
              lunch: plan.lunch || '',
              snack2: plan.snack2 || '',
              dinner: plan.dinner || '',
            });
          } else {
            setForm({ breakfast: '', snack1: '', lunch: '', snack2: '', dinner: '' });
          }
          // Önce tüm selected'ları temizle, sonra sadece seçili günü işaretle
          setMarkedDates((prev: any) => {
            const newMarkedDates = { ...prev };
            // Tüm selected'ları temizle
            Object.keys(newMarkedDates).forEach(date => {
              if (newMarkedDates[date]) {
                delete newMarkedDates[date].selected;
                delete newMarkedDates[date].selectedColor;
              }
            });
            // Sadece seçili günü işaretle
            newMarkedDates[selected] = {
              ...(newMarkedDates[selected] || {}),
              selected: true,
              selectedColor: '#4B6C4B',
              // Eğer bu günde diyet planı varsa nokta da göster
              marked: plan ? true : (newMarkedDates[selected]?.marked || false),
              dotColor: plan ? '#4B6C4B' : (newMarkedDates[selected]?.dotColor || '#4B6C4B'),
            };
            return newMarkedDates;
          });
        })
        .catch(() => setDietPlan(null))
        .finally(() => setLoading(false));
    } else {
      setDietPlan(null);
      setForm({ breakfast: '', snack1: '', lunch: '', snack2: '', dinner: '' });
    }
  }, [selected, userId, selectedDanisan, userType]);

  const handleSave = async () => {
    if (!userId || !selected) return;
    
    // Diyetisyen ise danışan seçili olmalı
    if (userType === 'dietician' && !selectedDanisan) {
      Alert.alert('Uyarı', 'Lütfen önce bir danışan seçin.');
      return;
    }
    
    setSaving(true);
    try {
      // Diyetisyen ise seçili danışanın ID'sini kullan, değilse kendi ID'sini
      const targetUserId = userType === 'dietician' ? selectedDanisan.id : userId;
      
      await addDietPlan({
        user_id: targetUserId,
        date: selected,
        ...form,
      });
      Alert.alert('Başarılı', 'Diyet programı kaydedildi!');
      setDietPlan({ ...form });
      // Diyet eklendikten sonra işaretli günleri güncelle ve seçili günü koru
      await fetchMarkedDates(targetUserId);
      setMarkedDates((prev: any) => ({
        ...prev,
        [selected]: {
          ...prev[selected],
          selected: true,
          selectedColor: '#4B6C4B',
          marked: true,
          dotColor: '#4B6C4B',
        },
      }));
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Kayıt sırasında hata oluştu.');
    }
    setSaving(false);
  };

  const handleEdit = () => {
    setEditForm({
      breakfast: dietPlan.breakfast || '',
      snack1: dietPlan.snack1 || '',
      lunch: dietPlan.lunch || '',
      snack2: dietPlan.snack2 || '',
      dinner: dietPlan.dinner || '',
    });
    setEditMode(true);
  };

  const handleEditSave = async () => {
    if (!userId || !selected) return;
    try {
      // Diyetisyen ise seçili danışanın ID'sini kullan, değilse kendi ID'sini
      const targetUserId = userType === 'dietician' ? selectedDanisan.id : userId;
      
      await updateDietPlan({
        user_id: targetUserId,
        date: selected,
        ...editForm,
      });
      setEditMode(false);
      getDietPlanByDate(targetUserId, selected).then(setDietPlan);
      // Güncelleme sonrası seçili günü koru
      setMarkedDates((prev: any) => ({
        ...prev,
        [selected]: {
          ...prev[selected],
          selected: true,
          selectedColor: '#4B6C4B',
          marked: true,
          dotColor: '#4B6C4B',
        },
      }));
      Alert.alert('Başarılı', 'Diyet planı güncellendi!');
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Güncelleme sırasında hata oluştu.');
    }
  };

  const handleDelete = async () => {
    if (!userId || !selected) return;
    Alert.alert('Diyet Planı Silinsin mi?', 'Bu günü silmek istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Evet', style: 'destructive', onPress: async () => {
        try {
          // Diyetisyen ise seçili danışanın ID'sini kullan, değilse kendi ID'sini
          const targetUserId = userType === 'dietician' ? selectedDanisan.id : userId;
          
          await deleteDietPlan(targetUserId, selected);
          setDietPlan(null);
          // Diyet silindikten sonra işaretli günleri güncelle ve seçili günü koru
          await fetchMarkedDates(targetUserId);
          setMarkedDates((prev: any) => ({
            ...prev,
            [selected]: {
              selected: true,
              selectedColor: '#4B6C4B',
              // Diyet silindiği için nokta yok
              marked: false,
            },
          }));
          Alert.alert('Silindi', 'Diyet planı silindi.');
        } catch (e: any) {
          Alert.alert('Hata', e.message || 'Silme sırasında hata oluştu.');
        }
      }}
    ]);
  };

  const handleDanisanSelect = (danisan: any) => {
    setSelectedDanisan(danisan);
    setShowDanisanModal(false);
    
    // Seçili danışanın diyet planlarını yükle
    fetchMarkedDates(danisan.id).then(() => {
      // Eğer bir gün seçiliyse, o günü koru
      if (selected) {
        setMarkedDates((prev: any) => ({
          ...prev,
          [selected]: {
            ...prev[selected],
            selected: true,
            selectedColor: '#4B6C4B',
          },
        }));
      }
    });
  };

  const renderDanisanItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.danisanItem}
      onPress={() => handleDanisanSelect(item)}
    >
      <View style={styles.danisanInfo}>
        <Text style={styles.danisanName}>{item.isim} {item.soyisim}</Text>
        <Text style={styles.danisanEmail}>{item.eposta}</Text>
        <Text style={styles.danisanDetails}>
          {item.yas ? `${item.yas} yaş` : ''} {item.cinsiyet ? `• ${item.cinsiyet}` : ''}
          {item.boy ? ` • ${item.boy}cm` : ''} {item.kilo ? ` • ${item.kilo}kg` : ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#4B6C4B" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="calendar" size={32} color="#4B6C4B" />
          </View>
          <Text style={styles.title}>Diyet Takvimi</Text>
        </View>
        <View style={styles.underline} />
        
        {/* Diyetisyen için danışan seçimi */}
        {userType === 'dietician' && (
          <View style={styles.danisanSelector}>
            <TouchableOpacity
              style={styles.danisanButton}
              onPress={() => setShowDanisanModal(true)}
            >
              <Ionicons name="people" size={20} color="#4B6C4B" />
              <Text style={styles.danisanButtonText}>
                {selectedDanisan ? `${selectedDanisan.isim} ${selectedDanisan.soyisim}` : 'Danışan Seçin'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#4B6C4B" />
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.calendarShadowWrap}>
          <View style={styles.calendarContainer}>
            <Calendar
              onDayPress={(day: { dateString: string }) => setSelected(day.dateString)}
              markedDates={userType === 'dietician' && !selectedDanisan ? {} : markedDates}
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
        </View>
        
        {/* Diyetisyen için uyarı */}
        {userType === 'dietician' && !selectedDanisan && (
          <View style={styles.warningBox}>
            <Ionicons name="information-circle" size={24} color="#FFA500" />
            <Text style={styles.warningText}>Diyet planı eklemek için önce bir danışan seçin</Text>
          </View>
        )}
        
        {/* Seçili günün diyet kutusu */}
        {dietPlan && (
          <View style={styles.dietBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.dietTitle}>
                {selected} Diyet Planı
                {userType === 'dietician' && selectedDanisan && (
                  <Text style={styles.danisanLabel}> - {selectedDanisan.isim} {selectedDanisan.soyisim}</Text>
                )}
              </Text>
              {!isClient && (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={handleEdit} style={{ marginRight: 8 }}>
                    <Ionicons name="create-outline" size={22} color="#4B6C4B" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={22} color="#B00020" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <View style={styles.dietUnderline} />
            {editMode && !isClient ? (
              <>
                <View style={styles.mealRow}>
                  <Text style={styles.mealTitle}>Kahvaltı:</Text>
                  <TextInput 
                    style={styles.dietItem} 
                    value={editForm.breakfast} 
                    onChangeText={t => setEditForm(f => ({ ...f, breakfast: t }))} 
                    placeholder="Örn: Yulaf ezmesi, süt, meyve..." 
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={styles.mealRow}>
                  <Text style={styles.mealTitle}>Ara Öğün 1:</Text>
                  <TextInput 
                    style={styles.dietItem} 
                    value={editForm.snack1} 
                    onChangeText={t => setEditForm(f => ({ ...f, snack1: t }))} 
                    placeholder="Örn: 1 elma, 10 badem..." 
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={styles.mealRow}>
                  <Text style={styles.mealTitle}>Öğle:</Text>
                  <TextInput 
                    style={styles.dietItem} 
                    value={editForm.lunch} 
                    onChangeText={t => setEditForm(f => ({ ...f, lunch: t }))} 
                    placeholder="Örn: Tavuk ızgara, salata..." 
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={styles.mealRow}>
                  <Text style={styles.mealTitle}>Ara Öğün 2:</Text>
                  <TextInput 
                    style={styles.dietItem} 
                    value={editForm.snack2} 
                    onChangeText={t => setEditForm(f => ({ ...f, snack2: t }))} 
                    placeholder="Örn: Yoğurt, meyve..." 
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={styles.mealRow}>
                  <Text style={styles.mealTitle}>Akşam:</Text>
                  <TextInput 
                    style={styles.dietItem} 
                    value={editForm.dinner} 
                    onChangeText={t => setEditForm(f => ({ ...f, dinner: t }))} 
                    placeholder="Örn: Çorba, sebze yemeği..." 
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                  <TouchableOpacity onPress={() => setEditMode(false)} style={{ marginRight: 12 }}>
                    <Text style={{ color: '#B00020', fontWeight: 'bold', fontSize: 15 }}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleEditSave}>
                    <Text style={{ color: '#4B6C4B', fontWeight: 'bold', fontSize: 15 }}>Kaydet</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.mealRow}><Text style={styles.mealTitle}>Kahvaltı:</Text><Text style={styles.dietItem}>{dietPlan.breakfast || '-'}</Text></View>
                <View style={styles.mealRow}><Text style={styles.mealTitle}>Ara Öğün 1:</Text><Text style={styles.dietItem}>{dietPlan.snack1 || '-'}</Text></View>
                <View style={styles.mealRow}><Text style={styles.mealTitle}>Öğle:</Text><Text style={styles.dietItem}>{dietPlan.lunch || '-'}</Text></View>
                <View style={styles.mealRow}><Text style={styles.mealTitle}>Ara Öğün 2:</Text><Text style={styles.dietItem}>{dietPlan.snack2 || '-'}</Text></View>
                <View style={styles.mealRow}><Text style={styles.mealTitle}>Akşam:</Text><Text style={styles.dietItem}>{dietPlan.dinner || '-'}</Text></View>
              </>
            )}
          </View>
        )}
        
        {/* Yeni diyet ekleme formu */}
        {selected && !dietPlan && !isClient && (
          <View style={styles.dietBox}>
            <Text style={styles.dietTitle}>
              {selected} - Yeni Diyet Planı
              {userType === 'dietician' && selectedDanisan && (
                <Text style={styles.danisanLabel}> - {selectedDanisan.isim} {selectedDanisan.soyisim}</Text>
              )}
            </Text>
            <View style={styles.dietUnderline} />
            <View style={styles.mealRow}>
              <Text style={styles.mealTitle}>Kahvaltı:</Text>
              <TextInput 
                style={styles.input} 
                value={form.breakfast} 
                onChangeText={t => setForm(f => ({ ...f, breakfast: t }))} 
                placeholder="Örn: Yulaf ezmesi, süt, meyve..." 
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={styles.mealRow}>
              <Text style={styles.mealTitle}>Ara Öğün 1:</Text>
              <TextInput 
                style={styles.input} 
                value={form.snack1} 
                onChangeText={t => setForm(f => ({ ...f, snack1: t }))} 
                placeholder="Örn: 1 elma, 10 badem..." 
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={styles.mealRow}>
              <Text style={styles.mealTitle}>Öğle:</Text>
              <TextInput 
                style={styles.input} 
                value={form.lunch} 
                onChangeText={t => setForm(f => ({ ...f, lunch: t }))} 
                placeholder="Örn: Tavuk ızgara, salata..." 
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={styles.mealRow}>
              <Text style={styles.mealTitle}>Ara Öğün 2:</Text>
              <TextInput 
                style={styles.input} 
                value={form.snack2} 
                onChangeText={t => setForm(f => ({ ...f, snack2: t }))} 
                placeholder="Örn: Yoğurt, meyve..." 
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={styles.mealRow}>
              <Text style={styles.mealTitle}>Akşam:</Text>
              <TextInput 
                style={styles.input} 
                value={form.dinner} 
                onChangeText={t => setForm(f => ({ ...f, dinner: t }))} 
                placeholder="Örn: Çorba, sebze yemeği..." 
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
              <Text style={styles.buttonText}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Danışanlar için boş gün mesajı */}
        {selected && !dietPlan && isClient && (
          <View style={styles.dietBox}>
            <Text style={styles.dietTitle}>
              {selected} - Diyet Planı
            </Text>
            <View style={styles.dietUnderline} />
            <View style={styles.emptyDietMessage}>
              <Ionicons name="information-circle" size={48} color="#9CA3AF" />
              <Text style={styles.emptyDietText}>
                Bu gün için henüz diyet planınız bulunmuyor.{'\n'}
                Diyetisyeniniz size diyet planı eklediğinde burada görünecektir.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
      
      {/* Danışan seçim modalı */}
      <Modal
        visible={showDanisanModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDanisanModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Danışan Seçin</Text>
              <TouchableOpacity onPress={() => setShowDanisanModal(false)}>
                <Ionicons name="close" size={24} color="#4B6C4B" />
              </TouchableOpacity>
            </View>
            {loadingDanisanlar ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Danışanlar yükleniyor...</Text>
              </View>
            ) : danisanlar.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Henüz danışanınız bulunmuyor.</Text>
              </View>
            ) : (
              <FlatList
                data={danisanlar}
                renderItem={renderDanisanItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>
      
      {userType !== 'dietician' && !isClient && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/DiyetEkle')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={36} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF7',
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 40,
    minHeight: '100%',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  headerIconWrap: {
    backgroundColor: '#E6EFE2',
    borderRadius: 32,
    padding: 8,
    marginRight: 10,
    shadowColor: '#4B6C4B',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#4B6C4B',
    letterSpacing: 0.5,
  },
  underline: {
    width: '80%',
    height: 2,
    backgroundColor: '#E6EFE2',
    alignSelf: 'center',
    marginBottom: 18,
    borderRadius: 2,
  },
  danisanSelector: {
    width: '90%',
    marginBottom: 16,
  },
  danisanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E6EFE2',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  danisanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B6C4B',
    flex: 1,
    marginLeft: 12,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '90%',
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  warningText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
  },
  calendarShadowWrap: {
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 32,
    borderRadius: 22,
    backgroundColor: 'transparent',
  },
  calendarContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  infoText: {
    marginTop: 18,
    textAlign: 'center',
    color: '#4B6C4B',
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  dietBox: {
    backgroundColor: '#F6FAF2',
    borderRadius: 20,
    padding: 24,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#4B6C4B',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    borderWidth: 2,
    borderColor: '#A3C76D',
  },
  dietTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4B6C4B',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  danisanLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B8E6B',
  },
  dietUnderline: {
    width: 60,
    height: 3,
    backgroundColor: '#A3C76D',
    alignSelf: 'center',
    borderRadius: 2,
    marginBottom: 12,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  mealIcon: {
    marginRight: 6,
    marginTop: 2,
  },
  mealTitle: {
    fontWeight: 'bold',
    color: '#4B6C4B',
    marginRight: 8,
    fontSize: 15,
    minWidth: 85,
  },
  dietItem: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginLeft: 10,
    fontSize: 15,
    color: '#2C3E50',
    borderWidth: 2,
    borderColor: '#E6EFE2',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    minHeight: 44,
  },
  input: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginLeft: 10,
    fontSize: 15,
    color: '#2C3E50',
    borderWidth: 2,
    borderColor: '#E6EFE2',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    minHeight: 44,
  },
  button: {
    backgroundColor: '#4B6C4B',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#4B6C4B',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 120,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4B6C4B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    zIndex: 99,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E6EFE2',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4B6C4B',
  },
  danisanItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  danisanInfo: {
    flex: 1,
  },
  danisanName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B6C4B',
    marginBottom: 4,
  },
  danisanEmail: {
    fontSize: 14,
    color: '#666',
  },
  danisanDetails: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#4B6C4B',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptyDietMessage: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  emptyDietText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
}); 