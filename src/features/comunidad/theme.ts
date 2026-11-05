import type { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';

export type SectionKey = 'donaciones' | 'adopciones' | 'eventos' | 'talleres';

// Cada sección tiene su color para reconocerla rápido en toda la app.
export const sections: Record<
  SectionKey,
  { title: string; description: string; icon: keyof typeof Ionicons.glyphMap; color: string; soft: string; text: string; href: Href }
> = {
  donaciones: {
    title: 'Donaciones',
    description: 'Regala lo que ya no usas o pide algo que te sirva.',
    icon: 'gift',
    color: '#D7192D',
    soft: 'bg-red-50',
    text: 'text-brand',
    href: '/comunidad/donaciones',
  },
  adopciones: {
    title: 'Adopciones',
    description: 'Animales que buscan un hogar responsable.',
    icon: 'paw',
    color: '#D97706',
    soft: 'bg-amber-50',
    text: 'text-amber-700',
    href: '/comunidad/adopciones',
  },
  eventos: {
    title: 'Eventos y campañas',
    description: 'Ferias, limpiezas, campañas de salud y más.',
    icon: 'calendar',
    color: '#0B2D5D',
    soft: 'bg-blue-50',
    text: 'text-navy',
    href: '/comunidad/eventos',
  },
  talleres: {
    title: 'Talleres',
    description: 'Aprende algo nuevo e inscríbete con tu cupo.',
    icon: 'school',
    color: '#1FA66A',
    soft: 'bg-green-50',
    text: 'text-success',
    href: '/comunidad/talleres',
  },
};
