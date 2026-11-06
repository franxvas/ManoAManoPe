export const colors = {
  navy: '#0B2D5D',
  red: '#D7192D',
  background: '#F4F5F7',
  white: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  success: '#1FA66A',
  rating: '#F4B400',
} as const;

export const listingLabels = {
  product: 'Producto',
  service: 'Servicio',
  promotion: 'Promoción',
  need: 'Necesidad',
} as const;

export const listingColors = {
  product: { foreground: '#234B70', background: '#EAF1F8' },
  service: { foreground: '#086B58', background: '#E7F5EF' },
  promotion: { foreground: '#B9152A', background: '#FFF0F2' },
  need: { foreground: '#895211', background: '#FFF4DB' },
} as const;
