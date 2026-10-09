import { isAxiosError } from "axios";
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

const cuando = (fecha: Date) =>
  Number.isNaN(fecha.getTime())
    ? "–"
    : fecha.toLocaleString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      });

// Si el servidor todavia no manda el inicio, es el fin menos lo que duro
const inicioDe = (sesion: SesionEstudio) =>
  sesion.inicio ? new Date(sesion.inicio) : new Date(new Date(sesion.fin).getTime() - sesion.minutos * 60_000);

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
      // Echo contesta "Not Found" cuando la ruta no existe (servidor viejo);
      // si la ruta existe, el mensaje es el del propio servidor
      const rutaInexistente = isAxiosError(err) && err.response?.status === 404 && err.response.data?.msg === "Not Found";
      toast.error(
        rutaInexistente
          ? "El servidor todavía no se actualizó para editar sesiones. Probá en unos minutos."
          : `${mensajeDeError(err, "No se pudo cambiar la materia")}${isAxiosError(err) && err.response ? ` (${err.response.status})` : ""}`
      );
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
          <dd>{cuando(inicioDe(sesion))}</dd>
        </div>
        <div>
          <dt>Terminó</dt>
          <dd>{cuando(new Date(sesion.fin))}</dd>
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
