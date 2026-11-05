import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable } from 'react-native';

import { colors } from '@/constants/theme';
import { useProtectedAction } from '@/hooks/use-protected-action';
import type { SavedType } from './api';
import { useSaved } from './use-saved';

// Corazón para guardar cualquier cosa de la app. Pide iniciar sesión si hace falta.
export function FavoriteButton({ type, id, size = 'md' }: { type: SavedType; id: string; size?: 'sm' | 'md' }) {
  const protect = useProtectedAction();
  const { isSaved, toggle } = useSaved(type);
  const saved = isSaved(id);
  const box = size === 'sm' ? 'h-9 w-9' : 'h-11 w-11';

  return (
    // Sin rol de botón: en la web va dentro de tarjetas que ya son botones y no se pueden anidar.
    <Pressable
      accessibilityLabel={saved ? 'Quitar de guardados' : 'Guardar'}
      accessibilityState={{ selected: saved }}
      hitSlop={8}
      onPress={(event) => {
        event.stopPropagation();
        protect(() => void toggle(id).catch(() => Alert.alert('Guardados', 'No se pudo actualizar. Inténtalo otra vez.')));
      }}
      className={`${box} items-center justify-center rounded-full bg-white shadow`}
    >
      <Ionicons name={saved ? 'heart' : 'heart-outline'} size={size === 'sm' ? 18 : 22} color={colors.red} />
    </Pressable>
  );
}
