import { useEffect, useRef } from "react";
import type { ResumenEstudio } from "../../api/types";
import { DIAS_CORTOS, MESES, desdeISO, diaSemana } from "../calendario/fechas";
import { NOMBRE_MEDALLA, medallaDe, nivelDelDia } from "./logros";
import { formatoHoras } from "./useTemporizador";

interface Props {
  resumen: ResumenEstudio;
}

interface Celda {
  fecha: string;
  minutos: number;
}

// Calendario de actividad de las ultimas 26 semanas: una columna por semana
// (de lunes a domingo) y el color segun cuanto de la meta cumpliste.
function CalendarioActividad({ resumen }: Props) {
  const meta = resumen.meta_diaria;
  const dias = resumen.por_dia;
  const grilla = useRef<HTMLDivElement>(null);

  // En el celular no entra todo: arranca mostrando lo mas reciente
  useEffect(() => {
    const el = grilla.current;
    if (!el) return;
    const alFinal = () => {
      el.scrollLeft = el.scrollWidth;
    };
    alFinal();
    // El ancho real se sabe recien cuando terminan de cargar estilos y fuentes
    const observador = new ResizeObserver(alFinal);
    observador.observe(el);
    return () => observador.disconnect();
  }, [dias.length]);

  if (dias.length === 0) return null;

  // La primera columna arranca en lunes; los dias de antes quedan vacios
  const relleno = diaSemana(desdeISO(dias[0].fecha)) - 1;
  const celdas: (Celda | null)[] = [...Array(relleno).fill(null), ...dias];
  const semanas: (Celda | null)[][] = [];
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7));

  const medallas = { bronce: 0, plata: 0, oro: 0 };
  for (const d of dias) {
    const m = medallaDe(d.minutos, meta);
    if (m) medallas[m]++;
  }
  const diasEstudiados = dias.filter((d) => d.minutos > 0).length;

  // El nombre del mes va en la semana donde empieza
  const mesDe = (semana: (Celda | null)[], i: number) => {
    const primero = semana.find(Boolean);
    if (!primero) return "";
    const mes = desdeISO(primero.fecha).getMonth();
    const anterior = semanas[i - 1]?.find(Boolean);
    return !anterior || desdeISO(anterior.fecha).getMonth() !== mes ? MESES[mes].slice(0, 3) : "";
  };

  return (
    <section className="card inicio-seccion estudio-ancho">
      <div className="inicio-seccion__header">
        <h2>Calendario de actividad</h2>
      </div>
      <p className="campo-ayuda">
        {diasEstudiados} {diasEstudiados === 1 ? "día" : "días"} con estudio en los últimos 6 meses
      </p>

      <div ref={grilla} className="actividad" role="img" aria-label="Minutos estudiados por día en los últimos 6 meses">
        <div className="actividad__dias" aria-hidden="true">
          {DIAS_CORTOS.map((d, i) => (
            <span key={d}>{i % 2 === 0 ? d : ""}</span>
          ))}
        </div>
        <div className="actividad__grilla">
          {semanas.map((semana, i) => (
            <div key={i} className="actividad__semana">
              <span className="actividad__mes" aria-hidden="true">
                {mesDe(semana, i)}
              </span>
              {semana.map((celda, j) =>
                celda ? (
                  <span
                    key={celda.fecha}
                    className={`actividad__dia actividad__dia--${nivelDelDia(celda.minutos, meta)}`}
                    title={`${desdeISO(celda.fecha).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })}: ${formatoHoras(celda.minutos)}`}
                  />
                ) : (
                  <span key={`vacio-${j}`} className="actividad__dia actividad__dia--vacio" />
                )
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="actividad__pie">
        <div className="actividad__leyenda" aria-hidden="true">
          <span>Menos</span>
          {[0, 1, 2, 3, 4].map((n) => (
            <span key={n} className={`actividad__dia actividad__dia--${n}`} />
          ))}
          <span>Más</span>
        </div>
        <ul className="medallas-conteo" aria-label="Medallas de los últimos 6 meses">
          {(Object.keys(medallas) as (keyof typeof medallas)[]).map((m) => (
            <li key={m} title={`Medallas de ${NOMBRE_MEDALLA[m].toLowerCase()}`}>
              <span className={`medalla medalla--chica medalla--${m}`} aria-hidden="true">
                <span className="material-symbols-rounded">workspace_premium</span>
              </span>
              {medallas[m]} <span className="campo-ayuda">{NOMBRE_MEDALLA[m].toLowerCase()}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default CalendarioActividad;
