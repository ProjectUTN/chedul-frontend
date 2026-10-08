import { useEffect, useMemo, useState } from "react";
import { getCalendarioAcademico, getEventos } from "../features/calendario/api";
import { academicasDelDia, aISO, desdeISO, diasDelMes, fechaLarga, MESES, nombreTipo } from "../features/calendario/fechas";
import VistaMes from "../features/calendario/VistaMes";
import Modal from "../features/calendario/Modal";
import EventoForm from "../features/calendario/EventoForm";
import SincronizarCalendario from "../features/calendario/SincronizarCalendario";
import { getMaterias } from "../features/estado_academico/api";
import { useAuth } from "../context/authProvider";
import { mensajeDeError } from "../api/client";
import type { Evento, FechaAcademica, Materia } from "../api/types";
import "../features/calendario/calendario.css";

// Calendario de parciales, finales y entregas, con las fechas de la facultad
// (mesas, feriados, cuatrimestres). El horario de cursada esta en su propia
// seccion (Horarios).

type Edicion = { evento: Evento | null; fecha: string };

function Calendario() {
  const { user } = useAuth();
  const [referencia, setReferencia] = useState(() => new Date());
  const [seleccionado, setSeleccionado] = useState(() => aISO(new Date()));

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [academicas, setAcademicas] = useState<FechaAcademica[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [error, setError] = useState("");
  const [recarga, setRecarga] = useState(0);
  const [edicion, setEdicion] = useState<Edicion | null>(null);
  const [sincronizando, setSincronizando] = useState(false);

  const anio = referencia.getFullYear();
  const mes = referencia.getMonth();

  // Rango visible: el mes con los dias de relleno de la grilla
  const [desde, hasta] = useMemo(() => {
    const dias = diasDelMes(anio, mes);
    return [aISO(dias[0]), aISO(dias[dias.length - 1])];
  }, [anio, mes]);

  useEffect(() => {
    let cancelado = false;
    getEventos(desde, hasta)
      .then((data) => !cancelado && setEventos(data))
      .catch((err) => !cancelado && setError(mensajeDeError(err)));
    return () => {
      cancelado = true;
    };
  }, [desde, hasta, recarga]);

  // Si falla, el calendario sigue andando con los eventos del alumno
  useEffect(() => {
    let cancelado = false;
    getCalendarioAcademico(desde, hasta)
      .then((data) => !cancelado && setAcademicas(data))
      .catch(() => !cancelado && setAcademicas([]));
    return () => {
      cancelado = true;
    };
  }, [desde, hasta]);

  useEffect(() => {
    if (!user) return;
    getMaterias(user.carrera)
      .then((data) => setMaterias([...data].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))))
      .catch((err) => setError(mensajeDeError(err)));
  }, [user]);

  const mover = (paso: number) => setReferencia((r) => new Date(r.getFullYear(), r.getMonth() + paso, 1));

  const irAHoy = () => {
    setReferencia(new Date());
    setSeleccionado(aISO(new Date()));
  };

  const seleccionar = (iso: string) => {
    setSeleccionado(iso);
    // Click en un dia de otro mes: se pasa a ese mes
    const fecha = desdeISO(iso);
    if (fecha.getMonth() !== mes) setReferencia(fecha);
  };

  const guardado = () => {
    setEdicion(null);
    setRecarga((n) => n + 1);
  };

  const delDia = eventos.filter((e) => e.fecha === seleccionado);
  const deLaFacultad = academicasDelDia(academicas, seleccionado);

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Calendario</h1>
          <p>Anotá parciales, finales y entregas para que no se te pase ninguno.</p>
        </div>
        <div className="calendario-acciones">
          <button className="btn btn-secundario" onClick={() => setSincronizando(true)}>
            <span className="material-symbols-rounded">sync</span>
            Google Calendar
          </button>
          <button
            className="btn btn-primario fab-movil"
            onClick={() => setEdicion({ evento: null, fecha: seleccionado })}>
            <span className="material-symbols-rounded">add</span>
            Nuevo evento
          </button>
        </div>
      </header>

      {error && <p className="form-error">{error}</p>}

      <div className="calendario-barra">
        <div className="calendario-nav">
          <button className="btn btn-icono" onClick={() => mover(-1)} aria-label="Mes anterior">
            <span className="material-symbols-rounded">chevron_left</span>
          </button>
          <button className="btn btn-icono" onClick={() => mover(1)} aria-label="Mes siguiente">
            <span className="material-symbols-rounded">chevron_right</span>
          </button>
          <h2>
            {MESES[mes]} {anio}
          </h2>
          <button className="btn btn-secundario btn-chico" onClick={irAHoy}>
            Hoy
          </button>
        </div>
      </div>

      <div className="calendario-mes-layout">
        <VistaMes
          anio={anio}
          mes={mes}
          eventos={eventos}
          academicas={academicas}
          seleccionado={seleccionado}
          onSeleccionar={seleccionar}
          onEditar={(evento) => setEdicion({ evento, fecha: evento.fecha })}
        />

        <aside className="card dia-panel">
          <div className="dia-panel__titulo">
            <h3>{fechaLarga(seleccionado)}</h3>
            <button
              className="btn btn-icono"
              aria-label="Agregar evento en este día"
              onClick={() => setEdicion({ evento: null, fecha: seleccionado })}>
              <span className="material-symbols-rounded">add</span>
            </button>
          </div>

          {deLaFacultad.length > 0 && (
            <ul className="dia-panel__lista">
              {deLaFacultad.map((f) => (
                <li key={f.id} className={`dia-panel__evento dia-panel__evento--facultad academica--${f.tipo}`}>
                  <span className="dia-panel__tipo">Calendario de la facultad</span>
                  <strong>{f.titulo}</strong>
                  {f.desde !== f.hasta && (
                    <span className="dia-panel__materia">
                      Del {f.desde.split("-").reverse().slice(0, 2).join("/")} al{" "}
                      {f.hasta.split("-").reverse().slice(0, 2).join("/")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {delDia.length === 0 ? (
            <p className="dia-panel__vacio">No tenés nada anotado.</p>
          ) : (
            <ul className="dia-panel__lista">
              {delDia.map((evento) => (
                <li key={evento.id}>
                  <button
                    className={`dia-panel__evento evento--${evento.tipo}`}
                    onClick={() => setEdicion({ evento, fecha: evento.fecha })}>
                    <span className="dia-panel__tipo">
                      {nombreTipo(evento.tipo)}
                      {evento.hora && ` · ${evento.hora}`}
                    </span>
                    <strong>{evento.titulo}</strong>
                    {evento.materia && <span className="dia-panel__materia">{evento.materia.nombre}</span>}
                    {evento.descripcion && <span className="dia-panel__notas">{evento.descripcion}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      <Modal
        abierto={edicion !== null}
        onCerrar={() => setEdicion(null)}
        titulo={edicion?.evento ? "Editar evento" : "Nuevo evento"}>
        {edicion && (
          <EventoForm evento={edicion.evento} fechaInicial={edicion.fecha} materias={materias} onGuardado={guardado} />
        )}
      </Modal>

      <Modal abierto={sincronizando} onCerrar={() => setSincronizando(false)} titulo="Ver en Google Calendar">
        {sincronizando && <SincronizarCalendario />}
      </Modal>
    </>
  );
}

export default Calendario;
