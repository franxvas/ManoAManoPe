import { ManoPreview } from '@/features/mano/preview';
import { ManoRemote } from '@/features/mano/remote';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function ManoScreen() {
  return isSupabaseConfigured ? <ManoRemote /> : <ManoPreview />;
}
