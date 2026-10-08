import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Modal from "../features/calendario/Modal";
import ComunidadForm from "../features/comunidades/ComunidadForm";
import { borrarComunidad, getComunidades, reportarComunidad } from "../features/comunidades/api";
import { PLATAFORMAS, plataforma } from "../features/comunidades/plataformas";
import { getMaterias } from "../features/estado_academico/api";
import { confirmar } from "../components/confirmar";
import { useAuth } from "../context/authProvider";
import { mensajeDeError } from "../api/client";
import type { Comunidad, Materia, PlataformaComunidad } from "../api/types";
import "../features/calendario/calendario.css";
import "../features/herramientas/herramientas.css";
import "../features/comunidades/comunidades.css";

// Comunidades: grupos de la carrera (WhatsApp, Discord...) que cargan los
// mismos alumnos. Los links rotos se reportan y con varios reportes se ocultan.

const normalizar = (texto: string) => texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function Comunidades() {
  const { user } = useAuth();
  const [comunidades, setComunidades] = useState<Comunidad[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<PlataformaComunidad | "">("");
  const [agregando, setAgregando] = useState(false);

  useEffect(() => {
    getComunidades()
      .then(setComunidades)
      .catch((err) => setError(mensajeDeError(err, "No se pudieron cargar las comunidades")))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    getMaterias(user.carrera)
      .then((data) => setMaterias([...data].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))))
      .catch(() => {});
  }, [user]);

  // Agrupadas: primero las de toda la carrera y despues por materia
  const grupos = useMemo(() => {
    const texto = normalizar(busqueda.trim());
    const visibles = comunidades.filter(
      (c) =>
        (!filtro || c.plataforma === filtro) &&
        (!texto || normalizar(`${c.nombre} ${c.descripcion} ${c.materia?.nombre ?? ""}`).includes(texto))
    );
    const porTitulo = new Map<string, Comunidad[]>();
    for (const c of visibles) {
      const titulo = c.materia?.nombre ?? "De toda la carrera";
      porTitulo.set(titulo, [...(porTitulo.get(titulo) ?? []), c]);
    }
    return [...porTitulo.entries()];
  }, [comunidades, busqueda, filtro]);

  const reportar = async (c: Comunidad) => {
    const ok = await confirmar({
      titulo: "¿Reportar esta comunidad?",
      mensaje: "Usalo si el link no anda o no es de la carrera. Con varios reportes deja de mostrarse.",
      aceptar: "Reportar",
      peligro: true,
    });
    if (!ok) return;
    try {
      await reportarComunidad(c.id);
      setComunidades((lista) => lista.map((x) => (x.id === c.id ? { ...x, reportada: true } : x)));
      toast.info("Gracias, lo vamos a tener en cuenta");
    } catch (err) {
      toast.error(mensajeDeError(err));
    }
  };

  const borrar = async (c: Comunidad) => {
    const ok = await confirmar({
      titulo: "¿Sacar esta comunidad?",
      mensaje: `"${c.nombre}" deja de aparecer para todos.`,
      aceptar: "Sacar",
      peligro: true,
    });
    if (!ok) return;
    try {
      await borrarComunidad(c.id);
      setComunidades((lista) => lista.filter((x) => x.id !== c.id));
      toast.success("Comunidad sacada");
    } catch (err) {
      toast.error(mensajeDeError(err));
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <Link to="/herramientas" className="volver">
            <span className="material-symbols-rounded">arrow_back</span>
            Herramientas
          </Link>
          <h1>Comunidades</h1>
          <p>Grupos de WhatsApp, Discord y más de la carrera y de cada materia. Los suman los mismos alumnos.</p>
        </div>
        <button type="button" className="btn btn-primario" onClick={() => setAgregando(true)}>
          <span className="material-symbols-rounded">add</span>
          Agregar
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="comunidades-filtros">
        <input
          className="control"
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o materia"
          aria-label="Buscar comunidad"
        />
        <div className="comunidades-chips" role="group" aria-label="Filtrar por app">
          <button type="button" className="chip-filtro" aria-pressed={filtro === ""} onClick={() => setFiltro("")}>
            Todas
          </button>
          {PLATAFORMAS.map((p) => (
            <button
              key={p.valor}
              type="button"
              className="chip-filtro"
              aria-pressed={filtro === p.valor}
              onClick={() => setFiltro(filtro === p.valor ? "" : p.valor)}>
              {p.nombre}
            </button>
          ))}
        </div>
      </div>

      {cargando ? (
        <p className="vacio">Cargando comunidades...</p>
      ) : comunidades.length === 0 ? (
        <div className="vacio">
          <p>
            Todavía nadie sumó una comunidad. Si estás en un grupo de la carrera, agregalo así lo encuentran los demás.
          </p>
        </div>
      ) : grupos.length === 0 ? (
        <p className="vacio">No hay comunidades con ese filtro.</p>
      ) : (
        grupos.map(([titulo, lista]) => (
          <section key={titulo} className="comunidades-grupo">
            <h2>{titulo}</h2>
            <ul className="comunidades">
              {lista.map((c) => {
                const p = plataforma(c.plataforma);
                return (
                  <li key={c.id} className={`card comunidad comunidad--${c.plataforma}`}>
                    <span className="comunidad__icono material-symbols-rounded" aria-hidden="true">
                      {p.icono}
                    </span>
                    <div className="comunidad__texto">
                      <strong>{c.nombre}</strong>
                      <span className="campo-ayuda">
                        {p.nombre}
                        {c.descripcion && ` · ${c.descripcion}`}
                      </span>
                    </div>
                    <div className="comunidad__acciones">
                      <a className="btn btn-primario btn-chico" href={c.link} target="_blank" rel="noopener noreferrer">
                        Unirme
                      </a>
                      {c.es_mia ? (
                        <button
                          type="button"
                          className="btn btn-icono"
                          onClick={() => borrar(c)}
                          aria-label={`Sacar ${c.nombre}`}
                          title="Sacar">
                          <span className="material-symbols-rounded">delete</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-icono"
                          onClick={() => reportar(c)}
                          disabled={c.reportada}
                          aria-label={c.reportada ? "Ya la reportaste" : `Reportar ${c.nombre}`}
                          title={c.reportada ? "Ya la reportaste" : "Reportar link roto o que no es de la carrera"}>
                          <span className="material-symbols-rounded">flag</span>
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}

      <Modal titulo="Agregar comunidad" abierto={agregando} onCerrar={() => setAgregando(false)}>
        <ComunidadForm
          materias={materias}
          onGuardada={(nueva) => {
            setComunidades((lista) => [...lista, nueva]);
            setAgregando(false);
          }}
        />
      </Modal>
    </>
  );
}

export default Comunidades;
