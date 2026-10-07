import type React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/authProvider";
import { getProgreso } from "../features/estado_academico/api";
import { getAportes } from "../features/aportes/api";
import { formatearFecha } from "../features/aportes/formato";
import { getEventos } from "../features/calendario/api";
import { aISO, cuantoFalta, nombreTipo, sumarDias } from "../features/calendario/fechas";
import { mensajeDeError } from "../api/client";
import type { Aporte, Evento, Progreso } from "../api/types";
import "../features/calendario/calendario.css";
import "./inicio.css";

function Inicio() {
  const { user } = useAuth();
  const [progreso, setProgreso] = useState<Progreso | null>(null);
  const [aportes, setAportes] = useState<Aporte[]>([]);
  const [proximos, setProximos] = useState<Evento[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getProgreso()
      .then(setProgreso)
      .catch((err) => setError(mensajeDeError(err, "No se pudo cargar tu progreso")));
    getAportes({ limite: 4 })
      .then((data) => setAportes(data.items))
      .catch(() => {});
    const hoy = new Date();
    getEventos(aISO(hoy), aISO(sumarDias(hoy, 60)))
      .then((data) => setProximos(data.slice(0, 5)))
      .catch(() => {});
  }, []);

  const primerNombre = user?.nombre.split(" ")[0];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>¡Hola, {primerNombre}!</h1>
          <p>Así va tu carrera.</p>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      {progreso && (
        <section className="estadisticas" aria-label="Estadísticas">
          <div className="card estadistica" style={{ "--tono": "var(--green)" } as React.CSSProperties}>
            <span className="estadistica__icono material-symbols-rounded" aria-hidden="true">
              trending_up
            </span>
            <span className="estadistica__valor">
              {Math.round(progreso.porcentaje_aprobadas)}%
            </span>
            <span className="estadistica__titulo">de la carrera aprobada</span>
            <div
              className="barra"
              role="progressbar"
              aria-valuenow={Math.round(progreso.porcentaje_aprobadas)}
              aria-valuemin={0}
              aria-valuemax={100}>
              <div style={{ width: `${progreso.porcentaje_aprobadas}%` }} />
            </div>
          </div>
          <div className="card estadistica" style={{ "--tono": "var(--accent)" } as React.CSSProperties}>
            <span className="estadistica__icono material-symbols-rounded" aria-hidden="true">
              task_alt
            </span>
            <span className="estadistica__valor">
              {progreso.obligatorias_aprobadas}
              <small>/{progreso.obligatorias_total}</small>
            </span>
            <span className="estadistica__titulo">materias aprobadas</span>
          </div>
          <div className="card estadistica" style={{ "--tono": "var(--yellow)" } as React.CSSProperties}>
            <span className="estadistica__icono material-symbols-rounded" aria-hidden="true">
              star
            </span>
            <span className="estadistica__valor">
              {progreso.promedio !== null ? progreso.promedio.toFixed(2) : "–"}
            </span>
            <span className="estadistica__titulo">promedio</span>
          </div>
          <div className="card estadistica" style={{ "--tono": "var(--orange)" } as React.CSSProperties}>
            <span className="estadistica__icono material-symbols-rounded" aria-hidden="true">
              pending_actions
            </span>
            <span className="estadistica__valor">
              {progreso.materias_regularizadas.length}
            </span>
            <span className="estadistica__titulo">finales pendientes</span>
          </div>
        </section>
      )}

      <div className="inicio-columnas">
        <section className="card inicio-seccion">
          <div className="inicio-seccion__header">
            <h2>Próximas fechas</h2>
            <Link to="/calendario">Ver calendario</Link>
          </div>
          {proximos.length === 0 ? (
            <p className="campo-ayuda">
              No tenés nada en los próximos dos meses. <Link to="/calendario">Anotá un parcial</Link>.
            </p>
          ) : (
            <ul className="lista-proximos">
              {proximos.map((e) => (
                <li key={e.id} className={`evento--${e.tipo}`}>
                  <span className="lista-proximos__cuando">{cuantoFalta(e.fecha)}</span>
                  <div>
                    <strong>{e.titulo}</strong>
                    <span className="campo-ayuda">
                      {nombreTipo(e.tipo)} · {e.fecha.split("-").reverse().join("/")}
                      {e.hora && ` · ${e.hora}`}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {progreso && (
          <section className="card inicio-seccion">
            <div className="inicio-seccion__header">
              <h2>Podés cursar</h2>
              <Link to="/estado">Actualizar estado</Link>
            </div>
            {progreso.materias_cursando.length > 0 && (
              <p className="campo-ayuda">
                Cursando ahora: {progreso.materias_cursando.map((m) => m.nombre).join(", ")}
              </p>
            )}
            {progreso.materias_pendientes_disponibles.length === 0 ? (
              <p className="campo-ayuda">
                No hay materias disponibles. Cargá tu estado académico para verlas.
              </p>
            ) : (
              <ul className="lista-materias">
                {progreso.materias_pendientes_disponibles.map((m) => (
                  <li key={m.id}>
                    <span className="chip">{m.nivel}°</span>
                    <span>{m.nombre}</span>
                    <Link
                      className="lista-materias__link"
                      to={`/aportes?materia_id=${m.id}`}
                      title="Ver aportes de esta materia">
                      <span className="material-symbols-rounded">library_books</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section className="card inicio-seccion">
          <div className="inicio-seccion__header">
            <h2>Últimos aportes</h2>
            <Link to="/aportes">Ver todos</Link>
          </div>
          {aportes.length === 0 ? (
            <p className="campo-ayuda">
              Todavía no hay aportes. <Link to="/aportes/nuevo">Subí el primero</Link>.
            </p>
          ) : (
            <ul className="lista-aportes">
              {aportes.map((a) => (
                <li key={a.id}>
                  <Link to={`/aportes?materia_id=${a.materia.id}`}>
                    <strong>{a.titulo}</strong>
                    <span className="campo-ayuda">
                      {a.materia.nombre} · {a.tag.nombre} · {formatearFecha(a.creado_en)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

export default Inicio;
