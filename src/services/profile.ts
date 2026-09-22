import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/domain';

interface ProfileRow {
  id: string; display_name: string; avatar_url: string | null; cover_url: string | null; profession: string | null; bio: string | null;
  phone: string | null; city: string | null; region: string | null; seller_mode: boolean; verified: boolean; rating_average: number;
  rating_count: number; service_area: string | null; availability: string | null;
}

export async function fetchProfile(): Promise<Profile | null> {
  if (!supabase) return null;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await supabase.from('profiles').select('id,display_name,avatar_url,cover_url,profession,bio,phone,city,region,seller_mode,verified,rating_average,rating_count,service_area,availability').eq('id', auth.user.id).single();
  if (error) throw error;
  return mapProfile(data as ProfileRow);
}

export async function fetchPublicProfile(profileId: string): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('profiles')
    .select('id,display_name,avatar_url,cover_url,profession,bio,phone,city,region,seller_mode,verified,rating_average,rating_count,service_area,availability')
    .eq('id', profileId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProfile(data as ProfileRow) : null;
}

export async function updateRemoteProfile(changes: Partial<Profile>) {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Debes iniciar sesión');
  const payload = {
    display_name: changes.displayName, avatar_url: changes.avatarUrl, cover_url: changes.coverUrl, profession: changes.profession,
    bio: changes.bio, phone: changes.phone, city: changes.city, region: changes.region, seller_mode: changes.sellerMode,
    service_area: changes.serviceArea, availability: changes.availability,
  };
  const { error } = await supabase.from('profiles').update(payload).eq('id', auth.user.id);
  if (error) throw error;
}

export async function uploadRemoteAvatar(uri: string) {
  return uploadRemoteProfileImage(uri, 'avatar');
}

export async function uploadRemoteCover(uri: string) {
  return uploadRemoteProfileImage(uri, 'cover');
}

async function uploadRemoteProfileImage(uri: string, kind: 'avatar' | 'cover') {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Debes iniciar sesión');
  const extension = uri.split('.').pop()?.split('?')[0] || 'jpg';
  const path = `${auth.user.id}/${kind}.${extension}`;
  const buffer = await fetch(uri).then((response) => response.arrayBuffer());
  const { error } = await supabase.storage.from('avatars').upload(path, buffer, { contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`, upsert: true });
  if (error) throw error;
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id, displayName: row.display_name, avatarUrl: row.avatar_url ?? '', coverUrl: row.cover_url ?? undefined,
    profession: row.profession ?? '', bio: row.bio ?? '', phone: row.phone ?? undefined, city: row.city ?? '', region: row.region ?? '',
    sellerMode: row.seller_mode, verified: row.verified, ratingAverage: Number(row.rating_average), ratingCount: row.rating_count,
    serviceArea: row.service_area ?? undefined, availability: row.availability ?? undefined,
  };
}
