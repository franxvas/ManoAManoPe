export interface TrustIndicators {
  joined_at: string;
  confirmed_services: number;
  completed_operations: number;
  review_count: number;
  /** Valoración estable (promedio bayesiano), calculada en Supabase. */
  review_average: number;
  raw_average?: number;
  verified?: boolean;
  verified_at?: string | null;
  recent_reports?: number;
  supported_sources: string[];
}

export type TrustLevel =
  | "en_revision"
  | "nuevo"
  | "en_crecimiento"
  | "confiable"
  | "verificado";

/** Reseñas "imaginarias" y nota previa del promedio bayesiano (igual que en SQL). */
export const PRIOR_WEIGHT = 5;
export const PRIOR_MEAN = 4;
/** Debajo de este número de reseñas se avisa que la nota aún no es representativa. */
export const FEW_REVIEWS = 5;

export function stableRating(sum: number, count: number): number {
  if (count <= 0) return 0;
  const value = (PRIOR_WEIGHT * PRIOR_MEAN + sum) / (PRIOR_WEIGHT + count);
  return Math.round(value * 100) / 100;
}

export function trustLevel(i: TrustIndicators): TrustLevel {
  if ((i.recent_reports ?? 0) >= 3) return "en_revision";
  const solid =
    i.completed_operations >= 5 && i.review_count >= 3 && i.review_average >= 4;
  if (solid && i.verified) return "verificado";
  if (solid) return "confiable";
  if (i.completed_operations >= 1 || i.review_count >= 1 || i.verified)
    return "en_crecimiento";
  return "nuevo";
}

export const trustLevelInfo: Record<
  TrustLevel,
  { label: string; description: string; tone: "muted" | "info" | "success" | "warning" }
> = {
  en_revision: {
    label: "En revisión",
    description: "Recibió varias denuncias recientes. Toma precauciones.",
    tone: "warning",
  },
  nuevo: {
    label: "Nuevo",
    description: "Aún no tiene operaciones completadas.",
    tone: "muted",
  },
  en_crecimiento: {
    label: "En crecimiento",
    description: "Ya tiene actividad, pero todavía poca.",
    tone: "info",
  },
  confiable: {
    label: "Confiable",
    description: "5+ operaciones completadas y buena valoración.",
    tone: "success",
  },
  verificado: {
    label: "Verificado",
    description: "Identidad verificada con DNI y buen historial.",
    tone: "success",
  },
};

export function badges(indicators: TrustIndicators): string[] {
  const result: string[] = [];
  if (indicators.verified) result.push("Identidad verificada");
  if (indicators.confirmed_services >= 1)
    result.push("Primer servicio confirmado");
  if (indicators.completed_operations >= 10)
    result.push("Diez acuerdos finalizados");
  return result;
}
