import { useState } from "react";
import { toast } from "react-toastify";
import SelectorMateria from "../../components/SelectorMateria";
import { mensajeDeError } from "../../api/client";
import type { Materia, SesionEstudio } from "../../api/types";
import { editarMateriaSesion } from "./api";
import { formatoHoras } from "./useTemporizador";

interface Props {
  sesion: SesionEstudio;
  materias: Materia[];
  onGuardada: (sesion: SesionEstudio) => void;
}

const cuando = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

// Detalle de una sesion de estudio: cuando empezo y termino y cuanto duro son
// fijos; lo unico que se puede corregir es la materia.
function DetalleSesion({ sesion, materias, onGuardada }: Props) {
  const [materiaId, setMateriaId] = useState(sesion.materia?.id ?? 0);
  const [guardando, setGuardando] = useState(false);
  const cambio = materiaId !== (sesion.materia?.id ?? 0);

  const guardar = async () => {
    setGuardando(true);
    try {
      const actualizada = await editarMateriaSesion(sesion.id, materiaId);
      toast.success("Cambiamos la materia de la sesión");
      onGuardada(actualizada);
    } catch (err) {
      toast.error(mensajeDeError(err, "No se pudo cambiar la materia"));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="form detalle-sesion">
      <dl className="detalle-sesion__datos">
        <div>
          <dt>Tipo</dt>
          <dd>{sesion.modo === "pomodoro" ? "Pomodoro" : "Cronómetro"}</dd>
        </div>
        <div>
          <dt>Empezó</dt>
          <dd>{cuando(sesion.inicio)}</dd>
        </div>
        <div>
          <dt>Terminó</dt>
          <dd>{cuando(sesion.fin)}</dd>
        </div>
        <div>
          <dt>Duración</dt>
          <dd>{formatoHoras(sesion.minutos)}</dd>
        </div>
      </dl>

      <label className="campo">
        <span>Materia</span>
        <SelectorMateria materias={materias} value={materiaId} onChange={setMateriaId} opcionVacia="Sin materia" />
      </label>

      <button type="button" className="btn btn-primario" disabled={!cambio || guardando} onClick={guardar}>
        {guardando ? "Guardando..." : "Guardar"}
      </button>
    </div>
  );
}

export default DetalleSesion;
