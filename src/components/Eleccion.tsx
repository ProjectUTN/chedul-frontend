import { useEffect, useRef, useSyncExternalStore } from "react";
import { eleccionActual, suscribirEleccion } from "./elegir";
import "./confirmacion.css";

// Eleccion se monta una sola vez (en App) y muestra los pedidos de elegir().
function Eleccion() {
  const actual = useSyncExternalStore(suscribirEleccion, eleccionActual);
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
      aria-labelledby="eleccion-titulo"
      onCancel={(e) => {
        e.preventDefault();
        actual?.responder(null);
      }}
      onClick={(e) => {
        if (e.target === ref.current) actual?.responder(null);
      }}>
      {actual && (
        <div className="confirmacion__contenido">
          <h2 id="eleccion-titulo">{actual.titulo}</h2>
          {actual.mensaje && <p>{actual.mensaje}</p>}
          <ul className="eleccion__opciones">
            {actual.opciones.map((o, i) => (
              <li key={o.valor}>
                <button type="button" className="eleccion__opcion" autoFocus={i === 0} onClick={() => actual.responder(o.valor)}>
                  <b>{o.etiqueta}</b>
                  {o.detalle && <span>{o.detalle}</span>}
                </button>
              </li>
            ))}
          </ul>
          <div className="confirmacion__acciones">
            <button type="button" className="btn btn-secundario" onClick={() => actual.responder(null)}>
              {actual.cancelar ?? "Cancelar"}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

export default Eleccion;
