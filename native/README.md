# App para la App Store (Capacitor)

La app nativa es una envoltura que abre tu web publicada (`https://www.anochde.com`)
dentro de una app de iPhone/iPad con icono propio, pantalla de carga y sin barra
del navegador. Al publicar cambios en la web, la app los muestra al instante sin
esperar a la revisión de Apple.

## Qué ya está preparado

- `capacitor.config.ts`: nombre, identificador `com.anochde.escuelapadel`, colores y URL del sitio.
- `native/www/index.html`: pantalla de respaldo si el móvil no tiene internet.
- Complementos instalados: app, barra de estado y pantalla de carga.

## Qué falta (requiere un Mac)

Necesitas un Mac con Xcode y una cuenta de Apple Developer (99 $/año). En el Mac:

```bash
git clone <este proyecto>
npm install
npx cap add ios      # crea la carpeta ios/ (solo la primera vez)
npx cap sync ios
npx cap open ios     # abre Xcode
```

En Xcode:

1. Selecciona tu equipo de desarrollo en **Signing & Capabilities**.
2. Cambia los iconos en `ios/App/App/Assets.xcassets` (usa `public/icon-192.png` como base, Apple pide 1024×1024).
3. Prueba en un iPhone real conectado por cable.
4. **Product → Archive** y sube a App Store Connect.

## Notas

- La cámara, la pizarra con Apple Pencil y la subida de vídeos funcionan a través del navegador interno; no hacen falta complementos nativos adicionales.
- Si algún día quieres notificaciones push nativas, se añade el complemento de notificaciones y un servicio de mensajería.
- Apple suele rechazar apps que son "solo una web". Este proyecto tiene funciones de cámara, pizarra, pagos y gestión, así que se presenta como herramienta de gestión del club; conviene incluir capturas y una cuenta de prueba en la revisión.
