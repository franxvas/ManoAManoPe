export interface RecursoAlquiler {
  id: string;
  nombre: string;
  tipo: 'hora' | 'dia';
  precioUnitario: number;
  garantia: number;
  condiciones: string;
}

export interface ReservaAlquiler {
  id: string;
  recursoId: string;
  fechaInicio: string;
  fechaFin: string;
  estado: 'pendiente' | 'aceptada' | 'rechazada' | 'cerrado';
}

export function validarDisponibilidad(
  reservasExistentes: ReservaAlquiler[],
  nuevoRecursoId: string,
  nuevaInicio: Date,
  nuevaFin: Date
): boolean {
  const reservasDelRecurso = reservasExistentes.filter(
    (r) => r.recursoId === nuevoRecursoId && r.estado === 'aceptada'
  );

  for (const reserva of reservasDelRecurso) {
    const inicioExistente = new Date(reserva.fechaInicio);
    const finExistente = new Date(reserva.fechaFin);

    if (nuevaInicio < finExistente && nuevaFin > inicioExistente) {
      return false;
    }
  }

  return true;
}