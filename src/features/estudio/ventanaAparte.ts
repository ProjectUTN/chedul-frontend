// Ventana de Document Picture-in-Picture (Chrome y Edge de escritorio)

interface DocumentPiP {
  requestWindow: (opciones?: { width?: number; height?: number }) => Promise<Window>;
}

export const documentPiP = (): DocumentPiP | undefined =>
  (window as unknown as { documentPictureInPicture?: DocumentPiP }).documentPictureInPicture;

export const ventanaAparteSoportada = () => documentPiP() !== undefined;

// Copia los estilos de la app a la ventana que se abre aparte
const copiarEstilos = (destino: Window) => {
  for (const hoja of Array.from(document.styleSheets)) {
    try {
      const estilo = destino.document.createElement("style");
      estilo.textContent = Array.from(hoja.cssRules)
        .map((regla) => regla.cssText)
        .join("\n");
      destino.document.head.appendChild(estilo);
    } catch {
      if (hoja.href) {
        const enlace = destino.document.createElement("link");
        enlace.rel = "stylesheet";
        enlace.href = hoja.href;
        destino.document.head.appendChild(enlace);
      }
    }
  }
  destino.document.documentElement.className = document.documentElement.className;
  const tema = document.documentElement.dataset.theme;
  if (tema) destino.document.documentElement.dataset.theme = tema;
};

// Abre la ventana siempre visible (queda por encima de las demas aplicaciones).
// Hay que llamarla desde un click.
export const abrirVentanaAparte = async () => {
  const pip = documentPiP();
  if (!pip) throw new Error("El navegador no soporta ventanas flotantes");
  const ventana = await pip.requestWindow({ width: 260, height: 150 });
  copiarEstilos(ventana);
  return ventana;
};
