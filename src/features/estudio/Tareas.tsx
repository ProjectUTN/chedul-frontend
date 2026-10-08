import { useEffect, useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import SelectorMateria from "../../components/SelectorMateria";
import { mensajeDeError } from "../../api/client";
import type { Materia, TareaEstudio } from "../../api/types";
import { borrarTarea, crearTarea, editarTarea, getTareas } from "./api";

interface Props {
  materias: Materia[];
  // La materia del temporizador, para que la tarea nueva arranque con esa
  materiaId: number;
}

// Lista de cosas para estudiar: se tildan al terminarlas y las hechas van abajo
function Tareas({ materias, materiaId }: Props) {
  const [tareas, setTareas] = useState<TareaEstudio[]>([]);
  const [titulo, setTitulo] = useState("");
  const [materia, setMateria] = useState(materiaId);
  const [enviando, setEnviando] = useState(false);
  const [verHechas, setVerHechas] = useState(false);

  useEffect(() => {
    getTareas()
      .then(setTareas)
      .catch(() => {});
  }, []);

  useEffect(() => setMateria(materiaId), [materiaId]);

  const ordenar = (lista: TareaEstudio[]) =>
    [...lista].sort((a, b) => Number(a.hecha) - Number(b.hecha) || b.creada.localeCompare(a.creada) || b.id - a.id);

  const agregar = async (e: FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    setEnviando(true);
    try {
      const nueva = await crearTarea({
        titulo,
        materia_id: materia,
        hecha: false,
      });
      setTareas((t) => ordenar([nueva, ...t]));
      setTitulo("");
    } catch (err) {
      toast.error(mensajeDeError(err, "No se pudo agregar"));
    } finally {
      setEnviando(false);
    }
  };

  const alternar = async (tarea: TareaEstudio) => {
    // Se marca al toque y se vuelve atras si falla
    setTareas((t) => ordenar(t.map((x) => (x.id === tarea.id ? { ...x, hecha: !x.hecha } : x))));
    try {
      await editarTarea(tarea.id, {
        titulo: tarea.titulo,
        materia_id: tarea.materia?.id ?? 0,
        hecha: !tarea.hecha,
      });
    } catch (err) {
      setTareas((t) => ordenar(t.map((x) => (x.id === tarea.id ? tarea : x))));
      toast.error(mensajeDeError(err));
    }
  };

  const borrar = async (tarea: TareaEstudio) => {
    try {
      await borrarTarea(tarea.id);
      setTareas((t) => t.filter((x) => x.id !== tarea.id));
    } catch (err) {
      toast.error(mensajeDeError(err));
    }
  };

  const pendientes = tareas.filter((t) => !t.hecha);
  const hechas = tareas.filter((t) => t.hecha);
  const visibles = verHechas ? [...pendientes, ...hechas] : pendientes;

  return (
    <section className="card inicio-seccion tareas-card">
      <div className="inicio-seccion__header">
        <h2>Para estudiar</h2>
        {pendientes.length > 0 && (
          <span className="chip">
            {pendientes.length} {pendientes.length === 1 ? "pendiente" : "pendientes"}
          </span>
        )}
      </div>

      <form className="tareas__nueva" onSubmit={agregar}>
        <input
          className="control"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={200}
          placeholder="Resolver la guía 3, leer el apunte..."
          aria-label="Nueva tarea"
        />
        <SelectorMateria materias={materias} value={materia} onChange={setMateria} opcionVacia="Sin materia" />
        <button type="submit" className="btn btn-primario" disabled={enviando || !titulo.trim()}>
          <span className="material-symbols-rounded">add</span>
          Agregar
        </button>
      </form>

      {visibles.length === 0 ? (
        <p className="campo-ayuda">
          {hechas.length > 0 ? "Hiciste todo, bien ahí." : "Anotá lo que tenés que estudiar."}
        </p>
      ) : (
        <ul className="tareas">
          {visibles.map((t) => (
            <li key={t.id} className={t.hecha ? "tarea tarea--hecha" : "tarea"}>
              <label className="tarea__check">
                <input type="checkbox" checked={t.hecha} onChange={() => alternar(t)} />
                <span>
                  {t.titulo}
                  {t.materia && <span className="campo-ayuda"> · {t.materia.nombre}</span>}
                </span>
              </label>
              <button
                type="button"
                className="btn btn-icono"
                onClick={() => borrar(t)}
                aria-label={`Borrar "${t.titulo}"`}
                title="Borrar">
                <span className="material-symbols-rounded">close</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {hechas.length > 0 && (
        <button type="button" className="btn btn-secundario btn-chico" onClick={() => setVerHechas((v) => !v)}>
          {verHechas ? "Ocultar las hechas" : `Ver las hechas (${hechas.length})`}
        </button>
      )}
    </section>
  );
}

export default Tareas;
