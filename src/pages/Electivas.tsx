import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CalculadoraElectivas from "../features/estado_academico/CalculadoraElectivas";
import { getMaterias, getMisCondiciones } from "../features/estado_academico/api";
import { useAuth } from "../context/authProvider";
import { mensajeDeError } from "../api/client";
import "../features/herramientas/herramientas.css";
import type { CondicionPorAlumno, Materia } from "../api/types";

function Electivas() {
  const { user } = useAuth();
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [misCondiciones, setMisCondiciones] = useState<CondicionPorAlumno[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.all([getMaterias(user.carrera), getMisCondiciones()])
      .then(([materias, mis]) => {
        setMaterias(materias);
        setMisCondiciones(mis);
      })
      .catch((err) => setError(mensajeDeError(err, "No se pudo cargar tu estado académico")));
  }, [user]);

  return (
    <>
      <div className="page-header">
        <div>
          <Link to="/herramientas" className="volver">
            <span className="material-symbols-rounded">arrow_back</span>
            Herramientas
          </Link>
          <h1>Electivas</h1>
          <p>
            Cuántas horas de electivas llevás. Se calcula con las que marcaste aprobadas en{" "}
            <Link to="/estado">Estado académico</Link>.
          </p>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <CalculadoraElectivas materias={materias} misCondiciones={misCondiciones} />
    </>
  );
}

export default Electivas;
