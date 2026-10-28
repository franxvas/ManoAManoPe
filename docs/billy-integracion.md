# Módulo de Billy

## Confirmaciones

Aplicar `202610280001_service_confirmations.sql` después del esquema inicial. La integración real actual es `deals` + una publicación de tipo `service`. Abrir `/confianza/confirmar?conversationId=UUID` desde una conversación con oferta aceptada. El trabajador solicita; el cliente genera y muestra; el trabajador introduce. El código dura diez minutos, cinco intentos, regeneración con 30 segundos de espera y diez generaciones por día. Solo se entrega al generarlo, no se puede recuperar el texto después. Un código no demuestra un pago.

El servidor deriva las partes del acuerdo, bloquea filas, guarda bcrypt y completa el acuerdo en la misma transacción. Un fallo de código devuelve un resultado negativo sin revertir el contador. La tabla no admite acceso directo de los clientes. Las reseñas dejan de completar acuerdos.

## Contrato para módulos futuros

No existe un RPC genérico para registrar participantes o completar cualquier operación. Cada compañero debe incorporar un adaptador SQL que consulte su tabla real, derive las partes y el estado, bloquee la operación y aplique su transición junto con una confirmación. No enviar participantes desde el cliente.

| Responsable | Acciones | Muestra el código | Lo introduce |
| --- | --- | --- | --- |
| Alexis | Finalización de servicio | Cliente | Trabajador |
| Lenin | Entrega de préstamo o alquiler | Receptor | Propietario |
| Lenin | Devolución de préstamo o alquiler | Propietario | Receptor que devuelve |
| Galoc | Recojo de donación o entrega acordada de adopción | Receptor | Entregante |
| Franco | Navegación y componentes compartidos | Revisar los accesos del perfil y conversación | Sin alterar Inicio |

Los contratos de préstamo, alquiler, donación y adopción están documentados, pero no se muestran contadores ni códigos para operaciones inexistentes. La adopción confirma la entrega acordada, no una evaluación de bienestar. Toda cancelación o retraso debe tratarse por el módulo de origen, sin inferir fraude.

## Aplicación

Las migraciones están preparadas; no asumir que están aplicadas a Supabase compartido. No se necesitan claves administrativas en Expo. La pantalla muestra el error real si el esquema no está instalado. No se habilitan códigos ficticios en modo demostración.

## Portafolio

Aplicar después `202610280002_portfolio.sql`. Las rutas son `/portafolio`, `/portafolio/[id]?ownerId=UUID` y `/portafolio/editar`. El mes es aproximado, las imágenes admiten JPG, PNG y WebP hasta 8 MB, entre una y seis. Los archivos van a `portfolio-media/propietario/trabajo/archivo`, bucket privado. Los enlaces firmados caducan en cinco minutos; ocultar un trabajo no revoca enlaces ya emitidos hasta su vencimiento.

Guardar es un RPC con validación de dueño y de las fotos subidas. Ante un fallo de red se consulta si las fotos quedaron referenciadas antes de limpiarlas; si no se puede comprobar, se conservan para evitar borrar contenido válido. Esto puede dejar objetos pendientes y requiere una limpieza administrativa posterior. No hay una transacción distribuida entre Storage y PostgreSQL. Eliminar devuelve las rutas para limpiar y muestra si queda pendiente algún objeto.

## Reseñas

Aplicar `202610280003_completed_reviews.sql`. Se reutiliza `complete_deal_and_review` por compatibilidad, pero desde PR 1 ese nombre no implica completar: solo admite acuerdos ya completados. El autor no puede editar ni eliminar la reseña; una reseña por participante y acuerdo. Se muestran tipo de operación, fecha y nombre público, sin mensajes, montos, códigos ni identificadores privados del acuerdo.

La edición del perfil pierde permisos sobre `rating_average`, `rating_count`, `verified` y fechas; las columnas de datos personales editables se conservan. Este es un cambio compartido mínimo de seguridad que Franco debe revisar. El promedio persistido se recalcula de reseñas vinculadas a acuerdos completados.

## Indicadores e insignias

Aplicar `202610280004_trust_indicators.sql`. `get_profile_trust` obtiene antigüedad desde el perfil y servicios confirmados desde `service_confirmations` y `deals`. Las reseñas se agregan directamente desde operaciones completadas, sin confiar en valores editables ni en la demostración. Solo se activan las insignias de primer servicio confirmado y diez acuerdos cuando esos umbrales existen en la fuente actual. No se muestran contadores de préstamos ni alquileres, y no hay un puntaje global.

Se retiraron los checks de identidad de perfil, anuncio y formulario de publicación, porque no hay un proceso de verificación documentado. Las valoraciones de demostración se identifican como Demo o se ocultan. No se alteraron Inicio ni la barra de pestañas.

## Demostración al profesor

1. Mostrar el perfil y explicar la diferencia entre reputación real e identidad.
2. Añadir un trabajo manual con fotos Antes y Después; ocultarlo y comprobar con otra sesión que no se ve.
3. Con un acuerdo real de servicio aceptado, el trabajador solicita la confirmación. El cliente genera el código y el trabajador lo introduce. Mostrar que un código incorrecto falla y que el usado no sirve otra vez.
4. Desde el acuerdo completado, publicar una reseña. Reintentar y comprobar que no se duplica.
5. Vincular ese servicio al portafolio y ver el distintivo confirmado y los indicadores.
6. Explicar que préstamos, alquileres y entregas futuras tienen contratos preparados, pero no se inventaron sus flujos.

## Pruebas SQL locales

Las pruebas usan PostgreSQL 16 con PostGIS en un contenedor etiquetado `manoam=billy`, sin publicar puertos. `supabase/tests/bootstrap.sql` simula únicamente las superficies de Auth y Storage necesarias; no reemplaza una prueba de integración con los servicios reales. Aplicar esquema inicial, luego las cuatro migraciones de Billy. Ejecutar `confirmations.sql`, `portfolio.sql`, `reviews.sql` y `trust.sql` antes de la prueba concurrente. Cada uno revierte sus datos de prueba.

Para concurrencia, ejecutar `concurrency-setup.sql`, que deja únicamente datos ficticios en la base desechable; ejecutar después `scripts/test-confirmation-concurrency.py`. Debe obtenerse un éxito, un rechazo y un único mensaje de confirmación. Borrar el contenedor de pruebas al terminar; nunca usar estos scripts en la base compartida.
