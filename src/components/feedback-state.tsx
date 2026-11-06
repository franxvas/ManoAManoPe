import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

export function LoadingState({ label = 'Cargando publicaciones…' }: { label?: string }) {
  return <View accessibilityRole="progressbar" accessibilityLabel={label} className="items-center gap-3 py-10"><ActivityIndicator color={colors.red} /><Text className="font-sans text-sm text-muted">{label}</Text></View>;
}

export function OfflineNotice({ onRetry }: { onRetry?: () => void }) {
  return <View accessibilityRole="alert" className="mx-4 my-3 flex-row items-center gap-3 rounded-2xl bg-amber-50 p-3"><Ionicons name="cloud-offline-outline" size={21} color="#92400E" /><Text className="flex-1 font-sans text-xs leading-5 text-ink">Sin conexión. Estás viendo publicaciones guardadas.</Text>{onRetry && <Pressable accessibilityRole="button" onPress={onRetry} className="min-h-11 justify-center px-2"><Text className="font-medium text-xs text-brand">Reintentar</Text></Pressable>}</View>;
}
