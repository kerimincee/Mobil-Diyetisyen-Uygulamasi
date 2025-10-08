import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { supabase } from '../../supabaseClient';

const { width } = Dimensions.get('window');

// Randevu interface'leri
interface Appointment {
  id: string;
  diyetisyen_id: string;
  user_id: string;
  tarih: string;
  giris_saati: string;
  cikis_saati: string;
  notlar?: string;
  created_at: string;
  users: {
    id: string;
    isim: string;
    soyisim: string;
    eposta: string;
    telefon?: string;
    profil_foto?: string;
  };
}

// VKI aralıkları ve renkleri
const bmiRanges = [
  { label: 'Zayıf', min: 0, max: 18.5, color: '#4fc3f7', icon: require('../../assets/images/zayif.png') },
  { label: 'Sağlıklı', min: 18.5, max: 25, color: '#8bc34a', icon: require('../../assets/images/saglikli.png') },
  { label: 'Şişman', min: 25, max: 30, color: '#ffeb3b', icon: require('../../assets/images/sisman.png') },
  { label: 'Obez', min: 30, max: 35, color: '#ff9800', icon: require('../../assets/images/obez.png') },
  { label: 'Aşırı Obez', min: 35, max: 60, color: '#e53935', icon: require('../../assets/images/asiriobez.png') },
];

export default function BMI() {
  const router = useRouter();
  const [isDiyetisyen, setIsDiyetisyen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // BMI hesaplama state'leri
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Kadın' | 'Erkek'>('Kadın');
  const [result, setResult] = useState<null | { vki: number; desc: string; label: string }>(null);
  const [infoVisible, setInfoVisible] = useState(false);
  
  // Randevu state'leri
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDateAppointments, setSelectedDateAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [addAppointmentModalVisible, setAddAppointmentModalVisible] = useState(false);
  const [editAppointmentModalVisible, setEditAppointmentModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Kullanıcı giriş kontrolü
  useEffect(() => {
    checkUserLogin();
  }, []);

  const checkUserLogin = async () => {
    const currentUserStr = await AsyncStorage.getItem('currentUser');
    const currentDiyetisyenStr = await AsyncStorage.getItem('currentDiyetisyen');
    const userType = await AsyncStorage.getItem('userType');

    // Önce diyetisyen kontrolü yap
    if (currentDiyetisyenStr && userType === 'dietician') {
      const diyetisyenData = JSON.parse(currentDiyetisyenStr);
      if (diyetisyenData.id) {
        setIsDiyetisyen(true);
        setCurrentUser(diyetisyenData);
        loadAppointments(diyetisyenData.id);
        return;
      }
    }

    // Normal kullanıcı kontrolü
    if (currentUserStr && userType !== 'dietician') {
      const userData = JSON.parse(currentUserStr);
      if (userData.id) {
        setIsDiyetisyen(false);
        setCurrentUser(userData);
      }
    }
  };

  // Randevuları yükle
  const loadAppointments = async (diyetisyenId: string) => {
    setAppointmentsLoading(true);
    try {
      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select(`
          *,
          users(
            id,
            isim,
            soyisim,
            eposta,
            telefon,
            profil_foto
          )
        `)
        .eq('diyetisyen_id', diyetisyenId)
        .order('tarih', { ascending: true });

      if (error) {
        console.error('Randevular yüklenirken hata:', error);
      } else {
        setAppointments(appointmentsData || []);
        filterAppointmentsByDate(selectedDate, appointmentsData || []);
      }
    } catch (error) {
      console.error('Randevular yüklenirken hata:', error);
    }
    setAppointmentsLoading(false);
  };

  // Seçili tarihe göre randevuları filtrele
  const filterAppointmentsByDate = (date: Date, appointmentsList: Appointment[]) => {
    const dateStr = date.toISOString().split('T')[0];
    const filtered = appointmentsList.filter(appointment => 
      appointment.tarih === dateStr
    );
    setSelectedDateAppointments(filtered);
  };

  // Tarih değiştiğinde randevuları filtrele
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    filterAppointmentsByDate(date, appointments);
  };

  // Randevu ekleme modalını aç
  const openAddAppointmentModal = () => {
    setAddAppointmentModalVisible(true);
  };

  // Randevu düzenleme modalını aç
  const openEditAppointmentModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditAppointmentModalVisible(true);
  };

  // Randevu silme
  const deleteAppointment = async (appointmentId: string) => {
    Alert.alert(
      'Randevu Sil',
      'Bu randevuyu silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('id', appointmentId);

              if (error) {
                Alert.alert('Hata', 'Randevu silinirken bir hata oluştu.');
              } else {
                Alert.alert('Başarılı', 'Randevu başarıyla silindi.');
                loadAppointments(currentUser?.id);
              }
            } catch (error) {
              Alert.alert('Hata', 'Randevu silinirken bir hata oluştu.');
            }
          }
        },
      ]
    );
  };

  function calculateBMI() {
    const boyMetre = Number(height) / 100;
    const vki = Number(weight) / (boyMetre * boyMetre);
    let label = '';
    let desc = '';
    if (vki < 18.5) {
      label = 'Zayıf';
      desc = 'Vücut kitle indeksiniz düşük. Sağlıklı bir kiloya ulaşmak için beslenme ve yaşam tarzınızı gözden geçirin.';
    } else if (vki < 25) {
      label = 'Sağlıklı';
      desc = 'Tebrikler! Vücut kitle indeksiniz sağlıklı aralıkta.';
    } else if (vki < 30) {
      label = 'Şişman';
      desc = 'Vücut kitle indeksiniz Şişman aralığında. Sağlıklı beslenme ve egzersiz ile ideal kilonuza ulaşabilirsiniz.';
    } else if (vki < 35) {
      label = 'Obez';
      desc = 'Vücut kitle indeksiniz obez aralığında. Sağlığınız için bir uzmana danışmanız önerilir.';
    } else {
      label = 'Aşırı Obez'; 
      desc = 'Vücut kitle indeksiniz aşırı obez aralığında. Sağlığınız için mutlaka bir uzmana başvurun.';
    }
    setResult({ vki, desc, label });
  }

  // Diyetisyen için randevu takvimi arayüzü
  if (isDiyetisyen) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAF7' }}>
        <View style={styles.calendarContainer}>
          <Text style={styles.calendarTitle}>Randevu Takvimi</Text>
          <View style={styles.divider} />
          
          {/* Takvim */}
          <View style={styles.calendarWrapper}>
            <Calendar
              current={selectedDate.toISOString()}
              onDayPress={(day) => handleDateChange(new Date(day.timestamp))}
              markedDates={{
                [selectedDate.toISOString().split('T')[0]]: {
                  selected: true,
                  selectedColor: '#4B6C4B',
                },
                ...appointments.reduce((acc, appointment) => {
                  acc[appointment.tarih] = {
                    marked: true,
                    dotColor: '#FF6B6B',
                  };
                  return acc;
                }, {} as any)
              }}
              theme={{
                selectedDayBackgroundColor: '#4B6C4B',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#4B6C4B',
                dayTextColor: '#2d4150',
                textDisabledColor: '#d9e1e8',
                arrowColor: '#4B6C4B',
                monthTextColor: '#4B6C4B',
                indicatorColor: '#4B6C4B',
                textDayFontWeight: '300',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '300',
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 13
              }}
            />
          </View>

          {/* Seçili gün randevuları */}
          <View style={styles.appointmentsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {selectedDate.toLocaleDateString('tr-TR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })} Randevuları
              </Text>
              <TouchableOpacity 
                style={styles.addAppointmentButton}
                onPress={openAddAppointmentModal}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addAppointmentButtonText}>Randevu Ekle</Text>
              </TouchableOpacity>
            </View>

            {appointmentsLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Randevular yükleniyor...</Text>
              </View>
            ) : selectedDateAppointments.length === 0 ? (
              <View style={styles.emptyAppointmentsContainer}>
                <Ionicons name="calendar-outline" size={40} color="#A0BFA0" />
                <Text style={styles.emptyAppointmentsText}>Bu tarihte randevu bulunmuyor</Text>
              </View>
            ) : (
              <ScrollView style={styles.appointmentsList} showsVerticalScrollIndicator={false}>
                {selectedDateAppointments.map((appointment) => (
                  <View key={appointment.id} style={styles.appointmentCard}>
                    <View style={styles.appointmentHeader}>
                      <View style={styles.clientInfo}>
                        {appointment.users.profil_foto ? (
                          <Image source={{ uri: appointment.users.profil_foto }} style={styles.clientAvatar} />
                        ) : (
                          <View style={styles.clientAvatarPlaceholder}>
                            <Ionicons name="person" size={20} color="#4B6C4B" />
                          </View>
                        )}
                        <View style={styles.clientDetails}>
                          <Text style={styles.clientName}>
                            {appointment.users.isim} {appointment.users.soyisim}
                          </Text>
                          <Text style={styles.clientEmail}>{appointment.users.eposta}</Text>
                        </View>
                      </View>
                      <View style={styles.timeInfo}>
                        <Text style={styles.timeText}>
                          {appointment.giris_saati} - {appointment.cikis_saati}
                        </Text>
                      </View>
                    </View>
                    {appointment.notlar && (
                      <Text style={styles.appointmentNotes}>{appointment.notlar}</Text>
                    )}
                    <View style={styles.appointmentActions}>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => openEditAppointmentModal(appointment)}
                      >
                        <Ionicons name="create-outline" size={18} color="#4B6C4B" />
                        <Text style={styles.actionButtonText}>Düzenle</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => deleteAppointment(appointment.id)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                        <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Sil</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>

        {/* Randevu Ekleme Modal */}
        <AddAppointmentModal
          visible={addAppointmentModalVisible}
          onClose={() => setAddAppointmentModalVisible(false)}
          diyetisyenId={currentUser?.id}
          onAppointmentAdded={() => {
            setAddAppointmentModalVisible(false);
            loadAppointments(currentUser?.id);
          }}
        />

        {/* Randevu Düzenleme Modal */}
        <EditAppointmentModal
          visible={editAppointmentModalVisible}
          onClose={() => {
            setEditAppointmentModalVisible(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
          diyetisyenId={currentUser?.id}
          onAppointmentUpdated={() => {
            setEditAppointmentModalVisible(false);
            setSelectedAppointment(null);
            loadAppointments(currentUser?.id);
          }}
        />
      </View>
    );
  }

  // Normal kullanıcı için BMI hesaplama arayüzü
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bgColor }}
      contentContainerStyle={[styles.container, { minHeight: '100%', paddingBottom: 64 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Vücut Kitle Endeksi{"\n"}Hesaplama Aracı</Text>
      <View style={styles.divider} />
      {/* Boy */}
      <Text style={styles.label}>Boyunuz</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={height.toString()}
          keyboardType="numeric"
          onChangeText={v => setHeight(Number(v))}
        />
        <Text style={styles.unit}>cm</Text>
      </View>
      <View style={styles.sliderRow}>
        <Slider
          style={{ width: width * 0.7, height: 40 }}
          minimumValue={100}
          maximumValue={220}
          step={1}
          value={height}
          onValueChange={setHeight}
          minimumTrackTintColor="#4B6C4B"
          maximumTrackTintColor="#e0e4e0"
          thumbTintColor="#4B6C4B"
        />
      </View>
      {/* Kilo */}
      <Text style={styles.label}>Kilonuz</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={weight.toString()}
          keyboardType="numeric"
          onChangeText={v => setWeight(Number(v))}
        />
        <Text style={styles.unit}>kg</Text>
      </View>
      <View style={styles.sliderRow}>
        <Slider
          style={{ width: width * 0.7, height: 40 }}
          minimumValue={30}
          maximumValue={200}
          step={1}
          value={weight}
          onValueChange={setWeight}
          minimumTrackTintColor="#4B6C4B"
          maximumTrackTintColor="#e0e4e0"
          thumbTintColor="#4B6C4B"
        />
      </View>
      {/* Yaş ve Cinsiyet */}
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1, marginRight: 10 }]}
          value={age}
          keyboardType="numeric"
          placeholder="Yaşınız"
          placeholderTextColor="#bdbdbd"
          onChangeText={setAge}
        />
        <Pressable
          style={[styles.genderButton, gender === 'Kadın' && styles.genderButtonActive]}
          onPress={() => setGender('Kadın')}
        >
          <Text style={[styles.genderText, gender === 'Kadın' && styles.genderTextActive]}>Kadın</Text>
        </Pressable>
        <Pressable
          style={[styles.genderButton, gender === 'Erkek' && styles.genderButtonActive, { marginLeft: 8 }]}
          onPress={() => setGender('Erkek')}
        >
          <Text style={[styles.genderText, gender === 'Erkek' && styles.genderTextActive]}>Erkek</Text>
        </Pressable>
      </View>
      {/* Hesapla Butonu */}
      <Pressable style={styles.calcButton} onPress={calculateBMI}>
        <Text style={styles.calcButtonText}>VKI Hesapla</Text>
      </Pressable>
      {/* VKI Nedir Butonu */}
      <Pressable style={styles.infoButton} onPress={() => setInfoVisible(true)}>
        <Ionicons name="information-circle-outline" size={20} color="#4B6C4B" style={{ marginRight: 6 }} />
        <Text style={styles.infoButtonText}>VKI Nedir?</Text>
      </Pressable>
      {/* VKI Nedir Modal */}
      {infoVisible && (
        <View style={styles.infoModalOverlay}>
          <View style={styles.infoModalContent}>
            <Pressable style={styles.infoModalCloseIcon} onPress={() => setInfoVisible(false)}>
            <Ionicons name="close" size={18} color="#888" />
            </Pressable>
            <Text style={styles.infoModalTitle}>Vücut Kitle İndeksi (VKİ) Nedir?</Text>
            <Text style={styles.infoModalText}>
              Vücut Kitle İndeksi (VKİ), kilogram cinsinden ağırlığın, metre cinsinden boyun karesine bölünmesiyle elde edilen bir değerdir. VKİ, kişinin zayıf, sağlıklı, fazla kilolu veya obez olup olmadığını belirlemede kullanılır. Sağlık risklerini değerlendirmek için pratik bir göstergedir.
            </Text>
          </View>
        </View>
      )}
      {/* Sonuç ve Açıklama */}
      {result && (
        <View style={styles.resultBox}>
          {/* VKI renk skalası ve gösterge */}
          <View style={styles.bmiBarWrapper}>
            <View style={styles.bmiBar}>
              {bmiRanges.map((range, idx) => (
                <View key={range.label} style={[styles.bmiBarSegment, { backgroundColor: range.color, flex: range.max - range.min }]} />
              ))}
              {/* VKI göstergesi */}
              <View style={[styles.bmiIndicator, { left: `${((Math.min(result.vki, 60) / 60) * 100)}%` }]}/>
            </View>
            <View style={styles.bmiLabelsRow}>
              {bmiRanges.map((range, idx) => (
                <View key={range.label} style={styles.bmiLabelCol}>
                  <Image
                    source={range.icon}
                    style={{ width: 38, height: 38, marginBottom: 2, opacity: result.label === range.label ? 1 : 0.35 }}
                    resizeMode="contain"
                  />
                  <Text style={[styles.bmiLabelText, result.label === range.label && { color: range.color, fontWeight: 'bold' }]}>{range.label}</Text>
                </View>
              ))}
            </View>
          </View>
          <Text style={styles.resultLabel}>{`Vücut Kitle İndeksiniz: ${result.vki.toFixed(1)}`}</Text>
          <Text style={[styles.resultStatus, result.label === 'Sağlıklı' ? styles.statusHealthy : result.label === 'Zayıf' ? styles.statusThin : result.label === 'Şişman' ? styles.statusOver : result.label === 'Obez' ? styles.statusObese : styles.statusVeryObese]}>{result.label}</Text>
          <Text style={styles.resultDesc}>{result.desc}</Text>
        </View>
      )}
    </ScrollView>
  );
}

// Randevu Düzenleme Modal Component'i
interface EditAppointmentModalProps {
  visible: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  diyetisyenId: string;
  onAppointmentUpdated: () => void;
}

function EditAppointmentModal({ visible, onClose, appointment, diyetisyenId, onAppointmentUpdated }: EditAppointmentModalProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [timePickerModalVisible, setTimePickerModalVisible] = useState(false);
  const [timePickerType, setTimePickerType] = useState<'start' | 'end'>('start');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  // Saat seçimi modalını aç
  const openTimePickerModal = (type: 'start' | 'end') => {
    setTimePickerType(type);
    setTimePickerModalVisible(true);
  };

  // Saat seçimi yapıldığında
  const handleTimeSelection = (time: string) => {
    if (timePickerType === 'start') {
      setStartTime(time);
      // Bitiş saatini otomatik olarak 1 saat sonrasına ayarla
      const startDate = new Date(`2000-01-01T${time}`);
      startDate.setHours(startDate.getHours() + 1);
      const endTimeStr = startDate.toTimeString().slice(0, 5);
      setEndTime(endTimeStr);
    } else {
      setEndTime(time);
    }
    setTimePickerModalVisible(false);
  };

  // Müsait saatleri yükle
  const loadAvailableTimeSlots = async (date: Date) => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      
      // O gün için mevcut randevuları al (kendi randevusu hariç)
      const { data: existingAppointments, error } = await supabase
        .from('appointments')
        .select('giris_saati, cikis_saati')
        .eq('diyetisyen_id', diyetisyenId)
        .eq('tarih', dateStr)
        .neq('id', appointment?.id || '');

      if (error) {
        console.error('Randevular yüklenirken hata:', error);
        return;
      }

      // Çalışma saatleri (09:00-18:00)
      const workHours = [];
      for (let hour = 9; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          workHours.push(time);
        }
      }

      // Mevcut randevuları kontrol et ve müsait saatleri belirle
      const busySlots = new Set();
      existingAppointments?.forEach(appointment => {
        const start = appointment.giris_saati;
        const end = appointment.cikis_saati;
        
        // Bu randevu süresince olan tüm 30 dakikalık slotları işaretle
        let currentTime = new Date(`2000-01-01T${start}`);
        const endTime = new Date(`2000-01-01T${end}`);
        
        while (currentTime < endTime) {
          const timeStr = currentTime.toTimeString().slice(0, 5);
          busySlots.add(timeStr);
          currentTime.setMinutes(currentTime.getMinutes() + 30);
        }
      });

      // Müsait saatleri filtrele
      const available = workHours.filter(time => !busySlots.has(time));
      setAvailableSlots(available);
    } catch (error) {
      console.error('Müsait saatler yüklenirken hata:', error);
    }
  };

  useEffect(() => {
    if (visible && appointment) {
      loadClients();
      // Mevcut randevu bilgilerini form'a yükle
      setSelectedClient(appointment.user_id);
      setSelectedDate(new Date(appointment.tarih));
      setStartTime(appointment.giris_saati);
      setEndTime(appointment.cikis_saati);
      setNotes(appointment.notlar || '');
    }
  }, [visible, appointment]);

  // Tarih değiştiğinde müsait saatleri yükle
  useEffect(() => {
    if (visible) {
      loadAvailableTimeSlots(selectedDate);
    }
  }, [visible, selectedDate]);

  const loadClients = async () => {
    try {
      const { data: clientsData, error } = await supabase
        .from('users')
        .select('*')
        .eq('diyetisyen_id', diyetisyenId);

      if (error) {
        console.error('Danışanlar yüklenirken hata:', error);
      } else {
        setClients(clientsData || []);
      }
    } catch (error) {
      console.error('Danışanlar yüklenirken hata:', error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedClient || !appointment) {
      Alert.alert('Hata', 'Lütfen gerekli alanları doldurun.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          user_id: selectedClient,
          tarih: selectedDate.toISOString().split('T')[0],
          giris_saati: startTime,
          cikis_saati: endTime,
          notlar: notes
        })
        .eq('id', appointment.id);

      if (error) {
        Alert.alert('Hata', 'Randevu güncellenirken bir hata oluştu.');
      } else {
        Alert.alert('Başarılı', 'Randevu başarıyla güncellendi.');
        onAppointmentUpdated();
      }
    } catch (error) {
      Alert.alert('Hata', 'Randevu güncellenirken bir hata oluştu.');
    }
    setLoading(false);
  };

  if (!appointment) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.addAppointmentModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Randevu Düzenle</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#4B6C4B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Danışan Seçimi */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Danışan Seçimi</Text>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Danışan:</Text>
                <View style={styles.pickerWrapper}>
                  <Text style={styles.pickerText}>
                    {selectedClient ? 
                      clients.find(c => c.id === selectedClient)?.isim + ' ' + clients.find(c => c.id === selectedClient)?.soyisim :
                      'Danışan seçin'
                    }
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#4B6C4B" />
                </View>
                {clients.map((client) => (
                  <TouchableOpacity
                    key={client.id}
                    style={[
                      styles.clientOption,
                      selectedClient === client.id && styles.clientOptionSelected
                    ]}
                    onPress={() => setSelectedClient(client.id)}
                  >
                    <Text style={[
                      styles.clientOptionText,
                      selectedClient === client.id && styles.clientOptionTextSelected
                    ]}>
                      {client.isim} {client.soyisim}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Tarih Seçimi */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Tarih</Text>
              <Calendar
                current={selectedDate.toISOString()}
                onDayPress={(day) => setSelectedDate(new Date(day.timestamp))}
                markedDates={{
                  [selectedDate.toISOString().split('T')[0]]: {
                    selected: true,
                    selectedColor: '#4B6C4B',
                  }
                }}
                theme={{
                  selectedDayBackgroundColor: '#4B6C4B',
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: '#4B6C4B',
                  dayTextColor: '#2d4150',
                  textDisabledColor: '#d9e1e8',
                  arrowColor: '#4B6C4B',
                  monthTextColor: '#4B6C4B',
                  indicatorColor: '#4B6C4B',
                  textDayFontWeight: '300',
                  textMonthFontWeight: 'bold',
                  textDayHeaderFontWeight: '300',
                  textDayFontSize: 16,
                  textMonthFontSize: 16,
                  textDayHeaderFontSize: 13
                }}
              />
            </View>

            {/* Saat Seçimi */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Saat</Text>
              <View style={styles.timeRow}>
                <View style={styles.timeInputContainer}>
                  <Text style={styles.timeLabel}>Başlangıç:</Text>
                  <TouchableOpacity
                    style={styles.timeInput}
                    onPress={() => openTimePickerModal('start')}
                  >
                    <Text style={styles.timeInputText}>{startTime}</Text>
                    <Ionicons name="time-outline" size={20} color="#4B6C4B" />
                  </TouchableOpacity>
                </View>
                <View style={styles.timeInputContainer}>
                  <Text style={styles.timeLabel}>Bitiş:</Text>
                  <TouchableOpacity
                    style={styles.timeInput}
                    onPress={() => openTimePickerModal('end')}
                  >
                    <Text style={styles.timeInputText}>{endTime}</Text>
                    <Ionicons name="time-outline" size={20} color="#4B6C4B" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Notlar */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Notlar</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Randevu notları..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Güncelle Butonu */}
            <TouchableOpacity 
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleUpdate}
              disabled={loading}
            >
              <Ionicons name="save-outline" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>
                {loading ? 'Güncelleniyor...' : 'Randevu Güncelle'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Saat Seçimi Modal */}
      <Modal
        visible={timePickerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTimePickerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.timePickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {timePickerType === 'start' ? 'Başlangıç Saati Seç' : 'Bitiş Saati Seç'}
              </Text>
              <TouchableOpacity onPress={() => setTimePickerModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#4B6C4B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.timePickerContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.timePickerSubtitle}>
                {selectedDate.toLocaleDateString('tr-TR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })} - Müsait Saatler
              </Text>
              
              <View style={styles.timeSlotsContainer}>
                {availableSlots.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={styles.timeSlot}
                    onPress={() => handleTimeSelection(time)}
                  >
                    <Text style={styles.timeSlotText}>{time}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {availableSlots.length === 0 && (
                <View style={styles.noAvailableSlots}>
                  <Ionicons name="time-outline" size={40} color="#A0BFA0" />
                  <Text style={styles.noAvailableSlotsText}>
                    Bu tarihte müsait saat bulunmuyor
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const mainColor = '#4B6C4B';
const bgColor = '#f5f7f7';

const styles = StyleSheet.create({
  container: {
    paddingTop: 68,
    paddingHorizontal: 20,
    paddingBottom: 32,
    backgroundColor: bgColor,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: mainColor,
    textAlign: 'center',
    marginBottom: 4,
    marginTop: 4,
  },
  divider: {
    height: 2,
    backgroundColor: '#e0e0e0',
    marginBottom: 18,
    marginHorizontal: 6,
    borderRadius: 2,
  },
  label: {
    fontSize: 14,
    color: '#222',
    marginBottom: 4,
    marginTop: 6,
    marginLeft: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 7,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#222',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  unit: {
    fontSize: 13,
    color: mainColor,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sliderRow: {
    height: 24,
    justifyContent: 'center',
    marginBottom: 10,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: '#e0e4e0',
    borderRadius: 3,
    width: width * 0.7,
    alignSelf: 'center',
  },
  sliderFill: {
    height: 6,
    backgroundColor: mainColor,
    borderRadius: 3,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  sliderThumb: {
    position: 'absolute',
    top: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: mainColor,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 2,
  },
  genderButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: mainColor,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  genderButtonActive: {
    backgroundColor: mainColor,
    borderColor: mainColor,
  },
  genderText: {
    color: mainColor,
    fontWeight: 'bold',
    fontSize: 14,
  },
  genderTextActive: {
    color: '#fff',
  },
  calcButton: {
    backgroundColor: mainColor,
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  calcButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  resultBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 10,
    marginTop: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: mainColor,
    marginBottom: 2,
  },
  resultStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statusHealthy: {
    color: '#4caf50',
  },
  statusThin: {
    color: '#2196f3',
  },
  statusOver: {
    color: '#ff9800',
  },
  statusObese: {
    color: '#e53935',
  },
  statusVeryObese: {
    color: '#b71c1c',
  },
  resultDesc: {
    fontSize: 12,
    color: '#444',
    textAlign: 'center',
    marginTop: 1,
    lineHeight: 15,
  },
  bmiBarWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 6,
  },
  bmiBar: {
    flexDirection: 'row',
    width: '100%',
    height: 6,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4,
    position: 'relative',
    backgroundColor: '#eee',
  },
  bmiBarSegment: {
    height: 6,
  },
  bmiIndicator: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#222',
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 2,
    marginLeft: -6,
  },
  bmiLabelsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 0,
  },
  bmiLabelCol: {
    alignItems: 'center',
    flex: 1,
  },
  bmiLabelText: {
    fontSize: 10,
    color: '#bbb',
    textAlign: 'center',
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 4,
    alignSelf: 'center',
    backgroundColor: '#eaf2ea',
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  infoButtonText: {
    color: '#4B6C4B',
    fontWeight: 'bold',
    fontSize: 13,
  },
  infoModalOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  infoModalContent: {
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 14,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
    position: 'relative',
  },
  infoModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4B6C4B',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  infoModalText: {
    fontSize: 13,
    color: '#444',
    textAlign: 'center',
    marginBottom: 0,
    lineHeight: 18,
    fontWeight: '400',
  },
  infoModalCloseIcon: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    padding: 4,
  },
  // Randevu Takvimi Stilleri
  calendarContainer: {
    flex: 1,
    paddingTop: 68,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  calendarTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: mainColor,
    textAlign: 'center',
    marginBottom: 4,
    marginTop: 4,
  },
  calendarWrapper: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  appointmentsSection: {
    flex: 1,
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
    color: mainColor,
    flex: 1,
  },
  addAppointmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: mainColor,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addAppointmentButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: mainColor,
    fontSize: 16,
  },
  emptyAppointmentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyAppointmentsText: {
    color: mainColor,
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  appointmentsList: {
    flex: 1,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  clientAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F0E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  clientEmail: {
    fontSize: 14,
    color: '#666',
  },
  timeInfo: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: mainColor,
  },
  appointmentNotes: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    fontStyle: 'italic',
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E6F0E6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#E6F0E6',
  },
  deleteButton: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FFE5E5',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B6C4B',
    marginLeft: 4,
  },
  deleteButtonText: {
    color: '#FF6B6B',
  },
  // Modal Stilleri
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAppointmentModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    margin: 20,
    maxHeight: '90%',
    width: '95%',
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
    color: mainColor,
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
    color: mainColor,
    marginBottom: 15,
  },
  pickerContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  pickerWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
  },
  clientOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 5,
  },
  clientOptionSelected: {
    backgroundColor: mainColor,
  },
  clientOptionText: {
    fontSize: 16,
    color: '#333',
  },
  clientOptionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeInputContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  timeInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E6F0E6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeInputText: {
    fontSize: 16,
    color: '#333',
  },
  notesInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E6F0E6',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mainColor,
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  // Saat Seçimi Modal Stilleri
  timePickerModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    margin: 20,
    maxHeight: '80%',
    width: '95%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  timePickerContent: {
    padding: 20,
  },
  timePickerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlot: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6F0E6',
  },
  timeSlotText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4B6C4B',
  },
  noAvailableSlots: {
    alignItems: 'center',
    padding: 40,
  },
  noAvailableSlotsText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
});

// Randevu Ekleme Modal Component'i
interface AddAppointmentModalProps {
  visible: boolean;
  onClose: () => void;
  diyetisyenId: string;
  onAppointmentAdded: () => void;
}

function AddAppointmentModal({ visible, onClose, diyetisyenId, onAppointmentAdded }: AddAppointmentModalProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [timePickerModalVisible, setTimePickerModalVisible] = useState(false);
  const [timePickerType, setTimePickerType] = useState<'start' | 'end'>('start');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');

  // Saat seçimi modalını aç
  const openTimePickerModal = (type: 'start' | 'end') => {
    setTimePickerType(type);
    setTimePickerModalVisible(true);
  };

  // Saat seçimi yapıldığında
  const handleTimeSelection = (time: string) => {
    if (timePickerType === 'start') {
      setStartTime(time);
      // Bitiş saatini otomatik olarak 1 saat sonrasına ayarla
      const startDate = new Date(`2000-01-01T${time}`);
      startDate.setHours(startDate.getHours() + 1);
      const endTimeStr = startDate.toTimeString().slice(0, 5);
      setEndTime(endTimeStr);
    } else {
      setEndTime(time);
    }
    setTimePickerModalVisible(false);
  };

  // Müsait saatleri yükle
  const loadAvailableTimeSlots = async (date: Date) => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      
      // O gün için mevcut randevuları al
      const { data: existingAppointments, error } = await supabase
        .from('appointments')
        .select('giris_saati, cikis_saati')
        .eq('diyetisyen_id', diyetisyenId)
        .eq('tarih', dateStr);

      if (error) {
        console.error('Randevular yüklenirken hata:', error);
        return;
      }

      // Çalışma saatleri (09:00-18:00)
      const workHours = [];
      for (let hour = 9; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          workHours.push(time);
        }
      }

      // Mevcut randevuları kontrol et ve müsait saatleri belirle
      const busySlots = new Set();
      existingAppointments?.forEach(appointment => {
        const start = appointment.giris_saati;
        const end = appointment.cikis_saati;
        
        // Bu randevu süresince olan tüm 30 dakikalık slotları işaretle
        let currentTime = new Date(`2000-01-01T${start}`);
        const endTime = new Date(`2000-01-01T${end}`);
        
        while (currentTime < endTime) {
          const timeStr = currentTime.toTimeString().slice(0, 5);
          busySlots.add(timeStr);
          currentTime.setMinutes(currentTime.getMinutes() + 30);
        }
      });

      // Müsait saatleri filtrele
      const available = workHours.filter(time => !busySlots.has(time));
      setAvailableSlots(available);
    } catch (error) {
      console.error('Müsait saatler yüklenirken hata:', error);
    }
  };

  // Tarih değiştiğinde müsait saatleri yükle
  useEffect(() => {
    if (visible) {
      loadAvailableTimeSlots(selectedDate);
    }
  }, [visible, selectedDate]);

  useEffect(() => {
    if (visible) {
      loadClients();
    }
  }, [visible]);

  const loadClients = async () => {
    try {
      const { data: clientsData, error } = await supabase
        .from('users')
        .select('*')
        .eq('diyetisyen_id', diyetisyenId);

      if (error) {
        console.error('Danışanlar yüklenirken hata:', error);
      } else {
        setClients(clientsData || []);
      }
    } catch (error) {
      console.error('Danışanlar yüklenirken hata:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedClient) {
      Alert.alert('Hata', 'Lütfen bir danışan seçin.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .insert({
          diyetisyen_id: diyetisyenId,
          user_id: selectedClient,
          tarih: selectedDate.toISOString().split('T')[0],
          giris_saati: startTime,
          cikis_saati: endTime,
          notlar: notes
        });

      if (error) {
        Alert.alert('Hata', 'Randevu eklenirken bir hata oluştu.');
      } else {
        Alert.alert('Başarılı', 'Randevu başarıyla eklendi.');
        onAppointmentAdded();
        // Form'u temizle
        setSelectedClient('');
        setSelectedDate(new Date());
        setStartTime('09:00');
        setEndTime('10:00');
        setNotes('');
      }
    } catch (error) {
      Alert.alert('Hata', 'Randevu eklenirken bir hata oluştu.');
    }
    setLoading(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.addAppointmentModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Yeni Randevu Ekle</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#4B6C4B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Danışan Seçimi */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Danışan Seçimi</Text>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Danışan:</Text>
                <View style={styles.pickerWrapper}>
                  <Text style={styles.pickerText}>
                    {selectedClient ? 
                      clients.find(c => c.id === selectedClient)?.isim + ' ' + clients.find(c => c.id === selectedClient)?.soyisim :
                      'Danışan seçin'
                    }
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#4B6C4B" />
                </View>
                {clients.map((client) => (
                  <TouchableOpacity
                    key={client.id}
                    style={[
                      styles.clientOption,
                      selectedClient === client.id && styles.clientOptionSelected
                    ]}
                    onPress={() => setSelectedClient(client.id)}
                  >
                    <Text style={[
                      styles.clientOptionText,
                      selectedClient === client.id && styles.clientOptionTextSelected
                    ]}>
                      {client.isim} {client.soyisim}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Tarih Seçimi */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Tarih</Text>
              <Calendar
                current={selectedDate.toISOString()}
                onDayPress={(day) => setSelectedDate(new Date(day.timestamp))}
                markedDates={{
                  [selectedDate.toISOString().split('T')[0]]: {
                    selected: true,
                    selectedColor: '#4B6C4B',
                  }
                }}
                theme={{
                  selectedDayBackgroundColor: '#4B6C4B',
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: '#4B6C4B',
                  dayTextColor: '#2d4150',
                  textDisabledColor: '#d9e1e8',
                  arrowColor: '#4B6C4B',
                  monthTextColor: '#4B6C4B',
                  indicatorColor: '#4B6C4B',
                  textDayFontWeight: '300',
                  textMonthFontWeight: 'bold',
                  textDayHeaderFontWeight: '300',
                  textDayFontSize: 16,
                  textMonthFontSize: 16,
                  textDayHeaderFontSize: 13
                }}
              />
            </View>

            {/* Saat Seçimi */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Saat</Text>
              <View style={styles.timeRow}>
                <View style={styles.timeInputContainer}>
                  <Text style={styles.timeLabel}>Başlangıç:</Text>
                  <TouchableOpacity
                    style={styles.timeInput}
                    onPress={() => openTimePickerModal('start')}
                  >
                    <Text style={styles.timeInputText}>{startTime}</Text>
                    <Ionicons name="time-outline" size={20} color="#4B6C4B" />
                  </TouchableOpacity>
                </View>
                <View style={styles.timeInputContainer}>
                  <Text style={styles.timeLabel}>Bitiş:</Text>
                  <TouchableOpacity
                    style={styles.timeInput}
                    onPress={() => openTimePickerModal('end')}
                  >
                    <Text style={styles.timeInputText}>{endTime}</Text>
                    <Ionicons name="time-outline" size={20} color="#4B6C4B" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Notlar */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Notlar</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Randevu notları..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Kaydet Butonu */}
            <TouchableOpacity 
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <Ionicons name="save-outline" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>
                {loading ? 'Kaydediliyor...' : 'Randevu Kaydet'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Saat Seçimi Modal */}
      <Modal
        visible={timePickerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTimePickerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.timePickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {timePickerType === 'start' ? 'Başlangıç Saati Seç' : 'Bitiş Saati Seç'}
              </Text>
              <TouchableOpacity onPress={() => setTimePickerModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#4B6C4B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.timePickerContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.timePickerSubtitle}>
                {selectedDate.toLocaleDateString('tr-TR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })} - Müsait Saatler
              </Text>
              
              <View style={styles.timeSlotsContainer}>
                {availableSlots.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={styles.timeSlot}
                    onPress={() => handleTimeSelection(time)}
                  >
                    <Text style={styles.timeSlotText}>{time}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {availableSlots.length === 0 && (
                <View style={styles.noAvailableSlots}>
                  <Ionicons name="time-outline" size={40} color="#A0BFA0" />
                  <Text style={styles.noAvailableSlotsText}>
                    Bu tarihte müsait saat bulunmuyor
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}