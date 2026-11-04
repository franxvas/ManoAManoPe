import { supabase } from "@/lib/supabase";
export interface Slot {
  id: string;
  owner_id: string;
  listing_id: string;
  starts_at: string;
  ends_at: string;
  active: boolean;
}
export interface Booking {
  id: string;
  slot_id: string;
  client_id: string;
  note: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  proposed_slot_id: string | null;
  proposed_by: string | null;
}
export async function agendaData() {
  if (!supabase) throw new Error("Inicia sesión para usar la agenda.");
  const [slots, bookings, services] = await Promise.all([
    supabase
      .from("service_slots")
      .select("*")
      .eq("active", true)
      .order("starts_at")
      .limit(300),
    supabase
      .from("service_bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("listings")
      .select("id,title,owner_id")
      .eq("type", "service")
      .eq("status", "published"),
  ]);
  if (slots.error || bookings.error || services.error)
    throw slots.error || bookings.error || services.error;
  return {
    slots: slots.data as Slot[],
    bookings: bookings.data as Booking[],
    services: services.data as {
      id: string;
      title: string;
      owner_id: string;
    }[],
  };
}
export async function agendaAction(
  name: string,
  args: Record<string, unknown>,
) {
  if (!supabase) throw new Error("Inicia sesión para continuar.");
  const { error } = await supabase.rpc(name, args);
  if (error) throw error;
}
export function futureInterval(day: string, start: string, end: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(start) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(end)
  )
    throw new Error("Usa una fecha AAAA-MM-DD y horas HH:MM.");
  const a = new Date(`${day}T${start}:00-05:00`),
    b = new Date(`${day}T${end}:00-05:00`);
  if (
    !Number.isFinite(+a) ||
    +a <= Date.now() ||
    +b <= +a ||
    +b - +a > 12 * 3600000 ||
    a.toISOString().slice(0, 10) !== day
  )
    throw new Error(
      "El horario debe ser futuro, terminar después de empezar y durar hasta 12 horas.",
    );
  return { start: a.toISOString(), end: b.toISOString() };
}
