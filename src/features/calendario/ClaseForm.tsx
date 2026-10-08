import { useEffect, useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import { borrarClase, crearClase, editarClase, getComisiones, type DatosClase } from "./api";
import { DIAS, DIAS_CORTOS, TIPOS_CLASE } from "./fechas";
import { NOMBRE_CUATRIMESTRE, comisionesVigentes, resumenHorarios } from "./comisiones";
import { erroresDeCampo, mensajeDeError, type ErroresCampo } from "../../api/client";
import SelectorMateria from "../../components/SelectorMateria";
import { confirmar } from "../../components/confirmar";
import type { Clase, Comision, Materia, TipoClase } from "../../api/types";

interface Props {
  clase: Clase | null;
  diaInicial: number;
  materias: Materia[];
  onGuardado: () => void;
}

// Formulario de un bloque del horario: una clase de la facultad o cualquier
// otra actividad que se repite (trabajo, deporte...). Al crear se pueden
// elegir varios dias y se guarda un bloque por dia.
function ClaseForm({ clase, diaInicial, materias, onGuardado }: Props) {
  const [datos, setDatos] = useState<DatosClase>(() => ({
    titulo: clase?.titulo ?? "",
    tipo: clase?.tipo ?? "clase",
    dia: clase?.dia ?? diaInicial,
    hora_inicio: clase?.hora_inicio ?? "08:30",
    hora_fin: clase?.hora_fin ?? "12:00",
    aula: clase?.aula ?? "",
    materia_id: clase?.materia?.id ?? 0,
    hasta: clase?.hasta ?? "",
  }));
  // Dias elegidos al crear; al editar se cambia el dia de ese bloque solo
  const [dias, setDias] = useState<number[]>(() => [clase?.dia ?? diaInicial]);
  const [errores, setErrores] = useState<ErroresCampo>({});
  const [enviando, setEnviando] = useState(false);

  const esClase = datos.tipo === "clase";

  // Al crear una clase se puede elegir una comision y se cargan todos sus horarios
  const [comisiones, setComisiones] = useState<Comision[]>([]);
  const [comisionId, setComisionId] = useState(0);
  const comision = esClase ? comisiones.find((c) => c.id === comisionId) : undefined;

  useEffect(() => {
    setComisionId(0);
    setComisiones([]);
    if (clase || !datos.materia_id) return;

    let vigente = true;
    getComisiones(datos.materia_id)
      .then((lista) => {
        if (!vigente) return;
        const vigentes = comisionesVigentes(lista);
        setComisiones(vigentes);
        // Con una sola comision ya queda elegida y se cargan sus horarios
        if (vigentes.length === 1) setComisionId(vigentes[0].id);
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

  const elegirTipo = (tipo: TipoClase) =>
    setDatos((d) => {
      // Las actividades que no son clases no van con una materia ni su nombre
      const titulo = tipo !== "clase" && materias.some((m) => m.nombre === d.titulo) ? "" : d.titulo;
      return {
        ...d,
        tipo,
        materia_id: tipo === "clase" ? d.materia_id : 0,
        titulo: titulo || (tipo === "trabajo" ? "Trabajo" : ""),
      };
    });

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

  const alternarDia = (dia: number) =>
    setDias((actuales) =>
      actuales.includes(dia) ? actuales.filter((d) => d !== dia) : [...actuales, dia].sort((a, b) => a - b)
    );

  // Cada clase lleva el aula de su horario; si la comision no la tiene, el
  // codigo de la comision (K1.1) para saber cual es
  const guardarComision = async (elegida: Comision) => {
    for (const horario of elegida.horarios) {
      await crearClase({
        ...datos,
        dia: horario.dia,
        hora_inicio: horario.hora_inicio,
        hora_fin: horario.hora_fin,
        aula: datos.aula.trim() || horario.aula || elegida.codigo,
        comision_id: elegida.id,
      });
    }
    const cantidad = elegida.horarios.length;
    toast.success(
      cantidad === 1
        ? `Se agregó la clase de ${elegida.codigo} al horario`
        : `Se agregaron ${cantidad} clases de ${elegida.codigo} al horario`
    );
  };

  const guardarDias = async () => {
    for (const dia of dias) await crearClase({ ...datos, dia });
    toast.success(dias.length === 1 ? "Se agregó al horario" : `Se agregó a ${dias.length} días del horario`);
  };

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (!clase && !comision && dias.length === 0) {
      setErrores({ dia: "Elegí al menos un día" });
      return;
    }
    setEnviando(true);
    setErrores({});
    try {
      if (clase) {
        await editarClase(clase.id, datos);
        toast.success("Horario actualizado");
      } else if (comision) {
        await guardarComision(comision);
      } else {
        await guardarDias();
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
      titulo: "¿Sacar esto del horario?",
      mensaje: `"${clase.titulo}" deja de aparecer en tu semana.`,
      aceptar: "Sacar",
      peligro: true,
    });
    if (!ok) return;
    setEnviando(true);
    try {
      await borrarClase(clase.id);
      toast.success("Sacado del horario");
      onGuardado();
    } catch (err) {
      toast.error(mensajeDeError(err));
      setEnviando(false);
    }
  };

  const cantidad = comision ? comision.horarios.length : clase ? 1 : dias.length;
  const textoBoton = clase
    ? "Guardar"
    : comision
      ? cantidad === 1
        ? "Agregar 1 clase"
        : `Agregar ${cantidad} clases`
      : cantidad > 1
        ? `Agregar en ${cantidad} días`
        : "Agregar";

  return (
    <form className="form" onSubmit={guardar} noValidate>
      <div className="campo">
        <span>Qué es</span>
        <div className="segmented" role="group" aria-label="Tipo de actividad">
          {TIPOS_CLASE.map((t) => (
            <button
              key={t.valor}
              type="button"
              aria-pressed={datos.tipo === t.valor}
              onClick={() => elegirTipo(t.valor)}>
              {t.nombre}
            </button>
          ))}
        </div>
        {errores.tipo && <small className="campo-error">{errores.tipo}</small>}
      </div>

      {esClase && (
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
      )}

      {esClase && comisiones.length > 0 && (
        <label className="campo">
          <span>Comisión</span>
          <select value={comisionId} onChange={(e) => setComisionId(Number(e.target.value))}>
            <option value={0}>Cargar el horario a mano</option>
            {comisiones.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codigo} ({NOMBRE_CUATRIMESTRE[c.cuatrimestre] ?? c.cuatrimestre}) · {resumenHorarios(c)}
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
          placeholder={esClase ? "Algoritmos (teoría)" : datos.tipo === "trabajo" ? "Trabajo" : "Gimnasio, inglés..."}
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
                {h.aula && <> · {h.aula}</>}
              </li>
            ))}
          </ul>
          {(errores.dia || errores.hora_inicio || errores.hora_fin) && (
            <small className="campo-error">{errores.dia || errores.hora_inicio || errores.hora_fin}</small>
          )}
        </div>
      ) : (
        <>
          {clase ? (
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
          ) : (
            <div className="campo">
              <span>Días</span>
              <div className="calendario-form__dias" role="group" aria-label="Días en que se repite">
                {DIAS_CORTOS.map((nombre, i) => (
                  <button
                    key={nombre}
                    type="button"
                    aria-pressed={dias.includes(i + 1)}
                    aria-label={DIAS[i]}
                    onClick={() => alternarDia(i + 1)}>
                    {nombre}
                  </button>
                ))}
              </div>
              {errores.dia && <small className="campo-error">{errores.dia}</small>}
            </div>
          )}

          <div className="calendario-form__fila calendario-form__fila--fija">
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
        </>
      )}

      <label className="campo">
        <span>{esClase ? "Aula o comisión (opcional)" : "Lugar (opcional)"}</span>
        <input
          value={datos.aula}
          onChange={(e) => cambiar("aula", e.target.value)}
          maxLength={60}
          placeholder={
            comision ? "Vacío: se usa el aula de cada horario" : esClase ? "Aula 305, K1051" : "Oficina, club..."
          }
        />
        {errores.aula && <small className="campo-error">{errores.aula}</small>}
      </label>

      <label className="campo">
        <span>Se repite hasta (opcional)</span>
        <input type="date" value={datos.hasta ?? ""} onChange={(e) => cambiar("hasta", e.target.value)} />
        <small className="campo-ayuda">Vacío: todas las semanas, sin fecha de fin.</small>
        {errores.hasta && <small className="campo-error">{errores.hasta}</small>}
      </label>

      <div className="calendario-form__acciones">
        {clase && (
          <button type="button" className="btn btn-peligro" onClick={borrar} disabled={enviando}>
            <span className="material-symbols-rounded">delete</span>
            Borrar
          </button>
        )}
        <button type="submit" className="btn btn-primario" disabled={enviando}>
          {enviando ? "Guardando..." : textoBoton}
        </button>
      </div>
    </form>
  );
}

export default ClaseForm;
