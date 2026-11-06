import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { colors } from '@/constants/theme';
import { useProtectedAction } from '@/hooks/use-protected-action';
import type { SavedType } from './api';
import { useSaved } from './use-saved';
export function FavoriteButton({ type, id, size = 'md', label = false, returnTo }: { type: SavedType; id: string; size?: 'sm' | 'md'; label?: boolean; returnTo?: string }) {
  const protect = useProtectedAction();
  const pathname = usePathname();
  const { isSaved, toggle, isLoading } = useSaved(type);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const saved = isSaved(id);
  const box = label ? 'min-h-11 px-4' : size === 'sm' ? 'h-9 w-9' : 'h-11 w-11';
  async function update() {
    if (busy) return;
    setBusy(true); setError('');
    try { await toggle(id); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo actualizar. Inténtalo otra vez.'); }
    finally { setBusy(false); }
  }
  return <View>
    <Pressable accessibilityLabel={saved ? 'Quitar de guardados' : 'Guardar'} accessibilityState={{ selected: saved, disabled: busy || isLoading, busy }} disabled={busy || isLoading} hitSlop={8}
      onPress={(event) => { event.stopPropagation(); protect(() => void update(), returnTo ?? pathname); }}
      className={`${box} flex-row items-center justify-center rounded-full bg-white shadow`}>
      {busy ? <ActivityIndicator size="small" color={colors.red} /> : <Ionicons name={saved ? 'heart' : 'heart-outline'} size={size === 'sm' ? 18 : 22} color={colors.red} />}
      {label && <Text className="ml-2 font-medium text-sm text-navy">{saved ? 'Guardado' : 'Guardar'}</Text>}
    </Pressable>
    {!!error && <Text accessibilityRole="alert" className="mt-2 max-w-52 text-xs text-brand">{error}</Text>}
  </View>;
}
