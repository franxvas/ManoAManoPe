# Módulo de Billy

## Confirmaciones

Aplicar `202610280001_service_confirmations.sql` después del esquema inicial. La integración real actual es `deals` + una publicación de tipo `service`. Abrir `/confianza/confirmar?conversationId=UUID` desde una conversación con oferta aceptada. El trabajador solicita; el cliente genera y muestra; el trabajador introduce. El código dura diez minutos, cinco intentos, regeneración con 30 segundos de espera y diez generaciones por día. Solo se entrega al generarlo, no se puede recuperar el texto después. Un código no demuestra un pago.

El servidor deriva las partes del acuerdo, bloquea filas, guarda bcrypt y completa el acuerdo en la misma transacción. Un fallo de código devuelve un resultado negativo sin revertir el contador. La tabla no admite acceso directo de los clientes. Las reseñas dejan de completar acuerdos.

## Contrato para módulos futuros

No existe un RPC genérico para registrar participantes o completar cualquier operación. Cada compañero debe incorporar un adaptador SQL que consulte su tabla real, derive las partes y el estado, bloquee la operación y aplique su transición junto con una confirmación. No enviar participantes desde el cliente.

| Responsable | Acciones                                          | Muestra el código                             | Lo introduce          |
| ----------- | ------------------------------------------------- | --------------------------------------------- | --------------------- |
| Alexis      | Finalización de servicio                          | Cliente                                       | Trabajador            |
| Lenin       | Entrega de préstamo o alquiler                    | Receptor                                      | Propietario           |
| Lenin       | Devolución de préstamo o alquiler                 | Propietario                                   | Receptor que devuelve |
| Galoc       | Recojo de donación o entrega acordada de adopción | Receptor                                      | Entregante            |
| Franco      | Navegación y componentes compartidos              | Revisar los accesos del perfil y conversación | Sin alterar Inicio    |

Los contratos de préstamo, alquiler, donación y adopción están documentados, pero no se muestran contadores ni códigos para operaciones inexistentes. La adopción confirma la entrega acordada, no una evaluación de bienestar. Toda cancelación o retraso debe tratarse por el módulo de origen, sin inferir fraude.

## Aplicación

Las migraciones están preparadas; no asumir que están aplicadas a Supabase compartido. No se necesitan claves administrativas en Expo. La pantalla muestra el error real si el esquema no está instalado. No se habilitan códigos ficticios en modo demostración.
