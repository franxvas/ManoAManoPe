# Mano a Mano PE

Mano a Mano PE es una aplicación que hicimos para conectar a personas de una misma ciudad. La idea es que alguien pueda publicar un producto, ofrecer un servicio, compartir una promoción o pedir algo que necesita.

La app está pensada principalmente para Bagua y muestra publicaciones cercanas usando la ubicación del celular. También tiene un mapa para explorar lo que hay alrededor.

## ¿Qué se puede hacer?

- Crear una cuenta o entrar como invitado.
- Publicar productos, servicios, promociones y necesidades.
- Buscar publicaciones y verlas en el mapa.
- Guardar favoritos.
- Contactar al vendedor y hacer una oferta.
- Conversar por mensajes.
- Editar el perfil y activar el modo vendedor.
- Revisar, editar, pausar o finalizar publicaciones propias.

Para las recomendaciones cercanas y el mapa hay que aceptar el permiso de ubicación. Si no se acepta, la aplicación sigue funcionando, pero no puede mostrar contenido cercano.

## Cuentas para probar

Creamos **2 cuentas semilla** para poder iniciar sesión y probar la aplicación sin registrarse:

### Cuenta de usuario

- Correo: `demo@manoamano.pe`
- Contraseña: `Demo12345!`

### Cuenta de vendedor

- Correo: `vendedor.demo@manoamano.pe`
- Contraseña: `Demo12345!`

La cuenta de vendedor tiene publicaciones creadas para revisar el perfil, los productos y la edición de publicaciones. En total dejamos **7 categorías** y **4 publicaciones de ejemplo**.

También se puede presionar **Continuar como invitado**, aunque para publicar, guardar favoritos, enviar mensajes o hacer ofertas será necesario iniciar sesión.

## Cómo iniciar sesión

1. Abrir la aplicación.
2. Presionar **Iniciar sesión**.
3. Escribir el correo y la contraseña de una de las cuentas de prueba.
4. Presionar nuevamente **Iniciar sesión**.

También se puede crear una cuenta nueva desde la opción **Crear cuenta**.

## Cómo ejecutar el proyecto

Primero hay que tener instalado Node.js, npm y la aplicación Expo Go en el celular.

Después abrimos el proyecto en Visual Studio Code y, desde la terminal, ejecutamos:

```bash
npm install
npx expo start --clear
```

Cuando aparezca el código QR, se escanea con Expo Go. El celular y la computadora deben estar conectados a la misma red Wi-Fi.

Si queremos abrir la versión web, presionamos la tecla `w` en la terminal. Para cerrar el servidor usamos `Ctrl + C`.

## Configuración de Supabase

La aplicación usa Supabase para guardar usuarios, perfiles, publicaciones, imágenes, favoritos y mensajes. Para ejecutarla con la base de datos se necesita un archivo `.env` en la carpeta principal con estos datos:

```env
EXPO_PUBLIC_SUPABASE_URL=tu_url_de_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_clave_publica
```

No se deben subir contraseñas ni claves privadas al repositorio.

## Tecnologías que usamos

Usamos React Native con Expo para la aplicación y Supabase para la base de datos. También usamos Expo Router para movernos entre pantallas y mapas para mostrar las publicaciones cercanas.

Este proyecto fue realizado como parte del curso de Programación de Aplicaciones Móviles y lo fuimos mejorando poco a poco mientras aprendíamos.
