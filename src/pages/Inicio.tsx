import type React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/authProvider";
import { getProgreso } from "../features/estado_academico/api";
import { getAportes } from "../features/aportes/api";
import { conEmoji, formatearFecha, MATERIA_CARRERA, nombreMateriaAporte } from "../features/aportes/formato";
import { getCalendarioAcademico, getEventos } from "../features/calendario/api";
import { aISO, cuantoFalta, nombreTipo, sumarDias } from "../features/calendario/fechas";
import EventosConfirmados from "../features/calendario/EventosConfirmados";
import { mensajeDeError } from "../api/client";
import type { Aporte, Evento, FechaAcademica, Progreso } from "../api/types";
import "../features/calendario/calendario.css";
import "./inicio.css";

// En Proximas fechas, del calendario de la facultad solo van las mesas y el
// inicio o fin de cuatrimestre; los feriados se ven en Calendario
const ACADEMICAS_EN_INICIO = new Set(["examen", "cuatrimestre"]);
const MAX_PROXIMAS = 6;

type Proxima =
  | { clave: string; fecha: string; tipo: "evento"; evento: Evento }
  | { clave: string; fecha: string; tipo: "facultad"; academica: FechaAcademica };

const diaMes = (iso: string) => iso.split("-").reverse().slice(0, 2).join("/");

function Inicio() {
  const { user } = useAuth();
  const [progreso, setProgreso] = useState<Progreso | null>(null);
  const [aportes, setAportes] = useState<Aporte[]>([]);
  const [proximos, setProximos] = useState<Evento[]>([]);
  const [academicas, setAcademicas] = useState<FechaAcademica[]>([]);
  const [error, setError] = useState("");

  const recargarProximos = () => {
    const hoy = new Date();
    getEventos(aISO(hoy), aISO(sumarDias(hoy, 60)))
      .then((data) => setProximos(data.slice(0, MAX_PROXIMAS)))
      .catch(() => {});
  };

  useEffect(() => {
    getProgreso()
      .then(setProgreso)
      .catch((err) => setError(mensajeDeError(err, "No se pudo cargar tu progreso")));
    getAportes({ limite: 4 })
      .then((data) => setAportes(data.items))
      .catch(() => {});
    recargarProximos();
    const hoy = new Date();
    getCalendarioAcademico(aISO(hoy), aISO(sumarDias(hoy, 60)))
      .then((data) => setAcademicas(data.filter((f) => ACADEMICAS_EN_INICIO.has(f.tipo))))
      .catch(() => {});
  }, []);

  // Las fechas de la facultad que ya empezaron se muestran como de hoy
  const hoyISO = aISO(new Date());
  const proximas: Proxima[] = [
    ...proximos.map((evento): Proxima => ({ clave: `e${evento.id}`, fecha: evento.fecha, tipo: "evento", evento })),
    ...academicas.map(
      (academica): Proxima => ({
        clave: `f${academica.id}`,
        fecha: academica.desde < hoyISO ? hoyISO : academica.desde,
        tipo: "facultad",
        academica,
      })
    ),
  ]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(0, MAX_PROXIMAS);

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

      <EventosConfirmados onAgregado={recargarProximos} />

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
          {proximas.length === 0 ? (
            <p className="campo-ayuda">
              No tenés nada en los próximos dos meses. <Link to="/calendario">Anotá un parcial</Link>.
            </p>
          ) : (
            <ul className="lista-proximos">
              {proximas.map((p) =>
                p.tipo === "evento" ? (
                  <li key={p.clave} className={`evento--${p.evento.tipo}`}>
                    <span className="lista-proximos__cuando">{cuantoFalta(p.fecha)}</span>
                    <div>
                      <strong>{p.evento.titulo}</strong>
                      <span className="campo-ayuda">
                        {nombreTipo(p.evento.tipo)} · {p.evento.fecha.split("-").reverse().join("/")}
                        {p.evento.hora && ` · ${p.evento.hora}`}
                      </span>
                    </div>
                  </li>
                ) : (
                  <li key={p.clave} className={`academica--${p.academica.tipo}`}>
                    <span className="lista-proximos__cuando">{cuantoFalta(p.fecha)}</span>
                    <div>
                      <strong>{p.academica.titulo}</strong>
                      <span className="campo-ayuda">
                        Facultad · {diaMes(p.academica.desde)}
                        {p.academica.hasta !== p.academica.desde && ` al ${diaMes(p.academica.hasta)}`}
                      </span>
                    </div>
                  </li>
                )
              )}
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
                  <Link to={`/aportes?materia_id=${a.materia?.id ?? MATERIA_CARRERA}`}>
                    <strong>{a.titulo}</strong>
                    <span className="campo-ayuda">
                      {nombreMateriaAporte(a)} · {conEmoji(a.tag.nombre)} · {formatearFecha(a.creado_en)}
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
