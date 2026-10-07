import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getClases, getEventos } from "../features/calendario/api";
import {
  aISO,
  desdeISO,
  diaSemana,
  diasDelMes,
  fechaLarga,
  inicioSemana,
  MESES,
  nombreTipo,
  sumarDias,
} from "../features/calendario/fechas";
import VistaMes from "../features/calendario/VistaMes";
import VistaSemana from "../features/calendario/VistaSemana";
import Modal from "../features/calendario/Modal";
import EventoForm from "../features/calendario/EventoForm";
import ClaseForm from "../features/calendario/ClaseForm";
import { getMaterias } from "../features/estado_academico/api";
import { useAuth } from "../context/authProvider";
import { mensajeDeError } from "../api/client";
import type { Clase, Evento, Materia } from "../api/types";
import "../features/calendario/calendario.css";

type Vista = "mes" | "semana";

type Edicion =
  | { tipo: "evento"; evento: Evento | null; fecha: string }
  | { tipo: "clase"; clase: Clase | null; dia: number };

function Calendario() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const vista: Vista = params.get("vista") === "semana" ? "semana" : "mes";

  const [referencia, setReferencia] = useState(() => new Date());
  const [seleccionado, setSeleccionado] = useState(() => aISO(new Date()));

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [clases, setClases] = useState<Clase[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [error, setError] = useState("");
  const [recarga, setRecarga] = useState(0);
  const [edicion, setEdicion] = useState<Edicion | null>(null);

  const anio = referencia.getFullYear();
  const mes = referencia.getMonth();
  const lunes = inicioSemana(referencia);

  // Rango de fechas visible segun la vista
  const [desde, hasta] = useMemo(() => {
    if (vista === "semana") {
      const inicio = inicioSemana(referencia);
      return [aISO(inicio), aISO(sumarDias(inicio, 6))];
    }
    const dias = diasDelMes(referencia.getFullYear(), referencia.getMonth());
    return [aISO(dias[0]), aISO(dias[dias.length - 1])];
  }, [vista, referencia]);

  useEffect(() => {
    let cancelado = false;
    getEventos(desde, hasta)
      .then((data) => !cancelado && setEventos(data))
      .catch((err) => !cancelado && setError(mensajeDeError(err)));
    return () => {
      cancelado = true;
    };
  }, [desde, hasta, recarga]);

  useEffect(() => {
    getClases()
      .then(setClases)
      .catch((err) => setError(mensajeDeError(err)));
  }, [recarga]);

  useEffect(() => {
    if (!user) return;
    getMaterias(user.carrera)
      .then((data) => setMaterias([...data].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))))
      .catch((err) => setError(mensajeDeError(err)));
  }, [user]);

  const cambiarVista = (nueva: Vista) => {
    const siguiente = new URLSearchParams(params);
    if (nueva === "semana") siguiente.set("vista", "semana");
    else siguiente.delete("vista");
    setParams(siguiente, { replace: true });
  };

  const mover = (paso: number) => {
    setReferencia((r) =>
      vista === "semana" ? sumarDias(r, paso * 7) : new Date(r.getFullYear(), r.getMonth() + paso, 1)
    );
  };

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

  const titulo =
    vista === "mes"
      ? `${MESES[mes]} ${anio}`
      : (() => {
          const domingo = sumarDias(lunes, 6);
          const mismoMes = lunes.getMonth() === domingo.getMonth();
          return mismoMes
            ? `${lunes.getDate()} al ${domingo.getDate()} de ${MESES[domingo.getMonth()].toLowerCase()}`
            : `${lunes.getDate()} de ${MESES[lunes.getMonth()].toLowerCase()} al ${domingo.getDate()} de ${MESES[domingo.getMonth()].toLowerCase()}`;
        })();

  const delDia = eventos.filter((e) => e.fecha === seleccionado);

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Calendario</h1>
          <p>Anotá parciales, finales y entregas, y armá tu horario de cursada.</p>
        </div>
        <div className="calendario-acciones">
          <button
            className="btn btn-secundario"
            onClick={() => setEdicion({ tipo: "clase", clase: null, dia: Math.min(diaSemana(new Date()), 6) })}>
            <span className="material-symbols-rounded">schedule</span>
            Agregar clase
          </button>
          <button
            className="btn btn-primario fab-movil"
            onClick={() => setEdicion({ tipo: "evento", evento: null, fecha: seleccionado })}>
            <span className="material-symbols-rounded">add</span>
            Nuevo evento
          </button>
        </div>
      </header>

      {error && <p className="form-error">{error}</p>}

      <div className="calendario-barra">
        <div className="calendario-nav">
          <button className="btn btn-icono" onClick={() => mover(-1)} aria-label="Anterior">
            <span className="material-symbols-rounded">chevron_left</span>
          </button>
          <button className="btn btn-icono" onClick={() => mover(1)} aria-label="Siguiente">
            <span className="material-symbols-rounded">chevron_right</span>
          </button>
          <h2>{titulo}</h2>
          <button className="btn btn-secundario btn-chico" onClick={irAHoy}>
            Hoy
          </button>
        </div>

        <div className="segmented" role="group" aria-label="Vista">
          <button aria-pressed={vista === "mes"} onClick={() => cambiarVista("mes")}>
            Mes
          </button>
          <button aria-pressed={vista === "semana"} onClick={() => cambiarVista("semana")}>
            Semana
          </button>
        </div>
      </div>

      {vista === "mes" ? (
        <div className="calendario-mes-layout">
          <VistaMes
            anio={anio}
            mes={mes}
            eventos={eventos}
            seleccionado={seleccionado}
            onSeleccionar={seleccionar}
            onEditar={(evento) => setEdicion({ tipo: "evento", evento, fecha: evento.fecha })}
          />

          <aside className="card dia-panel">
            <div className="dia-panel__titulo">
              <h3>{fechaLarga(seleccionado)}</h3>
              <button
                className="btn btn-icono"
                aria-label="Agregar evento en este día"
                onClick={() => setEdicion({ tipo: "evento", evento: null, fecha: seleccionado })}>
                <span className="material-symbols-rounded">add</span>
              </button>
            </div>

            {delDia.length === 0 ? (
              <p className="dia-panel__vacio">No tenés nada anotado.</p>
            ) : (
              <ul className="dia-panel__lista">
                {delDia.map((evento) => (
                  <li key={evento.id}>
                    <button
                      className={`dia-panel__evento evento--${evento.tipo}`}
                      onClick={() => setEdicion({ tipo: "evento", evento, fecha: evento.fecha })}>
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
      ) : (
        <>
          {clases.length === 0 && (
            <p className="vacio">
              Todavía no cargaste tu horario. Tocá "Agregar clase" o hacé click en un día de la grilla.
            </p>
          )}
          <VistaSemana
            lunes={lunes}
            clases={clases}
            eventos={eventos}
            onClase={(clase) => setEdicion({ tipo: "clase", clase, dia: clase.dia })}
            onNuevaClase={(dia) => setEdicion({ tipo: "clase", clase: null, dia })}
            onEvento={(evento) => setEdicion({ tipo: "evento", evento, fecha: evento.fecha })}
          />
        </>
      )}

      <Modal
        abierto={edicion !== null}
        onCerrar={() => setEdicion(null)}
        titulo={
          edicion?.tipo === "clase"
            ? edicion.clase
              ? "Editar clase"
              : "Nueva clase"
            : edicion?.evento
              ? "Editar evento"
              : "Nuevo evento"
        }>
        {edicion?.tipo === "evento" && (
          <EventoForm
            evento={edicion.evento}
            fechaInicial={edicion.fecha}
            materias={materias}
            onGuardado={guardado}
          />
        )}
        {edicion?.tipo === "clase" && (
          <ClaseForm clase={edicion.clase} diaInicial={edicion.dia} materias={materias} onGuardado={guardado} />
        )}
      </Modal>
    </>
  );
}

export default Calendario;
