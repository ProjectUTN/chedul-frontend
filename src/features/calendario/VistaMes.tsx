import { academicasDelDia, aISO, DIAS_CORTOS, diasDelMes, esDiaSinClases, nombreTipo } from "./fechas";
import type { Evento, FechaAcademica } from "../../api/types";

interface Props {
  anio: number;
  mes: number;
  eventos: Evento[];
  // Calendario de la facultad: mesas, feriados, inicio y fin de cuatrimestre
  academicas: FechaAcademica[];
  seleccionado: string;
  onSeleccionar: (iso: string) => void;
  onEditar: (evento: Evento) => void;
}

const MAX_POR_DIA = 3;

function VistaMes({ anio, mes, eventos, academicas, seleccionado, onSeleccionar, onEditar }: Props) {
  const hoy = aISO(new Date());

  const porDia = new Map<string, Evento[]>();
  for (const evento of eventos) {
    const lista = porDia.get(evento.fecha) ?? [];
    lista.push(evento);
    porDia.set(evento.fecha, lista);
  }

  return (
    <div className="mes" role="grid" aria-label="Calendario del mes">
      <div className="mes__semana mes__encabezado" role="row">
        {DIAS_CORTOS.map((dia) => (
          <span key={dia} role="columnheader">
            {dia}
          </span>
        ))}
      </div>

      <div className="mes__dias">
        {diasDelMes(anio, mes).map((fecha) => {
          const iso = aISO(fecha);
          const delDia = porDia.get(iso) ?? [];
          const deLaFacultad = academicasDelDia(academicas, iso);
          const lugar = Math.max(0, MAX_POR_DIA - deLaFacultad.length);
          const clases = ["mes__dia"];
          if (esDiaSinClases(deLaFacultad)) clases.push("mes__dia--sin-clases");
          if (fecha.getMonth() !== mes) clases.push("mes__dia--afuera");
          if (iso === hoy) clases.push("mes__dia--hoy");
          if (iso === seleccionado) clases.push("mes__dia--seleccionado");

          return (
            <div
              key={iso}
              role="gridcell"
              tabIndex={0}
              aria-selected={iso === seleccionado}
              aria-label={`${fecha.getDate()}, ${[...deLaFacultad.map((f) => f.titulo), `${delDia.length} eventos`].join(", ")}`}
              className={clases.join(" ")}
              onClick={() => onSeleccionar(iso)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSeleccionar(iso);
                }
              }}>
              <span className="mes__numero">{fecha.getDate()}</span>

              <div className="mes__eventos">
                {deLaFacultad.map((f) => (
                  <span key={f.id} className={`evento-chip evento-chip--facultad academica--${f.tipo}`} title={f.titulo}>
                    {f.titulo}
                  </span>
                ))}
                {delDia.slice(0, lugar).map((evento) => (
                  <button
                    key={evento.id}
                    type="button"
                    className={`evento-chip evento--${evento.tipo}`}
                    title={`${nombreTipo(evento.tipo)}: ${evento.titulo}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditar(evento);
                    }}>
                    {evento.hora && <b>{evento.hora}</b>} {evento.titulo}
                  </button>
                ))}
                {delDia.length > lugar && <span className="mes__mas">+{delDia.length - lugar} más</span>}
              </div>

              {/* En celular las celdas son chicas: solo puntos de color */}
              <div className="mes__puntos" aria-hidden="true">
                {deLaFacultad.slice(0, 2).map((f) => (
                  <span key={`f${f.id}`} className={`evento-punto academica--${f.tipo}`} />
                ))}
                {delDia.slice(0, 4 - Math.min(2, deLaFacultad.length)).map((evento) => (
                  <span key={evento.id} className={`evento-punto evento--${evento.tipo}`} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VistaMes;
