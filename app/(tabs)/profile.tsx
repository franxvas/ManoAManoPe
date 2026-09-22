import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { BrandLogo } from '@/components/brand-logo';
import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { useListings } from '@/hooks/use-listings';
import { useProfile } from '@/hooks/use-profile';

const menuItems: { label: string; icon: keyof typeof Ionicons.glyphMap; route: '/profile/edit' | '/profile/my-listings' | '/profile/favorites' | '/profile/account' | '/profile/notification-settings' | '/profile/help' }[] = [
  { label: 'Editar perfil', icon: 'create-outline', route: '/profile/edit' },
  { label: 'Mis publicaciones', icon: 'albums-outline', route: '/profile/my-listings' },
  { label: 'Favoritos', icon: 'heart-outline', route: '/profile/favorites' },
  { label: 'Cuenta y seguridad', icon: 'shield-checkmark-outline', route: '/profile/account' },
  { label: 'Notificaciones', icon: 'notifications-outline', route: '/profile/notification-settings' },
  { label: 'Centro de ayuda', icon: 'help-circle-outline', route: '/profile/help' },
];

export default function ProfileScreen() {
  const { profile, isError, refresh, updateProfile } = useProfile();
  const [actionError, setActionError] = useState('');
  const [sellerModeUpdating, setSellerModeUpdating] = useState(false);
  const { listings: allListings } = useListings();
  const listings = allListings.filter((item) => item.ownerId === profile?.id);
  const { signOut, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-canvas px-6">
        <Ionicons name="person-circle-outline" size={72} color={colors.navy} />
        <Text className="mt-4 font-display text-2xl text-navy">Tu perfil te está esperando</Text>
        <Text className="mt-2 text-center font-sans text-muted">Inicia sesión para publicar, guardar favoritos y construir tu reputación.</Text>
        <Pressable onPress={() => router.push({ pathname: '/(auth)/login', params: { returnTo: '/(tabs)/profile' } })} className="mt-6 rounded-2xl bg-brand px-8 py-4"><Text className="font-medium text-white">Iniciar sesión</Text></Pressable>
      </SafeAreaView>
    );
  }
  if (!profile && isError) return <SafeAreaView className="flex-1 items-center justify-center bg-canvas px-6"><Text className="font-display text-2xl text-navy">No pudimos cargar tu perfil</Text><Text className="mt-2 text-center text-muted">Revisa tu conexión e inténtalo otra vez.</Text><Pressable onPress={() => void refresh()} className="mt-5 rounded-xl bg-brand px-6 py-3"><Text className="font-medium text-white">Reintentar</Text></Pressable></SafeAreaView>;
  if (!profile) return <SafeAreaView className="flex-1 items-center justify-center bg-canvas"><Text className="font-medium text-navy">Cargando perfil…</Text></SafeAreaView>;
  const toggleSellerMode = async (sellerMode: boolean) => {
    setSellerModeUpdating(true); setActionError('');
    try { await updateProfile({ sellerMode }); }
    catch (error) { setActionError(error instanceof Error ? error.message : 'No se pudo cambiar el modo vendedor.'); }
    finally { setSellerModeUpdating(false); }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScrollView contentContainerClassName="pb-28" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between bg-white px-5 pb-3 pt-2"><BrandLogo compact /><Pressable onPress={() => router.push('/notifications')}><Ionicons name="notifications-outline" size={25} color={colors.navy} /></Pressable></View>
        <View className="relative h-40 bg-navy">{Boolean(profile.coverUrl) && <Image source={{ uri: profile.coverUrl }} className="h-full w-full opacity-70" contentFit="cover" />}</View>
        <View className="bg-white px-5 pb-6">
          <View className="-mt-12 flex-row items-end justify-between"><View className="rounded-full border-4 border-white"><Avatar uri={profile.avatarUrl} name={profile.displayName} size={94} /></View><Pressable onPress={() => router.push('/profile/edit')} className="mb-2 rounded-full border border-navy px-4 py-2"><Text className="font-medium text-xs text-navy">Editar perfil</Text></Pressable></View>
          <View className="mt-3 flex-row items-center"><Text className="font-display text-2xl text-navy">{profile.displayName}</Text>{profile.verified && <Ionicons name="checkmark-circle" size={19} color={colors.navy} style={{ marginLeft: 6 }} />}</View>
          <Text className="mt-1 font-sans text-sm text-muted">{profile.profession}</Text>
          <Text className="mt-3 font-sans leading-5 text-ink">{profile.bio}</Text>
          <View className="mt-5 flex-row rounded-2xl bg-canvas py-4">
            <Stat value={String(listings.length)} label="Publicaciones" />
            <Stat value={profile.ratingAverage.toFixed(1)} label="Rating" />
            <Stat value={String(profile.ratingCount)} label="Reseñas" last />
          </View>
        </View>
        <View className="mt-3 bg-white px-5 py-2">
          <View className="flex-row items-center py-4"><View className="h-11 w-11 items-center justify-center rounded-xl bg-red-50"><Ionicons name="storefront-outline" size={22} color={colors.red} /></View><View className="ml-3 flex-1"><Text className="font-medium text-ink">Modo vendedor</Text><Text className="mt-0.5 font-sans text-xs text-muted">Activa herramientas para ofrecer y vender</Text></View><Switch disabled={sellerModeUpdating} value={profile.sellerMode} onValueChange={(sellerMode) => void toggleSellerMode(sellerMode)} trackColor={{ false: '#D1D5DB', true: colors.red }} /></View>
          {Boolean(actionError) && <Pressable onPress={() => setActionError('')} className="mb-3 rounded-xl bg-red-50 p-3"><Text className="text-center text-xs text-brand">{actionError}</Text></Pressable>}
          {menuItems.map((item) => (
            <Pressable key={item.label} onPress={() => router.push(item.route)} className="flex-row items-center border-t border-line py-4">
              <Ionicons name={item.icon} size={22} color={colors.navy} /><Text className="ml-3 flex-1 font-medium text-sm text-ink">{item.label}</Text><Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          ))}
          <Pressable onPress={() => void signOut().then(() => router.replace('/(auth)/welcome'))} className="flex-row items-center border-t border-line py-4"><Ionicons name="log-out-outline" size={22} color={colors.red} /><Text className="ml-3 font-medium text-sm text-brand">Cerrar sesión</Text></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label, last = false }: { value: string; label: string; last?: boolean }) {
  return <View className={`flex-1 items-center ${last ? '' : 'border-r border-line'}`}><Text className="font-display text-xl text-navy">{value}</Text><Text className="mt-1 font-sans text-[11px] text-muted">{label}</Text></View>;
}
