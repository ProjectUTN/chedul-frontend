import { useCallback, useEffect, useState } from "react";
import CondicionEnMaterias from "../features/estado_academico/CondicionEnMaterias";
import YearSelector from "../features/estado_academico/YearSelector";
import {
  getCondiciones,
  getMaterias,
  getMisCondiciones,
} from "../features/estado_academico/api";
import { useAuth } from "../context/authProvider";
import { mensajeDeError } from "../api/client";
import type { Condicion, CondicionPorAlumno, Materia } from "../api/types";
import "../styles.css";

function Estado() {
  const { user } = useAuth();
  const [nivel, setNivel] = useState(1);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [condiciones, setCondiciones] = useState<Condicion[]>([]);
  const [misCondiciones, setMisCondiciones] = useState<CondicionPorAlumno[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const recargarMisCondiciones = useCallback(() => {
    getMisCondiciones()
      .then(setMisCondiciones)
      .catch((err) => setError(mensajeDeError(err)));
  }, []);

  useEffect(() => {
    if (!user) return;

    Promise.all([getMaterias(user.carrera), getCondiciones(), getMisCondiciones()])
      .then(([materias, condiciones, mis]) => {
        setMaterias(materias);
        setCondiciones(condiciones);
        setMisCondiciones(mis);
      })
      .catch((err) => setError(mensajeDeError(err, "No se pudo cargar tu estado académico")))
      .finally(() => setCargando(false));
  }, [user]);

  const materiasDelNivel = materias
    .filter((m) => m.nivel === nivel)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const aprobadas = misCondiciones.filter((c) => c.condicion === "Aprobada").length;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Estado académico</h1>
          <p>
            Llevá registro de tu progreso, así podés ver tus estadísticas y qué
            materias podés cursar en Inicio.
          </p>
        </div>
        {!cargando && (
          <span className="chip chip-azul">
            {aprobadas} de {materias.length} aprobadas
          </span>
        )}
      </div>

      <YearSelector nivelActual={nivel} onChange={setNivel} />

      {error && <p className="form-error">{error}</p>}

      {cargando ? (
        <p className="vacio">Cargando materias...</p>
      ) : (
        <CondicionEnMaterias
          materias={materiasDelNivel}
          condiciones={condiciones}
          misCondiciones={misCondiciones}
          onCambio={recargarMisCondiciones}
        />
      )}
    </>
  );
}

export default Estado;
