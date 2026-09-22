import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEMO_SELLER_ID, DEMO_USER_ID, demoConversations, demoListings, demoMessages, demoNotifications, demoProfile } from '@/constants/demo';
import type { AppNotification, Conversation, Listing, Message, Offer, OfferStatus, Profile } from '@/types/domain';

type NewListingInput = Omit<Listing, 'id' | 'ownerId' | 'ownerName' | 'ownerAvatar' | 'ownerProfession' | 'ownerVerified' | 'rating' | 'createdAt' | 'status'>;

interface AppState {
  favorites: string[];
  listings: Listing[];
  conversations: Conversation[];
  messages: Message[];
  offers: Offer[];
  notifications: AppNotification[];
  reviewedConversations: string[];
  notificationPreferences: { messages: boolean; offers: boolean; activity: boolean };
  profile: Profile;
  toggleFavorite: (listingId: string) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  updateProfile: (profile: Partial<Profile>) => void;
  addListing: (listing: NewListingInput) => Listing;
  updateListing: (listingId: string, changes: Partial<Listing>) => void;
  updateListingStatus: (listingId: string, status: Listing['status']) => void;
  deleteListing: (listingId: string) => void;
  openConversation: (listing: Listing) => Conversation;
  sendMessage: (conversationId: string, body: string) => void;
  sendOffer: (conversationId: string, listingId: string, amount: number, parentOfferId?: string) => void;
  resolveOffer: (offerId: string, status: Extract<OfferStatus, 'accepted' | 'rejected'>) => void;
  submitReview: (conversationId: string, rating: number) => void;
  setNotificationPreference: (key: 'messages' | 'offers' | 'activity', value: boolean) => void;
}

const buildId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      favorites: ['laptop-hp'],
      listings: demoListings,
      conversations: demoConversations,
      messages: demoMessages,
      offers: [{
        id: 'offer-1', conversationId: 'chat-1', listingId: 'carpinteria-diaz', senderId: DEMO_SELLER_ID,
        receiverId: DEMO_USER_ID, amount: 430, currency: 'PEN', status: 'pending', createdAt: '2026-09-15T16:38:00Z',
      }],
      notifications: demoNotifications,
      reviewedConversations: [],
      notificationPreferences: { messages: true, offers: true, activity: true },
      profile: demoProfile,
      toggleFavorite: (listingId) => set((state) => ({
        favorites: state.favorites.includes(listingId)
          ? state.favorites.filter((id) => id !== listingId)
          : [...state.favorites, listingId],
      })),
      markNotificationRead: (notificationId) => set((state) => ({
        notifications: state.notifications.map((item) => item.id === notificationId ? { ...item, read: true } : item),
      })),
      markAllNotificationsRead: () => set((state) => ({
        notifications: state.notifications.map((item) => ({ ...item, read: true })),
      })),
      updateProfile: (changes) => set((state) => ({ profile: { ...state.profile, ...changes } })),
      addListing: (input) => {
        const profile = get().profile;
        const listing: Listing = {
          ...input,
          id: buildId('listing'),
          ownerId: DEMO_USER_ID,
          ownerName: profile.displayName,
          ownerAvatar: profile.avatarUrl,
          ownerProfession: profile.profession,
          ownerVerified: profile.verified,
          rating: profile.ratingAverage,
          status: 'published',
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ listings: [listing, ...state.listings] }));
        return listing;
      },
      updateListing: (listingId, changes) => set((state) => ({
        listings: state.listings.map((item) => item.id === listingId ? { ...item, ...changes, id: item.id, ownerId: item.ownerId } : item),
      })),
      updateListingStatus: (listingId, status) => set((state) => ({
        listings: state.listings.map((item) => item.id === listingId ? { ...item, status } : item),
      })),
      deleteListing: (listingId) => set((state) => ({ listings: state.listings.filter((item) => item.id !== listingId) })),
      openConversation: (listing) => {
        const existing = get().conversations.find((item) => item.listingId === listing.id);
        if (existing) return existing;
        const conversation: Conversation = {
          id: buildId('chat'), listingId: listing.id, participantName: listing.ownerName,
          participantAvatar: listing.ownerAvatar, lastMessage: 'Inicia la conversación',
          lastMessageAt: new Date().toISOString(), unreadCount: 0, status: 'chatting',
        };
        set((state) => ({ conversations: [conversation, ...state.conversations] }));
        return conversation;
      },
      sendMessage: (conversationId, body) => {
        const createdAt = new Date().toISOString();
        const message: Message = { id: buildId('message'), conversationId, senderId: DEMO_USER_ID, body, messageType: 'text', createdAt };
        set((state) => ({
          messages: [...state.messages, message],
          conversations: state.conversations.map((item) => item.id === conversationId ? { ...item, lastMessage: body, lastMessageAt: createdAt } : item),
        }));
      },
      sendOffer: (conversationId, listingId, amount, parentOfferId) => {
        const offer: Offer = {
          id: buildId('offer'), conversationId, listingId, senderId: DEMO_USER_ID, receiverId: DEMO_SELLER_ID,
          amount, currency: 'PEN', status: 'pending', parentOfferId, createdAt: new Date().toISOString(),
        };
        const message: Message = {
          id: buildId('message'), conversationId, senderId: DEMO_USER_ID, body: String(amount), messageType: 'offer', offerId: offer.id, createdAt: offer.createdAt,
        };
        set((state) => ({
          offers: [...state.offers.map((item) => item.id === parentOfferId ? { ...item, status: 'countered' as const } : item), offer],
          messages: [...state.messages, message],
          conversations: state.conversations.map((item) => item.id === conversationId ? { ...item, status: 'offer_sent', lastMessage: `Oferta enviada: S/ ${amount}`, lastMessageAt: offer.createdAt } : item),
        }));
      },
      resolveOffer: (offerId, status) => {
        const offer = get().offers.find((item) => item.id === offerId);
        if (!offer || offer.status !== 'pending') return;
        const accepted = status === 'accepted';
        const createdAt = new Date().toISOString();
        const systemMessage: Message = {
          id: buildId('message'), conversationId: offer.conversationId, body: accepted ? 'Trato Aceptado' : 'Oferta rechazada', messageType: 'system', createdAt,
        };
        set((state) => ({
          offers: state.offers.map((item) => item.id === offerId ? { ...item, status } : item),
          messages: [...state.messages, systemMessage],
          conversations: state.conversations.map((item) => item.id === offer.conversationId ? {
            ...item, status: accepted ? 'accepted' : 'chatting', lastMessage: systemMessage.body, lastMessageAt: createdAt,
          } : item),
          notifications: [{
            id: buildId('notification'), type: accepted ? 'offer_accepted' : 'offer_rejected',
            title: accepted ? '¡Trato aceptado!' : 'Oferta rechazada',
            body: accepted ? `Se acordó un precio de S/ ${offer.amount}.` : 'La oferta no fue aceptada.', read: false, createdAt,
          }, ...state.notifications],
        }));
      },
      submitReview: (conversationId, rating) => set((state) => ({
        reviewedConversations: state.reviewedConversations.includes(conversationId) ? state.reviewedConversations : [...state.reviewedConversations, conversationId],
        notifications: [{ id: buildId('notification'), type: 'review', title: 'Reseña publicada', body: `Tu calificación de ${rating} estrellas fue registrada.`, read: false, createdAt: new Date().toISOString() }, ...state.notifications],
      })),
      setNotificationPreference: (key, value) => set((state) => ({ notificationPreferences: { ...state.notificationPreferences, [key]: value } })),
    }),
    {
      name: 'mano-a-mano-demo',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ favorites, listings, conversations, messages, offers, notifications, profile, reviewedConversations, notificationPreferences }) => ({ favorites, listings, conversations, messages, offers, notifications, profile, reviewedConversations, notificationPreferences }),
    },
  ),
);
