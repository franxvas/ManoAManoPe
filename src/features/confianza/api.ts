import { supabase } from "@/lib/supabase";
export interface ConfirmationState {
  role: "client" | "worker";
  deal_id: string;
  deal_status: string;
  status: string;
  expires_at?: string;
  confirmed_at?: string;
  attempts?: number;
}
export async function trustRpc<T>(
  name: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  if (!supabase)
    throw new Error(
      "Esta función requiere una sesión real de Supabase. No se generan códigos de demostración.",
    );
  const { data, error } = await supabase.rpc(name, params);
  if (error) throw new Error(error.message);
  return data as T;
}
