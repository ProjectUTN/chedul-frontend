// Ventana de Document Picture-in-Picture (Chrome y Edge de escritorio)

interface DocumentPiP {
  requestWindow: (opciones?: { width?: number; height?: number }) => Promise<Window>;
}

export const documentPiP = (): DocumentPiP | undefined =>
  (window as unknown as { documentPictureInPicture?: DocumentPiP }).documentPictureInPicture;

export const ventanaAparteSoportada = () => documentPiP() !== undefined;
