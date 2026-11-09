export interface Recurso {
  id: string;
  titulo: string;
  tipo: 'alquiler' | 'prestamo';
  precio?: string;
  garantia?: string;
  condiciones: string;
  foto: string;
  propietario: string;
}

let recursosData: Recurso[] = [
  {
    id: '1',
    titulo: 'Moto Lineal 150cc',
    tipo: 'alquiler',
    precio: 'S/ 45 por día',
    garantia: 'S/ 150 de garantía',
    condiciones: 'Licencia de conducir vigente y DNI obligatorio.',
    foto: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400',
    propietario: 'Carlos Mendoza'
  },
  {
    id: '2',
    titulo: 'Proyector Multimedia HD',
    tipo: 'alquiler',
    precio: 'S/ 30 por día',
    garantia: 'S/ 200 de garantía',
    condiciones: 'Devolver en su maletín original y sin daños.',
    foto: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400',
    propietario: 'Lucía Torres'
  }
];

export function getAlquileres() {
  return recursosData.filter(r => r.tipo === 'alquiler');
}

export function getRecursoById(id: string) {
  return recursosData.find(r => r.id === id);
}

export function agregarAlquiler(nuevo: Omit<Recurso, 'id' | 'tipo'>) {
  const item: Recurso = {
    ...nuevo,
    id: Date.now().toString(),
    tipo: 'alquiler',
  };
  recursosData = [item, ...recursosData];
}