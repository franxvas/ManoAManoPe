export function parsePriceRange(text: string): {
  min: number;
  max: number | null;
} {
  const value = text
    .trim()
    .replace(/^S\/\s*/i, '')
    .replace(/,/g, '.');
  const match =
    /^(\d+(?:\.\d{1,2})?)(?:\s*(?:-|–|a)\s*(\d+(?:\.\d{1,2})?))?$/.exec(value);
  if (!match)
    throw new Error('Ingresa un monto válido, por ejemplo 140 o 100–160.');
  const min = Number(match[1]);
  const max = match[2] == null ? null : Number(match[2]);
  if (
    !Number.isFinite(min) ||
    (max !== null && (!Number.isFinite(max) || max < min))
  )
    throw new Error('El máximo debe ser mayor o igual al mínimo.');
  return { min, max };
}
export function budgetLabel(
  min: number | null | undefined,
  max: number | null | undefined,
): string {
  if (min == null && max == null) return 'Necesito una cotización';
  if (min == null) return `Hasta S/ ${max}`;
  if (max == null) return `Desde S/ ${min}`;
  return min === max ? `S/ ${min}` : `S/ ${min} – S/ ${max}`;
}
