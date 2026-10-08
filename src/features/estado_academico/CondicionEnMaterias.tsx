import { useState } from "react";
import { toast } from "react-toastify";
import "./condicionEnMaterias.css";
import { mensajeDeError } from "../../api/client";
import type { Condicion, CondicionPorAlumno, Materia } from "../../api/types";
import { borrarCondicion, setCondicion } from "./api";
import { alCambiarEstado } from "../calendario/horarioAutomatico";
import { NOTAS_APROBADA, NO_ME_INTERESA, condicionesPara } from "./condiciones";

const PENDIENTE = "Pendiente";

// Texto corto para que los estados entren en una fila en el celular
const CORTO: Record<string, string> = {
  Regularizada: "Regular",
};

// En el celular "No me interesa" no entra con los otros cuatro
const MUY_CORTO: Record<string, string> = {
  [NO_ME_INTERESA]: "Paso",
};

const claseEstado = (estado: string) =>
  `estado--${estado.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-")}`;

interface CondicionEnMateriasProps {
  materias: Materia[];
  condiciones: Condicion[];
  misCondiciones: CondicionPorAlumno[];
  onCambio: () => void;
}

function CondicionEnMaterias({ materias, condiciones, misCondiciones, onCambio }: CondicionEnMateriasProps) {
  const [guardando, setGuardando] = useState<number | null>(null);

  const estadosPara = (materia: Materia) => [
    PENDIENTE,
    ...condicionesPara(materia, condiciones).map((c) => c.condicion),
  ];

  const condicionDe = (materiaId: number) => misCondiciones.find((c) => c.materia_id === materiaId);

  const estadoDe = (materiaId: number) => condicionDe(materiaId)?.condicion ?? PENDIENTE;

  const guardar = async (materiaId: number, estado: string, nota: number | null) => {
    const anterior = estadoDe(materiaId);
    setGuardando(materiaId);
    try {
      if (estado === PENDIENTE) {
        await borrarCondicion(materiaId);
      } else {
        const condicion = condiciones.find((c) => c.condicion === estado);
        if (!condicion) return;
        await setCondicion(materiaId, condicion.id, estado === "Aprobada" ? nota : null);
      }
      onCambio();
      const materia = materias.find((m) => m.id === materiaId);
      if (materia) await alCambiarEstado(materia, anterior, estado);
    } catch (err) {
      toast.error(mensajeDeError(err, "No se pudo guardar el estado"));
    } finally {
      setGuardando(null);
    }
  };

  const cambiarEstado = (materiaId: number, nuevoEstado: string) => {
    if (nuevoEstado === estadoDe(materiaId)) return;
    guardar(materiaId, nuevoEstado, condicionDe(materiaId)?.nota ?? null);
  };

  const cambiarNota = (materiaId: number, valor: string) => {
    const nota = valor === "" ? null : Number(valor);
    guardar(materiaId, "Aprobada", nota);
  };

  if (materias.length === 0) {
    return <p className="vacio">No hay materias cargadas para este año.</p>;
  }

  return (
    <ul className="lista-estado">
      {materias.map((materia) => {
        const estado = estadoDe(materia.id);
        const estados = estadosPara(materia);
        const ocupado = guardando === materia.id;

        return (
          <li key={materia.id} className={`materia-fila ${claseEstado(estado)}`} aria-busy={ocupado}>
            <div className="materia-fila__info">
              <div className="materia-fila__titulo">
                <h3>{materia.nombre}</h3>
                {materia.programa && (
                  <a
                    className="materia-fila__programa"
                    href={materia.programa}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Ver programa">
                    <span className="material-symbols-rounded">description</span>
                  </a>
                )}
              </div>
              <p className="materia-fila__meta">
                {[materia.cuatrimestre, materia.tipo, materia.carga_horaria && `${materia.carga_horaria} hs/sem`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {materia.correlativas.length > 0 && (
                <p className="materia-fila__correlativas">
                  <span className="material-symbols-rounded">link</span>
                  {materia.correlativas
                    .map((c) => `${c.nombre} (${c.tipo === "aprobada" ? "aprobada" : "regular"})`)
                    .join(", ")}
                </p>
              )}
            </div>

            <div className="materia-fila__acciones">
              <div className="estado-opciones" role="radiogroup" aria-label={`Estado de ${materia.nombre}`}>
                {estados.map((opcion) => (
                  <button
                    key={opcion}
                    type="button"
                    role="radio"
                    aria-checked={estado === opcion}
                    className={`estado-opcion ${claseEstado(opcion)}`}
                    disabled={ocupado}
                    title={MUY_CORTO[opcion] ? opcion : undefined}
                    onClick={() => cambiarEstado(materia.id, opcion)}>
                    {MUY_CORTO[opcion] ? (
                      <>
                        <span className="estado-opcion__largo">{opcion}</span>
                        <span className="estado-opcion__corto" aria-hidden="true">
                          {MUY_CORTO[opcion]}
                        </span>
                      </>
                    ) : (
                      (CORTO[opcion] ?? opcion)
                    )}
                  </button>
                ))}
              </div>

              {estado === "Aprobada" && (
                <label className="nota">
                  <span>Nota</span>
                  <select
                    className="control"
                    aria-label={`Nota de ${materia.nombre}`}
                    value={condicionDe(materia.id)?.nota ?? ""}
                    disabled={ocupado}
                    onChange={(e) => cambiarNota(materia.id, e.target.value)}>
                    <option value="">–</option>
                    {NOTAS_APROBADA.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default CondicionEnMaterias;
