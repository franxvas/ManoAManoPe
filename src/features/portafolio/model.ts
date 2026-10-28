export type PhotoKind = "work" | "before" | "after";
export interface PortfolioPhoto {
  path: string;
  kind: PhotoKind;
  url: string;
}
export interface PortfolioWork {
  id: string;
  owner_id: string;
  title: string;
  category: string;
  description: string;
  completed_month: string;
  visible: boolean;
  deal_id: string | null;
  media: PortfolioPhoto[];
  confirmed: boolean;
}
export function imageType(
  bytes: Uint8Array,
): "image/jpeg" | "image/png" | "image/webp" {
  if (!bytes.length || bytes.length > 8 * 1024 * 1024)
    throw new Error("Cada foto debe pesar como máximo 8 MB.");
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    return "image/jpeg";
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v))
    return "image/png";
  if (
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
    return "image/webp";
  throw new Error("Usa fotografías JPG, PNG o WebP válidas.");
}
export function validateWork(
  title: string,
  category: string,
  description: string,
  month: string,
  photos: number,
) {
  if (title.trim().length < 5 || title.trim().length > 100)
    throw new Error("El título debe tener entre 5 y 100 caracteres.");
  if (category.trim().length < 2 || category.trim().length > 80)
    throw new Error("Indica una categoría de 2 a 80 caracteres.");
  if (description.trim().length < 20 || description.trim().length > 4000)
    throw new Error("Describe el trabajo con 20 a 4000 caracteres.");
  if (
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) ||
    month + "-01" > new Date().toLocaleDateString("sv-SE")
  )
    throw new Error("Selecciona un mes válido que no esté en el futuro.");
  if (photos < 1 || photos > 6)
    throw new Error("Añade entre una y seis fotografías.");
}
