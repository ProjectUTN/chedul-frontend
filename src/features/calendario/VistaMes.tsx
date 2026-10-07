import { aISO, DIAS_CORTOS, diasDelMes, nombreTipo } from "./fechas";
import type { Evento } from "../../api/types";

interface Props {
  anio: number;
  mes: number;
  eventos: Evento[];
  seleccionado: string;
  onSeleccionar: (iso: string) => void;
  onEditar: (evento: Evento) => void;
}

const MAX_POR_DIA = 3;

function VistaMes({ anio, mes, eventos, seleccionado, onSeleccionar, onEditar }: Props) {
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
          const clases = ["mes__dia"];
          if (fecha.getMonth() !== mes) clases.push("mes__dia--afuera");
          if (iso === hoy) clases.push("mes__dia--hoy");
          if (iso === seleccionado) clases.push("mes__dia--seleccionado");

          return (
            <div
              key={iso}
              role="gridcell"
              tabIndex={0}
              aria-selected={iso === seleccionado}
              aria-label={`${fecha.getDate()}, ${delDia.length} eventos`}
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
                {delDia.slice(0, MAX_POR_DIA).map((evento) => (
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
                {delDia.length > MAX_POR_DIA && (
                  <span className="mes__mas">+{delDia.length - MAX_POR_DIA} más</span>
                )}
              </div>

              {/* En celular las celdas son chicas: solo puntos de color */}
              <div className="mes__puntos" aria-hidden="true">
                {delDia.slice(0, 4).map((evento) => (
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
