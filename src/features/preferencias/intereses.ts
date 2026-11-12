import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { Listing } from '@/types/domain';

// Cada interés reconoce una promoción por palabras de su título o descripción.
export const intereses = [
  { id: 'comida', label: 'Comida y restaurantes', icon: 'restaurant-outline', words: ['menú', 'ceviche', 'pollo', 'chaufa', 'empanada', 'torta', 'pan', 'desayuno', 'jugo', 'café'] },
  { id: 'abarrotes', label: 'Abarrotes', icon: 'basket-outline', words: ['arroz', 'aceite', 'leche', 'huevo', 'gaseosa', 'canasta', 'azúcar'] },
  { id: 'tecnologia', label: 'Celulares y tecnología', icon: 'phone-portrait-outline', words: ['celular', 'pantalla', 'cargador', 'power bank', 'laptop', 'audífono'] },
  { id: 'hogar', label: 'Hogar y muebles', icon: 'bed-outline', words: ['silla', 'repisa', 'cama', 'mueble', 'puerta', 'madera', 'limpieza'] },
  { id: 'construccion', label: 'Ferretería y construcción', icon: 'hammer-outline', words: ['taladro', 'broca', 'pintura', 'clavo', 'cable', 'martillo'] },
  { id: 'ropa', label: 'Ropa y confecciones', icon: 'shirt-outline', words: ['uniforme', 'polo', 'camisa', 'jean', 'vestido', 'casaca'] },
  { id: 'servicios', label: 'Clases y servicios', icon: 'school-outline', words: ['clase', 'mudanza', 'flete', 'mantenimiento', 'instalación', 'reparación'] },
] as const;

export type InteresId = (typeof intereses)[number]['id'];

export function interesesDe(session: Session | null): InteresId[] {
  const saved = session?.user.user_metadata?.intereses;
  return Array.isArray(saved) ? saved : [];
}

export async function guardarIntereses(ids: InteresId[]) {
  if (!supabase) return;
  const { error } = await supabase.auth.updateUser({ data: { intereses: ids } });
  if (error) throw error;
}

export function coincide(listing: Listing, ids: InteresId[]) {
  const text = `${listing.title} ${listing.description}`.toLowerCase();
  // Palabra completa (admite plural), para que "pan" no coincida con "pantalla".
  const has = (word: string) => new RegExp(`(^|[^\\p{L}])${word}(e?s)?([^\\p{L}]|$)`, 'u').test(text);
  return intereses.some((item) => ids.includes(item.id) && item.words.some(has));
}
