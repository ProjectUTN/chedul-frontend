import { useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import { borrarEvento, crearEvento, editarEvento, type DatosEvento } from "./api";
import { TIPOS_EVENTO } from "./fechas";
import { erroresDeCampo, mensajeDeError, type ErroresCampo } from "../../api/client";
import SelectorMateria from "../../components/SelectorMateria";
import { confirmar } from "../../components/confirmar";
import type { Evento, Materia } from "../../api/types";

interface Props {
  evento: Evento | null;
  fechaInicial: string;
  materias: Materia[];
  onGuardado: () => void;
}

function EventoForm({ evento, fechaInicial, materias, onGuardado }: Props) {
  const [datos, setDatos] = useState<DatosEvento>(() => ({
    titulo: evento?.titulo ?? "",
    tipo: evento?.tipo ?? "parcial",
    fecha: evento?.fecha ?? fechaInicial,
    hora: evento?.hora ?? "",
    descripcion: evento?.descripcion ?? "",
    materia_id: evento?.materia?.id ?? 0,
  }));
  const [errores, setErrores] = useState<ErroresCampo>({});
  const [enviando, setEnviando] = useState(false);

  const cambiar = <K extends keyof DatosEvento>(campo: K, valor: DatosEvento[K]) =>
    setDatos((d) => ({ ...d, [campo]: valor }));

  const elegirMateria = (id: number) => {
    const materia = materias.find((m) => m.id === id);
    setDatos((d) => {
      // Si el titulo esta vacio, se completa con el tipo y la materia
      const tipo = TIPOS_EVENTO.find((t) => t.valor === d.tipo)?.nombre ?? "";
      const titulo = !d.titulo.trim() && materia ? `${tipo} de ${materia.nombre}` : d.titulo;
      return { ...d, materia_id: id, titulo };
    });
  };

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErrores({});
    try {
      if (evento) await editarEvento(evento.id, datos);
      else await crearEvento(datos);
      toast.success(evento ? "Evento actualizado" : "Evento agregado");
      onGuardado();
    } catch (err) {
      setErrores(erroresDeCampo(err));
      toast.error(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  };

  const borrar = async () => {
    if (!evento) return;
    const ok = await confirmar({
      titulo: "¿Borrar este evento?",
      mensaje: `"${evento.titulo}" se borra del calendario.`,
      aceptar: "Borrar",
      peligro: true,
    });
    if (!ok) return;
    setEnviando(true);
    try {
      await borrarEvento(evento.id);
      toast.success("Evento borrado");
      onGuardado();
    } catch (err) {
      toast.error(mensajeDeError(err));
      setEnviando(false);
    }
  };

  return (
    <form className="form" onSubmit={guardar} noValidate>
      <div className="calendario-form__fila">
        <label className="campo">
          <span>Tipo</span>
          <select value={datos.tipo} onChange={(e) => cambiar("tipo", e.target.value as DatosEvento["tipo"])}>
            {TIPOS_EVENTO.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="campo">
          <span>Materia</span>
          <SelectorMateria
            materias={materias}
            value={datos.materia_id}
            onChange={elegirMateria}
            opcionVacia="Ninguna"
          />
          {errores.materia_id && <small className="campo-error">{errores.materia_id}</small>}
        </label>
      </div>

      <label className="campo">
        <span>Título</span>
        <input
          value={datos.titulo}
          onChange={(e) => cambiar("titulo", e.target.value)}
          maxLength={120}
          placeholder="Primer parcial de Análisis"
          autoFocus
        />
        {errores.titulo && <small className="campo-error">{errores.titulo}</small>}
      </label>

      <div className="calendario-form__fila">
        <label className="campo">
          <span>Fecha</span>
          <input type="date" value={datos.fecha} onChange={(e) => cambiar("fecha", e.target.value)} />
          {errores.fecha && <small className="campo-error">{errores.fecha}</small>}
        </label>

        <label className="campo">
          <span>Hora (opcional)</span>
          <input type="time" value={datos.hora} onChange={(e) => cambiar("hora", e.target.value)} />
          {errores.hora && <small className="campo-error">{errores.hora}</small>}
        </label>
      </div>

      <label className="campo">
        <span>Notas (opcional)</span>
        <textarea
          value={datos.descripcion}
          onChange={(e) => cambiar("descripcion", e.target.value)}
          maxLength={1000}
          placeholder="Temas, aula, qué llevar..."
        />
      </label>

      <div className="calendario-form__acciones">
        {evento && (
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

export default EventoForm;
