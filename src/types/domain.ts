export type ListingType = 'product' | 'service' | 'promotion' | 'need';
export type ListingStatus = 'draft' | 'published' | 'paused' | 'sold' | 'completed';
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'countered' | 'cancelled';
export type MessageType = 'text' | 'image' | 'offer' | 'system';

export interface Profile {
  id: string;
  displayName: string;
  avatarUrl: string;
  coverUrl?: string;
  profession: string;
  bio: string;
  phone?: string;
  city: string;
  region: string;
  sellerMode: boolean;
  verified: boolean;
  ratingAverage: number;
  ratingCount: number;
  serviceArea?: string;
  availability?: string;
}

export interface Category {
  id: string;
  name: string;
  type: ListingType;
  icon: string;
}

export interface Listing {
  id: string;
  ownerId: string;
  categoryId: string;
  type: ListingType;
  title: string;
  description: string;
  price?: number;
  originalPrice?: number;
  budget?: number;
  currency: 'PEN';
  negotiable: boolean;
  condition?: string;
  serviceArea?: string;
  availability?: string;
  homeService?: boolean;
  shippingAvailable?: boolean;
  validUntil?: string;
  address: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  status: ListingStatus;
  images: string[];
  ownerName: string;
  ownerAvatar: string;
  ownerProfession: string;
  ownerVerified: boolean;
  rating: number;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId?: string;
  body: string;
  messageType: MessageType;
  offerId?: string;
  createdAt: string;
  readAt?: string;
}

export interface Offer {
  id: string;
  conversationId: string;
  listingId: string;
  senderId: string;
  receiverId: string;
  amount: number;
  currency: 'PEN';
  status: OfferStatus;
  parentOfferId?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  listingId: string;
  participantName: string;
  participantAvatar: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  status: 'chatting' | 'negotiating' | 'offer_sent' | 'waiting' | 'accepted';
}

export interface AppNotification {
  id: string;
  type: 'message' | 'offer' | 'offer_accepted' | 'offer_rejected' | 'counteroffer' | 'review' | 'listing';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}
