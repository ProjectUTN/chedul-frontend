import { useEffect, useMemo, useState } from "react";
import { getClases, getEventos } from "../features/calendario/api";
import { aISO, diaSemana, inicioSemana, MESES, sumarDias } from "../features/calendario/fechas";
import VistaSemana from "../features/calendario/VistaSemana";
import { seCursaEl } from "../features/calendario/comisiones";
import Modal from "../features/calendario/Modal";
import EventoForm from "../features/calendario/EventoForm";
import ClaseForm from "../features/calendario/ClaseForm";
import SincronizarCalendario from "../features/calendario/SincronizarCalendario";
import { getMaterias } from "../features/estado_academico/api";
import { useAuth } from "../context/authProvider";
import { mensajeDeError } from "../api/client";
import type { Clase, Evento, Materia } from "../api/types";
import "../features/calendario/calendario.css";

// Horario semanal de cursada. Las clases se repiten todas las semanas; los
// parciales y entregas de la semana que se ve aparecen encima.

type Edicion = { tipo: "evento"; evento: Evento } | { tipo: "clase"; clase: Clase | null; dia: number };

function Horarios() {
  const { user } = useAuth();
  const [referencia, setReferencia] = useState(() => new Date());
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [clases, setClases] = useState<Clase[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [error, setError] = useState("");
  const [recarga, setRecarga] = useState(0);
  const [edicion, setEdicion] = useState<Edicion | null>(null);
  const [sincronizando, setSincronizando] = useState(false);

  const lunes = useMemo(() => inicioSemana(referencia), [referencia]);
  const domingo = sumarDias(lunes, 6);
  const esEstaSemana = aISO(lunes) === aISO(inicioSemana(new Date()));
  // Cada clase se compara con la fecha de su dia en la semana que se ve, asi
  // la semana del 1° de agosto ya muestra las del 2° cuatrimestre
  const clasesDeLaSemana = clases.filter((c) => seCursaEl(c, sumarDias(lunes, c.dia - 1)));
  const fueraDeCursada = clases.length > 0 && clasesDeLaSemana.length === 0;

  useEffect(() => {
    let cancelado = false;
    getEventos(aISO(lunes), aISO(sumarDias(lunes, 6)))
      .then((data) => !cancelado && setEventos(data))
      .catch((err) => !cancelado && setError(mensajeDeError(err)));
    return () => {
      cancelado = true;
    };
  }, [lunes, recarga]);

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

  const guardado = () => {
    setEdicion(null);
    setRecarga((n) => n + 1);
  };

  const mismoMes = lunes.getMonth() === domingo.getMonth();
  const titulo = mismoMes
    ? `${lunes.getDate()} al ${domingo.getDate()} de ${MESES[domingo.getMonth()].toLowerCase()}`
    : `${lunes.getDate()} de ${MESES[lunes.getMonth()].toLowerCase()} al ${domingo.getDate()} de ${MESES[domingo.getMonth()].toLowerCase()}`;

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Horarios</h1>
          <p>Tu semana: clases, trabajo y lo que se repita. Las materias que marcás como cursando se agregan solas.</p>
        </div>
        <div className="calendario-acciones">
          <button className="btn btn-secundario" onClick={() => setSincronizando(true)}>
            <span className="material-symbols-rounded">sync</span>
            Google Calendar
          </button>
          <button
            className="btn btn-primario fab-movil"
            onClick={() =>
              setEdicion({
                tipo: "clase",
                clase: null,
                dia: Math.min(diaSemana(new Date()), 6),
              })
            }>
            <span className="material-symbols-rounded">add</span>
            Agregar al horario
          </button>
        </div>
      </header>

      {error && <p className="form-error">{error}</p>}

      <div className="calendario-barra">
        <div className="calendario-nav">
          <button
            className="btn btn-icono"
            onClick={() => setReferencia((r) => sumarDias(r, -7))}
            aria-label="Semana anterior">
            <span className="material-symbols-rounded">chevron_left</span>
          </button>
          <button
            className="btn btn-icono"
            onClick={() => setReferencia((r) => sumarDias(r, 7))}
            aria-label="Semana siguiente">
            <span className="material-symbols-rounded">chevron_right</span>
          </button>
          <h2>{titulo}</h2>
          {!esEstaSemana && (
            <button className="btn btn-secundario btn-chico" onClick={() => setReferencia(new Date())}>
              Esta semana
            </button>
          )}
        </div>
      </div>

      {clases.length === 0 && (
        <p className="vacio">
          Todavía no cargaste tu horario. Marcá materias como cursando en Estado académico, tocá "Agregar al horario" o hacé
          click en un día de la grilla.
        </p>
      )}

      {fueraDeCursada && (
        <p className="vacio">
          Esta semana no hay cursada. Las materias del 1° cuatrimestre aparecen de marzo a julio y las del 2° de agosto
          a diciembre.
        </p>
      )}

      <VistaSemana
        lunes={lunes}
        clases={clasesDeLaSemana}
        eventos={eventos}
        onClase={(clase) => setEdicion({ tipo: "clase", clase, dia: clase.dia })}
        onNuevaClase={(dia) => setEdicion({ tipo: "clase", clase: null, dia })}
        onEvento={(evento) => setEdicion({ tipo: "evento", evento })}
      />

      <Modal
        abierto={edicion !== null}
        onCerrar={() => setEdicion(null)}
        titulo={edicion?.tipo === "evento" ? "Editar evento" : edicion?.clase ? "Editar horario" : "Agregar al horario"}>
        {edicion?.tipo === "evento" && (
          <EventoForm
            evento={edicion.evento}
            fechaInicial={edicion.evento.fecha}
            materias={materias}
            onGuardado={guardado}
          />
        )}
        {edicion?.tipo === "clase" && (
          <ClaseForm clase={edicion.clase} diaInicial={edicion.dia} materias={materias} onGuardado={guardado} />
        )}
      </Modal>

      <Modal abierto={sincronizando} onCerrar={() => setSincronizando(false)} titulo="Ver en Google Calendar">
        {sincronizando && <SincronizarCalendario />}
      </Modal>
    </>
  );
}

export default Horarios;
