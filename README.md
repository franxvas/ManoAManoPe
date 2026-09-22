# MANO A MANO.PE

Aplicación móvil de marketplace local para encontrar, ofrecer y negociar productos, servicios, promociones y necesidades cercanas. Está construida con Expo SDK 57, React Native, TypeScript estricto, Expo Router, NativeWind, TanStack Query y Supabase.

## Funcionalidad incluida

- Bienvenida, login, registro, recuperación y cierre de sesión con Supabase Auth.
- Navegación pública como invitado y protección de publicar, favoritos, contacto y ofertas.
- Inicio con búsqueda, filtros, estados vacíos/error/carga y pull-to-refresh.
- Detalle con fotos, vendedor, ubicación, favoritos, contacto y oferta.
- Mapa real con permiso de ubicación, alternativa al permiso denegado, marcadores, filtros y tarjetas sincronizadas.
- Formularios validados para producto, servicio, promoción y necesidad, selección de imágenes y edición.
- Conversaciones, mensajes y ofertas con actualizaciones Realtime.
- Aceptar, rechazar y contraofertar mediante RPC transaccional; el trato no procesa pagos.
- Perfil editable, modo vendedor persistente, publicaciones propias, favoritos y notificaciones.
- Esquema PostgreSQL/PostGIS completo, RLS, Storage, RPC, índices y datos demo.

Sin variables de entorno, la aplicación entra en modo demostración local y permite probar el flujo completo con `demo@manoamano.pe` y cualquier contraseña de 6 o más caracteres. Con variables válidas, autenticación, consultas, publicaciones, perfil, favoritos, conversaciones, mensajes, ofertas y notificaciones usan Supabase.

## Requisitos

- Node.js 20 o superior.
- npm 10 o superior.
- Expo Go compatible con SDK 57 o un development build.
- Docker y Supabase CLI para backend local, o un proyecto Supabase alojado.
- Xcode para compilar iOS; Android Studio/JDK para compilar Android.

## Instalación

```bash
npm install
cp .env.example .env
npm start
```

No se debe incluir `SUPABASE_SERVICE_ROLE_KEY` en `.env`: el cliente móvil nunca la utiliza.

## Variables de entorno

```dotenv
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
GOOGLE_MAPS_API_KEY_IOS=
GOOGLE_MAPS_API_KEY_ANDROID=
```

Las dos variables de Supabase activan el backend real. Las claves de mapas se añaden cuando el proveedor y la compilación nativa las requieran; `react-native-maps` funciona con el proveedor nativo por defecto durante desarrollo compatible.

## Supabase local

Instala la CLI oficial y ejecuta:

```bash
supabase start
supabase db reset
```

`db reset` aplica [la migración inicial](./supabase/migrations/202609150001_initial_schema.sql) y [el seed](./supabase/seed.sql). El seed incluye cuentas y datos marcados por su ubicación en el archivo de desarrollo:

- `demo@manoamano.pe` / `Demo12345!`
- `vendedor.demo@manoamano.pe` / `Demo12345!`

Para un proyecto remoto vinculado:

```bash
supabase link --project-ref TU_PROJECT_REF
supabase db push
```

Ejecuta el seed solo en un entorno de desarrollo. Cambia o elimina las cuentas demo antes de producción.

## Storage y seguridad

La migración crea `avatars`, `listing-media` y `message-media`, aplica policies por propietario/participante y activa RLS en todas las tablas. Las operaciones delicadas de oferta usan `send_offer` y `respond_to_offer`, que validan `auth.uid()`, bloquean la oferta durante la transición y crean trato, mensaje de sistema y notificación en la misma transacción.

## Ejecución

```bash
npm run ios
npm run android
npm run web
```

Para proyectos nativos reproducibles:

```bash
npx expo prebuild
npx expo run:ios
npx expo run:android
```

## Calidad

```bash
npm run typecheck
npm run lint
npm test
npm run doctor
```

## Estructura

- `app/`: rutas Expo Router y pantallas.
- `src/components/`: componentes visuales propios.
- `src/features/`, `src/hooks/`, `src/services/`: sesión, acceso remoto y lógica reutilizable.
- `src/stores/`: estado demo/efímero persistido.
- `supabase/migrations/`: esquema, RLS, RPC, Realtime, PostGIS y Storage.
- `supabase/seed.sql`: datos realistas de desarrollo para Bagua.

## Notificaciones push

La bandeja interna ya funciona y `expo-notifications` está configurado como dependencia. Para enviar push desde producción se debe añadir una Edge Function segura y las credenciales del proveedor correspondiente; ninguna clave servidor se guarda en la app.
