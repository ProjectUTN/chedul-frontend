import { aISO, colorDeMateria, DIAS, DIAS_CORTOS, minutos, sumarDias } from "./fechas";
import type { Clase, Evento } from "../../api/types";

interface Props {
  lunes: Date;
  clases: Clase[];
  eventos: Evento[];
  onClase: (clase: Clase) => void;
  onNuevaClase: (dia: number) => void;
  onEvento: (evento: Evento) => void;
}

const PX_POR_HORA = 52;
const DURACION_EVENTO = 45; // minutos que ocupa un evento con hora en la grilla

function VistaSemana({ lunes, clases, eventos, onClase, onNuevaClase, onEvento }: Props) {
  const hoy = aISO(new Date());
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));

  // El domingo se muestra solo si hay algo ese dia
  const domingo = aISO(dias[6]);
  const conDomingo = clases.some((c) => c.dia === 7) || eventos.some((e) => e.fecha === domingo);
  const visibles = conDomingo ? dias : dias.slice(0, 6);

  // Rango de horas: de 8 a 23 como minimo, ampliado si hay algo antes o despues
  const horas = [
    ...clases.flatMap((c) => [minutos(c.hora_inicio), minutos(c.hora_fin)]),
    ...eventos.filter((e) => e.hora).map((e) => minutos(e.hora!)),
  ];
  const desde = Math.floor(Math.min(8 * 60, ...horas) / 60);
  const hasta = Math.min(24, Math.ceil(Math.max(23 * 60, ...horas.map((m) => m + DURACION_EVENTO)) / 60));
  const filas = Array.from({ length: hasta - desde }, (_, i) => desde + i);

  const top = (min: number) => ((min - desde * 60) / 60) * PX_POR_HORA;

  return (
    <>
      {/* Celular: lista por dia, la grilla no entra */}
      <ol className="semana-agenda">
        {visibles.map((fecha, i) => {
          const dia = i + 1;
          const iso = aISO(fecha);
          const delDia = [
            ...clases
              .filter((c) => c.dia === dia)
              .map((c) => ({ hora: c.hora_inicio, clase: c, evento: undefined })),
            ...eventos
              .filter((e) => e.fecha === iso)
              .map((e) => ({ hora: e.hora ?? "", clase: undefined, evento: e })),
          ].sort((a, b) => a.hora.localeCompare(b.hora));

          return (
            <li key={iso} className={`agenda-dia${iso === hoy ? " agenda-dia--hoy" : ""}`}>
              <div className="agenda-dia__fecha">
                <span>{DIAS_CORTOS[i]}</span>
                <strong>{fecha.getDate()}</strong>
              </div>
              <div className="agenda-dia__items">
                {delDia.length === 0 && <span className="agenda-dia__libre">Libre</span>}
                {delDia.map(({ clase, evento }) =>
                  clase ? (
                    <button
                      key={`c${clase.id}`}
                      type="button"
                      className="agenda-item"
                      style={{ borderLeftColor: colorDeMateria(clase.materia?.id) }}
                      onClick={() => onClase(clase)}>
                      <span className="agenda-item__hora">
                        {clase.hora_inicio} a {clase.hora_fin}
                      </span>
                      <strong>{clase.titulo}</strong>
                      {clase.aula && <span className="agenda-item__extra">{clase.aula}</span>}
                    </button>
                  ) : (
                    evento && (
                      <button
                        key={`e${evento.id}`}
                        type="button"
                        className={`agenda-item agenda-item--evento evento--${evento.tipo}`}
                        onClick={() => onEvento(evento)}>
                        <span className="agenda-item__hora">{evento.hora ?? "Todo el día"}</span>
                        <strong>{evento.titulo}</strong>
                      </button>
                    )
                  ),
                )}
                <button
                  type="button"
                  className="agenda-dia__agregar"
                  onClick={() => onNuevaClase(dia)}
                  aria-label={`Agregar clase el ${DIAS[i].toLowerCase()}`}>
                  <span className="material-symbols-rounded">add</span>
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="semana-scroll">
        <div
          className="semana"
          style={{ gridTemplateColumns: `3.25rem repeat(${visibles.length}, minmax(7.5rem, 1fr))` }}>
          {/* Encabezados con los eventos sin hora */}
          <div className="semana__esquina" />
          {visibles.map((fecha, i) => {
            const iso = aISO(fecha);
            const todoElDia = eventos.filter((e) => e.fecha === iso && !e.hora);
            return (
              <div key={iso} className={`semana__cabecera${iso === hoy ? " semana__cabecera--hoy" : ""}`}>
                <span className="semana__dia">{DIAS_CORTOS[i]}</span>
                <span className="semana__fecha">{fecha.getDate()}</span>
                {todoElDia.map((evento) => (
                  <button
                    key={evento.id}
                    type="button"
                    className={`evento-chip evento--${evento.tipo}`}
                    onClick={() => onEvento(evento)}>
                    {evento.titulo}
                  </button>
                ))}
              </div>
            );
          })}

          {/* Columna de horas */}
          <div className="semana__horas" style={{ height: filas.length * PX_POR_HORA }}>
            {filas.map((h) => (
              <span key={h} style={{ top: top(h * 60) }}>
                {String(h).padStart(2, "0")}:00
              </span>
            ))}
          </div>

          {visibles.map((fecha, i) => {
            const dia = i + 1;
            const iso = aISO(fecha);
            return (
              <div
                key={iso}
                className={`semana__columna${iso === hoy ? " semana__columna--hoy" : ""}`}
                style={{ height: filas.length * PX_POR_HORA, backgroundSize: `100% ${PX_POR_HORA}px` }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) onNuevaClase(dia);
                }}
                title="Click para agregar una clase">
                {clases
                  .filter((c) => c.dia === dia)
                  .map((clase) => {
                    const inicio = minutos(clase.hora_inicio);
                    const color = colorDeMateria(clase.materia?.id);
                    return (
                      <button
                        key={clase.id}
                        type="button"
                        className="bloque-clase"
                        style={{
                          top: top(inicio),
                          height: Math.max(24, top(minutos(clase.hora_fin)) - top(inicio)),
                          borderLeftColor: color,
                          backgroundColor: `${color}26`,
                        }}
                        onClick={() => onClase(clase)}>
                        <strong>{clase.titulo}</strong>
                        <span>
                          {clase.hora_inicio} a {clase.hora_fin}
                        </span>
                        {clase.aula && <span>{clase.aula}</span>}
                      </button>
                    );
                  })}

                {eventos
                  .filter((e) => e.fecha === iso && e.hora)
                  .map((evento) => (
                    <button
                      key={evento.id}
                      type="button"
                      className={`bloque-evento evento--${evento.tipo}`}
                      style={{ top: top(minutos(evento.hora!)) }}
                      onClick={() => onEvento(evento)}>
                      <b>{evento.hora}</b> {evento.titulo}
                    </button>
                  ))}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default VistaSemana;
