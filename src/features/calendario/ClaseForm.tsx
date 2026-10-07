import { useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import { borrarClase, crearClase, editarClase, type DatosClase } from "./api";
import { DIAS } from "./fechas";
import { erroresDeCampo, mensajeDeError, type ErroresCampo } from "../../api/client";
import type { Clase, Materia } from "../../api/types";

interface Props {
  clase: Clase | null;
  diaInicial: number;
  materias: Materia[];
  onGuardado: () => void;
}

function ClaseForm({ clase, diaInicial, materias, onGuardado }: Props) {
  const [datos, setDatos] = useState<DatosClase>(() => ({
    titulo: clase?.titulo ?? "",
    dia: clase?.dia ?? diaInicial,
    hora_inicio: clase?.hora_inicio ?? "08:30",
    hora_fin: clase?.hora_fin ?? "12:00",
    aula: clase?.aula ?? "",
    materia_id: clase?.materia?.id ?? 0,
  }));
  const [errores, setErrores] = useState<ErroresCampo>({});
  const [enviando, setEnviando] = useState(false);

  const cambiar = <K extends keyof DatosClase>(campo: K, valor: DatosClase[K]) =>
    setDatos((d) => ({ ...d, [campo]: valor }));

  const elegirMateria = (id: number) => {
    const materia = materias.find((m) => m.id === id);
    setDatos((d) => ({
      ...d,
      materia_id: id,
      // El titulo sigue a la materia mientras el alumno no lo haya cambiado
      titulo:
        materia && (!d.titulo.trim() || materias.some((m) => m.nombre === d.titulo))
          ? materia.nombre
          : d.titulo,
    }));
  };

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErrores({});
    try {
      if (clase) await editarClase(clase.id, datos);
      else await crearClase(datos);
      toast.success(clase ? "Clase actualizada" : "Clase agregada al horario");
      onGuardado();
    } catch (err) {
      setErrores(erroresDeCampo(err));
      toast.error(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  };

  const borrar = async () => {
    if (!clase || !confirm(`¿Sacar "${clase.titulo}" del horario?`)) return;
    setEnviando(true);
    try {
      await borrarClase(clase.id);
      toast.success("Clase borrada");
      onGuardado();
    } catch (err) {
      toast.error(mensajeDeError(err));
      setEnviando(false);
    }
  };

  return (
    <form className="form" onSubmit={guardar} noValidate>
      <label className="campo">
        <span>Materia</span>
        <select value={datos.materia_id} onChange={(e) => elegirMateria(Number(e.target.value))}>
          <option value={0}>Ninguna</option>
          {materias.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </select>
        {errores.materia_id && <small className="campo-error">{errores.materia_id}</small>}
      </label>

      <label className="campo">
        <span>Título</span>
        <input
          value={datos.titulo}
          onChange={(e) => cambiar("titulo", e.target.value)}
          maxLength={120}
          placeholder="Algoritmos (teoría)"
        />
        {errores.titulo && <small className="campo-error">{errores.titulo}</small>}
      </label>

      <div className="calendario-form__fila calendario-form__fila--3">
        <label className="campo">
          <span>Día</span>
          <select value={datos.dia} onChange={(e) => cambiar("dia", Number(e.target.value))}>
            {DIAS.map((nombre, i) => (
              <option key={nombre} value={i + 1}>
                {nombre}
              </option>
            ))}
          </select>
          {errores.dia && <small className="campo-error">{errores.dia}</small>}
        </label>

        <label className="campo">
          <span>Desde</span>
          <input type="time" value={datos.hora_inicio} onChange={(e) => cambiar("hora_inicio", e.target.value)} />
          {errores.hora_inicio && <small className="campo-error">{errores.hora_inicio}</small>}
        </label>

        <label className="campo">
          <span>Hasta</span>
          <input type="time" value={datos.hora_fin} onChange={(e) => cambiar("hora_fin", e.target.value)} />
          {errores.hora_fin && <small className="campo-error">{errores.hora_fin}</small>}
        </label>
      </div>

      <label className="campo">
        <span>Aula o comisión (opcional)</span>
        <input
          value={datos.aula}
          onChange={(e) => cambiar("aula", e.target.value)}
          maxLength={60}
          placeholder="Aula 305, K1051"
        />
        {errores.aula && <small className="campo-error">{errores.aula}</small>}
      </label>

      <div className="calendario-form__acciones">
        {clase && (
          <button type="button" className="btn btn-peligro" onClick={borrar} disabled={enviando}>
            <span className="material-symbols-rounded">delete</span>
            Borrar
          </button>
        )}
        <button type="submit" className="btn btn-primario" disabled={enviando}>
          {enviando ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}

export default ClaseForm;
