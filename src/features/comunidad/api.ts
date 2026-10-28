import { imageType } from '@/features/portafolio/model';
import { supabase } from '@/lib/supabase';

const BUCKET = 'community-media';

export function db() {
  if (!supabase) throw new Error('Conecta Supabase e inicia sesión para usar Comunidad.');
  return supabase;
}

export async function rpc<T = void>(name: string, params: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await db().rpc(name, params);
  if (error) throw new Error(error.message);
  return data as T;
}

export async function currentUserId() {
  const { data } = await db().auth.getUser();
  if (!data.user) throw new Error('Inicia sesión para continuar.');
  return data.user.id;
}

export function photoUrl(path: string) {
  return db().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// Sube solo las fotos nuevas (las que aún no tienen ruta en Storage) y devuelve todas las rutas en orden.
export async function uploadPhotos(folder: string, photos: { uri: string; path?: string }[]) {
  const userId = await currentUserId();
  const paths: string[] = [];
  for (const [index, photo] of photos.entries()) {
    if (photo.path) {
      paths.push(photo.path);
      continue;
    }
    const response = await fetch(photo.uri);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const contentType = imageType(bytes);
    const extension = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
    const path = `${userId}/${folder}/${Date.now()}-${index}.${extension}`;
    const { error } = await db().storage.from(BUCKET).upload(path, bytes, { contentType, upsert: false });
    if (error) throw error;
    paths.push(path);
  }
  return paths;
}
