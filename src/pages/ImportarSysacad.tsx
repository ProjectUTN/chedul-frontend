import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import SelectorMateria from "../components/SelectorMateria";
import { useAuth } from "../context/authProvider";
import { mensajeDeError } from "../api/client";
import {
  borrarCondicion,
  getCondiciones,
  getMaterias,
  getMisCondiciones,
  setCondicion,
} from "../features/estado_academico/api";
import { agregarConComision, sacarVariasDelHorario } from "../features/calendario/horarioAutomatico";
import { buscarMateria, leerSysacad, type FilaInterpretada } from "../features/importar/sysacad";
import type { Condicion, CondicionPorAlumno, Materia } from "../api/types";
import "../features/herramientas/herramientas.css";
import "../features/estado_academico/condicionEnMaterias.css";
import "../features/importar/importar.css";

// Importar el estado academico desde SysAcad: el alumno pega lo que copio de
// la pagina (o sube la pagina guardada), revisa lo que cambia y confirma.

const PENDIENTE = "Pendiente";
type Destino = "Aprobada" | "Regularizada" | "Cursando" | typeof PENDIENTE;

interface Propuesta {
  clave: string;
  fila: FilaInterpretada;
  materiaId: number;
  destino: Destino | null;
  // Por que no se importa (curso de ingreso, estado desconocido)
  motivo: string;
  incluir: boolean;
}

const claseEstado = (estado: string) => `estado--${estado.toLowerCase()}`;

const textoDestino = (destino: string, nota: number | null) =>
  destino === "Aprobada" && nota ? `Aprobada con ${nota}` : destino === "Regularizada" ? "Regular" : destino;

function ImportarSysacad() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [condiciones, setCondiciones] = useState<Condicion[]>([]);
  const [mis, setMis] = useState<CondicionPorAlumno[]>([]);
  const [error, setError] = useState("");
  const [contenido, setContenido] = useState("");
  const [propuestas, setPropuestas] = useState<Propuesta[] | null>(null);
  const [importando, setImportando] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([getMaterias(user.carrera), getCondiciones(), getMisCondiciones()])
      .then(([materias, condiciones, mis]) => {
        setMaterias(materias);
        setCondiciones(condiciones);
        setMis(mis);
      })
      .catch((err) => setError(mensajeDeError(err, "No se pudieron cargar tus materias")));
  }, [user]);

  const actualDe = (materiaId: number) => mis.find((c) => c.materia_id === materiaId);

  const cambia = (materiaId: number, destino: Destino | null, nota: number | null) => {
    if (!materiaId || !destino) return false;
    const actual = actualDe(materiaId);
    const estado = actual?.condicion ?? PENDIENTE;
    if (estado !== destino) return true;
    // Misma condicion: solo cambia si SysAcad trae una nota distinta
    return destino === "Aprobada" && nota !== null && nota !== actual?.nota;
  };

  const leer = (texto: string) => {
    setContenido(texto);
    if (!texto.trim()) {
      setPropuestas(null);
      return;
    }
    const filas = leerSysacad(texto);
    setPropuestas(
      filas.map((fila, i) => {
        let destino: Destino | null = null;
        let motivo = "";
        if (fila.anio === 0) motivo = "Curso de ingreso, no es del plan";
        else if (!fila.condicion) motivo = "No entendimos este estado";
        else destino = fila.condicion === "Libre" ? PENDIENTE : fila.condicion;
        const materiaId = destino ? (buscarMateria(fila.materia, materias) ?? 0) : 0;
        return {
          clave: `${i}-${fila.materia}`,
          fila,
          materiaId,
          destino,
          motivo,
          incluir: cambia(materiaId, destino, fila.nota),
        };
      })
    );
  };

  const subirArchivo = async (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    leer(await archivo.text());
  };

  const actualizar = (clave: string, cambios: Partial<Propuesta>) =>
    setPropuestas((lista) =>
      (lista ?? []).map((p) => {
        if (p.clave !== clave) return p;
        const nueva = { ...p, ...cambios };
        // Al elegir a mano la materia se marca para importar si cambia algo
        if ("materiaId" in cambios) nueva.incluir = cambia(nueva.materiaId, nueva.destino, nueva.fila.nota);
        return nueva;
      })
    );

  const grupos = useMemo(() => {
    const lista = propuestas ?? [];
    return {
      cambios: lista.filter((p) => p.destino && (!p.materiaId || cambia(p.materiaId, p.destino, p.fila.nota))),
      iguales: lista.filter((p) => p.destino && p.materiaId && !cambia(p.materiaId, p.destino, p.fila.nota)),
      ignoradas: lista.filter((p) => !p.destino),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propuestas, mis]);

  const aImportar = grupos.cambios.filter((p) => p.incluir && p.materiaId);

  const importar = async () => {
    setImportando(true);
    try {
      await Promise.all(
        aImportar.map((p) => {
          const condicion = condiciones.find((c) => c.condicion === p.destino);
          if (p.destino === PENDIENTE || !condicion) return borrarCondicion(p.materiaId);
          return setCondicion(p.materiaId, condicion.id, p.destino === "Aprobada" ? p.fila.nota : null);
        })
      );
      toast.success(
        aImportar.length === 1
          ? "Importamos 1 materia de SysAcad"
          : `Importamos ${aImportar.length} materias de SysAcad`
      );

      // El horario sigue a las materias en curso, igual que al marcarlas a mano
      const materia = (id: number) => materias.find((m) => m.id === id)!;
      const empiezan = aImportar.filter(
        (p) => p.destino === "Cursando" && actualDe(p.materiaId)?.condicion !== "Cursando"
      );
      const terminan = aImportar.filter(
        (p) => p.destino !== "Cursando" && actualDe(p.materiaId)?.condicion === "Cursando"
      );
      if (terminan.length > 0) await sacarVariasDelHorario(terminan.map((p) => materia(p.materiaId)));
      if (empiezan.length > 0) {
        await agregarConComision(empiezan.map((p) => ({ materia: materia(p.materiaId), codigo: p.fila.comision })));
      }
      navigate("/estado");
    } catch (err) {
      toast.error(mensajeDeError(err, "No se pudo importar todo, revisá tu estado académico"));
      setMis(await getMisCondiciones().catch(() => mis));
    } finally {
      setImportando(false);
    }
  };

  const fila = (p: Propuesta, editable: boolean) => {
    const actual = actualDe(p.materiaId);
    const estadoActual = actual?.condicion ?? PENDIENTE;
    const nombre = materias.find((m) => m.id === p.materiaId)?.nombre;
    return (
      <li key={p.clave} className={`importar-fila ${p.destino ? claseEstado(p.destino) : ""}`}>
        {editable && (
          <input
            type="checkbox"
            className="importar-fila__check"
            checked={p.incluir}
            disabled={!p.materiaId}
            onChange={(e) => actualizar(p.clave, { incluir: e.target.checked })}
            aria-label={`Importar ${nombre ?? p.fila.materia}`}
          />
        )}
        <div className="importar-fila__info">
          {editable && !p.materiaId ? (
            <>
              <SelectorMateria
                materias={materias}
                value={0}
                onChange={(id) => actualizar(p.clave, { materiaId: id })}
                placeholder="Elegí a qué materia corresponde"
                ariaLabel={`Materia para ${p.fila.materia}`}
              />
              <small className="campo-error">No encontramos "{p.fila.materia}" en el plan</small>
            </>
          ) : (
            <strong>{nombre ?? p.fila.materia}</strong>
          )}
          <small className="campo-ayuda">
            SysAcad: {p.fila.estado}
            {p.fila.condicion === "Libre" && " · queda pendiente"}
          </small>
          {p.motivo && <small className="campo-ayuda">{p.motivo}</small>}
        </div>
        {p.destino && p.materiaId > 0 && (
          <div className="importar-fila__cambio">
            {editable && (
              <>
                <span className={`importar-estado ${claseEstado(estadoActual.replace(/ /g, "-"))}`}>
                  {textoDestino(estadoActual, actual?.nota ?? null)}
                </span>
                <span className="material-symbols-rounded" aria-label="pasa a">
                  arrow_forward
                </span>
              </>
            )}
            <span className={`importar-estado ${claseEstado(p.destino)}`}>{textoDestino(p.destino, p.fila.nota)}</span>
          </div>
        )}
      </li>
    );
  };

  return (
    <>
      <div className="page-header">
        <div>
          <Link to="/estado" className="volver">
            <span className="material-symbols-rounded">arrow_back</span>
            Estado académico
          </Link>
          <h1>Importar de SysAcad</h1>
          <p>Traé tu estado académico de SysAcad en un paso, sin cargar materia por materia.</p>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <section className="card importar-paso">
        <h2>1. Copiá tu estado de SysAcad</h2>
        <ol className="importar-pasos">
          <li>
            Entrá a{" "}
            <a href="https://sysacadweb.frre.utn.edu.ar/Alumnos/estado/" target="_blank" rel="noopener noreferrer">
              SysAcad, Estado académico
            </a>
            .
          </li>
          <li>
            Seleccioná toda la página (<kbd>Ctrl</kbd>+<kbd>A</kbd>, o mantené apretado en el celu) y copiala.
          </li>
          <li>Pegala acá abajo.</li>
        </ol>
        <textarea
          className="control importar-texto"
          value={contenido.startsWith("<") ? "" : contenido}
          onChange={(e) => leer(e.target.value)}
          placeholder="Pegá acá lo que copiaste de SysAcad"
          aria-label="Estado académico copiado de SysAcad"
          disabled={materias.length === 0}
        />
        <label className="importar-archivo">
          <span className="material-symbols-rounded">upload_file</span>O subí la página guardada (.html)
          <input type="file" accept=".html,.htm,text/html" onChange={subirArchivo} disabled={materias.length === 0} />
        </label>
        <p className="campo-ayuda">
          Todo se lee en tu navegador. Chedul nunca te pide tu usuario ni tu contraseña de SysAcad.
        </p>
      </section>

      {propuestas && propuestas.length === 0 && (
        <p className="form-error">
          No encontramos la tabla de materias. Fijate de copiar desde la página "Estado académico" de SysAcad.
        </p>
      )}

      {propuestas && propuestas.length > 0 && (
        <section className="card importar-paso">
          <h2>2. Revisá lo que cambia</h2>
          <p className="campo-ayuda">
            Encontramos {propuestas.length} materias: {grupos.cambios.length}{" "}
            {grupos.cambios.length === 1 ? "cambia" : "cambian"} y {grupos.iguales.length}{" "}
            {grupos.iguales.length === 1 ? "ya estaba igual" : "ya estaban igual"}. Destildá las que no quieras traer.
          </p>

          {grupos.cambios.length > 0 ? (
            <ul className="importar-lista">{grupos.cambios.map((p) => fila(p, true))}</ul>
          ) : (
            <p className="vacio">Tu estado en Chedul ya está igual que en SysAcad.</p>
          )}

          {grupos.iguales.length > 0 && (
            <details className="importar-mas">
              <summary>Ya estaban igual ({grupos.iguales.length})</summary>
              <ul className="importar-lista">{grupos.iguales.map((p) => fila(p, false))}</ul>
            </details>
          )}
          {grupos.ignoradas.length > 0 && (
            <details className="importar-mas">
              <summary>No se importan ({grupos.ignoradas.length})</summary>
              <ul className="importar-lista">{grupos.ignoradas.map((p) => fila(p, false))}</ul>
            </details>
          )}

          <div className="importar-acciones">
            <button
              type="button"
              className="btn btn-primario"
              disabled={importando || aImportar.length === 0}
              onClick={importar}>
              <span className="material-symbols-rounded">download</span>
              {importando
                ? "Importando..."
                : aImportar.length === 1
                  ? "Importar 1 cambio"
                  : `Importar ${aImportar.length} cambios`}
            </button>
          </div>
        </section>
      )}
    </>
  );
}

export default ImportarSysacad;
