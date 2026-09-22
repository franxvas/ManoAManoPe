import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { AppNotification } from '@/types/domain';

export async function fetchFavoriteIds(): Promise<string[]> {
  if (!supabase) return [];
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await supabase.from('favorites').select('listing_id').eq('user_id', auth.user.id);
  if (error) throw error;
  return (data ?? []).map((row) => String(row.listing_id));
}

export async function toggleRemoteFavorite(listingId: string, currentlyFavorite: boolean) {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Debes iniciar sesión');
  const request = currentlyFavorite
    ? supabase.from('favorites').delete().eq('user_id', auth.user.id).eq('listing_id', listingId)
    : supabase.from('favorites').insert({ user_id: auth.user.id, listing_id: listingId });
  const { error } = await request;
  if (error) throw error;
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('notifications').select('id,type,title,body,read_at,created_at').order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: String(row.id), type: normalizeNotificationType(String(row.type)), title: String(row.title), body: String(row.body), read: Boolean(row.read_at), createdAt: String(row.created_at) }));
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
