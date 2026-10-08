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

  const electivas = Math.round(ordenanza?.horas_electivas_faltantes ?? 0);
  const leFalta = (ordenanza?.faltantes.length ?? 0) > 0 || electivas > 0;

  return (
    <>
      <div className="page-header">
        <div>
          <Link to="/herramientas" className="volver">
            <span className="material-symbols-rounded">arrow_back</span>
            Herramientas
          </Link>
          <h1>Ordenanza 531</h1>
          <p>Cuándo podés cursar lo que te queda sin correlativas.</p>
        </div>
      </div>

      <section className="card inicio-seccion ordenanza__que-es">
        <h2>¿De qué se trata?</h2>
        <p>
          Es una nota para pedir una excepción a las correlativas cuando estás terminando la carrera. Si lo que te
          falta cursar (las obligatorias pendientes más las horas de electivas que te faltan) suma menos horas
          semanales que el último nivel, podés cursar todo eso aunque no tengas las correlativas. Los finales sí los
          tenés que rendir respetando las correlativas.
        </p>
        <span className="campo-ayuda">
          Se presenta en el Departamento de Alumnos con la nota "Solicitud de excepción transitoria al régimen de
          correlatividades (531)".
        </span>
      </section>

      {error && <p className="form-error">{error}</p>}

      {ordenanza && (
        <section className={`card inicio-seccion ordenanza ${ordenanza.puede ? "ordenanza--puede" : ""}`}>
          <div className="inicio-seccion__header">
            <h2>{leFalta ? "¿Podés pedirla?" : "No te falta nada por cursar"}</h2>
            {leFalta && (
              <span className={`chip ${ordenanza.puede ? "chip-verde" : ""}`}>
                {ordenanza.puede ? "Sí, podés pedirla" : "Todavía no"}
              </span>
            )}
          </div>
          {leFalta && (
            <>
              <p>
                {ordenanza.puede
                  ? `Lo que te falta no supera las ${Math.round(ordenanza.horas_limite)} hs semanales del último nivel: podés presentar la nota.`
                  : `Te sobran ${Math.round(ordenanza.horas_faltantes - ordenanza.horas_limite)} hs semanales: se puede pedir cuando lo que te falta no supera las ${Math.round(ordenanza.horas_limite)} hs semanales del último nivel.`}
              </p>
              <div className="barra" role="progressbar" aria-label="Horas que faltan contra el límite">
                <div style={{ width: `${Math.min(100, (ordenanza.horas_limite / ordenanza.horas_faltantes) * 100)}%` }} />
              </div>
              <span className="campo-ayuda">
                Te faltan {Math.round(ordenanza.horas_faltantes)} hs semanales de {Math.round(ordenanza.horas_limite)}{" "}
                permitidas. Lo que ya regularizaste o estás cursando no cuenta, ni la Práctica Supervisada.
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
                {electivas > 0 && (
                  <li>
                    <span className="chip">Elec.</span>
                    <span>Horas de electivas</span>
                    <span className="campo-ayuda ordenanza__estado">{electivas} hs semanales</span>
                  </li>
                )}
              </ul>
            </>
          )}
          <span className="campo-ayuda">
            Se calcula con tu <Link to="/estado">estado académico</Link>. Las horas de electivas que llevás las ves en{" "}
            <Link to="/herramientas/electivas">Electivas</Link>.
          </span>
        </section>
      )}
    </>
  );
}

export default Ordenanza531;
