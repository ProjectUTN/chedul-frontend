import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import ImportarSysacad from "./ImportarSysacad";
import SelectorEstado, { type OpcionEstado } from "../components/SelectorEstado";
import { useAuth } from "../context/authProvider";
import { mensajeDeError } from "../api/client";
import {
  borrarCondicion,
  getCondiciones,
  getMaterias,
  getMisCondiciones,
  setCondicion,
} from "../features/estado_academico/api";
import { esElectiva } from "../features/estado_academico/condiciones";
import { agregarVariasAlHorario } from "../features/calendario/horarioAutomatico";
import { fueraDeCuatrimestre } from "../features/calendario/comisiones";
import { marcarBienvenidaVista } from "../features/bienvenida/bienvenida";
import logo from "../assets/1B-Chedul_Logo_Horizontal_Azul.svg";
import type { Condicion, CondicionPorAlumno, Materia } from "../api/types";
import "../features/estado_academico/condicionEnMaterias.css";
import "../features/importar/importar.css";
import "../features/bienvenida/bienvenida.css";

// Bienvenida: la primera vez que entra, el alumno carga su estado academico
// importandolo de SysAcad o año por año. Con eso se calcula todo lo demas.

const PENDIENTE = "Pendiente";
type Estado = typeof PENDIENTE | "Cursando" | "Regularizada" | "Aprobada";
const OPCIONES: OpcionEstado[] = [
  { valor: PENDIENTE, texto: "Pendiente", icono: "hourglass_empty", color: "pendiente" },
  { valor: "Cursando", texto: "Cursando", icono: "menu_book", color: "cursando" },
  { valor: "Regularizada", texto: "Regular", icono: "fact_check", color: "regularizada" },
  { valor: "Aprobada", texto: "Aprobada", icono: "workspace_premium", color: "aprobada" },
];
const NOMBRE_NIVEL = ["", "1er año", "2do año", "3er año", "4to año", "5to año"];
const NIVELES = [1, 2, 3, 4, 5];

type Paso =
  | { tipo: "inicio" }
  | { tipo: "importar" }
  | { tipo: "anio" }
  | { tipo: "nivel"; nivel: number }
  | { tipo: "listo" };

const cantidad = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

// Orden de los pasos, para saber si se avanza o se vuelve
const orden = (p: Paso) =>
  p.tipo === "inicio" ? 0 : p.tipo === "listo" ? 9 : p.tipo === "nivel" ? 2 + p.nivel / 10 : 1;

// Papelitos del final: posiciones y colores al azar, una sola vez
const PAPELITOS = Array.from({ length: 36 }, (_, i) => ({
  izquierda: Math.random() * 100,
  demora: Math.random() * 0.6,
  duracion: 1.8 + Math.random() * 1.4,
  giro: Math.round(Math.random() * 720 - 360),
  color: ["#5b8cff", "#8b5cf6", "#22c55e", "#f59e0b", "#ec4899"][i % 5],
}));

const claseEstado = (estado: string) => `estado--${estado.toLowerCase()}`;

function Bienvenida() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paso, setPaso] = useState<Paso>({ tipo: "inicio" });
  // Para animar: hacia adelante entra desde la derecha, hacia atras desde la izquierda
  const [direccion, setDireccion] = useState<"adelante" | "atras">("adelante");
  const pantalla = useRef<HTMLDivElement>(null);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [condiciones, setCondiciones] = useState<Condicion[]>([]);
  const [mis, setMis] = useState<CondicionPorAlumno[]>([]);
  // Lo que va eligiendo en el modo a mano, por materia
  const [elegidos, setElegidos] = useState<Record<number, Estado>>({});
  const [anio, setAnio] = useState(1);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.all([getMaterias(user.carrera), getCondiciones(), getMisCondiciones()])
      .then(([materias, condiciones, mis]) => {
        setMaterias(materias);
        setCondiciones(condiciones);
        setMis(mis);
      })
      .catch((err) => setError(mensajeDeError(err, "No se pudieron cargar las materias")));
  }, [user]);

  // Las materias aparecen a medida que se scrollea hasta ellas
  useEffect(() => {
    const raiz = pantalla.current;
    if (!raiz) return;
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas
          .filter((e) => e.isIntersecting)
          .forEach((e, i) => {
            const el = e.target as HTMLElement;
            el.style.transitionDelay = `${i * 70}ms`;
            el.classList.add("visible");
            observador.unobserve(el);
          });
      },
      { root: raiz, threshold: 0.15 }
    );
    raiz.querySelectorAll(".revelar:not(.visible)").forEach((el) => observador.observe(el));
    return () => observador.disconnect();
  });

  const ir = (siguiente: Paso) => {
    setDireccion(orden(siguiente) >= orden(paso) ? "adelante" : "atras");
    setPaso(siguiente);
    pantalla.current?.scrollTo({ top: 0 });
  };

  const delNivel = (nivel: number) =>
    materias.filter((m) => m.nivel === nivel).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const terminar = (destino = "/inicio") => {
    if (user) marcarBienvenidaVista(user.id);
    navigate(destino, { replace: true });
  };

  // Elegir el año arma una propuesta: lo de antes aprobado, lo del año en curso
  // cursando y el resto pendiente. Despues se corrige año por año.
  const elegirAnio = (nivel: number) => {
    setAnio(nivel);
    const propuesta: Record<number, Estado> = {};
    for (const m of materias) {
      if (esElectiva(m)) continue;
      // Del año que cursa, las de un cuatrimestre que ya paso (o no empezo)
      // no pueden estar en curso: se proponen regulares
      if (m.nivel === nivel) propuesta[m.id] = fueraDeCuatrimestre(m.cuatrimestre) ? "Regularizada" : "Cursando";
      else propuesta[m.id] = m.nivel < nivel ? "Aprobada" : PENDIENTE;
    }
    setElegidos(propuesta);
    ir({ tipo: "nivel", nivel: 1 });
  };

  const estadoDe = (id: number): Estado => elegidos[id] ?? PENDIENTE;
  const elegir = (id: number, estado: Estado) => setElegidos((e) => ({ ...e, [id]: estado }));
  const marcarNivel = (nivel: number, estado: Estado) =>
    setElegidos((e) => {
      const nuevos = { ...e };
      for (const m of delNivel(nivel)) if (!esElectiva(m)) nuevos[m.id] = estado;
      return nuevos;
    });

  const resumen = useMemo(() => {
    const cuenta = { Aprobada: 0, Cursando: 0, Regularizada: 0 };
    for (const estado of Object.values(elegidos)) if (estado !== PENDIENTE) cuenta[estado]++;
    return cuenta;
  }, [elegidos]);

  const guardar = async () => {
    setGuardando(true);
    setError("");
    try {
      const cambios = materias.filter((m) => {
        const actual = mis.find((c) => c.materia_id === m.id)?.condicion ?? PENDIENTE;
        return estadoDe(m.id) !== actual;
      });
      await Promise.all(
        cambios.map((m) => {
          const condicion = condiciones.find((c) => c.condicion === estadoDe(m.id));
          return condicion ? setCondicion(m.id, condicion.id, null) : borrarCondicion(m.id);
        })
      );
      const cursando = materias.filter((m) => estadoDe(m.id) === "Cursando");
      if (cursando.length > 0) await agregarVariasAlHorario(cursando);
      ir({ tipo: "listo" });
    } catch (err) {
      setError(mensajeDeError(err, "No se pudo guardar todo, probá de nuevo"));
    } finally {
      setGuardando(false);
    }
  };

  const filaMateria = (m: Materia) => {
    const actual = estadoDe(m.id);
    return (
      <li key={m.id} className={`bienvenida-materia revelar ${claseEstado(actual)}`}>
        <span className="bienvenida-materia__nombre">{m.nombre}</span>
        <SelectorEstado
          opciones={OPCIONES}
          valor={actual}
          onChange={(v) => elegir(m.id, v as Estado)}
          etiqueta={`Estado de ${m.nombre}`}
        />
      </li>
    );
  };

  const contenido = () => {
    switch (paso.tipo) {
      case "inicio":
        return (
          <>
            <img src="/favicon.svg" alt="" className="bienvenida__mascota" aria-hidden="true" />
            <h1>¡Hola{user?.nombre ? `, ${user.nombre.split(" ")[0]}` : ""}! Armemos tu carrera</h1>
            <p className="bienvenida__bajada">
              Contanos cómo vas y Chedul calcula qué podés cursar, tu progreso y tus horarios.
            </p>
            <div className="bienvenida-opciones">
              <button
                type="button"
                className="bienvenida-opcion bienvenida-opcion--destacada opcion--azul"
                onClick={() => ir({ tipo: "importar" })}>
                <span className="bienvenida-opcion__icono material-symbols-rounded">bolt</span>
                <span className="bienvenida-opcion__texto">
                  <strong>Importar de SysAcad</strong>
                  <span>Copiás tu estado académico y listo. Lo más rápido.</span>
                </span>
                <span className="bienvenida-opcion__flecha material-symbols-rounded">arrow_forward</span>
                <span className="bienvenida-opcion__sello">Recomendado</span>
              </button>
              <button type="button" className="bienvenida-opcion opcion--lila" onClick={() => ir({ tipo: "anio" })}>
                <span className="bienvenida-opcion__icono material-symbols-rounded">checklist</span>
                <span className="bienvenida-opcion__texto">
                  <strong>Completarlo a mano</strong>
                  <span>Te preguntamos año por año, con todo ya sugerido.</span>
                </span>
                <span className="bienvenida-opcion__flecha material-symbols-rounded">arrow_forward</span>
              </button>
              <button type="button" className="bienvenida-opcion opcion--verde" onClick={() => elegirAnio(1)}>
                <span className="bienvenida-opcion__icono material-symbols-rounded">rocket_launch</span>
                <span className="bienvenida-opcion__texto">
                  <strong>Recién empiezo</strong>
                  <span>Arrancás 1er año: te armamos el horario.</span>
                </span>
                <span className="bienvenida-opcion__flecha material-symbols-rounded">arrow_forward</span>
              </button>
            </div>
            <button type="button" className="bienvenida__despues" onClick={() => terminar()}>
              Lo hago después
            </button>
          </>
        );

      case "importar":
        return (
          <>
            <h1>Importar de SysAcad</h1>
            <div className="bienvenida__importar">
              <ImportarSysacad embebido alTerminar={() => ir({ tipo: "listo" })} />
            </div>
            <div className="bienvenida-navegacion">
              <button type="button" className="btn btn-secundario" onClick={() => ir({ tipo: "inicio" })}>
                Atrás
              </button>
            </div>
          </>
        );

      case "anio":
        return (
          <>
            <h1>¿En qué año estás?</h1>
            <p className="bienvenida__bajada">
              Marcamos como aprobado lo de los años anteriores y como cursando lo de tu año. En el próximo paso lo
              corregís.
            </p>
            <div className="bienvenida-anios">
              {NIVELES.map((n) => (
                <button key={n} type="button" className="bienvenida-anio" onClick={() => elegirAnio(n)}>
                  <strong>{n}°</strong>
                  <span>{NOMBRE_NIVEL[n]}</span>
                </button>
              ))}
            </div>
            <div className="bienvenida-navegacion">
              <button type="button" className="btn btn-secundario" onClick={() => ir({ tipo: "inicio" })}>
                Atrás
              </button>
            </div>
          </>
        );

      case "nivel": {
        const { nivel } = paso;
        const lista = delNivel(nivel);
        const obligatorias = lista.filter((m) => !esElectiva(m));
        const electivas = lista.filter(esElectiva);
        const ultimo = nivel >= anio;
        return (
          <>
            <div className="bienvenida-progreso" aria-label={`Año ${nivel} de ${anio}`}>
              {NIVELES.filter((n) => n <= anio).map((n) => (
                <span key={n} className={n <= nivel ? "activo" : ""} />
              ))}
            </div>
            <h1>{NOMBRE_NIVEL[nivel]}</h1>
            <p className="bienvenida__bajada">Revisá cada materia. Las notas las podés cargar después.</p>
            <div className="bienvenida-rapido">
              <span>Marcar todas</span>
              {OPCIONES.map((o) => (
                <button
                  key={o.valor}
                  type="button"
                  className={`bienvenida-rapido__boton estado--${o.color}`}
                  onClick={() => marcarNivel(nivel, o.valor as Estado)}>
                  <span className="material-symbols-rounded" aria-hidden="true">
                    {o.icono}
                  </span>
                  {o.texto}
                </button>
              ))}
            </div>
            <ul className="bienvenida-materias">{obligatorias.map(filaMateria)}</ul>
            {electivas.length > 0 && (
              <details className="importar-mas">
                <summary>Electivas de {NOMBRE_NIVEL[nivel]} (opcional)</summary>
                <ul className="bienvenida-materias">{electivas.map(filaMateria)}</ul>
              </details>
            )}
            {error && <p className="form-error">{error}</p>}
            <div className="bienvenida-navegacion">
              <button
                type="button"
                className="btn btn-secundario"
                onClick={() => ir(nivel === 1 ? { tipo: "anio" } : { tipo: "nivel", nivel: nivel - 1 })}>
                Atrás
              </button>
              {ultimo ? (
                <button type="button" className="btn btn-primario" disabled={guardando} onClick={guardar}>
                  {guardando ? "Guardando..." : "Guardar y terminar"}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primario"
                  onClick={() => ir({ tipo: "nivel", nivel: nivel + 1 })}>
                  Siguiente: {NOMBRE_NIVEL[nivel + 1]}
                </button>
              )}
            </div>
            {ultimo && nivel < 5 && (
              <button
                type="button"
                className="bienvenida__despues"
                onClick={() => {
                  setAnio(nivel + 1);
                  ir({ tipo: "nivel", nivel: nivel + 1 });
                }}>
                Tengo materias de {NOMBRE_NIVEL[nivel + 1]}
              </button>
            )}
          </>
        );
      }

      case "listo":
        return (
          <>
            <div className="papelitos" aria-hidden="true">
              {PAPELITOS.map((p, i) => (
                <span
                  key={i}
                  style={
                    {
                      left: `${p.izquierda}%`,
                      background: p.color,
                      animationDelay: `${p.demora}s`,
                      animationDuration: `${p.duracion}s`,
                      "--giro": `${p.giro}deg`,
                    } as CSSProperties
                  }
                />
              ))}
            </div>
            <span className="bienvenida__check material-symbols-rounded" aria-hidden="true">
              celebration
            </span>
            <h1>¡Listo!</h1>
            {resumen.Aprobada + resumen.Cursando + resumen.Regularizada > 0 && (
              <p className="bienvenida__bajada">
                Cargaste {cantidad(resumen.Aprobada, "aprobada", "aprobadas")},{" "}
                {cantidad(resumen.Regularizada, "regular", "regulares")} y {resumen.Cursando} en curso.
              </p>
            )}
            <p className="bienvenida__bajada">
              En Inicio vas a ver tu progreso y qué materias podés cursar. Lo podés cambiar cuando quieras desde Estado
              académico.
            </p>
            <div className="bienvenida-navegacion bienvenida-navegacion--centro">
              <button type="button" className="btn btn-primario" onClick={() => terminar()}>
                Ir a mi inicio
              </button>
            </div>
          </>
        );
    }
  };

  return (
    <div className="bienvenida" ref={pantalla}>
      <header className="bienvenida__barra">
        <img src={logo} alt="Chedul" />
      </header>
      <main
        key={paso.tipo === "nivel" ? `nivel-${paso.nivel}` : paso.tipo}
        className={`bienvenida__contenido bienvenida__contenido--${paso.tipo} bienvenida__contenido--${direccion}`}>
        {materias.length === 0 && !error ? <p className="vacio">Cargando...</p> : contenido()}
        {error && paso.tipo === "inicio" && <p className="form-error">{error}</p>}
      </main>
    </div>
  );
}

export default Bienvenida;
