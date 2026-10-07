import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  borrarCondicion,
  getCondiciones,
  getMaterias,
  getMisCondiciones,
  getProgreso,
  setCondicion,
} from "../features/estado_academico/api";
import {
  armarGrafo,
  caminoArista,
  cumple,
  ESTADOS,
  estadosDesdeProgreso,
  NODO_ALTO,
  NODO_ANCHO,
  relacionadas,
  type EstadoMapa,
} from "../features/correlativas/layout";
import { useAuth } from "../context/authProvider";
import { mensajeDeError } from "../api/client";
import type { Condicion, CondicionPorAlumno, Materia } from "../api/types";
import "../features/correlativas/correlativas.css";

const NIVELES = ["", "Primer año", "Segundo año", "Tercer año", "Cuarto año", "Quinto año", "Sexto año"];

function MapaCorrelativas() {
  const { user } = useAuth();
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [estados, setEstados] = useState<Map<number, EstadoMapa>>(new Map());
  const [condiciones, setCondiciones] = useState<Condicion[]>([]);
  const [misCondiciones, setMisCondiciones] = useState<CondicionPorAlumno[]>([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [conElectivas, setConElectivas] = useState(false);

  const [seleccionada, setSeleccionada] = useState<number | null>(null);
  const [encima, setEncima] = useState<number | null>(null);
  const panel = useRef<HTMLElement>(null);

  const cargarEstado = useCallback(async () => {
    const [progreso, mias] = await Promise.all([getProgreso(), getMisCondiciones()]);
    setEstados(estadosDesdeProgreso(progreso));
    setMisCondiciones(mias);
  }, []);

  useEffect(() => {
    if (!user) return;
    Promise.all([getMaterias(user.carrera), getCondiciones(), cargarEstado()])
      .then(([mats, conds]) => {
        setMaterias(mats);
        setCondiciones(conds);
      })
      .catch((err) => setError(mensajeDeError(err, "No se pudo cargar el plan")))
      .finally(() => setCargando(false));
  }, [user, cargarEstado]);

  // Las electivas se muestran a pedido para que el mapa no quede tan cargado
  const visibles = useMemo(
    () => (conElectivas ? materias : materias.filter((m) => m.tipo !== "Electiva")),
    [materias, conElectivas]
  );
  const grafo = useMemo(() => armarGrafo(visibles), [visibles]);

  // La materia activa es la que tiene el mouse encima o, si no, la elegida
  const activa = encima ?? seleccionada;
  const relacion = useMemo(
    () => (activa ? relacionadas(grafo, activa) : null),
    [grafo, activa]
  );

  const conteo = useMemo(() => {
    const c = new Map<EstadoMapa, number>();
    estados.forEach((estado, id) => {
      if (grafo.nodos.has(id)) c.set(estado, (c.get(estado) ?? 0) + 1);
    });
    return c;
  }, [estados, grafo]);

  const elegir = (id: number) => {
    const nueva = seleccionada === id ? null : id;
    setSeleccionada(nueva);
    // En pantallas chicas el panel queda abajo del mapa
    if (nueva && window.innerWidth <= 1100) {
      setTimeout(() => panel.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    }
  };

  const claseNodo = (id: number) => {
    const clases = ["nodo", `nodo--${estados.get(id) ?? "bloqueada"}`];
    if (id === seleccionada) clases.push("nodo--seleccionado");
    if (relacion && id !== activa) {
      if (relacion.previas.has(id)) clases.push("nodo--previa");
      else if (relacion.habilita.has(id)) clases.push("nodo--habilita");
      else clases.push("nodo--atenuado");
    }
    return clases.join(" ");
  };

  const claseArista = (desde: number, hasta: number, tipo: string) => {
    const clases = ["arista", `arista--${tipo}`];
    if (relacion && activa) {
      const haciaAtras = (hasta === activa || relacion.previas.has(hasta)) && relacion.previas.has(desde);
      const haciaAdelante = (desde === activa || relacion.habilita.has(desde)) && relacion.habilita.has(hasta);
      if (haciaAtras) clases.push("arista--previa");
      else if (haciaAdelante) clases.push("arista--habilita");
      else clases.push("arista--atenuada");
    }
    return clases.join(" ");
  };

  const materia = seleccionada ? grafo.nodos.get(seleccionada)?.materia : undefined;
  const miCondicion = misCondiciones.find((c) => c.materia_id === seleccionada);
  const condicionAprobada = condiciones.find((c) => c.condicion === "Aprobada");

  const cambiarCondicion = async (condicionId: number, nota: number | null) => {
    if (!materia) return;
    setGuardando(true);
    try {
      if (condicionId === 0) await borrarCondicion(materia.id);
      else await setCondicion(materia.id, condicionId, nota);
      await cargarEstado();
    } catch (err) {
      toast.error(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const habilitaDirecto = materia ? visibles.filter((m) => m.correlativas.some((c) => c.materia_id === materia.id)) : [];

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Mapa de correlativas</h1>
          <p>
            Tocá una materia para ver qué necesitás para cursarla y qué te habilita. También podés cambiar su
            estado desde acá.
          </p>
        </div>
      </header>

      {error && <p className="form-error">{error}</p>}

      <ul className="mapa-leyenda" aria-label="Referencias">
        {ESTADOS.map((e) => (
          <li key={e.valor}>
            <span className={`mapa-leyenda__muestra nodo--${e.valor}`} />
            {e.nombre}
            <b>{conteo.get(e.valor) ?? 0}</b>
          </li>
        ))}
        <li className="mapa-leyenda__flechas">
          <svg width="28" height="8" aria-hidden="true">
            <line x1="0" y1="4" x2="28" y2="4" className="arista arista--aprobada" />
          </svg>
          Pide aprobada
        </li>
        <li className="mapa-leyenda__flechas">
          <svg width="28" height="8" aria-hidden="true">
            <line x1="0" y1="4" x2="28" y2="4" className="arista arista--regular" />
          </svg>
          Pide regular
        </li>
        <li className="mapa-leyenda__electivas">
          <label>
            <input
              type="checkbox"
              checked={conElectivas}
              onChange={(e) => {
                setConElectivas(e.target.checked);
                setSeleccionada(null);
              }}
            />
            Mostrar electivas
          </label>
        </li>
      </ul>

      {cargando ? (
        <p className="vacio">Cargando el plan...</p>
      ) : (
        <div className="mapa-layout">
          <div className="mapa-scroll">
            <div className="mapa" style={{ width: grafo.ancho, height: grafo.alto }}>
              {grafo.niveles.map((nivel, i) => (
                <span
                  key={nivel}
                  className="mapa__nivel"
                  style={{ left: grafo.nodos.size ? 8 + i * (NODO_ANCHO + 76) : 0, width: NODO_ANCHO }}>
                  {NIVELES[nivel] ?? `Nivel ${nivel}`}
                </span>
              ))}

              <svg className="mapa__aristas" width={grafo.ancho} height={grafo.alto} aria-hidden="true">
                <defs>
                  <marker id="punta" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 z" fill="context-stroke" />
                  </marker>
                </defs>
                {grafo.aristas.map((a) => (
                  <path
                    key={`${a.desde}-${a.hasta}`}
                    d={caminoArista(grafo, a)}
                    className={claseArista(a.desde, a.hasta, a.tipo)}
                    markerEnd="url(#punta)"
                  />
                ))}
              </svg>

              {[...grafo.nodos.values()].map(({ materia: m, x, y }) => (
                <button
                  key={m.id}
                  type="button"
                  className={claseNodo(m.id)}
                  style={{ left: x, top: y, width: NODO_ANCHO, height: NODO_ALTO }}
                  onClick={() => elegir(m.id)}
                  onMouseEnter={() => setEncima(m.id)}
                  onMouseLeave={() => setEncima(null)}
                  onFocus={() => setEncima(m.id)}
                  onBlur={() => setEncima(null)}
                  aria-pressed={m.id === seleccionada}>
                  <span className="nodo__nombre">{m.nombre}</span>
                  <span className="nodo__meta">
                    {m.cuatrimestre || "—"} · {m.carga_horaria} hs/sem
                  </span>
                </button>
              ))}
            </div>
          </div>

          <aside ref={panel} className="card mapa-panel" aria-live="polite">
            {!materia ? (
              <div className="mapa-panel__vacio">
                <span className="material-symbols-rounded">touch_app</span>
                <p>Elegí una materia del mapa para ver el detalle.</p>
              </div>
            ) : (
              <>
                <div>
                  <span className={`chip mapa-panel__estado nodo--${estados.get(materia.id) ?? "bloqueada"}`}>
                    {ESTADOS.find((e) => e.valor === (estados.get(materia.id) ?? "bloqueada"))?.nombre}
                  </span>
                  <h2>{materia.nombre}</h2>
                  <p className="mapa-panel__meta">
                    {NIVELES[materia.nivel]} · {materia.cuatrimestre || "Sin cuatrimestre"} · {materia.horas} hs totales
                  </p>
                </div>

                <div className="mapa-panel__condicion">
                  <label className="campo">
                    <span>Mi estado</span>
                    <select
                      value={miCondicion?.condicion_id ?? 0}
                      disabled={guardando}
                      onChange={(e) => cambiarCondicion(Number(e.target.value), null)}>
                      <option value={0}>Pendiente</option>
                      {condiciones.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.condicion}
                        </option>
                      ))}
                    </select>
                  </label>
                  {condicionAprobada && miCondicion?.condicion_id === condicionAprobada.id && (
                    <label className="campo">
                      <span>Nota</span>
                      <select
                        value={miCondicion.nota ?? 0}
                        disabled={guardando}
                        onChange={(e) =>
                          cambiarCondicion(condicionAprobada.id, Number(e.target.value) || null)
                        }>
                        <option value={0}>Sin nota</option>
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>

                <section>
                  <h3>Para cursarla necesitás</h3>
                  {materia.correlativas.length === 0 ? (
                    <p className="mapa-panel__nada">Nada, no tiene correlativas.</p>
                  ) : (
                    <ul className="mapa-panel__lista">
                      {materia.correlativas.map((c) => {
                        const ok = cumple(c.tipo, estados.get(c.materia_id));
                        return (
                          <li key={c.materia_id} className={ok ? "ok" : "falta"}>
                            <span className="material-symbols-rounded">{ok ? "check_circle" : "cancel"}</span>
                            <button type="button" onClick={() => elegir(c.materia_id)}>
                              {c.nombre}
                            </button>
                            <small>{c.tipo === "aprobada" ? "aprobada" : "regular"}</small>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>

                <section>
                  <h3>Te habilita</h3>
                  {habilitaDirecto.length === 0 ? (
                    <p className="mapa-panel__nada">No es correlativa de ninguna materia.</p>
                  ) : (
                    <ul className="mapa-panel__lista">
                      {habilitaDirecto.map((m) => (
                        <li key={m.id}>
                          <span className="material-symbols-rounded">arrow_forward</span>
                          <button type="button" onClick={() => elegir(m.id)}>
                            {m.nombre}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <Link className="btn btn-secundario" to={`/aportes?materia_id=${materia.id}`}>
                  <span className="material-symbols-rounded">library_books</span>
                  Ver aportes de esta materia
                </Link>
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

export default MapaCorrelativas;
