import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { addDietPlan, deleteDietPlan, getDietPlanByDate, updateDietPlan } from '../../services/dietPlanService';
import { supabase } from '../../supabaseClient';

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
  const router = useRouter();

  // Kullanıcının tüm diyet planlarını çek ve işaretle
  const fetchMarkedDates = async (userId: string) => {
    const { data, error } = await supabase
      .from('diet_plans')
      .select('date')
      .eq('user_id', userId);
    if (error) return;
    const marks: any = {};
    data?.forEach((plan: any) => {
      marks[plan.date] = { marked: true, dotColor: '#4B6C4B', selected: markedDates[plan.date]?.selected, selectedColor: markedDates[plan.date]?.selectedColor };
    });
    setMarkedDates((prev: any) => ({ ...marks, ...(prev || {}) }));
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      if (user?.id) fetchMarkedDates(user.id);
    })();
  }, []);

  useEffect(() => {
    if (selected && userId) {
      setLoading(true);
      getDietPlanByDate(userId, selected)
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
          // Seçili günü işaretle
          setMarkedDates((prev: any) => ({
            ...prev,
            [selected]: {
              ...(prev[selected] || {}),
              selected: true,
              selectedColor: '#4B6C4B',
            },
          }));
        })
        .catch(() => setDietPlan(null))
        .finally(() => setLoading(false));
    } else {
      setDietPlan(null);
      setForm({ breakfast: '', snack1: '', lunch: '', snack2: '', dinner: '' });
    }
  }, [selected, userId]);

  const handleSave = async () => {
    if (!userId || !selected) return;
    setSaving(true);
    try {
      await addDietPlan({
        user_id: userId,
        date: selected,
        ...form,
      });
      Alert.alert('Başarılı', 'Diyet programı kaydedildi!');
      setDietPlan({ ...form });
      fetchMarkedDates(userId); // Diyet eklendikten sonra işaretli günleri güncelle
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
      await updateDietPlan({
        user_id: userId,
        date: selected,
        ...editForm,
      });
      setEditMode(false);
      getDietPlanByDate(userId, selected).then(setDietPlan);
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
          await deleteDietPlan(userId, selected);
          setDietPlan(null);
          fetchMarkedDates(userId);
          Alert.alert('Silindi', 'Diyet planı silindi.');
        } catch (e: any) {
          Alert.alert('Hata', e.message || 'Silme sırasında hata oluştu.');
        }
      }}
    ]);
  };

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
        <View style={styles.calendarShadowWrap}>
          <View style={styles.calendarContainer}>
            <Calendar
              onDayPress={(day: { dateString: string }) => setSelected(day.dateString)}
              markedDates={markedDates}
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
        {/* Seçili günün diyet kutusu */}
        {dietPlan && (
          <View style={styles.dietBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.dietTitle}>{selected} Diyet Planı</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={handleEdit} style={{ marginRight: 8 }}>
                  <Ionicons name="create-outline" size={22} color="#4B6C4B" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDelete}>
                  <Ionicons name="trash-outline" size={22} color="#B00020" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.dietUnderline} />
            {editMode ? (
              <>
                <View style={styles.mealRow}><Text style={styles.mealTitle}>Kahvaltı:</Text><TextInput style={styles.dietItem} value={editForm.breakfast} onChangeText={t => setEditForm(f => ({ ...f, breakfast: t }))} /></View>
                <View style={styles.mealRow}><Text style={styles.mealTitle}>Ara Öğün 1:</Text><TextInput style={styles.dietItem} value={editForm.snack1} onChangeText={t => setEditForm(f => ({ ...f, snack1: t }))} /></View>
                <View style={styles.mealRow}><Text style={styles.mealTitle}>Öğle:</Text><TextInput style={styles.dietItem} value={editForm.lunch} onChangeText={t => setEditForm(f => ({ ...f, lunch: t }))} /></View>
                <View style={styles.mealRow}><Text style={styles.mealTitle}>Ara Öğün 2:</Text><TextInput style={styles.dietItem} value={editForm.snack2} onChangeText={t => setEditForm(f => ({ ...f, snack2: t }))} /></View>
                <View style={styles.mealRow}><Text style={styles.mealTitle}>Akşam:</Text><TextInput style={styles.dietItem} value={editForm.dinner} onChangeText={t => setEditForm(f => ({ ...f, dinner: t }))} /></View>
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
      </ScrollView>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/DiyetEkle')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={36} color="#fff" />
      </TouchableOpacity>
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
    borderRadius: 18,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#4B6C4B',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1.5,
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
    alignItems: 'flex-start',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  mealIcon: {
    marginRight: 6,
    marginTop: 2,
  },
  mealTitle: {
    fontWeight: 'bold',
    color: '#4B6C4B',
    marginRight: 4,
    fontSize: 15,
    minWidth: 80,
  },
  dietItem: {
    fontSize: 15,
    color: '#4B6C4B',
    flexShrink: 1,
    flexWrap: 'wrap',
    borderBottomWidth: 1,
    borderBottomColor: '#E6EFE2',
    paddingBottom: 5,
  },
  input: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginLeft: 10,
    fontSize: 15,
    color: '#4B6C4B',
    borderWidth: 1,
    borderColor: '#E6EFE2',
  },
  button: {
    backgroundColor: '#4B6C4B',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
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
}); 