import { imageType } from "@/features/portafolio/model";
export async function readImage(uri: string) {
  const response = await fetch(uri);
  if (!response.ok)
    throw new Error("No pudimos leer la fotografía. Vuelve a seleccionarla.");
  const buffer = await response.arrayBuffer();
  const contentType = imageType(new Uint8Array(buffer));
  const extension =
    contentType === "image/png"
      ? "png"
      : contentType === "image/webp"
        ? "webp"
        : "jpg";
  return { buffer, contentType, extension };
}
