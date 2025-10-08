import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import LoadingOverlay from '../components/LoadingOverlay';
import { LoadingProvider } from '../contexts/LoadingContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
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
        <Stack initialRouteName="GirisScreen">
          <Stack.Screen name="GirisScreen" options={{ title: 'DiyetAPP', headerShown: false }} />
          <Stack.Screen name="UserLogin" options={{ title: 'Kullanıcı Girişi', headerBackTitle: 'Geri' }} />
          <Stack.Screen name="DieticianLogin" options={{ title: 'Diyetisyen Girişi', headerBackTitle: 'Geri' }} />
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
