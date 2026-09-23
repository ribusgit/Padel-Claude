# Publicar la web y guía para subir la app a la App Store

## 1. Arreglo previo (rápido)
- La fecha del subtítulo del Panel ("miércoles, 23 de septiembre") a veces sale distinta entre servidor y móvil (por la zona horaria) y provoca un parpadeo o error. Se mostrará la fecha solo cuando la página ya ha cargado en el dispositivo, usando la hora de Madrid.

## 2. Publicar
- Revisar el informe de seguridad; si hay avisos críticos, te los enseño antes de publicar.
- Publicar la última versión en https://www.anochde.com (la app de iPhone carga esta web, así que se actualiza sola).

## 3. Guía paso a paso con Xcode (en tu Mac)
1. Requisitos: Mac con Xcode actualizado (App Store del Mac), cuenta Apple Developer (99 $/año) y Node.js instalado.
2. Descargar el proyecto: conectar GitHub desde Lovable y hacer `git clone`, luego `npm install`.
3. Crear la app iOS: `npx cap add ios` (solo la primera vez), `npx cap sync ios`, `npx cap open ios`.
4. En Xcode, pestaña **Signing & Capabilities**: elegir tu equipo, confirmar identificador `com.anochde.escuelapadel`.
5. Icono: en `Assets.xcassets → AppIcon` arrastrar un icono de 1024×1024 (te lo preparo si lo pides).
6. Permisos (Info.plist): textos para cámara, micrófono y fotos (necesarios para vídeos, pizarra con webcam y foto del alumno). Te daré los textos exactos en español.
7. Probar en tu iPhone/iPad por cable (botón Play).
8. En **App Store Connect**: crear la app (nombre, idioma español, identificador, SKU).
9. En Xcode: destino "Any iOS Device" → **Product → Archive** → **Distribute App → App Store Connect → Upload**.
10. En App Store Connect: capturas (iPhone 6,7" e iPad 13"), descripción, política de privacidad (URL), cuenta de prueba para Apple, y **Enviar a revisión**.
11. Consejos para evitar rechazos: destacar funciones de gestión, cámara y pizarra; los pagos de cuotas del club no son compras dentro de la app, explicarlo en las notas de revisión.

## Detalles técnicos
- `app-shell.tsx`/panel: calcular el subtítulo de fecha tras hidratar (useEffect / useHydrated) con `timeZone: "Europe/Madrid"`.
- Opcional: añadir claves `NSCameraUsageDescription`, `NSMicrophoneUsageDescription`, `NSPhotoLibraryUsageDescription` al README nativo.
