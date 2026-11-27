import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { AppNotification } from '@/types/domain';
import { fetchSavedIds, setSaved } from '@/features/guardados/api';

// Los favoritos de publicaciones viven en la tabla única de guardados.
export async function fetchFavoriteIds(): Promise<string[]> {
  if (!supabase) return [];
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  return fetchSavedIds('listing');
}

export async function toggleRemoteFavorite(listingId: string, currentlyFavorite: boolean) {
  if (!supabase) throw new Error('Supabase no está configurado');
  await setSaved('listing', listingId, !currentlyFavorite);
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('notifications').select('id,type,title,body,data,read_at,created_at').order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: String(row.id), type: normalizeNotificationType(String(row.type)), title: String(row.title), body: String(row.body), read: Boolean(row.read_at), createdAt: String(row.created_at), data: (row.data ?? {}) as Record<string, string> }));
}

export async function markRemoteNotificationRead(notificationId: string) {
  if (!supabase) return;
  const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', notificationId);
  if (error) throw error;
}

export async function markAllRemoteNotificationsRead() {
  if (!supabase) return;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', auth.user.id).is('read_at', null);
  if (error) throw error;
}

export function subscribeToNotifications(userId: string, onChange: () => void): RealtimeChannel | null {
  if (!supabase) return null;
  const instanceId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return supabase.channel(`notifications:${userId}:${instanceId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, onChange).subscribe();
}

export async function removeNotificationChannel(channel: RealtimeChannel | null) {
  if (supabase && channel) await supabase.removeChannel(channel);
}

const normalizeNotificationType = (value: string): AppNotification['type'] => {
  if (value === 'message' || value === 'offer' || value === 'offer_accepted' || value === 'offer_rejected' || value === 'counteroffer' || value === 'review' || value === 'listing') return value;
  return 'listing';
};

// Devuelve la ruta a la que lleva una notificación, o null si no apunta a nada.
export async function notificationTarget(data: Record<string, string> = {}) {
  if (data.conversation_id) return { pathname: '/conversation/[id]', params: { id: data.conversation_id } } as const;
  if (data.deal_id && supabase) {
    const { data: deal } = await supabase.from('deals').select('conversation_id').eq('id', data.deal_id).maybeSingle();
    if (deal?.conversation_id) return { pathname: '/conversation/[id]', params: { id: String(deal.conversation_id) } } as const;
  }
  if (data.donation_id) return { pathname: '/comunidad/donaciones/[id]', params: { id: data.donation_id } } as const;
  if (data.adoption_id) return { pathname: '/comunidad/adopciones/[id]', params: { id: data.adoption_id } } as const;
  if (data.review_id) return '/(tabs)/profile' as const;
  return null;
}
