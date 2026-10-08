import { useState } from "react";
import { toast } from "react-toastify";
import { mensajeDeError } from "../../api/client";
import type { ResumenEstudio } from "../../api/types";
import { setMetaDiaria } from "./api";
import { NOMBRE_MEDALLA, PRESETS_META, medallaDe, proximaMedalla } from "./logros";
import { formatoHoras } from "./useTemporizador";

interface Props {
  resumen: ResumenEstudio;
  // Minutos del bloque que esta corriendo y todavia no se guardo
  enCurso: number;
  corriendo: boolean;
  onMetaCambiada: (meta: number) => void;
}

const diasDelMesActual = () => {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
};

const pomodoros = (minutos: number) => {
  const cantidad = Math.ceil(minutos / 25);
  return cantidad === 1 ? "un pomodoro de 25" : `unos ${cantidad} pomodoros de 25`;
};

const horaEn = (minutos: number) =>
  new Date(Date.now() + minutos * 60_000).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

function Pildora({ titulo, minutos, objetivo }: { titulo: string; minutos: number; objetivo: number }) {
  const porcentaje = objetivo > 0 ? Math.round((minutos / objetivo) * 100) : 0;
  return (
    <div className="pildora">
      <div className="pildora__texto">
        <span>{titulo}</span>
        <span className="pildora__valor">{porcentaje}%</span>
      </div>
      <div className="pildora__barra">
        <div style={{ width: `${Math.min(100, porcentaje)}%` }} />
      </div>
      <span className="campo-ayuda">
        {formatoHoras(minutos)} de {formatoHoras(objetivo)}
      </span>
    </div>
  );
}

// Meta diaria: cuanto llevás hoy, la medalla del dia, cuanto falta para la
// proxima y como vas en la semana y el mes.
function MetaDiaria({ resumen, enCurso, corriendo, onMetaCambiada }: Props) {
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const meta = resumen.meta_diaria;
  const hoy = resumen.hoy_minutos + enCurso;
  const medalla = medallaDe(hoy, meta);
  const proxima = proximaMedalla(hoy, meta);

  const cambiarMeta = async (minutos: number) => {
    setGuardando(true);
    try {
      onMetaCambiada(await setMetaDiaria(minutos));
      setEditando(false);
      toast.success(`Tu meta ahora es de ${formatoHoras(minutos)} por día`);
    } catch (err) {
      toast.error(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="card inicio-seccion meta" aria-label="Meta diaria">
      <div className="inicio-seccion__header">
        <h2>Meta de hoy</h2>
        {editando ? (
          <select
            className="control meta__select"
            aria-label="Minutos por día"
            value={PRESETS_META.includes(meta) ? meta : ""}
            disabled={guardando}
            onChange={(e) => cambiarMeta(Number(e.target.value))}>
            {!PRESETS_META.includes(meta) && <option value="">{formatoHoras(meta)}</option>}
            {PRESETS_META.map((m) => (
              <option key={m} value={m}>
                {formatoHoras(m)} por día
              </option>
            ))}
          </select>
        ) : (
          <button type="button" className="btn btn-secundario btn-chico" onClick={() => setEditando(true)}>
            <span className="material-symbols-rounded">tune</span>
            {formatoHoras(meta)}
          </button>
        )}
      </div>

      <div className="meta__hoy">
        <span className={`medalla medalla--${medalla ?? "ninguna"}`} aria-hidden="true">
          <span className="material-symbols-rounded">{medalla ? "workspace_premium" : "flag"}</span>
        </span>
        <div>
          <p className="meta__cuanto">
            {formatoHoras(hoy)} <span className="campo-ayuda">de {formatoHoras(meta)}</span>
          </p>
          <p className="campo-ayuda">
            {medalla ? `Medalla de ${NOMBRE_MEDALLA[medalla].toLowerCase()} de hoy. ` : ""}
            {proxima
              ? `Te faltan ${formatoHoras(proxima.faltan)} para ${proxima.medalla === "bronce" ? "cumplir la meta" : `la de ${NOMBRE_MEDALLA[proxima.medalla].toLowerCase()}`}${
                  corriendo
                    ? `: si seguís, llegás a las ${horaEn(proxima.faltan)}`
                    : ` (${pomodoros(proxima.faltan)})`
                }.`
              : "Llegaste al oro, el máximo del día."}
          </p>
        </div>
      </div>

      <div className="pildoras">
        <Pildora titulo="Hoy" minutos={hoy} objetivo={meta} />
        <Pildora titulo="Semana" minutos={resumen.semana_minutos + enCurso} objetivo={meta * 7} />
        <Pildora titulo="Mes" minutos={resumen.mes_minutos + enCurso} objetivo={meta * diasDelMesActual()} />
      </div>
    </section>
  );
}

export default MetaDiaria;
