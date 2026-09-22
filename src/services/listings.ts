import { demoCategories, demoListings } from '@/constants/demo';
import { supabase } from '@/lib/supabase';
import type { Category, Listing, ListingType } from '@/types/domain';

interface ListingFilters {
  query?: string;
  type?: ListingType;
  categoryId?: string;
}

export async function fetchListings(filters: ListingFilters = {}): Promise<Listing[]> {
  if (!supabase) {
    const normalized = filters.query?.trim().toLocaleLowerCase('es-PE');
    return demoListings.filter((listing) => {
      const matchesType = !filters.type || listing.type === filters.type;
      const matchesCategory = !filters.categoryId || listing.categoryId === filters.categoryId;
      const searchable = `${listing.title} ${listing.description} ${listing.ownerName}`.toLocaleLowerCase('es-PE');
      return matchesType && matchesCategory && (!normalized || searchable.includes(normalized));
    });
  }

  let request = supabase.from('listing_feed').select('*').eq('status', 'published').order('created_at', { ascending: false }).limit(30);
  if (filters.type) request = request.eq('type', filters.type);
  if (filters.categoryId) request = request.eq('category_id', filters.categoryId);
  if (filters.query) request = request.textSearch('search_document', filters.query, { type: 'websearch', config: 'spanish_unaccent' });
  const { data, error } = await request;
  if (error) throw error;
  return (data ?? []).map(mapListingRow);
}

export async function fetchNearbyListings(latitude: number, longitude: number, radiusKm = 15, type?: ListingType, categoryId?: string): Promise<Listing[]> {
  if (!supabase) {
    return demoListings
      .filter((listing) => (!type || listing.type === type) && (!categoryId || listing.categoryId === categoryId))
      .map((listing) => ({ listing, distance: getDistanceMeters(latitude, longitude, listing.latitude, listing.longitude) }))
      .filter(({ distance }) => distance <= radiusKm * 1000)
      .sort((a, b) => a.distance - b.distance)
      .map(({ listing }) => listing);
  }
  const { data, error } = await supabase.rpc('get_nearby_listings', {
    p_latitude: latitude, p_longitude: longitude, p_radius_meters: radiusKm * 1000, p_listing_type: type ?? null, p_category_id: categoryId ?? null,
  });
  if (error) throw error;
  return (data ?? []).map(mapListingRow);
}

export function getDistanceMeters(latitude: number, longitude: number, targetLatitude: number, targetLongitude: number) {
  const earthRadiusMeters = 6_371_000;
  const toRadians = (value: number) => value * Math.PI / 180;
  const latitudeDelta = toRadians(targetLatitude - latitude);
  const longitudeDelta = toRadians(targetLongitude - longitude);
  const originLatitude = toRadians(latitude);
  const destinationLatitude = toRadians(targetLatitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(originLatitude) * Math.cos(destinationLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(haversine));
}

export async function fetchListing(id: string): Promise<Listing | null> {
  if (!supabase) return demoListings.find((listing) => listing.id === id) ?? null;
  const { data, error } = await supabase.from('listing_feed').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapListingRow(data) : null;
}

export async function fetchMyListings(): Promise<Listing[]> {
  if (!supabase) return demoListings;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await supabase.from('listing_feed').select('*').eq('owner_id', auth.user.id).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapListingRow);
}

export async function fetchCategories(): Promise<Category[]> {
  if (!supabase) return demoCategories;
  const { data, error } = await supabase.from('categories').select('id,name,type,icon').eq('active', true).order('sort_order');
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: String(row.id), name: String(row.name), type: row.type as ListingType, icon: String(row.icon ?? 'grid-outline') }));
}

export interface ListingWriteInput {
  categoryId: string;
  type: ListingType;
  title: string;
  description: string;
  price?: number;
  originalPrice?: number;
  budget?: number;
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
}

export async function createRemoteListing(input: ListingWriteInput, imageUris: string[]): Promise<string> {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error('Debes iniciar sesión');
  const { data, error } = await supabase.from('listings').insert({
    owner_id: authData.user.id, category_id: input.categoryId, type: input.type, title: input.title, description: input.description,
    price: input.price, original_price: input.originalPrice, budget: input.budget, negotiable: input.negotiable, condition: input.condition,
    service_area: input.serviceArea, availability: input.availability, home_service: input.homeService, shipping_available: input.shippingAvailable,
    valid_until: input.validUntil || null, address: input.address, city: input.city, region: input.region, latitude: input.latitude,
    longitude: input.longitude, status: 'published',
  }).select('id').single();
  if (error) throw error;
  const listingId = String(data.id);
  const uploadedPaths: string[] = [];
  try {
    const mediaRows = [];
    for (const [index, uri] of imageUris.entries()) {
      const extension = uri.split('.').pop()?.split('?')[0] || 'jpg';
      const path = `${authData.user.id}/${listingId}/${Date.now()}-${index}.${extension}`;
      const buffer = await fetch(uri).then((response) => response.arrayBuffer());
      const { error: uploadError } = await supabase.storage.from('listing-media').upload(path, buffer, { contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`, upsert: false });
      if (uploadError) throw uploadError;
      uploadedPaths.push(path);
      const { data: publicUrl } = supabase.storage.from('listing-media').getPublicUrl(path);
      mediaRows.push({ listing_id: listingId, storage_path: path, public_url: publicUrl.publicUrl, sort_order: index });
    }
    if (mediaRows.length) {
      const { error: mediaError } = await supabase.from('listing_media').insert(mediaRows);
      if (mediaError) throw mediaError;
    }
    return listingId;
  } catch (error) {
    if (uploadedPaths.length) await supabase.storage.from('listing-media').remove(uploadedPaths);
    await supabase.from('listings').delete().eq('id', listingId);
    throw error;
  }
}

export async function updateRemoteListingStatus(listingId: string, status: Listing['status']) {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { error } = await supabase.from('listings').update({ status }).eq('id', listingId);
  if (error) throw error;
}

export async function updateRemoteListing(listingId: string, input: ListingWriteInput, imageUris: string[]) {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { error } = await supabase.from('listings').update({
    category_id: input.categoryId, type: input.type, title: input.title, description: input.description, price: input.price,
    original_price: input.originalPrice, budget: input.budget, negotiable: input.negotiable, condition: input.condition,
    service_area: input.serviceArea, availability: input.availability, home_service: input.homeService,
    shipping_available: input.shippingAvailable, valid_until: input.validUntil || null, address: input.address,
    city: input.city, region: input.region, latitude: input.latitude, longitude: input.longitude,
  }).eq('id', listingId);
  if (error) throw error;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Debes iniciar sesión');
  const { data: media, error: mediaFetchError } = await supabase.from('listing_media').select('id,storage_path,public_url').eq('listing_id', listingId);
  if (mediaFetchError) throw mediaFetchError;
  const retainedUrls = imageUris.filter((uri) => uri.startsWith('http'));
  const removed = (media ?? []).filter((item) => !retainedUrls.includes(String(item.public_url)));
  if (removed.length) {
    await supabase.storage.from('listing-media').remove(removed.map((item) => String(item.storage_path)));
    const { error: deleteError } = await supabase.from('listing_media').delete().in('id', removed.map((item) => item.id));
    if (deleteError) throw deleteError;
  }
  for (const [index, uri] of imageUris.entries()) {
    const existing = (media ?? []).find((item) => item.public_url === uri);
    if (existing) {
      await supabase.from('listing_media').update({ sort_order: index }).eq('id', existing.id);
      continue;
    }
    const extension = uri.split('.').pop()?.split('?')[0] || 'jpg';
    const path = `${auth.user.id}/${listingId}/${Date.now()}-${index}.${extension}`;
    const buffer = await fetch(uri).then((response) => response.arrayBuffer());
    const { error: uploadError } = await supabase.storage.from('listing-media').upload(path, buffer, { contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}` });
    if (uploadError) throw uploadError;
    const publicUrl = supabase.storage.from('listing-media').getPublicUrl(path).data.publicUrl;
    const { error: insertError } = await supabase.from('listing_media').insert({ listing_id: listingId, storage_path: path, public_url: publicUrl, sort_order: index });
    if (insertError) throw insertError;
  }
}

export async function deleteRemoteListing(listingId: string) {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { error } = await supabase.from('listings').delete().eq('id', listingId);
  if (error) throw error;
}

function mapListingRow(row: Record<string, unknown>): Listing {
  const media = Array.isArray(row.media_urls) ? row.media_urls.filter((item): item is string => typeof item === 'string') : [];
  return {
    id: String(row.id), ownerId: String(row.owner_id), categoryId: String(row.category_id), type: row.type as Listing['type'],
    title: String(row.title), description: String(row.description), price: toOptionalNumber(row.price), originalPrice: toOptionalNumber(row.original_price),
    budget: toOptionalNumber(row.budget), currency: 'PEN', negotiable: Boolean(row.negotiable), condition: toOptionalString(row.condition),
    serviceArea: toOptionalString(row.service_area), availability: toOptionalString(row.availability), homeService: Boolean(row.home_service),
    shippingAvailable: Boolean(row.shipping_available), validUntil: toOptionalString(row.valid_until), address: String(row.address ?? ''),
    city: String(row.city ?? ''), region: String(row.region ?? ''), latitude: Number(row.latitude), longitude: Number(row.longitude),
    status: row.status as Listing['status'], images: media, ownerName: String(row.owner_name ?? ''), ownerAvatar: String(row.owner_avatar ?? ''),
    ownerProfession: String(row.owner_profession ?? ''), ownerVerified: Boolean(row.owner_verified), rating: Number(row.rating ?? 0), createdAt: String(row.created_at),
  };
}

const toOptionalString = (value: unknown) => value == null ? undefined : String(value);
const toOptionalNumber = (value: unknown) => value == null ? undefined : Number(value);
