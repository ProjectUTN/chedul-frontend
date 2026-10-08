import { useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import SelectorMateria from "../../components/SelectorMateria";
import { erroresDeCampo, mensajeDeError, type ErroresCampo } from "../../api/client";
import type { Comunidad, Materia } from "../../api/types";
import { crearComunidad, type DatosComunidad } from "./api";

interface Props {
  materias: Materia[];
  onGuardada: (comunidad: Comunidad) => void;
}

// Formulario para sumar un grupo: el link decide si es WhatsApp, Discord, etc.
function ComunidadForm({ materias, onGuardada }: Props) {
  const [datos, setDatos] = useState<DatosComunidad>({ nombre: "", descripcion: "", link: "", materia_id: 0 });
  const [errores, setErrores] = useState<ErroresCampo>({});
  const [enviando, setEnviando] = useState(false);

  const cambiar = <K extends keyof DatosComunidad>(campo: K, valor: DatosComunidad[K]) =>
    setDatos((d) => ({ ...d, [campo]: valor }));

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErrores({});
    try {
      const nueva = await crearComunidad(datos);
      toast.success("Comunidad agregada");
      onGuardada(nueva);
    } catch (err) {
      setErrores(erroresDeCampo(err));
      toast.error(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form className="form" onSubmit={guardar} noValidate>
      <label className="campo">
        <span>Link para unirse</span>
        <input
          type="url"
          inputMode="url"
          value={datos.link}
          onChange={(e) => cambiar("link", e.target.value)}
          placeholder="https://chat.whatsapp.com/..."
          autoComplete="off"
        />
        {errores.link && <small className="campo-error">{errores.link}</small>}
      </label>

      <label className="campo">
        <span>Nombre</span>
        <input
          value={datos.nombre}
          onChange={(e) => cambiar("nombre", e.target.value)}
          maxLength={80}
          placeholder="ISI 2026, Análisis I comisión 1..."
        />
        {errores.nombre && <small className="campo-error">{errores.nombre}</small>}
      </label>

      <label className="campo">
        <span>Materia (opcional)</span>
        <SelectorMateria
          materias={materias}
          value={datos.materia_id}
          onChange={(id) => cambiar("materia_id", id)}
          opcionVacia="De toda la carrera"
        />
        {errores.materia_id && <small className="campo-error">{errores.materia_id}</small>}
      </label>

      <label className="campo">
        <span>Descripción (opcional)</span>
        <textarea
          value={datos.descripcion}
          onChange={(e) => cambiar("descripcion", e.target.value)}
          maxLength={300}
          rows={2}
          placeholder="Para qué es el grupo"
        />
        {errores.descripcion && <small className="campo-error">{errores.descripcion}</small>}
      </label>

      <p className="campo-ayuda">Lo ven todos los alumnos de Chedul. No compartas grupos privados sin permiso.</p>

      <div className="calendario-form__acciones">
        <button type="submit" className="btn btn-primario" disabled={enviando}>
          {enviando ? "Guardando..." : "Agregar"}
        </button>
      </div>
    </form>
  );
}

export default ComunidadForm;
