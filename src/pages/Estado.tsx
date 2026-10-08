import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import CondicionEnMaterias from "../features/estado_academico/CondicionEnMaterias";
import YearSelector from "../features/estado_academico/YearSelector";
import CalculadoraElectivas from "../features/estado_academico/CalculadoraElectivas";
import {
  borrarCondicion,
  getCondiciones,
  getMaterias,
  getMisCondiciones,
  setCondicion,
} from "../features/estado_academico/api";
import { useAuth } from "../context/authProvider";
import { mensajeDeError } from "../api/client";
import { confirmar } from "../components/confirmar";
import { agregarVariasAlHorario, sacarVariasDelHorario } from "../features/calendario/horarioAutomatico";
import type { Condicion, CondicionPorAlumno, Materia } from "../api/types";
import "../styles.css";

const PENDIENTE = "Pendiente";
const NOMBRE_NIVEL = ["", "primer año", "segundo año", "tercer año", "cuarto año", "quinto año"];

const claseEstado = (estado: string) =>
  `estado--${estado.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}`;

function Estado() {
  const { user } = useAuth();
  const [nivel, setNivel] = useState(1);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [condiciones, setCondiciones] = useState<Condicion[]>([]);
  const [misCondiciones, setMisCondiciones] = useState<CondicionPorAlumno[]>([]);
  const [cargando, setCargando] = useState(true);
  const [marcando, setMarcando] = useState(false);
  const [error, setError] = useState("");

  const recargarMisCondiciones = useCallback(() => {
    return getMisCondiciones()
      .then(setMisCondiciones)
      .catch((err) => setError(mensajeDeError(err)));
  }, []);

  useEffect(() => {
    if (!user) return;

    Promise.all([getMaterias(user.carrera), getCondiciones(), getMisCondiciones()])
      .then(([materias, condiciones, mis]) => {
        setMaterias(materias);
        setCondiciones(condiciones);
        setMisCondiciones(mis);
      })
      .catch((err) => setError(mensajeDeError(err, "No se pudo cargar tu estado académico")))
      .finally(() => setCargando(false));
  }, [user]);

  const materiasDelNivel = materias
    .filter((m) => m.nivel === nivel)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const aprobadas = misCondiciones.filter((c) => c.condicion === "Aprobada").length;
  const estados = [PENDIENTE, ...condiciones.map((c) => c.condicion)];

  // Marca todas las materias del año que se esta viendo con el mismo estado.
  // Las que ya estaban aprobadas conservan su nota.
  const marcarTodas = async (estado: string) => {
    const nombreNivel = NOMBRE_NIVEL[nivel] ?? `nivel ${nivel}`;
    const aCambiar = materiasDelNivel.filter(
      (m) => (misCondiciones.find((c) => c.materia_id === m.id)?.condicion ?? PENDIENTE) !== estado
    );
    if (aCambiar.length === 0) {
      toast.info(`Todas las materias de ${nombreNivel} ya están en ${estado.toLowerCase()}`);
      return;
    }
    const ok = await confirmar({
      titulo: `¿Marcar ${nombreNivel} como ${estado.toLowerCase()}?`,
      mensaje:
        aCambiar.length === 1
          ? `Se cambia 1 materia de ${nombreNivel}. Las que ya estaban así no se tocan.`
          : `Se cambian ${aCambiar.length} materias de ${nombreNivel}. Las que ya estaban así no se tocan.`,
      aceptar: "Marcar todas",
    });
    if (!ok) return;

    const condicion = condiciones.find((c) => c.condicion === estado);
    const estabanCursando = aCambiar.filter(
      (m) => misCondiciones.find((c) => c.materia_id === m.id)?.condicion === "Cursando"
    );
    setMarcando(true);
    try {
      await Promise.all(
        aCambiar.map((m) =>
          estado === PENDIENTE || !condicion
            ? borrarCondicion(m.id)
            : setCondicion(m.id, condicion.id, null)
        )
      );
      toast.success(`Listo, ${aCambiar.length} materias de ${nombreNivel} en ${estado.toLowerCase()}`);
      if (estado === "Cursando") await agregarVariasAlHorario(aCambiar);
      else if (estabanCursando.length > 0) await sacarVariasDelHorario(estabanCursando);
    } catch (err) {
      toast.error(mensajeDeError(err, "No se pudieron guardar todas, revisá la lista"));
    } finally {
      await recargarMisCondiciones();
      setMarcando(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Estado académico</h1>
          <p>
            Llevá registro de tu progreso, así podés ver tus estadísticas y qué
            materias podés cursar en Inicio.
          </p>
        </div>
        {!cargando && (
          <span className="chip chip-azul">
            {aprobadas} de {materias.length} aprobadas
          </span>
        )}
      </div>

      {!cargando && <CalculadoraElectivas materias={materias} misCondiciones={misCondiciones} />}

      <YearSelector nivelActual={nivel} onChange={setNivel} />

      {!cargando && materiasDelNivel.length > 0 && (
        <div className="marcar-todas" role="group" aria-label="Marcar todas las materias del año">
          <span className="marcar-todas__texto">Marcar todas como</span>
          <div className="marcar-todas__opciones">
            {estados.map((estado) => (
              <button
                key={estado}
                type="button"
                className={`estado-opcion marcar-todas__boton ${claseEstado(estado)}`}
                disabled={marcando}
                onClick={() => marcarTodas(estado)}>
                {estado === "Regularizada" ? "Regular" : estado}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="form-error">{error}</p>}

      {cargando ? (
        <p className="vacio">Cargando materias...</p>
      ) : (
        <CondicionEnMaterias
          materias={materiasDelNivel}
          condiciones={condiciones}
          misCondiciones={misCondiciones}
          onCambio={recargarMisCondiciones}
        />
      )}
    </>
  );
}

export default Estado;
