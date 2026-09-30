import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { colors } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.red,
        tabBarInactiveTintColor: colors.navy,
        tabBarLabelStyle: { fontFamily: 'Inter_600SemiBold', fontSize: 11, marginBottom: 7 },
        tabBarStyle: { height: 76, paddingTop: 8, backgroundColor: colors.white, borderTopColor: colors.border },
        tabBarIcon: ({ color, size }) => {
          const icons = { index: 'home', explore: 'compass', messages: 'chatbubbles', profile: 'person' } as const;
          const name = icons[route.name as keyof typeof icons] ?? 'add';
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explorar' }} />
      <Tabs.Screen
        name="publish"
        options={{
          title: '', // Dejamos el título vacío para que el botón flotante no arrastre texto debajo
          tabBarLabel: () => null, // Oculta por completo la etiqueta de texto en la barra inferior solo para esta pestaña
          tabBarItemStyle: { top: -20 },
          tabBarIcon: () => (
            <View className="h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-brand shadow-lg">
              <Ionicons name="add" size={32} color="white" />
            </View>
          ),
        }}
      />
      <Tabs.Screen name="messages" options={{ title: 'Mensajes' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}