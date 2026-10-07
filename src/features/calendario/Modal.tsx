import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  titulo: string;
  abierto: boolean;
  onCerrar: () => void;
  children: ReactNode;
}

// Ventana modal con <dialog>: maneja el foco, Escape y el fondo oscuro sola.
function Modal({ titulo, abierto, onCerrar, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (abierto && !dialog.open) dialog.showModal();
    if (!abierto && dialog.open) dialog.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      className="modal"
      onClose={onCerrar}
      onClick={(e) => {
        // Click en el fondo cierra
        if (e.target === ref.current) onCerrar();
      }}>
      <div className="modal__contenido">
        <header className="modal__header">
          <h2>{titulo}</h2>
          <button type="button" className="btn btn-icono" onClick={onCerrar} aria-label="Cerrar">
            <span className="material-symbols-rounded">close</span>
          </button>
        </header>
        {abierto && children}
      </div>
    </dialog>
  );
}

export default Modal;
