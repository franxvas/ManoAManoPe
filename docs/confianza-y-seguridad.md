# Confianza y seguridad — investigación y decisiones

Este documento responde a las observaciones del ingeniero: **estado de confianza**, **valoraciones estables**, **seguridad de publicaciones** y **API de verificación**.

## 1. Cómo lo resuelven otras plataformas

| Plataforma | Qué hace | Qué tomamos |
|---|---|---|
| Mercado Libre | Termómetro de reputación según ventas completadas, reclamos y demoras. | Un estado visible calculado con operaciones reales, no solo con estrellas. |
| Airbnb | Verificación de identidad con documento y reseñas solo después de una estadía. | Reseñas solo después de una operación completada (ya existía) y verificación de DNI. |
| Wallapop / OLX | Botón "Reportar" y moderación de anuncios; límites para cuentas nuevas. | Denuncias, pausa automática y límite diario de publicaciones. |
| IMDb / Amazon | Promedios ajustados para que pocos votos no distorsionen el ranking. | Promedio bayesiano. |

## 2. Valoraciones estables (promedio bayesiano)

Con un promedio simple, alguien con **1 reseña de 5★** queda por encima de alguien con **40 reseñas de 4.8★**. Además, es muy fácil inflarlo con una sola reseña.

Ahora la nota se calcula así:

```
nota = (C · m + suma de estrellas) / (C + número de reseñas)
C = 5 (reseñas "imaginarias")   m = 4.0 (nota previa)
```

| Caso | Promedio simple | Nota estable |
|---|---|---|
| 1 reseña de 5★ | 5.00 | 4.17 |
| 40 reseñas de 4.8★ | 4.80 | 4.71 |
| 200 reseñas de 5★ | 5.00 | 4.98 |

- Se calcula en Supabase (`public.stable_rating`) y se guarda en `profiles.rating_average`, que es el valor que muestran las tarjetas.
- Con menos de 5 reseñas, el perfil avisa que la nota todavía no es representativa.
- Además, cada reseña exige una operación completada entre las dos personas y no se puede editar ni borrar. Esto ya existía.

## 3. Estado de confianza

Se calcula a partir de datos verificables (`trustLevel` en `src/features/confianza/indicators.ts`):

| Estado | Condición |
|---|---|
| Nuevo | Sin operaciones ni reseñas |
| En crecimiento | Tiene al menos 1 operación, 1 reseña o el DNI verificado |
| Confiable | Tiene 5 o más operaciones, 3 o más reseñas y una nota estable de 4.0 o más |
| Verificado | Cumple lo de Confiable y además tiene el DNI verificado |
| En revisión | Recibió 3 o más denuncias en los últimos 90 días (tiene prioridad sobre los demás estados) |

Se muestra en la tarjeta "Actividad" del perfil.

## 4. Seguridad de publicaciones

- **Reportar:** el botón está en el detalle de la publicación. Los motivos son estafa, prohibido, falso, ofensivo, spam u otro. Cada usuario puede reportar una vez y no puede reportar su propia publicación (`report_listing`).
- **Pausa automática:** cuando 3 usuarios distintos reportan una publicación, se pausa y se notifica al dueño.
- **Límite para cuentas nuevas:** si la cuenta tiene menos de 7 días y no está verificada, puede publicar como máximo 5 veces por día (trigger `listings_rate_limit`). La verificación quita el límite.
- La tabla `listing_reports` tiene RLS y no se puede leer desde la app. Solo se escribe mediante el RPC.

## 5. API de verificación (DNI – RENIEC)

- **Proveedor:** Decolecta (antes apis.net.pe). Expone la consulta de DNI de RENIEC con un token y tiene un plan gratuito para pruebas. Otras opciones son apiperu.dev y factiliza.
- **Flujo:**
  1. La app envía el DNI a la Edge Function `verify-dni`.
  2. La función consulta RENIEC con el token, que solo está en el servidor.
  3. Comprueba que el primer nombre y el apellido paterno coincidan con el nombre del perfil.
  4. Si coinciden, marca `profiles.verified = true` y guarda `verified_at`.
- **Privacidad (Ley 29733):** el número de DNI no se guarda. Solo queda registrado que la cuenta fue verificada y cuándo. El usuario no puede marcarse como verificado desde la app, porque esa columna no tiene permiso de `update`.

### Desplegar

```powershell
supabase db push
supabase secrets set DECOLECTA_TOKEN=<tu-token>
supabase functions deploy verify-dni
```

Si no se configura el token, la pantalla muestra "La verificación aún no está configurada en el servidor".

## 6. Mejoras futuras

- Un panel de moderación para revisar las denuncias y reactivar publicaciones.
- Verificación del número de celular por SMS.
- Detección de precios anómalos comparando con la mediana de la categoría.
