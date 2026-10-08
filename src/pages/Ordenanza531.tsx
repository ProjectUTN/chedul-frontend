import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProgreso } from "../features/estado_academico/api";
import { mensajeDeError } from "../api/client";
import "../features/herramientas/herramientas.css";
import type { Ordenanza531 as Datos531 } from "../api/types";
import "./inicio.css";

// Ordenanza 531: si lo que le falta al alumno no supera la carga horaria del
// ultimo nivel, puede cursar esas materias sin correlativas (punto 5.3.1 del
// Reglamento de Estudios, Ord. 1549 modificada por la 1872).
function Ordenanza531() {
  const [ordenanza, setOrdenanza] = useState<Datos531 | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getProgreso()
      .then((p) => setOrdenanza(p.ordenanza_531))
      .catch((err) => setError(mensajeDeError(err, "No se pudo calcular")));
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <Link to="/herramientas" className="volver">
            <span className="material-symbols-rounded">arrow_back</span>
            Herramientas
          </Link>
          <h1>Ordenanza 531</h1>
          <p>
            Si la carga horaria semanal de lo que te falta cursar no supera la de 5° año, podés cursar esas
            materias sin correlativas. Para rendir el final sí se piden.
          </p>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      {ordenanza && (
        <section className={`card inicio-seccion ordenanza ${ordenanza.puede ? "ordenanza--puede" : ""}`}>
          <div className="inicio-seccion__header">
            <h2>{ordenanza.faltantes.length === 0 ? "No te falta ninguna obligatoria" : "¿Podés pedirla?"}</h2>
            {ordenanza.faltantes.length > 0 && (
              <span className={`chip ${ordenanza.puede ? "chip-verde" : ""}`}>
                {ordenanza.puede ? "Sí, podés pedirla" : "Todavía no"}
              </span>
            )}
          </div>
          {ordenanza.faltantes.length > 0 && (
            <>
              <p>
                {ordenanza.puede
                  ? "Lo que te falta no supera la carga horaria de 5° año: podés presentar la nota."
                  : `Te sobran ${Math.round(ordenanza.horas_faltantes - ordenanza.horas_limite)} hs semanales: se puede pedir cuando lo que te falta no supera las ${Math.round(ordenanza.horas_limite)} hs semanales de 5° año.`}
              </p>
              <div className="barra" role="progressbar" aria-label="Horas que faltan contra el límite">
                <div style={{ width: `${Math.min(100, (ordenanza.horas_limite / ordenanza.horas_faltantes) * 100)}%` }} />
              </div>
              <span className="campo-ayuda">
                Te faltan {Math.round(ordenanza.horas_faltantes)} hs semanales de {Math.round(ordenanza.horas_limite)}{" "}
                permitidas.
                No cuenta electivas, la Práctica Supervisada ni lo que ya regularizaste o estás cursando.
              </span>
              <h3 className="ordenanza__subtitulo">Lo que te falta cursar</h3>
              <ul className="lista-materias">
                {ordenanza.faltantes.map((m) => (
                  <li key={m.id}>
                    <span className="chip">{m.nivel}°</span>
                    <span>{m.nombre}</span>
                    <span className="campo-ayuda ordenanza__estado">{m.estado_actual}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <span className="campo-ayuda">
            Se pide con la nota "Solicitud de excepción transitoria al régimen de correlatividades (531)" en el
            Departamento de Alumnos. Se calcula con tu <Link to="/estado">estado académico</Link>.
          </span>
        </section>
      )}
    </>
  );
}

export default Ordenanza531;
