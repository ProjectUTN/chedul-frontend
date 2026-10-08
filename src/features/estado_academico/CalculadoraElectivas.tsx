import type { CondicionPorAlumno, Materia } from "../../api/types";
import "./calculadoraElectivas.css";

// Horas semanales de electivas que pide el plan de ISI para recibirse
export const HORAS_ELECTIVAS = 20;

interface Props {
  materias: Materia[];
  misCondiciones: CondicionPorAlumno[];
}

// Suma la carga horaria semanal de las electivas aprobadas contra las que
// pide el plan. Las regularizadas o en curso se muestran aparte, como
// "en camino", porque todavia no cuentan.
function CalculadoraElectivas({ materias, misCondiciones }: Props) {
  const electivas = materias.filter((m) => m.tipo === "Electiva");
  if (electivas.length === 0) return null;

  const condicion = (m: Materia) => misCondiciones.find((c) => c.materia_id === m.id)?.condicion;
  const aprobadas = electivas.filter((m) => condicion(m) === "Aprobada");
  const enCamino = electivas.filter((m) => condicion(m) === "Regularizada" || condicion(m) === "Cursando");

  const horas = (lista: Materia[]) => lista.reduce((total, m) => total + m.carga_horaria, 0);
  const hechas = horas(aprobadas);
  const enProceso = horas(enCamino);
  const faltan = Math.max(0, HORAS_ELECTIVAS - hechas);
  const porcentaje = (h: number) => `${Math.min(100, (h / HORAS_ELECTIVAS) * 100)}%`;

  return (
    <section className="card electivas" aria-label="Calculadora de electivas">
      <div className="electivas__titulo">
        <h2>Electivas</h2>
        <span className={`chip ${faltan === 0 ? "electivas__chip--listo" : ""}`}>
          {hechas} de {HORAS_ELECTIVAS} h semanales
        </span>
      </div>

      <div className="electivas__barra" role="progressbar" aria-valuenow={hechas} aria-valuemin={0} aria-valuemax={HORAS_ELECTIVAS}>
        <div className="electivas__hechas" style={{ width: porcentaje(hechas) }} />
        <div className="electivas__proceso" style={{ width: porcentaje(Math.min(enProceso, faltan)) }} />
      </div>

      <p className="campo-ayuda">
        {faltan === 0
          ? "Ya tenés todas las horas de electivas que pide el plan."
          : enProceso > 0
            ? `Te faltan ${faltan} h. Con las que estás cursando o tenés regulares sumarías ${Math.min(HORAS_ELECTIVAS, hechas + enProceso)} h.`
            : `Te faltan ${faltan} h: por ejemplo ${Math.ceil(faltan / 3)} electivas de 3 h.`}
      </p>

      {(aprobadas.length > 0 || enCamino.length > 0) && (
        <ul className="electivas__lista">
          {[...aprobadas, ...enCamino].map((m) => (
            <li key={m.id}>
              <span className={`chip ${condicion(m) === "Aprobada" ? "electivas__chip--listo" : ""}`}>
                {condicion(m) === "Aprobada" ? "Aprobada" : condicion(m)}
              </span>
              <span>{m.nombre}</span>
              <span className="campo-ayuda electivas__horas">{m.carga_horaria} h</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default CalculadoraElectivas;
