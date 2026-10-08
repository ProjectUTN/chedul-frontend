import type { ResumenEstudio } from "../../api/types";
import { desdeISO } from "../calendario/fechas";
import { cotizacion } from "./logros";
import { formatoHoras } from "./useTemporizador";

interface Props {
  resumen: ResumenEstudio;
}

const ANCHO = 300;
const ALTO = 110;

const conSigno = (minutos: number) => `${minutos >= 0 ? "+" : "−"}${formatoHoras(Math.abs(minutos))}`;

// Cotizacion de los ultimos 30 dias: cada dia suma lo que estudiaste por
// encima de tu meta y resta lo que te falto.
function Cotizacion({ resumen }: Props) {
  const puntos = cotizacion(resumen.por_dia, resumen.meta_diaria);

  if (puntos.length < 2) {
    return (
      <section className="card inicio-seccion">
        <div className="inicio-seccion__header">
          <h2>Tu cotización</h2>
        </div>
        <p className="campo-ayuda">
          Sube los días que pasás tu meta y baja los que no llegás. Estudiá un par de días para ver el gráfico.
        </p>
      </section>
    );
  }

  const valores = puntos.map((p) => p.valor);
  const max = Math.max(0, ...valores);
  const min = Math.min(0, ...valores);
  const rango = max - min || 1;
  const x = (i: number) => (i / (puntos.length - 1)) * ANCHO;
  const y = (v: number) => ALTO - ((v - min) / rango) * ALTO;
  const linea = puntos.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.valor).toFixed(1)}`).join(" ");
  const area = `${linea} L${ANCHO},${y(0).toFixed(1)} L0,${y(0).toFixed(1)} Z`;

  const actual = puntos[puntos.length - 1];
  const ayer = puntos[puntos.length - 2];
  const sube = actual.valor >= 0;
  const variacion = actual.valor - ayer.valor;
  const desde = desdeISO(puntos[0].fecha);

  return (
    <section className={`card inicio-seccion cotizacion ${sube ? "cotizacion--sube" : "cotizacion--baja"}`}>
      <div className="inicio-seccion__header">
        <h2>Tu cotización</h2>
        <span className="cotizacion__valor">{conSigno(actual.valor)}</span>
      </div>
      <p className="campo-ayuda">
        Hoy {variacion >= 0 ? "sube" : "baja"} {formatoHoras(Math.abs(variacion))}. Suma lo que pasás tu meta y resta lo
        que te falta, desde el {desde.getDate()}/{desde.getMonth() + 1}.
      </p>
      <svg
        className="cotizacion__grafico"
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Cotización actual ${conSigno(actual.valor)}`}>
        <path className="cotizacion__area" d={area} />
        <line className="cotizacion__cero" x1="0" x2={ANCHO} y1={y(0)} y2={y(0)} />
        <path className="cotizacion__linea" d={linea} />
      </svg>
    </section>
  );
}

export default Cotizacion;
