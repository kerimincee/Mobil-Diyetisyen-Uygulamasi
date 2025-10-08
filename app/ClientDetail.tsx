import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLoading } from '../contexts/LoadingContext';
import { supabase } from '../supabaseClient';

interface Client {
  id: string;
  isim: string;
  soyisim: string;
  eposta: string;
  telefon?: string;
  boy?: number;
  kilo?: number;
  yas?: number;
  cinsiyet?: string;
  profil_foto?: string;
}

interface Meal {
  id: string;
  food_name: string;
  calorie: number;
  image_url?: string;
  created_at: string;
}

export default function ClientDetailScreen() {
  const router = useRouter();
  const { clientId } = useLocalSearchParams();
  const { setShowLoading, showLoading } = useLoading();
  const [client, setClient] = useState<Client | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientData = async () => {
      setShowLoading(true);
      try {
        // Diyetisyen kontrolü
        const currentDiyetisyen = await AsyncStorage.getItem('currentDiyetisyen');
        if (!currentDiyetisyen) {
          router.replace('/GirisScreen');
          return;
        }

        // Danışan bilgilerini getir
        const { data: clientData, error: clientError } = await supabase
          .from('users')
          .select('*')
          .eq('id', clientId)
          .single();

        if (clientError || !clientData) {
          Alert.alert('Hata', 'Danışan bilgileri bulunamadı.');
          router.back();
          return;
        }

        setClient(clientData);

        // Danışanın yemeklerini getir
        const { data: mealsData, error: mealsError } = await supabase
          .from('meals')
          .select('*')
          .eq('user_id', clientId)
          .order('created_at', { ascending: false });

        if (mealsError) {
          console.error('Yemekler getirilirken hata:', mealsError);
        } else {
          setMeals(mealsData || []);
        }

      } catch (error) {
        console.error('Veri yükleme hatası:', error);
        Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu.');
      }
      setShowLoading(false);
      setLoading(false);
    };

    if (clientId) {
      fetchClientData();
    }
  }, [clientId]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      
      // Geçersiz tarih kontrolü
      if (isNaN(date.getTime())) {
        return 'Tarih belirsiz';
      }
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${day}.${month}.${year} ${hours}:${minutes}`;
    } catch (error) {
      console.error('Tarih formatı hatası:', error);
      return 'Tarih belirsiz';
    }
  };

  const calculateTotalCalories = () => {
    return meals.reduce((total, meal) => total + meal.calorie, 0);
  };

  const calculateAverageCalories = () => {
    if (meals.length === 0) return 0;
    return Math.round(calculateTotalCalories() / meals.length);
  };

  if (loading || showLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' }}>
        <Text>Yükleniyor...</Text>
      </View>
    );
  }

  if (!client) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' }}>
        <Text>Danışan bulunamadı</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.clientInfo}>
          {client.profil_foto ? (
            <Image source={{ uri: client.profil_foto }} style={styles.clientAvatar} />
          ) : (
            <View style={styles.clientAvatarPlaceholder}>
              <Ionicons name="person" size={40} color="#4B6C4B" />
            </View>
          )}
          <View style={styles.clientDetails}>
            <Text style={styles.clientName}>{client.isim} {client.soyisim}</Text>
            <Text style={styles.clientEmail}>{client.eposta}</Text>
            {client.telefon && <Text style={styles.clientPhone}>{client.telefon}</Text>}
          </View>
        </View>
      </View>

      {/* Kişisel Bilgiler */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>
        <View style={styles.infoGrid}>
          {client.yas && (
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={20} color="#4B6C4B" />
              <Text style={styles.infoLabel}>Yaş</Text>
              <Text style={styles.infoValue}>{client.yas}</Text>
            </View>
          )}
          {client.boy && (
            <View style={styles.infoItem}>
              <Ionicons name="resize-outline" size={20} color="#4B6C4B" />
              <Text style={styles.infoLabel}>Boy</Text>
              <Text style={styles.infoValue}>{client.boy} cm</Text>
            </View>
          )}
          {client.kilo && (
            <View style={styles.infoItem}>
              <Ionicons name="scale-outline" size={20} color="#4B6C4B" />
              <Text style={styles.infoLabel}>Kilo</Text>
              <Text style={styles.infoValue}>{client.kilo} kg</Text>
            </View>
          )}
          {client.cinsiyet && (
            <View style={styles.infoItem}>
              <Ionicons name="person-outline" size={20} color="#4B6C4B" />
              <Text style={styles.infoLabel}>Cinsiyet</Text>
              <Text style={styles.infoValue}>{client.cinsiyet}</Text>
            </View>
          )}
        </View>
      </View>

      {/* İstatistikler */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Beslenme İstatistikleri</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{meals.length}</Text>
            <Text style={styles.statLabel}>Toplam Yemek</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{calculateTotalCalories()}</Text>
            <Text style={styles.statLabel}>Toplam Kalori</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{calculateAverageCalories()}</Text>
            <Text style={styles.statLabel}>Ortalama Kalori</Text>
          </View>
        </View>
      </View>

      {/* Yemek Listesi */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Yemek Geçmişi ({meals.length})</Text>
        {meals.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>Henüz yemek kaydı bulunmuyor</Text>
          </View>
        ) : (
          meals.map((meal) => (
            <View key={meal.id} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <Text style={styles.mealName}>{meal.food_name}</Text>
                <Text style={styles.mealTime}>{formatDate(meal.created_at)}</Text>
              </View>
              <View style={styles.mealContent}>
                {meal.image_url && (
                  <Image source={{ uri: meal.image_url }} style={styles.mealImage} />
                )}
                <View style={styles.calorieInfo}>
                  <Ionicons name="flame" size={16} color="#FF6B6B" />
                  <Text style={styles.calorieText}>{meal.calorie} kalori</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    backgroundColor: '#4B6C4B',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  clientAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  clientEmail: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    marginBottom: 3,
  },
  clientPhone: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#4B6C4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B6C4B',
    marginBottom: 15,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4B6C4B',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4B6C4B',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    marginTop: 10,
  },
  mealCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mealName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  mealTime: {
    fontSize: 12,
    color: '#666',
    minWidth: 80,
    textAlign: 'right',
  },
  mealContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 10,
  },
  calorieInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calorieText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
    marginLeft: 5,
  },
});
