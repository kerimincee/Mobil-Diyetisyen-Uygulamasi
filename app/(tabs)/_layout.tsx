import { Tabs } from 'expo-router';
import { Image, Platform } from 'react-native';

import { CustomTabBarButton, HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Anasayfa',
          tabBarIcon: ({ focused }) => (
            <Image source={require('../../assets/images/anasayfa.png')} style={{ width: 34, height: 34, tintColor: focused ? '#5A7742' : '#B0B0B0' }} />
          ),
        }}
      />
      <Tabs.Screen
        name="BMI"
        options={{
          title: 'VKI Hesapla',
          tabBarIcon: ({ focused }) => (
            <Image source={require('../../assets/images/vkihesapla.png')} style={{ width: 34, height: 34, tintColor: focused ? '#5A7742' : '#B0B0B0' }} />
          ),
        }}
      />
      <Tabs.Screen
        name="Chatbot"
        options={{
          title: 'Diyet Asistanı',
          tabBarIcon: () => null, // Ortadaki özel buton, iconu CustomTabBarButton'da
          tabBarButton: (props) => <CustomTabBarButton {...props} isCenter />,
        }}
      />

      <Tabs.Screen
        name="Kalori"
        options={{
          title: 'Kalori',
          tabBarIcon: ({ focused }) => (
            <Image source={require('../../assets/images/kalori.png')} style={{ width: 34, height: 34, tintColor: focused ? '#5A7742' : '#B0B0B0' }} />
          ),
        }}
      />
      <Tabs.Screen
        name="Takvim"
        options={{
          title: 'Takvim',
          tabBarIcon: ({ focused }) => (
            <Image source={require('../../assets/images/takvim.png')} style={{ width: 34, height: 34, tintColor: focused ? '#5A7742' : '#B0B0B0' }} />
          ),
        }}
      />
    </Tabs>
  );
}
