import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { Materia } from "../api/types";
import "./selectorMateria.css";

interface Props {
  materias: Materia[];
  value: number;
  onChange: (id: number) => void;
  // Texto de la opcion "sin materia" (Todas, Ninguna...). Sin esto no se ofrece.
  opcionVacia?: string;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}

// Saca tildes y pasa a minusculas para que "algebra" encuentre "Álgebra"
const normalizar = (texto: string) =>
  texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

type Opcion = { id: number; texto: string; nivel?: number };

// SelectorMateria es un combo donde se escribe y se va filtrando la lista de
// materias. Reemplaza al <select> de materias, que con 50 opciones era incomodo.
function SelectorMateria({
  materias,
  value,
  onChange,
  opcionVacia,
  placeholder = "Escribí para buscar la materia",
  ariaLabel = "Materia",
  className = "",
}: Props) {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [activa, setActiva] = useState(0);
  const contenedor = useRef<HTMLDivElement>(null);
  const lista = useRef<HTMLUListElement>(null);

  const seleccionada = materias.find((m) => m.id === value);

  const opciones = useMemo<Opcion[]>(() => {
    const palabras = normalizar(texto).split(/\s+/).filter(Boolean);
    const filtradas = materias
      .filter((m) => {
        const nombre = normalizar(m.nombre);
        return palabras.every((p) => nombre.includes(p));
      })
      .sort((a, b) => a.nivel - b.nivel || a.nombre.localeCompare(b.nombre, "es"))
      .map((m) => ({ id: m.id, texto: m.nombre, nivel: m.nivel }));
    return opcionVacia && !palabras.length ? [{ id: 0, texto: opcionVacia }, ...filtradas] : filtradas;
  }, [materias, texto, opcionVacia]);

  // Al cerrar se vuelve a mostrar el nombre de la materia elegida
  useEffect(() => {
    if (!abierto) setTexto("");
  }, [abierto]);

  useEffect(() => {
    setActiva(0);
  }, [texto]);

  useEffect(() => {
    if (!abierto) return;
    lista.current?.querySelector<HTMLElement>(`[data-indice="${activa}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activa, abierto]);

  useEffect(() => {
    if (!abierto) return;
    const cerrarAfuera = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", cerrarAfuera);
    return () => document.removeEventListener("mousedown", cerrarAfuera);
  }, [abierto]);

  const elegir = (opcion: Opcion) => {
    onChange(opcion.id);
    setAbierto(false);
  };

  const teclado = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!abierto) setAbierto(true);
      else setActiva((i) => Math.min(i + 1, opciones.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiva((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (abierto && opciones[activa]) {
        e.preventDefault();
        elegir(opciones[activa]);
      }
    } else if (e.key === "Escape") {
      if (abierto) {
        e.preventDefault();
        e.stopPropagation();
        setAbierto(false);
      }
    } else if (e.key === "Tab") {
      setAbierto(false);
    }
  };

  const mostrado = abierto ? texto : (seleccionada?.nombre ?? (value === 0 && opcionVacia ? opcionVacia : ""));

  return (
    <div className={`selector-materia ${className}`} ref={contenedor}>
      <input
        type="text"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={abierto}
        aria-controls={`${id}-lista`}
        aria-autocomplete="list"
        aria-activedescendant={abierto && opciones[activa] ? `${id}-${activa}` : undefined}
        autoComplete="off"
        className="control selector-materia__input"
        placeholder={abierto && seleccionada ? seleccionada.nombre : placeholder}
        value={mostrado}
        onChange={(e) => {
          setTexto(e.target.value);
          setAbierto(true);
        }}
        onFocus={(e) => {
          e.target.select();
          setAbierto(true);
        }}
        onClick={() => setAbierto(true)}
        onKeyDown={teclado}
      />
      <span className="material-symbols-rounded selector-materia__icono" aria-hidden="true">
        {abierto ? "search" : "expand_more"}
      </span>

      {abierto && (
        <ul className="selector-materia__lista" role="listbox" id={`${id}-lista`} ref={lista}>
          {opciones.length === 0 && <li className="selector-materia__vacio">No hay materias con ese nombre</li>}
          {opciones.map((opcion, i) => (
            <li
              key={opcion.id}
              id={`${id}-${i}`}
              data-indice={i}
              role="option"
              aria-selected={opcion.id === value}
              className={`selector-materia__opcion${i === activa ? " selector-materia__opcion--activa" : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActiva(i)}
              onClick={() => elegir(opcion)}>
              <span>{opcion.texto}</span>
              {opcion.nivel !== undefined && <small>{opcion.nivel}° año</small>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SelectorMateria;
