import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import CondicionEnMaterias from "../features/estado_academico/CondicionEnMaterias";
import YearSelector from "../features/estado_academico/YearSelector";
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
import { NO_ME_INTERESA, esElectiva } from "../features/estado_academico/condiciones";
import { agregarVariasAlHorario, sacarVariasDelHorario } from "../features/calendario/horarioAutomatico";
import type { Condicion, CondicionPorAlumno, Materia } from "../api/types";
import "../styles.css";

const PENDIENTE = "Pendiente";
const NOMBRE_NIVEL = ["", "primer año", "segundo año", "tercer año", "cuarto año", "quinto año"];

const claseEstado = (estado: string) =>
  `estado--${estado.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-")}`;

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
  // Las electivas van aparte: se eligen, no hay que cursarlas todas
  const obligatoriasDelNivel = materiasDelNivel.filter((m) => !esElectiva(m));
  const electivasDelNivel = materiasDelNivel.filter(esElectiva);
  const aprobadas = misCondiciones.filter((c) => c.condicion === "Aprobada").length;
  // "No me interesa" se elige de a una y solo en electivas
  const estados = [PENDIENTE, ...condiciones.map((c) => c.condicion).filter((c) => c !== NO_ME_INTERESA)];

  // Marca todas las obligatorias del año que se esta viendo con el mismo
  // estado; las electivas se marcan de a una.
  const marcarTodas = async (estado: string) => {
    const nombreNivel = NOMBRE_NIVEL[nivel] ?? `nivel ${nivel}`;
    // Las electivas descartadas no se tocan
    const aCambiar = obligatoriasDelNivel.filter((m) => {
      const actual = misCondiciones.find((c) => c.materia_id === m.id)?.condicion ?? PENDIENTE;
      return actual !== estado && actual !== NO_ME_INTERESA;
    });
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
          estado === PENDIENTE || !condicion ? borrarCondicion(m.id) : setCondicion(m.id, condicion.id, null)
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
          <p>Llevá registro de tu progreso, así podés ver tus estadísticas y qué materias podés cursar en Inicio.</p>
        </div>
        <div className="estado-cabecera">
          {!cargando && (
            <span className="chip chip-azul">
              {aprobadas} de {materias.length} aprobadas
            </span>
          )}
          <Link to="/estado/importar" className="btn btn-secundario btn-chico">
            <span className="material-symbols-rounded">download</span>
            Importar de SysAcad
          </Link>
        </div>
      </div>

      <YearSelector nivelActual={nivel} onChange={setNivel} />

      {!cargando && obligatoriasDelNivel.length > 0 && (
        <div className="marcar-todas" role="group" aria-label="Marcar todas las obligatorias del año">
          <span className="marcar-todas__texto">Marcar todas las obligatorias como</span>
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
        <>
          {electivasDelNivel.length > 0 && <h2 className="estado-seccion">Obligatorias</h2>}
          <CondicionEnMaterias
            materias={obligatoriasDelNivel}
            condiciones={condiciones}
            misCondiciones={misCondiciones}
            onCambio={recargarMisCondiciones}
          />
          {electivasDelNivel.length > 0 && (
            <>
              <h2 className="estado-seccion">
                Electivas
                <span className="campo-ayuda"> · elegís cuáles cursar; las que no te interesan no aparecen en Inicio</span>
              </h2>
              <CondicionEnMaterias
                materias={electivasDelNivel}
                condiciones={condiciones}
                misCondiciones={misCondiciones}
                onCambio={recargarMisCondiciones}
              />
            </>
          )}
        </>
      )}
    </>
  );
}

export default Estado;
