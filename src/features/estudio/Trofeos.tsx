import { useState } from "react";
import type { ResumenEstudio } from "../../api/types";
import { trofeos } from "./logros";

interface Props {
  resumen: ResumenEstudio;
}

// Trofeos que se ganan estudiando; los que faltan muestran cuanto llevás
function Trofeos({ resumen }: Props) {
  const [verTodos, setVerTodos] = useState(false);
  const lista = trofeos(resumen);
  const logrados = lista.filter((t) => t.logrado).length;
  // Primero los ganados y despues los que estan mas cerca
  const ordenados = [...lista].sort((a, b) => Number(b.logrado) - Number(a.logrado) || b.avance - a.avance);
  const visibles = verTodos ? ordenados : ordenados.slice(0, 6);

  return (
    <section className="card inicio-seccion estudio-ancho">
      <div className="inicio-seccion__header">
        <h2>Trofeos</h2>
        <span className="chip">
          {logrados} de {lista.length}
        </span>
      </div>
      <ul className="trofeos">
        {visibles.map((t) => (
          <li key={t.id} className={t.logrado ? "trofeo trofeo--logrado" : "trofeo"}>
            <span className="trofeo__icono material-symbols-rounded" aria-hidden="true">
              {t.icono}
            </span>
            <div className="trofeo__texto">
              <strong>{t.nombre}</strong>
              <span className="campo-ayuda">{t.descripcion}</span>
              {!t.logrado && (
                <div className="trofeo__avance" aria-label={`${Math.round(t.avance * 100)}% hecho`}>
                  <div style={{ width: `${t.avance * 100}%` }} />
                </div>
              )}
            </div>
            {t.logrado && (
              <span className="material-symbols-rounded trofeo__check" aria-label="Logrado">
                check_circle
              </span>
            )}
          </li>
        ))}
      </ul>
      {lista.length > 6 && (
        <button
          type="button"
          className="btn btn-secundario btn-chico trofeos__mas"
          onClick={() => setVerTodos((v) => !v)}>
          {verTodos ? "Ver menos" : `Ver los ${lista.length}`}
        </button>
      )}
    </section>
  );
}

export default Trofeos;
