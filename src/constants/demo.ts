import type { AppNotification, Category, Conversation, Listing, Message, Profile } from '@/types/domain';

export const DEMO_USER_ID = '11111111-1111-4111-8111-111111111111';
export const DEMO_SELLER_ID = '22222222-2222-4222-8222-222222222222';

export const demoProfile: Profile = {
  id: DEMO_USER_ID,
  displayName: 'Billy Mark Núñez Sánchez',
  avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop',
  coverUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&auto=format&fit=crop',
  profession: 'Estudiante de Ingeniería de Sistemas / Profesional TI',
  bio: 'Apasionado por la tecnología y por conectar a las personas de Bagua.',
  phone: '999 999 999',
  city: 'Bagua',
  region: 'Amazonas',
  sellerMode: true,
  verified: true,
  ratingAverage: 4.8,
  ratingCount: 24,
  serviceArea: 'Bagua y alrededores',
  availability: 'Lun–Sáb, 8:00 a 18:00',
};

export const demoCategories: Category[] = [
  { id: 'tech', name: 'Tecnología', type: 'product', icon: 'laptop-outline' },
  { id: 'wood', name: 'Carpintería', type: 'service', icon: 'hammer-outline' },
  { id: 'food', name: 'Restaurantes', type: 'promotion', icon: 'restaurant-outline' },
  { id: 'repair', name: 'Técnicos', type: 'service', icon: 'construct-outline' },
  { id: 'fashion', name: 'Ropa', type: 'product', icon: 'shirt-outline' },
  { id: 'transport', name: 'Transporte', type: 'service', icon: 'car-outline' },
  { id: 'need-repair', name: 'Técnicos', type: 'need', icon: 'construct-outline' },
];

export const demoListings: Listing[] = [
  {
    id: 'laptop-hp', ownerId: DEMO_SELLER_ID, categoryId: 'tech', type: 'product',
    title: 'Laptop HP Pavilion', description: 'Laptop en excelente estado, Ryzen 5, 16 GB RAM y SSD de 512 GB. Incluye cargador original.',
    price: 1800, currency: 'PEN', negotiable: true, condition: 'Como nuevo', address: 'Campus universitario', city: 'Bagua', region: 'Amazonas',
    latitude: -5.6388, longitude: -78.5312, status: 'published', rating: 4.8,
    images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=900&auto=format&fit=crop'],
    ownerName: 'Carlos Mendoza', ownerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop', ownerProfession: 'Tienda de tecnología', ownerVerified: true, createdAt: '2026-09-14T15:20:00Z', shippingAvailable: true,
  },
  {
    id: 'carpinteria-diaz', ownerId: DEMO_SELLER_ID, categoryId: 'wood', type: 'service',
    title: 'Carpintería Díaz', description: 'Muebles a medida, puertas, mesas y trabajos en melamina. Cotización sin compromiso.',
    price: 120, currency: 'PEN', negotiable: true, address: 'Jr. Amazonas 280', city: 'Bagua', region: 'Amazonas',
    latitude: -5.6406, longitude: -78.5348, status: 'published', rating: 4.9,
    images: ['https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=900&auto=format&fit=crop'],
    ownerName: 'Juan Díaz', ownerAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop', ownerProfession: 'Maestro carpintero', ownerVerified: true, createdAt: '2026-09-13T10:00:00Z', serviceArea: 'Todo Bagua', availability: 'Lun–Sáb', homeService: true,
  },
  {
    id: 'polleria', ownerId: DEMO_SELLER_ID, categoryId: 'food', type: 'promotion',
    title: '1/4 de pollo + papas + ensalada', description: 'Promoción familiar de Pollería El Chalaquito. Válida hasta agotar stock.',
    price: 35, originalPrice: 42, currency: 'PEN', negotiable: false, address: 'Plaza de Armas', city: 'Bagua', region: 'Amazonas',
    latitude: -5.6393, longitude: -78.5325, status: 'published', rating: 4.7,
    images: ['https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=900&auto=format&fit=crop'],
    ownerName: 'El Chalaquito', ownerAvatar: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=300&auto=format&fit=crop', ownerProfession: 'Pollería', ownerVerified: true, createdAt: '2026-09-15T12:00:00Z', validUntil: '2026-09-30',
  },
  {
    id: 'reparacion-laptop', ownerId: DEMO_SELLER_ID, categoryId: 'need-repair', type: 'need',
    title: 'Busco técnico para reparar laptop', description: 'La laptop enciende pero no muestra imagen. Necesito diagnóstico y reparación esta semana.',
    budget: 90, currency: 'PEN', negotiable: true, address: 'Sector La Primavera', city: 'Bagua', region: 'Amazonas',
    latitude: -5.6367, longitude: -78.5291, status: 'published', rating: 5,
    images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=900&auto=format&fit=crop'],
    ownerName: 'María López', ownerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop', ownerProfession: 'Estudiante', ownerVerified: false, createdAt: '2026-09-15T09:30:00Z',
  },
  {
    id: 'ropa-marisa', ownerId: DEMO_SELLER_ID, categoryId: 'fashion', type: 'product',
    title: 'Casacas urbanas para dama', description: 'Nueva colección, tallas S a XL y varios colores disponibles.', price: 50,
    currency: 'PEN', negotiable: false, condition: 'Nuevo', address: 'Mercado Central', city: 'Bagua', region: 'Amazonas', latitude: -5.6420, longitude: -78.5362,
    status: 'published', rating: 4.6, images: ['https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=900&auto=format&fit=crop'],
    ownerName: 'Tienda Marisa', ownerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop', ownerProfession: 'Moda local', ownerVerified: true, createdAt: '2026-09-12T17:00:00Z', shippingAvailable: true,
  },
  {
    id: 'mototaxi', ownerId: DEMO_USER_ID, categoryId: 'transport', type: 'service',
    title: 'Delivery rápido en Bagua', description: 'Recojo y entrega de paquetes en toda la ciudad. Atención segura y puntual.', price: 8,
    currency: 'PEN', negotiable: false, address: 'Bagua', city: 'Bagua', region: 'Amazonas', latitude: -5.6351, longitude: -78.5380,
    status: 'published', rating: 4.9, images: ['https://images.unsplash.com/photo-1526367790999-0150786686a2?w=900&auto=format&fit=crop'],
    ownerName: demoProfile.displayName, ownerAvatar: demoProfile.avatarUrl, ownerProfession: demoProfile.profession, ownerVerified: true, createdAt: '2026-09-11T08:00:00Z', homeService: true,
  },
];

export const demoConversations: Conversation[] = [
  { id: 'chat-1', listingId: 'carpinteria-diaz', participantName: 'Juan Díaz', participantAvatar: demoListings[1]!.ownerAvatar, lastMessage: 'Puedo tenerla lista el viernes.', lastMessageAt: '2026-09-15T16:42:00Z', unreadCount: 2, status: 'negotiating' },
  { id: 'chat-2', listingId: 'laptop-hp', participantName: 'Carlos Mendoza', participantAvatar: demoListings[0]!.ownerAvatar, lastMessage: 'La laptop sigue disponible.', lastMessageAt: '2026-09-15T13:15:00Z', unreadCount: 0, status: 'chatting' },
];

export const demoMessages: Message[] = [
  { id: 'm1', conversationId: 'chat-1', senderId: DEMO_USER_ID, body: 'Hola Juan, ¿puedes fabricar una mesa de 6 puestos?', messageType: 'text', createdAt: '2026-09-15T16:30:00Z', readAt: '2026-09-15T16:31:00Z' },
  { id: 'm2', conversationId: 'chat-1', senderId: DEMO_SELLER_ID, body: 'Claro. En madera tornillo costaría S/ 500.', messageType: 'text', createdAt: '2026-09-15T16:34:00Z', readAt: '2026-09-15T16:35:00Z' },
  { id: 'm3', conversationId: 'chat-1', senderId: DEMO_SELLER_ID, body: '430', messageType: 'offer', offerId: 'offer-1', createdAt: '2026-09-15T16:38:00Z' },
  { id: 'm4', conversationId: 'chat-1', senderId: DEMO_SELLER_ID, body: 'Puedo tenerla lista el viernes.', messageType: 'text', createdAt: '2026-09-15T16:42:00Z' },
];

export const demoNotifications: AppNotification[] = [
  { id: 'n1', type: 'offer', title: 'Nueva oferta', body: 'Recibiste una oferta de S/ 430 por Carpintería Díaz.', read: false, createdAt: '2026-09-15T16:38:00Z' },
  { id: 'n2', type: 'message', title: 'Nuevo mensaje', body: 'Juan Díaz respondió en tu conversación.', read: false, createdAt: '2026-09-15T16:42:00Z' },
  { id: 'n3', type: 'review', title: 'Nueva reseña', body: 'María calificó tu servicio con 5 estrellas.', read: true, createdAt: '2026-09-14T11:00:00Z' },
];
