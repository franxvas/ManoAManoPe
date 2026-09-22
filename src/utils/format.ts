import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatMoney = (amount?: number) => amount == null ? 'A convenir' : `S/ ${amount.toLocaleString('es-PE')}`;

export const formatRelativeDate = (value: string) => formatDistanceToNow(new Date(value), { addSuffix: true, locale: es });

export const getListingAmount = (price?: number | null, budget?: number | null) => price ?? budget ?? undefined;
