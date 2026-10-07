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

// Reparte las clases de un dia en carriles para que las que se pisan queden
// una al lado de la otra. Devuelve, por clase, su carril y cuantos carriles
// tiene su grupo de clases superpuestas.
const repartirEnCarriles = (clases: Clase[]) => {
  const ordenadas = [...clases].sort((a, b) => minutos(a.hora_inicio) - minutos(b.hora_inicio));
  const resultado = new Map<number, { carril: number; carriles: number }>();
  let grupo: Clase[] = [];
  let finDeCarriles: number[] = [];
  let finDelGrupo = -1;

  const cerrarGrupo = () => {
    for (const c of grupo) resultado.get(c.id)!.carriles = finDeCarriles.length;
    grupo = [];
    finDeCarriles = [];
  };

  for (const clase of ordenadas) {
    const inicio = minutos(clase.hora_inicio);
    const fin = minutos(clase.hora_fin);
    if (inicio >= finDelGrupo) cerrarGrupo();
    let carril = finDeCarriles.findIndex((f) => f <= inicio);
    if (carril === -1) carril = finDeCarriles.length;
    finDeCarriles[carril] = fin;
    finDelGrupo = Math.max(finDelGrupo, fin);
    grupo.push(clase);
    resultado.set(clase.id, { carril, carriles: 1 });
  }
  cerrarGrupo();
  return resultado;
};

function VistaSemana({ lunes, clases, eventos, onClase, onNuevaClase, onEvento }: Props) {
  const hoy = aISO(new Date());
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));

  // El domingo se muestra solo si hay algo ese dia
  const domingo = aISO(dias[6]);
  const conDomingo = clases.some((c) => c.dia === 7) || eventos.some((e) => e.fecha === domingo);
  const visibles = conDomingo ? dias : dias.slice(0, 6);

  // Rango de horas: se ajusta a lo que hay cargado (una hora de margen) para
  // no mostrar media grilla vacia; sin nada, de 8 a 22
  const horas = [
    ...clases.flatMap((c) => [minutos(c.hora_inicio), minutos(c.hora_fin)]),
    ...eventos.filter((e) => e.hora).map((e) => minutos(e.hora!) + DURACION_EVENTO),
  ];
  const desde = horas.length > 0 ? Math.max(0, Math.floor(Math.min(...horas) / 60) - 1) : 8;
  const hasta = horas.length > 0 ? Math.min(24, Math.ceil(Math.max(...horas) / 60) + 1) : 22;
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
              .map((c) => ({
                hora: c.hora_inicio,
                clase: c,
                evento: undefined,
              })),
            ...eventos
              .filter((e) => e.fecha === iso)
              .map((e) => ({
                hora: e.hora ?? "",
                clase: undefined,
                evento: e,
              })),
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
                      style={{
                        borderLeftColor: colorDeMateria(clase.materia?.id),
                      }}
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
          style={{
            gridTemplateColumns: `3.25rem repeat(${visibles.length}, minmax(7.5rem, 1fr))`,
          }}>
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
            const delDia = clases.filter((c) => c.dia === dia);
            const carriles = repartirEnCarriles(delDia);
            return (
              <div
                key={iso}
                className={`semana__columna${iso === hoy ? " semana__columna--hoy" : ""}`}
                style={{
                  height: filas.length * PX_POR_HORA,
                  backgroundSize: `100% ${PX_POR_HORA}px`,
                }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) onNuevaClase(dia);
                }}
                title="Click para agregar una clase">
                {delDia.map((clase) => {
                  const inicio = minutos(clase.hora_inicio);
                  const color = colorDeMateria(clase.materia?.id);
                  const { carril, carriles: total } = carriles.get(clase.id)!;
                  const ancho = 100 / total;
                  return (
                    <button
                      key={clase.id}
                      type="button"
                      className="bloque-clase"
                      style={{
                        top: top(inicio),
                        height: Math.max(24, top(minutos(clase.hora_fin)) - top(inicio)),
                        left: `calc(${carril * ancho}% + 0.25rem)`,
                        width: `calc(${ancho}% - 0.5rem)`,
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
                      style={{
                        // Los de ultima hora (23:59) se suben para que entren en la grilla
                        top: top(Math.min(minutos(evento.hora!), hasta * 60 - DURACION_EVENTO)),
                      }}
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
