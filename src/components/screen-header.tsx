import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { BrandLogo } from '@/components/brand-logo';
import { colors } from '@/constants/theme';
import { useNotifications } from '@/hooks/use-notifications';
import { useProfile } from '@/hooks/use-profile';
import { goBackOr } from '@/utils/navigation';

export function ScreenHeader({ title, showBack = false, backFallback = '/(tabs)' }: { title?: string; showBack?: boolean; backFallback?: '/(tabs)' | '/(tabs)/profile' | '/(tabs)/messages' | '/(auth)/welcome' }) {
  const { profile } = useProfile();
  const { notifications } = useNotifications();
  const unread = notifications.filter((item) => !item.read).length;
  return (
    <View className="flex-row items-center justify-between bg-white px-5 pb-3 pt-2">
      <View className="flex-row items-center">
        {showBack && (
          <Pressable onPress={() => goBackOr(backFallback)} className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-canvas" accessibilityLabel="Volver">
            <Ionicons name="arrow-back" size={23} color={colors.navy} />
          </Pressable>
        )}
        {title ? <Text className="font-display text-2xl text-navy">{title}</Text> : <BrandLogo compact />}
      </View>
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => router.push('/notifications')} className="relative h-11 w-11 items-center justify-center rounded-full bg-canvas" accessibilityLabel="Notificaciones">
          <Ionicons name="notifications-outline" size={23} color={colors.navy} />
          {unread > 0 && (
            <View className="absolute right-0 top-0 min-w-5 items-center rounded-full bg-brand px-1 py-0.5">
              <Text className="font-medium text-[10px] text-white">{unread}</Text>
            </View>
          )}
        </Pressable>
        <Pressable onPress={() => router.push('/(tabs)/profile')} accessibilityLabel="Abrir perfil">
          <Avatar uri={profile?.avatarUrl} name={profile?.displayName ?? 'Usuario'} size={42} />
        </Pressable>
      </View>
    </View>
  );
}
