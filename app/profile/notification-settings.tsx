import { Text, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/stores/app-store';

export default function NotificationSettingsScreen() {
  const preferences = useAppStore((state) => state.notificationPreferences);
  const setPreference = useAppStore((state) => state.setNotificationPreference);
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title="Notificaciones" showBack />
      <View className="m-5 rounded-3xl bg-white px-5">
        <Setting title="Mensajes" description="Nuevos mensajes y conversaciones" value={preferences.messages} onChange={(value) => setPreference('messages', value)} />
        <Setting title="Ofertas y tratos" description="Ofertas, contraofertas y acuerdos" value={preferences.offers} onChange={(value) => setPreference('offers', value)} />
        <Setting title="Actividad" description="Reseñas y novedades de publicaciones" value={preferences.activity} onChange={(value) => setPreference('activity', value)} />
      </View>
      <Text className="px-8 text-center font-sans text-xs leading-5 text-muted">Estas preferencias controlan la bandeja. Las notificaciones push requieren un development build y configuración EAS.</Text>
    </SafeAreaView>
  );
}

function Setting({ title, description, value, onChange }: { title: string; description: string; value: boolean; onChange: (value: boolean) => void }) {
  return <View className="flex-row items-center border-b border-line py-5 last:border-b-0"><View className="flex-1"><Text className="font-medium text-ink">{title}</Text><Text className="mt-1 font-sans text-xs text-muted">{description}</Text></View><Switch value={value} onValueChange={onChange} trackColor={{ false: '#D1D5DB', true: colors.red }} /></View>;
}
