import type { CapacitorConfig } from "@capacitor/cli";

/**
 * App nativa (iOS) de la Escuela de Pádel.
 *
 * La web usa renderizado en servidor (SSR), así que la app nativa carga
 * directamente el sitio publicado en https://www.anochde.com. Ventaja: cada vez
 * que publicas cambios, la app se actualiza sin pasar por la revisión de Apple.
 * `native/www` sólo contiene una pantalla de respaldo por si no hay conexión.
 */
const config: CapacitorConfig = {
  appId: "com.anochde.escuelapadel",
  appName: "Escuela de Pádel",
  webDir: "native/www",
  ios: {
    contentInset: "always",
    limitsNavigationsToAppBoundDomains: false,
  },
  server: {
    url: "https://www.anochde.com",
    cleartext: false,
    allowNavigation: ["www.anochde.com", "anochde.com", "*.lovable.app"],
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#0e120f",
      showSpinner: true,
      spinnerColor: "#d4ff3f",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0e120f",
    },
  },
};

export default config;
