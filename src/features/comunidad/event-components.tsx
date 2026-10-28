import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Image } from 'expo-image';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { photoUrl } from './api';
import { StatusBadge } from './components';
import { categoryText, dayKey, eventPhase, parseDay, phaseBadges, seatsInfo, timeText, type CommunityEvent } from './event-model';

export function nextDays(count: number, from = new Date()) {
  return Array.from({ length: count }, (_, i) => new Date(from.getFullYear(), from.getMonth(), from.getDate() + i));
}

export function DayStrip({ days, selected, marked, onSelect }: { days: Date[]; selected?: string; marked?: Set<string>; onSelect: (day: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerClassName="gap-2">
      {days.map((day) => {
        const key = dayKey(day);
        const active = key === selected;
        return (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={format(day, "EEEE d 'de' MMMM", { locale: es })}
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(key)}
            className={`w-14 items-center rounded-2xl py-2 ${active ? 'bg-brand' : 'bg-white'}`}
          >
            <Text className={`font-sans text-[11px] capitalize ${active ? 'text-white' : 'text-muted'}`}>{format(day, 'EEE', { locale: es }).replace('.', '')}</Text>
            <Text className={`font-display text-xl ${active ? 'text-white' : 'text-navy'}`}>{day.getDate()}</Text>
            <View className={`mt-0.5 h-1.5 w-1.5 rounded-full ${marked?.has(key) ? (active ? 'bg-white' : 'bg-brand') : 'bg-transparent'}`} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function EventCard({ event, onPress, showDate = false }: { event: CommunityEvent; onPress: () => void; showDate?: boolean }) {
  const start = new Date(event.starts_at);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={event.title} onPress={onPress} className="flex-row rounded-2xl bg-white p-3">
      {event.photo ? (
        <Image source={{ uri: photoUrl(event.photo) }} style={{ width: 80, height: 80, borderRadius: 14 }} contentFit="cover" />
      ) : (
        <View className="h-20 w-20 items-center justify-center rounded-2xl bg-red-50">
          <Ionicons name="calendar-outline" size={28} color={colors.red} />
        </View>
      )}
      <View className="ml-3 flex-1">
        <Text numberOfLines={2} className="font-medium text-base text-ink">{event.title}</Text>
        <Text className="mt-1 font-sans text-xs text-muted">
          {showDate && `${format(start, "EEE d 'de' MMM", { locale: es })} · `}
          {timeText(start)} – {timeText(new Date(event.ends_at))} · {event.place}
        </Text>
        {event.requires_registration && <Text className="mt-1 font-medium text-xs text-navy">{seatsInfo(event).text}</Text>}
        <View className="mt-2 flex-row gap-2">
          <StatusBadge label={categoryText(event)} tone="red" />
          <StatusBadge {...phaseBadges[eventPhase(event)]} />
        </View>
      </View>
    </Pressable>
  );
}

export function dayTitle(day: string) {
  const title = format(parseDay(day) ?? new Date(), "EEEE d 'de' MMMM", { locale: es });
  return title.charAt(0).toUpperCase() + title.slice(1);
}
