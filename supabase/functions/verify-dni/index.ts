// Edge Function: verifica la identidad de la persona con su DNI (RENIEC vía Decolecta).
// El token del proveedor vive solo en el servidor (secreto DECOLECTA_TOKEN), nunca en la app.
// No se guarda el número de DNI: solo se marca profiles.verified y verified_at (Ley 29733).
//
// Desplegar:
//   supabase secrets set DECOLECTA_TOKEN=xxxxx
//   supabase functions deploy verify-dni
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const normalize = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z ]/g, " ").split(/\s+/).filter(Boolean);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  const { data: auth } = await admin.auth.getUser(jwt);
  if (!auth?.user) return json({ error: "Inicia sesión para verificarte" }, 401);

  const { dni } = await req.json().catch(() => ({ dni: "" }));
  if (!/^\d{8}$/.test(String(dni))) return json({ error: "El DNI debe tener 8 dígitos" }, 400);

  const token = Deno.env.get("DECOLECTA_TOKEN");
  if (!token) return json({ error: "La verificación aún no está configurada en el servidor" }, 503);

  const res = await fetch(`https://api.decolecta.com/v1/reniec/dni?numero=${dni}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404 || res.status === 422) return json({ error: "No encontramos ese DNI" }, 404);
  if (!res.ok) return json({ error: "El servicio de RENIEC no responde, intenta más tarde" }, 502);
  const person = await res.json();

  const { data: profile } = await admin.from("profiles").select("display_name, verified").eq("id", auth.user.id).single();
  if (profile?.verified) return json({ verified: true });

  // El nombre del perfil debe contener el primer nombre y el apellido paterno del DNI.
  const profileWords = new Set(normalize(profile?.display_name ?? ""));
  const firstName = normalize(person.first_name ?? "")[0];
  const lastName = normalize(person.first_last_name ?? "")[0];
  if (!firstName || !lastName || !profileWords.has(firstName) || !profileWords.has(lastName)) {
    return json({ error: "El nombre de tu perfil no coincide con el del DNI. Usa tu nombre y apellido reales." }, 409);
  }

  const { error } = await admin.from("profiles").update({ verified: true, verified_at: new Date().toISOString() }).eq("id", auth.user.id);
  if (error) return json({ error: "No pudimos guardar la verificación" }, 500);
  return json({ verified: true });
});
