import { Ionicons } from '@expo/vector-icons';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity } from 'react-native';
// React Native Reanimated is configured in babel.config.js

import { useColorScheme } from '@/hooks/useColorScheme';
import LoadingOverlay from '../components/LoadingOverlay';
import { LoadingProvider } from '../contexts/LoadingContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <LoadingProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <LoadingOverlay />
        <Stack>
          <Stack.Screen 
            name="index" 
            options={{ 
              title: 'Kullanıcı Girişi', 
              headerShown: true,
              headerRight: () => (
                <TouchableOpacity 
                  onPress={() => router.push('/DieticianLogin')}
                  style={{ marginRight: 15 }}
                >
                  <Ionicons name="medical-outline" size={24} color="#4B6C4B" />
                </TouchableOpacity>
              ),
            }} 
          />
          <Stack.Screen name="DieticianLogin" options={{ title: 'Diyetisyen Girişi', headerBackTitle: 'Geri', headerShown: true }} />
          <Stack.Screen name="Register" options={{ title: 'Kayıt Ol', headerBackTitle: 'Giriş Yap' }} />
          <Stack.Screen 
            name="Profile" 
            options={{ 
              title: 'Profilim', 
              headerBackTitle: 'Geri',
              headerStyle: { backgroundColor: '#4B6C4B' },
              headerTitleStyle: { color: '#fff', fontWeight: 'bold' },
              headerTintColor: '#fff',
              headerShadowVisible: false,
            }} 
          />
          <Stack.Screen 
            name="DieticianProfile" 
            options={{ 
              title: 'Diyetisyen Profili', 
              headerBackTitle: 'Geri',
              headerStyle: { backgroundColor: '#4B6C4B' },
              headerTitleStyle: { color: '#fff', fontWeight: 'bold' },
              headerTintColor: '#fff',
              headerShadowVisible: false,
            }} 
          />
          <Stack.Screen 
            name="AddClient" 
            options={{ 
              title: 'Danışan Ekle', 
              headerBackTitle: 'Geri',
              headerStyle: { backgroundColor: '#4B6C4B' },
              headerTitleStyle: { color: '#fff', fontWeight: 'bold' },
              headerTintColor: '#fff',
              headerShadowVisible: false,
            }} 
          />
          <Stack.Screen 
            name="ClientDetail" 
            options={{ 
              title: 'Danışan Detayı', 
              headerBackTitle: 'Geri',
              headerStyle: { backgroundColor: '#4B6C4B' },
              headerTitleStyle: { color: '#fff', fontWeight: 'bold' },
              headerTintColor: '#fff',
              headerShadowVisible: false,
            }} 
          />
          <Stack.Screen name="DiyetEkle" options={{ title: 'Diyet Ekle', headerBackTitle: 'Geri' }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </LoadingProvider>
  );
}
