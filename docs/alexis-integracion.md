# Alexis: Necesito una mano

## Organización
- `app/mano.tsx`: ruta que selecciona el modo según configuración de Supabase.
- `src/features/mano/preview.tsx`: formularios y lista en modo demostración.
- `src/features/mano/remote.tsx`: formularios, propuestas y seguimiento conectado.
- `src/features/mano/api.ts`: consultas y operaciones RPC.
- `src/features/mano/progress.ts`: transiciones de seguimiento usadas por la demostración y sus pruebas.
- `src/features/mano/preview-proposals.tsx`: simulación local con ambos roles.
- `supabase/migrations/202611030001_necesito_una_mano.sql`: tablas, permisos y funciones.

## Integración para el equipo
Aplicar primero las migraciones anteriores, incluida la contribución de Billy. Esta migración depende de `profiles`, `reviews`, `deals`, `listings` y `service_confirmations`.
Revisar y aplicar la migración nueva en un entorno de desarrollo, antes de conectar la aplicación con su URL y clave pública de Supabase. Nunca introducir una clave service-role en la app.
Los ejemplos añadidos al seed requieren las cuentas demo que ya crea el seed original. No ejecutar el seed en producción.
Las fotografías usan el bucket existente `listing-media` y sus permisos por usuario. No se añaden dependencias al proyecto.

## Cambios compartidos
Publicar incluye acceso a la sección. Mensajes consulta además `mano_list_threads` y abre la solicitud y tarea correspondientes.
La migración extiende `list_public_reviews`, `get_profile_trust` y el cálculo del promedio del perfil para incluir tareas finalizadas del nuevo módulo.

## Verificación realizada
TypeScript y lint pasan. Las pruebas Jest incluyen restricciones de propuestas y transiciones del seguimiento.
Se ejecutó la migración en PostgreSQL aislado (PGlite) con tablas base mínimas: privacidad de propuestas y mensajes, aceptación, actualizaciones del precio, finalización, tareas independientes, promedio del perfil y bandeja de conversaciones.
Esta comprobación no sustituye una prueba con todas las migraciones del equipo ni la prueba entre dos cuentas de Supabase y su almacenamiento.

## Prueba de aceptación pendiente con Supabase
Con dos cuentas, crear cada tipo de solicitud, subir fotos y comprobar propuestas privadas. Editar una propuesta pendiente, comparar perfiles y aceptar una. Confirmar que no se admiten nuevas propuestas. En reparación, proponer un nuevo precio y comprobar que solo cambia al aceptarlo el cliente. Completar y calificar una tarea; comprobar bandeja, reseñas y promedio. En un proyecto con dos tareas, completar una y comprobar que el proyecto sigue pendiente hasta completar o cancelar las restantes.
La vista sin Supabase es una simulación en un solo dispositivo, no una prueba de autenticación ni de permisos reales.

## Prueba de base reproducible
`node scripts/test-mano-db.cjs` usa una base PGlite desechable en memoria y no se conecta a Supabase. Requiere el paquete opcional `@electric-sql/pglite`; puede instalarse fuera del proyecto y señalarse mediante la variable `MANO_PGLITE_MODULE` (ruta absoluta al módulo). No se añadió esta herramienta a las dependencias de la aplicación. La prueba usa tablas base mínimas y no valida todas las migraciones existentes.

## Alcance de ubicación
Las solicitudes pueden compartir coordenadas opcionales redondeadas a dos decimales por el servidor. La búsqueda permite radio aproximado de 5, 10, 25 o 50 km y orden por distancia. Sin permiso, se mantiene la búsqueda por ciudad o distrito. No se publica la dirección exacta. Los resultados sin coordenadas se excluyen solo cuando hay filtro de radio activo. La distancia es orientativa por el redondeo.

## Revisión local de los flujos
- Reparación: presupuesto, aceptación, actualización del precio, bloqueo de finalización con revisión pendiente, confirmación y calificación probados en la web de demostración.
- Ayuda: edición sin duplicar, rechazo sin eliminar la solicitud, aceptación de otro trabajador, finalización y calificación probados en la web de demostración.
- Proyecto: una tarea finalizada mantiene el proyecto pendiente; al cancelar las demás, se marca finalizado. Comprobado en la web de demostración.
- Cercanía: cálculo y filtrado por radio probados automáticamente; el redondeo de coordenadas se comprobó en PostgreSQL aislado. No se solicitó la ubicación del usuario durante la revisión.
- Continúa pendiente para el integrador: aplicar todas las migraciones originales y nuevas juntas en Supabase de desarrollo y probar dos cuentas, Storage y dispositivos móviles. El entorno local de prueba no dispone de PostGIS ni reproduce todo Supabase.
