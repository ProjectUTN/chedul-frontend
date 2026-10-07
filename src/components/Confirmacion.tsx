import { useEffect, useRef, useSyncExternalStore } from "react";
import { pedidoActual, suscribirConfirmacion } from "./confirmar";
import "./confirmacion.css";

// Confirmacion se monta una sola vez (en App) y muestra los pedidos de confirmar().
function Confirmacion() {
  const actual = useSyncExternalStore(suscribirConfirmacion, pedidoActual);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (actual && !dialog.open) dialog.showModal();
    if (!actual && dialog.open) dialog.close();
  }, [actual]);

  return (
    <dialog
      ref={ref}
      className="confirmacion"
      aria-labelledby="confirmacion-titulo"
      onCancel={(e) => {
        e.preventDefault();
        actual?.responder(false);
      }}
      onClick={(e) => {
        // Click en el fondo es cancelar
        if (e.target === ref.current) actual?.responder(false);
      }}>
      {actual && (
        <div className="confirmacion__contenido">
          <h2 id="confirmacion-titulo">{actual.titulo}</h2>
          {actual.mensaje && <p>{actual.mensaje}</p>}
          <div className="confirmacion__acciones">
            <button type="button" className="btn btn-secundario" onClick={() => actual.responder(false)}>
              {actual.cancelar ?? "Cancelar"}
            </button>
            <button
              type="button"
              autoFocus
              className={`btn ${actual.peligro ? "btn-peligro-lleno" : "btn-primario"}`}
              onClick={() => actual.responder(true)}>
              {actual.aceptar ?? "Aceptar"}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

export default Confirmacion;
