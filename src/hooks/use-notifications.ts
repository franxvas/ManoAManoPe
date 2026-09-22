import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { useAuth } from '@/features/auth/auth-provider';
import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchNotifications, markAllRemoteNotificationsRead, markRemoteNotificationRead, removeNotificationChannel, subscribeToNotifications } from '@/services/user-data';
import { useAppStore } from '@/stores/app-store';

export function useNotifications() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const local = useAppStore((state) => state.notifications);
  const localMarkRead = useAppStore((state) => state.markNotificationRead);
  const localMarkAll = useAppStore((state) => state.markAllNotificationsRead);
  const key = useMemo(() => ['notifications', session?.user.id] as const, [session?.user.id]);
  const remote = useQuery({ queryKey: key, queryFn: fetchNotifications, enabled: isSupabaseConfigured && Boolean(session), refetchInterval: 30_000 });
  const notifications = isSupabaseConfigured ? (remote.data ?? []) : local;
  useEffect(() => {
    if (!isSupabaseConfigured || !session?.user.id) return;
    const channel = subscribeToNotifications(session.user.id, () => void queryClient.invalidateQueries({ queryKey: key }));
    return () => { void removeNotificationChannel(channel); };
  }, [key, queryClient, session?.user.id]);
  const markRead = async (id: string) => {
    if (!isSupabaseConfigured) return localMarkRead(id);
    queryClient.setQueryData(key, notifications.map((item) => item.id === id ? { ...item, read: true } : item));
    await markRemoteNotificationRead(id);
  };
  const markAllRead = async () => {
    if (!isSupabaseConfigured) return localMarkAll();
    queryClient.setQueryData(key, notifications.map((item) => ({ ...item, read: true })));
    await markAllRemoteNotificationsRead();
  };
  return { notifications, markRead, markAllRead };
}
