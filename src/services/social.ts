import type { RealtimeChannel } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { Conversation, Listing, Message, Offer } from '@/types/domain';

interface ProfileRow { id: string; display_name: string; avatar_url: string | null }
interface ListingRow { id: string; title: string; price: number | null; budget: number | null; type: Listing['type'] }
interface ConversationRow {
  id: string; listing_id: string; buyer_id: string; seller_id: string; status: string; last_message_at: string;
  buyer: ProfileRow; seller: ProfileRow; listing: ListingRow;
}
interface MessageRow { id: string; conversation_id: string; sender_id: string | null; body: string; message_type: Message['messageType']; offer_id: string | null; created_at: string; read_at: string | null }
interface OfferRow { id: string; conversation_id: string; listing_id: string; sender_id: string; receiver_id: string; amount: number; currency: 'PEN'; status: Offer['status']; parent_offer_id: string | null; created_at: string }

export interface RemoteConversation extends Conversation { buyerId: string; sellerId: string }
export interface RemoteConversationDetail { conversation: RemoteConversation; listing: ListingRow }

function requireClient() {
  if (!supabase) throw new Error('Supabase no está configurado');
  return supabase;
}

export async function openRemoteConversation(listingId: string) {
  const client = requireClient();
  const { data, error } = await client.rpc('open_or_create_conversation', { p_listing_id: listingId });
  if (error) throw error;
  return String(data);
}

export async function fetchRemoteConversations(): Promise<RemoteConversation[]> {
  const client = requireClient();
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await client.from('conversations').select('id,listing_id,buyer_id,seller_id,status,last_message_at,buyer:profiles!buyer_id(id,display_name,avatar_url),seller:profiles!seller_id(id,display_name,avatar_url),listing:listings(id,title,price,budget,type)').order('last_message_at', { ascending: false });
  if (error) throw error;
  const rows = data as unknown as ConversationRow[];
  const ids = rows.map((row) => row.id);
  const [lastMessages, unreadMessages] = ids.length ? await Promise.all([
    client.from('messages').select('conversation_id,body').in('conversation_id', ids).order('created_at', { ascending: false }),
    client.from('messages').select('conversation_id').in('conversation_id', ids).is('read_at', null).neq('sender_id', auth.user.id),
  ]) : [{ data: [] }, { data: [] }];
  const messageByConversation = new Map<string, string>();
  for (const message of (lastMessages.data ?? []) as { conversation_id: string; body: string }[]) if (!messageByConversation.has(message.conversation_id)) messageByConversation.set(message.conversation_id, message.body);
  const unreadByConversation = new Map<string, number>();
  for (const message of (unreadMessages.data ?? []) as { conversation_id: string }[]) unreadByConversation.set(message.conversation_id, (unreadByConversation.get(message.conversation_id) ?? 0) + 1);
  return rows.map((row) => {
    const counterpart = row.buyer_id === auth.user!.id ? row.seller : row.buyer;
    return {
      id: row.id, listingId: row.listing_id, participantName: counterpart.display_name, participantAvatar: counterpart.avatar_url ?? '',
      lastMessage: messageByConversation.get(row.id) ?? row.listing.title, lastMessageAt: row.last_message_at, unreadCount: unreadByConversation.get(row.id) ?? 0,
      status: normalizeConversationStatus(row.status), buyerId: row.buyer_id, sellerId: row.seller_id,
    };
  });
}

export async function fetchRemoteConversation(id: string): Promise<RemoteConversationDetail | null> {
  const conversations = await fetchRemoteConversations();
  const conversation = conversations.find((item) => item.id === id);
  if (!conversation) return null;
  const client = requireClient();
  const { data, error } = await client.from('listings').select('id,title,price,budget,type').eq('id', conversation.listingId).single();
  if (error) throw error;
  return { conversation, listing: data as ListingRow };
}

export async function fetchRemoteMessages(conversationId: string): Promise<{ messages: Message[]; offers: Offer[] }> {
  const client = requireClient();
  const [{ data: messages, error: messageError }, { data: offers, error: offerError }] = await Promise.all([
    client.from('messages').select('id,conversation_id,sender_id,body,message_type,offer_id,created_at,read_at').eq('conversation_id', conversationId).order('created_at'),
    client.from('offers').select('id,conversation_id,listing_id,sender_id,receiver_id,amount,currency,status,parent_offer_id,created_at').eq('conversation_id', conversationId).order('created_at'),
  ]);
  if (messageError) throw messageError;
  if (offerError) throw offerError;
  return {
    messages: (messages as MessageRow[]).map((row) => ({ id: row.id, conversationId: row.conversation_id, senderId: row.sender_id ?? undefined, body: row.body, messageType: row.message_type, offerId: row.offer_id ?? undefined, createdAt: row.created_at, readAt: row.read_at ?? undefined })),
    offers: (offers as OfferRow[]).map((row) => ({ id: row.id, conversationId: row.conversation_id, listingId: row.listing_id, senderId: row.sender_id, receiverId: row.receiver_id, amount: Number(row.amount), currency: row.currency, status: row.status, parentOfferId: row.parent_offer_id ?? undefined, createdAt: row.created_at })),
  };
}

export async function sendRemoteMessage(conversationId: string, body: string) {
  const client = requireClient();
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) throw new Error('Debes iniciar sesión');
  const { error } = await client.from('messages').insert({ conversation_id: conversationId, sender_id: auth.user.id, body, message_type: 'text' });
  if (error) throw error;
}

export async function markRemoteMessagesRead(conversationId: string) {
  const client = requireClient();
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) return;
  const { error } = await client.from('messages').update({ read_at: new Date().toISOString() }).eq('conversation_id', conversationId).neq('sender_id', auth.user.id).is('read_at', null);
  if (error) throw error;
}

export async function sendRemoteOffer(conversationId: string, amount: number, parentOfferId?: string) {
  const { error } = await requireClient().rpc('send_offer', { p_conversation_id: conversationId, p_amount: amount, p_parent_offer_id: parentOfferId ?? null });
  if (error) throw error;
}

export async function respondRemoteOffer(offerId: string, action: 'accept' | 'reject' | 'counter', counterAmount?: number) {
  const { error } = await requireClient().rpc('respond_to_offer', { p_offer_id: offerId, p_action: action, p_counter_amount: counterAmount ?? null });
  if (error) throw error;
}

export async function submitRemoteReview(conversationId: string, rating: number, comment: string) {
  const { error } = await requireClient().rpc('complete_deal_and_review', { p_conversation_id: conversationId, p_rating: rating, p_comment: comment });
  if (error) throw error;
}

export function subscribeToConversation(conversationId: string, onChange: () => void): RealtimeChannel {
  return requireClient().channel(`conversation:${conversationId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'offers', filter: `conversation_id=eq.${conversationId}` }, onChange)
    .subscribe();
}

export function subscribeToConversationList(onChange: () => void): RealtimeChannel {
  return requireClient().channel('conversation-list')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, onChange)
    .subscribe();
}

export async function removeRealtimeChannel(channel: RealtimeChannel) {
  if (supabase) await supabase.removeChannel(channel);
}

const normalizeConversationStatus = (status: string): Conversation['status'] => {
  if (status === 'negotiating' || status === 'offer_sent' || status === 'waiting' || status === 'accepted') return status;
  return 'chatting';
};
