import { Ionicons } from '@expo/vector-icons';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/constants/theme';
import { useNotifications } from '@/hooks/use-notifications';
import { formatRelativeDate } from '@/utils/format';
import { PrimaryButton } from '@/components/primary-button';
import { useAuth } from '@/features/auth/auth-provider';
import { router } from 'expo-router';

const icons = { message: 'chatbubble-outline', offer: 'pricetag-outline', offer_accepted: 'checkmark-circle-outline', offer_rejected: 'close-circle-outline', counteroffer: 'swap-horizontal-outline', review: 'star-outline', listing: 'megaphone-outline' } as const;

export default function NotificationsScreen() {
  const { isAuthenticated } = useAuth();
  const { notifications, markRead, markAllRead } = useNotifications();
  if (!isAuthenticated) return <SafeAreaView edges={['top']} className="flex-1 bg-canvas"><ScreenHeader title="Notificaciones" showBack /><View className="flex-1 justify-center px-6"><EmptyState icon="notifications-outline" title="Inicia sesión para ver tus avisos" description="Aquí aparecerán mensajes, ofertas y novedades de tu cuenta." /><PrimaryButton label="Iniciar sesión" onPress={() => router.push({ pathname: '/(auth)/login', params: { returnTo: '/notifications' } })} /></View></SafeAreaView>;
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title="Notificaciones" showBack />
      {notifications.some((item) => !item.read) && <Pressable onPress={() => void markAllRead()} className="self-end px-5 py-3"><Text className="font-medium text-sm text-brand">Marcar todas como leídas</Text></Pressable>}
      <FlatList data={notifications} keyExtractor={(item) => item.id} contentContainerClassName="px-5 pb-8" ListEmptyComponent={<EmptyState icon="notifications-off-outline" title="Todo está tranquilo" description="Tus mensajes, ofertas y reseñas aparecerán aquí." />} renderItem={({ item }) => (
        <Pressable onPress={() => void markRead(item.id)} className={`mb-3 flex-row rounded-2xl border p-4 ${item.read ? 'border-line bg-white' : 'border-red-100 bg-red-50'}`}>
          <View className={`h-11 w-11 items-center justify-center rounded-xl ${item.read ? 'bg-canvas' : 'bg-white'}`}><Ionicons name={icons[item.type]} size={22} color={item.read ? colors.navy : colors.red} /></View>
          <View className="ml-3 flex-1"><View className="flex-row items-center"><Text className="flex-1 font-medium text-sm text-ink">{item.title}</Text>{!item.read && <View className="h-2 w-2 rounded-full bg-brand" />}</View><Text className="mt-1 font-sans text-sm leading-5 text-muted">{item.body}</Text><Text className="mt-2 font-sans text-[10px] text-muted">{formatRelativeDate(item.createdAt)}</Text></View>
        </Pressable>
      )} />
    </SafeAreaView>
  );
}
