// Service worker minimo: solo sirve para mostrar avisos del temporizador de
// estudio (en el celu las notificaciones salen siempre por un service worker).
// No guarda nada en cache.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanas) => {
      const abierta = ventanas.find((v) => "focus" in v);
      return abierta ? abierta.focus() : self.clients.openWindow("/herramientas/estudiar");
    })
  );
});
