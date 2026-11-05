import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { fetchMyPublications, fetchMyRegistrations, type MyPublication } from '@/features/comunidad/actividad';
import { photoUrl } from '@/features/comunidad/api';
import { StatusBadge } from '@/features/comunidad/components';
import { EventCard } from '@/features/comunidad/eventos/components';
import { fetchMyRequests, requestStatusLabels } from '@/features/comunidad/solicitudes';
import { sections } from '@/features/comunidad/theme';
import { formatRelativeDate } from '@/utils/format';

type Tab = 'solicitudes' | 'inscripciones' | 'publicaciones';
const tabs: { value: Tab; label: string }[] = [
  { value: 'solicitudes', label: 'Solicitudes' },
  { value: 'inscripciones', label: 'Inscripciones' },
  { value: 'publicaciones', label: 'Publicaciones' },
];

const kindSection = { donation: sections.donaciones, adoption: sections.adopciones, event: sections.eventos, workshop: sections.talleres };

function openItem(kind: keyof typeof kindSection, id: string) {
  if (kind === 'donation') router.push({ pathname: '/comunidad/donaciones/[id]', params: { id } });
  else if (kind === 'adoption') router.push({ pathname: '/comunidad/adopciones/[id]', params: { id } });
  else router.push({ pathname: '/comunidad/eventos/[id]', params: { id } });
}

export default function MyActivityScreen() {
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const [tab, setTab] = useState<Tab>(params.tab ?? 'solicitudes');
  const { session } = useAuth();
  const userId = session?.user.id;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title="Mi actividad" showBack />
      {!userId ? (
        <View className="flex-1 justify-center px-6">
          <EmptyState icon="lock-closed-outline" title="Inicia sesión" description="Aquí verás lo que pediste, tus inscripciones y lo que publicaste en Comunidad." />
          <PrimaryButton label="Iniciar sesión" onPress={() => router.push({ pathname: '/(auth)/login', params: { returnTo: '/comunidad/mi-actividad' } })} />
        </View>
      ) : (
        <>
          <View className="mx-5 mt-3 flex-row rounded-2xl bg-white p-1">
            {tabs.map((item) => (
              <Pressable
                key={item.value}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === item.value }}
                onPress={() => setTab(item.value)}
                className={`flex-1 items-center rounded-xl py-2.5 ${tab === item.value ? 'bg-navy' : ''}`}
              >
                <Text className={`font-medium text-xs ${tab === item.value ? 'text-white' : 'text-muted'}`}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
          {tab === 'solicitudes' && <RequestsTab userId={userId} />}
          {tab === 'inscripciones' && <RegistrationsTab userId={userId} />}
          {tab === 'publicaciones' && <PublicationsTab userId={userId} />}
        </>
      )}
    </SafeAreaView>
  );
}

function RequestsTab({ userId }: { userId: string }) {
  const query = useQuery({ queryKey: ['my-community-requests', userId], queryFn: () => fetchMyRequests(userId), staleTime: 0 });
  if (query.isLoading) return <ActivityIndicator className="mt-10" color={colors.red} />;
  if (query.isError) return <EmptyState icon="cloud-offline-outline" title="No pudimos cargar tus solicitudes" description={query.error.message} />;
  return (
    <FlatList
      data={query.data}
      keyExtractor={(item) => item.id}
      contentContainerClassName="gap-3 p-5 pb-12"
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
      ListEmptyComponent={<EmptyState icon="file-tray-outline" title="Aún no enviaste solicitudes" description="Cuando pidas una donación o quieras adoptar, aparecerá aquí." />}
      renderItem={({ item }) => {
        const section = kindSection[item.kind];
        return (
          <Pressable accessibilityRole="button" onPress={() => openItem(item.kind, item.targetId)} className="flex-row items-center rounded-2xl bg-white p-4">
            <View className={`h-11 w-11 items-center justify-center rounded-xl ${section.soft}`}>
              <Ionicons name={section.icon} size={22} color={section.color} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-medium text-ink">{item.title}</Text>
              <Text className="mb-2 mt-0.5 font-sans text-xs text-muted">
                {item.kind === 'donation' ? 'Donación' : 'Adopción'} · {formatRelativeDate(item.created_at)}
              </Text>
              <StatusBadge
                label={requestStatusLabels[item.status]}
                tone={['selected', 'accepted'].includes(item.status) ? 'amber' : ['delivered', 'completed'].includes(item.status) ? 'green' : ['pending', 'evaluating'].includes(item.status) ? 'navy' : 'gray'}
              />
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        );
      }}
    />
  );
}

function RegistrationsTab({ userId }: { userId: string }) {
  const query = useQuery({ queryKey: ['my-registrations', userId], queryFn: () => fetchMyRegistrations(userId), staleTime: 0 });
  if (query.isLoading) return <ActivityIndicator className="mt-10" color={colors.red} />;
  if (query.isError) return <EmptyState icon="cloud-offline-outline" title="No pudimos cargar tus inscripciones" description={query.error.message} />;
  return (
    <FlatList
      data={query.data}
      keyExtractor={(item) => item.id}
      contentContainerClassName="gap-3 p-5 pb-12"
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
      ListEmptyComponent={<EmptyState icon="calendar-clear-outline" title="No tienes inscripciones" description="Inscríbete en un evento o taller y lo verás aquí." />}
      renderItem={({ item }) => <EventCard event={item} showDate onPress={() => openItem(item.kind, item.id)} />}
    />
  );
}

function PublicationsTab({ userId }: { userId: string }) {
  const query = useQuery({ queryKey: ['my-publications', userId], queryFn: () => fetchMyPublications(userId), staleTime: 0 });
  if (query.isLoading) return <ActivityIndicator className="mt-10" color={colors.red} />;
  if (query.isError) return <EmptyState icon="cloud-offline-outline" title="No pudimos cargar tus publicaciones" description={query.error.message} />;
  return (
    <FlatList
      data={query.data}
      keyExtractor={(item) => item.id}
      contentContainerClassName="gap-3 p-5 pb-12"
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
      ListEmptyComponent={<EmptyState icon="megaphone-outline" title="Aún no publicaste nada" description="Dona algo, da en adopción u organiza un evento desde Comunidad." />}
      renderItem={({ item }) => <PublicationRow item={item} />}
    />
  );
}

function PublicationRow({ item }: { item: MyPublication }) {
  const section = kindSection[item.kind];
  return (
    <Pressable accessibilityRole="button" onPress={() => openItem(item.kind, item.id)} className="flex-row items-center rounded-2xl bg-white p-3">
      {item.photo ? (
        <Image source={{ uri: photoUrl(item.photo) }} style={{ width: 64, height: 64, borderRadius: 14 }} contentFit="cover" />
      ) : (
        <View className={`h-16 w-16 items-center justify-center rounded-2xl ${section.soft}`}>
          <Ionicons name={section.icon} size={26} color={section.color} />
        </View>
      )}
      <View className="ml-3 flex-1">
        <Text className={`font-medium text-[11px] uppercase ${section.text}`}>{section.title}</Text>
        <Text numberOfLines={1} className="mt-0.5 font-medium text-ink">{item.title}</Text>
        <View className="mt-1.5">
          <StatusBadge {...item.badge} />
        </View>
        <Text className={`mt-1 text-xs ${item.pending ? 'font-medium text-brand' : 'font-sans text-muted'}`}>{item.detail}</Text>
      </View>
      {item.pending > 0 && (
        <View className="ml-2 h-6 min-w-6 items-center justify-center rounded-full bg-brand px-1.5">
          <Text className="font-medium text-[11px] text-white">{item.pending}</Text>
        </View>
      )}
    </Pressable>
  );
}

