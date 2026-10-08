// Avisos del navegador para cuando termina un bloque del pomodoro. Son
// opcionales: la preferencia se guarda en este dispositivo y el permiso se
// pide recien cuando el alumno los activa.

const CLAVE = "chedul.avisarFin";

export const avisosSoportados = () => typeof Notification !== "undefined";

export const permisoDeAvisos = (): NotificationPermission => (avisosSoportados() ? Notification.permission : "denied");

export const leerPreferenciaAvisos = () => {
  try {
    return localStorage.getItem(CLAVE) === "1" && permisoDeAvisos() === "granted";
  } catch {
    return false;
  }
};

export const guardarPreferenciaAvisos = (activo: boolean) => {
  try {
    localStorage.setItem(CLAVE, activo ? "1" : "0");
  } catch {
    // Sin storage la preferencia dura hasta que se cierre la pestaña
  }
};

// En el celu las notificaciones solo salen desde un service worker
const registrarServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/sw.js");
  } catch {
    // Se intenta igual con Notification
  }
};

// Pide permiso (hay que llamarla desde un click). Devuelve si quedo concedido.
export const pedirPermisoDeAvisos = async () => {
  if (!avisosSoportados()) return false;
  const permiso =
    Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
  if (permiso === "granted") await registrarServiceWorker();
  return permiso === "granted";
};

export const mostrarAviso = async (titulo: string, cuerpo: string) => {
  if (permisoDeAvisos() !== "granted") return;
  const opciones: NotificationOptions = { body: cuerpo, icon: "/favicon.svg", badge: "/favicon.svg" };
  try {
    const registro = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    if (registro) {
      await registro.showNotification(titulo, opciones);
      return;
    }
    new Notification(titulo, opciones);
  } catch {
    // Algunos navegadores no dejan crearla: no es grave
  }
};
