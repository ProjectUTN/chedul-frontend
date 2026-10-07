import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AporteCard from "../features/aportes/AporteCard";
import { getAportes, getTags, type FiltroAportes } from "../features/aportes/api";
import { getMaterias } from "../features/estado_academico/api";
import SearchBar from "../features/mails/SearchBar";
import SelectorMateria from "../components/SelectorMateria";
import { useAuth } from "../context/authProvider";
import useDebounce from "../hooks/useDebounce";
import { mensajeDeError } from "../api/client";
import type { Aporte, AporteTag, Materia } from "../api/types";
import "../features/aportes/aportes.css";

type Vista = "todos" | "mios" | "favoritos";

const POR_PAGINA = 12;

function Aportes() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [materias, setMaterias] = useState<Materia[]>([]);
  const [tags, setTags] = useState<AporteTag[]>([]);

  const [busqueda, setBusqueda] = useState("");
  const q = useDebounce(busqueda);
  const materiaId = Number(searchParams.get("materia_id")) || 0;
  const [tagId, setTagId] = useState(0);
  const [orden, setOrden] = useState<"recientes" | "populares">("recientes");
  const [vista, setVista] = useState<Vista>("todos");

  const [aportes, setAportes] = useState<Aporte[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    getMaterias(user.carrera).then(setMaterias).catch(() => {});
    getTags().then(setTags).catch(() => {});
  }, [user]);

  // Cada vez que cambia un filtro se vuelve a la primera pagina
  useEffect(() => {
    const filtro: FiltroAportes = {
      q,
      materia_id: materiaId,
      tag_id: tagId,
      orden,
      mios: vista === "mios",
      favoritos: vista === "favoritos",
      pagina,
      limite: POR_PAGINA,
    };

    let cancelado = false;
    setCargando(true);
    setError("");

    getAportes(filtro)
      .then((data) => {
        if (cancelado) return;
        setAportes((prev) => (pagina === 1 ? data.items : [...prev, ...data.items]));
        setTotal(data.total);
      })
      .catch((err) => !cancelado && setError(mensajeDeError(err, "No se pudieron cargar los aportes")))
      .finally(() => !cancelado && setCargando(false));

    return () => {
      cancelado = true;
    };
  }, [q, materiaId, tagId, orden, vista, pagina]);

  const cambiarFiltro = (aplicar: () => void) => {
    aplicar();
    setPagina(1);
  };

  const setMateriaId = (id: number) => {
    const params = new URLSearchParams(searchParams);
    if (id) params.set("materia_id", String(id));
    else params.delete("materia_id");
    setSearchParams(params, { replace: true });
  };

  const actualizar = (actualizado: Aporte) => {
    setAportes((prev) => {
      // En "Favoritos", si se desmarca deja de pertenecer a la lista
      if (vista === "favoritos" && !actualizado.es_favorito) {
        setTotal((t) => t - 1);
        return prev.filter((a) => a.id !== actualizado.id);
      }
      return prev.map((a) => (a.id === actualizado.id ? actualizado : a));
    });
  };

  const quitar = (id: number) => {
    setAportes((prev) => prev.filter((a) => a.id !== id));
    setTotal((t) => t - 1);
  };

  const hayFiltros = q || materiaId || tagId;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Aportes</h1>
          <p>
            Resúmenes, parciales, ejercicios y links que comparten los alumnos.
            Subí lo tuyo y guardá en favoritos lo que te sirva.
          </p>
        </div>
        <Link className="btn btn-primario fab-movil" to="/aportes/nuevo">
          <span className="material-symbols-rounded">upload</span>
          Subir aporte
        </Link>
      </div>

      <div className="aportes-filtros">
        <SearchBar
          searchTerm={busqueda}
          onSearchChange={(e) => cambiarFiltro(() => setBusqueda(e.target.value))}
          placeholder="Buscar por título, descripción o materia..."
        />
        <SelectorMateria
          materias={materias}
          value={materiaId}
          onChange={(id) => cambiarFiltro(() => setMateriaId(id))}
          opcionVacia="Todas las materias"
        />
        <select
          className="control"
          aria-label="Tipo de aporte"
          value={tagId}
          onChange={(e) => cambiarFiltro(() => setTagId(Number(e.target.value)))}>
          <option value={0}>Todos los tipos</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
        <select
          className="control"
          aria-label="Orden"
          value={orden}
          onChange={(e) =>
            cambiarFiltro(() => setOrden(e.target.value as "recientes" | "populares"))
          }>
          <option value="recientes">Más recientes</option>
          <option value="populares">Más favoritos</option>
        </select>
      </div>

      <div className="aportes-barra">
        <div className="segmented" role="group" aria-label="Qué aportes ver">
          {(
            [
              ["todos", "Todos"],
              ["mios", "Mis aportes"],
              ["favoritos", "Favoritos"],
            ] as [Vista, string][]
          ).map(([valor, texto]) => (
            <button
              key={valor}
              aria-pressed={vista === valor}
              onClick={() => cambiarFiltro(() => setVista(valor))}>
              {texto}
            </button>
          ))}
        </div>
        {!cargando && (
          <span className="aportes-total">
            {total} {total === 1 ? "aporte" : "aportes"}
          </span>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}

      {aportes.length > 0 && (
        <div className="aportes-grilla">
          {aportes.map((aporte) => (
            <AporteCard
              key={aporte.id}
              aporte={aporte}
              onActualizado={actualizar}
              onBorrado={quitar}
            />
          ))}
        </div>
      )}

      {!cargando && aportes.length === 0 && !error && (
        <div className="vacio">
          {hayFiltros
            ? "No hay aportes que coincidan con la búsqueda."
            : vista === "mios"
              ? "Todavía no subiste ningún aporte."
              : vista === "favoritos"
                ? "Todavía no guardaste aportes en favoritos."
                : "Todavía no hay aportes. ¡Subí el primero!"}
        </div>
      )}

      {cargando && <p className="vacio">Cargando aportes...</p>}

      {!cargando && aportes.length < total && (
        <button className="btn btn-secundario cargar-mas" onClick={() => setPagina((p) => p + 1)}>
          Cargar más
        </button>
      )}
    </>
  );
}

export default Aportes;
