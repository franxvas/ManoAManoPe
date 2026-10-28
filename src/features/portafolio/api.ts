import { supabase } from "@/lib/supabase";
import { trustRpc } from "@/features/confianza/api";
import { imageType, PhotoKind, PortfolioWork } from "./model";
function client() {
  if (!supabase)
    throw new Error(
      "Conecta Supabase e inicia sesión para gestionar el portafolio.",
    );
  return supabase;
}
export async function readWorks(ownerId: string): Promise<PortfolioWork[]> {
  const c = client();
  const { data, error } = await c
    .from("portfolio_works")
    .select("*,portfolio_media(storage_path,kind,sort_order)")
    .eq("owner_id", ownerId)
    .order("completed_month", { ascending: false });
  if (error) throw error;
  return Promise.all(
    (data ?? []).map(async (row) => {
      const media = await Promise.all(
        (
          row.portfolio_media as {
            storage_path: string;
            kind: PhotoKind;
            sort_order: number;
          }[]
        )
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(async (m) => {
            const { data, error } = await c.storage
              .from("portfolio-media")
              .createSignedUrl(m.storage_path, 300);
            if (error) throw error;
            return { path: m.storage_path, kind: m.kind, url: data.signedUrl };
          }),
      );
      let confirmed = false;
      if (row.deal_id) {
        const { data, error } = await c.rpc("portfolio_work_confirmed", {
          p_work_id: row.id,
        });
        if (error) throw error;
        confirmed = Boolean(data);
      }
      return { ...row, media, confirmed } as PortfolioWork;
    }),
  );
}
export async function saveWork(
  input: {
    id?: string;
    title: string;
    category: string;
    description: string;
    month: string;
    visible: boolean;
    dealId: string | null;
    photos: { uri: string; path?: string; kind: PhotoKind }[];
  },
  existing?: PortfolioWork,
) {
  const c = client();
  const { data: auth, error } = await c.auth.getUser();
  if (error || !auth.user) throw new Error("Inicia sesión");
  const id = input.id ?? (await trustRpc<string>("allocate_portfolio_id"));
  const uploaded: string[] = [];
  let committed = false;
  try {
    const media: { path: string; kind: PhotoKind }[] = [];
    for (const [i, photo] of input.photos.entries()) {
      let path = photo.path;
      if (!path) {
        const response = await fetch(photo.uri);
        if (!response.ok) throw new Error("No se pudo leer una foto");
        const bytes = new Uint8Array(await response.arrayBuffer());
        const contentType = imageType(bytes);
        path = `${auth.user.id}/${id}/${Date.now()}-${i}.${contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg"}`;
        const { error } = await c.storage
          .from("portfolio-media")
          .upload(path, bytes, { contentType, upsert: false });
        if (error) throw error;
        uploaded.push(path);
      }
      media.push({ path, kind: photo.kind });
    }
    await trustRpc("save_portfolio_work", {
      p_id: id,
      p_title: input.title,
      p_category: input.category,
      p_description: input.description,
      p_completed_month: input.month + "-01",
      p_visible: input.visible,
      p_deal_id: input.dealId,
      p_media: media,
    });
    committed = true;
    const removed =
      existing?.media
        .filter((m) => !media.some((p) => p.path === m.path))
        .map((m) => m.path) ?? [];
    if (removed.length) {
      const { error } = await c.storage.from("portfolio-media").remove(removed);
      if (error)
        return {
          id,
          warning:
            "El trabajo se guardó. Algunas fotos retiradas no pudieron limpiarse de Storage.",
        };
    }
    return { id, warning: "" };
  } catch (e) {
    // Si se pierde la respuesta del RPC, comprobar el estado antes de borrar fotos posiblemente referenciadas.
    if (!committed && uploaded.length) {
      const { data, error } = await c
        .from("portfolio_media")
        .select("storage_path")
        .in("storage_path", uploaded);
      if (!error) {
        const referenced = new Set((data ?? []).map((m) => m.storage_path));
        await c.storage
          .from("portfolio-media")
          .remove(uploaded.filter((p) => !referenced.has(p)));
      }
    }
    throw e;
  }
}
export async function removeWork(id: string) {
  const paths = await trustRpc<string[]>("delete_portfolio_work", { p_id: id });
  if (paths.length) {
    const { error } = await client()
      .storage.from("portfolio-media")
      .remove(paths);
    if (error)
      return "El trabajo se eliminó, pero quedó pendiente limpiar algunas fotos de Storage.";
  }
  return "";
}
