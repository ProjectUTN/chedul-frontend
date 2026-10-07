import { useEffect, useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import { borrarClase, crearClase, editarClase, getComisiones, type DatosClase } from "./api";
import { DIAS, DIAS_CORTOS } from "./fechas";
import { erroresDeCampo, mensajeDeError, type ErroresCampo } from "../../api/client";
import SelectorMateria from "../../components/SelectorMateria";
import { confirmar } from "../../components/confirmar";
import type { Clase, Comision, Materia } from "../../api/types";

interface Props {
  clase: Clase | null;
  diaInicial: number;
  materias: Materia[];
  onGuardado: () => void;
}

const resumenHorarios = (comision: Comision) =>
  comision.horarios.map((h) => `${DIAS_CORTOS[h.dia - 1]} ${h.hora_inicio}–${h.hora_fin}`).join(", ");

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

  // Al crear una clase se puede elegir una comision y se cargan todos sus horarios
  const [comisiones, setComisiones] = useState<Comision[]>([]);
  const [comisionId, setComisionId] = useState(0);
  const comision = comisiones.find((c) => c.id === comisionId);

  useEffect(() => {
    setComisionId(0);
    setComisiones([]);
    if (clase || !datos.materia_id) return;

    let vigente = true;
    getComisiones(datos.materia_id)
      .then((lista) => {
        if (vigente) setComisiones(lista.filter((c) => c.horarios.length > 0));
      })
      .catch(() => {
        // Sin comisiones se carga a mano, no hace falta avisar
      });
    return () => {
      vigente = false;
    };
  }, [clase, datos.materia_id]);

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

  const elegirComision = (id: number) => {
    const anterior = comision?.codigo;
    const nueva = comisiones.find((c) => c.id === id);
    setComisionId(id);
    // El aula sigue a la comision mientras el alumno no la haya cambiado
    setDatos((d) => ({
      ...d,
      aula: !d.aula.trim() || d.aula === anterior ? (nueva?.codigo ?? "") : d.aula,
    }));
  };

  const guardarComision = async (elegida: Comision) => {
    for (const horario of elegida.horarios) {
      await crearClase({
        ...datos,
        dia: horario.dia,
        hora_inicio: horario.hora_inicio,
        hora_fin: horario.hora_fin,
      });
    }
    const cantidad = elegida.horarios.length;
    toast.success(
      cantidad === 1
        ? `Se agregó la clase de ${elegida.codigo} al horario`
        : `Se agregaron ${cantidad} clases de ${elegida.codigo} al horario`
    );
  };

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErrores({});
    try {
      if (clase) {
        await editarClase(clase.id, datos);
        toast.success("Clase actualizada");
      } else if (comision) {
        await guardarComision(comision);
      } else {
        await crearClase(datos);
        toast.success("Clase agregada al horario");
      }
      onGuardado();
    } catch (err) {
      setErrores(erroresDeCampo(err));
      toast.error(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  };

  const borrar = async () => {
    if (!clase) return;
    const ok = await confirmar({
      titulo: "¿Sacar esta clase del horario?",
      mensaje: `"${clase.titulo}" deja de aparecer en tu semana.`,
      aceptar: "Sacar",
      peligro: true,
    });
    if (!ok) return;
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
        <SelectorMateria
          materias={materias}
          value={datos.materia_id}
          onChange={elegirMateria}
          opcionVacia="Ninguna"
        />
        {errores.materia_id && <small className="campo-error">{errores.materia_id}</small>}
      </label>

      {comisiones.length > 0 && (
        <label className="campo">
          <span>Comisión</span>
          <select value={comisionId} onChange={(e) => elegirComision(Number(e.target.value))}>
            <option value={0}>Cargar el horario a mano</option>
            {comisiones.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codigo} · {resumenHorarios(c)}
              </option>
            ))}
          </select>
        </label>
      )}

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

      {comision ? (
        <div className="campo">
          <span>Horarios de {comision.codigo}</span>
          <ul className="calendario-form__horarios">
            {comision.horarios.map((h) => (
              <li key={`${h.dia}-${h.hora_inicio}`}>
                <b>{DIAS[h.dia - 1]}</b> de {h.hora_inicio} a {h.hora_fin}
              </li>
            ))}
          </ul>
          {(errores.dia || errores.hora_inicio || errores.hora_fin) && (
            <small className="campo-error">{errores.dia || errores.hora_inicio || errores.hora_fin}</small>
          )}
        </div>
      ) : (
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
      )}

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
          {enviando
            ? "Guardando..."
            : comision
              ? comision.horarios.length === 1
                ? "Agregar 1 clase"
                : `Agregar ${comision.horarios.length} clases`
              : "Guardar"}
        </button>
      </div>
    </form>
  );
}

export default ClaseForm;
