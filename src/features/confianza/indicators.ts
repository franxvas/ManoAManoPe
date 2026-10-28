export interface TrustIndicators {
  joined_at: string;
  confirmed_services: number;
  completed_operations: number;
  review_count: number;
  review_average: number;
  supported_sources: string[];
}
export function badges(indicators: TrustIndicators): string[] {
  const result: string[] = [];
  if (indicators.confirmed_services >= 1)
    result.push("Primer servicio confirmado");
  if (indicators.completed_operations >= 10)
    result.push("Diez acuerdos finalizados");
  return result;
}
