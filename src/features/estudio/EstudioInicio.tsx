import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SelectorMateria from "../../components/SelectorMateria";
import { useAuth } from "../../context/authProvider";
import { getMaterias } from "../estado_academico/api";
import type { Materia, ResumenEstudio } from "../../api/types";
import { getResumen } from "./api";
import { SESION_GUARDADA, useTemporizadorGlobal } from "./TemporizadorProvider";
import { AJUSTES_POMODORO, formatoHoras, formatoReloj } from "./useTemporizador";

// Lo de estudio en Inicio: un acceso directo para arrancar el temporizador sin
// pasar por Estudiar y los numeros de hoy, la semana y la racha.

function EstudioInicio() {
  const { user } = useAuth();
  const { t } = useTemporizadorGlobal();
  const navigate = useNavigate();
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [resumen, setResumen] = useState<ResumenEstudio | null>(null);

  const cargarResumen = useCallback(() => {
    getResumen()
      .then(setResumen)
      .catch(() => {});
  }, []);

  useEffect(cargarResumen, [cargarResumen]);

  // Cuando el temporizador guarda una sesion hay que refrescar los numeros
  useEffect(() => {
    window.addEventListener(SESION_GUARDADA, cargarResumen);
    return () => window.removeEventListener(SESION_GUARDADA, cargarResumen);
  }, [cargarResumen]);

  useEffect(() => {
    if (!user) return;
    getMaterias(user.carrera)
      .then((data) => setMaterias([...data].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))))
      .catch(() => {});
  }, [user]);

  const enFoco = t.fase === "foco" || t.modo === "libre";
  // Lo del bloque que esta corriendo cuenta aunque todavia no se guardo
  const enCurso = t.empezado && enFoco ? Math.floor(t.transcurridoMs / 60_000) : 0;
  const hoy = (resumen?.hoy_minutos ?? 0) + enCurso;
  const semana = (resumen?.semana_minutos ?? 0) + enCurso;
  const meta = resumen?.meta_diaria ?? 0;
  const porcentaje = meta > 0 ? Math.min(100, Math.round((hoy / meta) * 100)) : 0;
  const materiaActual = materias.find((m) => m.id === t.materiaId);
  const etiqueta = t.modo === "libre" ? "Cronómetro" : t.fase === "foco" ? "Foco" : "Descanso";

  // Arranca el reloj y lleva directo a la pantalla de estudio
  const empezarYAbrir = () => {
    t.empezar();
    navigate("/herramientas/estudiar");
  };

  const elegirDuracion = (opcion: "libre" | number) => {
    if (opcion === "libre") {
      t.elegirModo("libre");
      return;
    }
    const ajustes = AJUSTES_POMODORO.find((a) => a.foco === opcion);
    if (!ajustes) return;
    if (t.modo !== "pomodoro") t.elegirModo("pomodoro");
    t.elegirAjustes(ajustes);
  };

  return (
    <>
      <section className={`card estudiar-ahora estudiar-ahora--${t.fase}`} aria-label="Estudiar">
        {t.empezado ? (
          <>
            <div className="estudiar-ahora__reloj">
              <span className="estudiar-ahora__fase">{etiqueta}</span>
              <span className="estudiar-ahora__tiempo" role="timer">
                {formatoReloj(t.mostrarMs)}
              </span>
              <span className="campo-ayuda">{materiaActual?.nombre ?? "Sin materia"}</span>
            </div>
            <div className="estudiar-ahora__acciones">
              {t.corriendo ? (
                <button type="button" className="btn btn-secundario" onClick={t.pausar}>
                  <span className="material-symbols-rounded">pause</span>
                  Pausar
                </button>
              ) : (
                <button type="button" className="btn btn-primario" onClick={t.empezar}>
                  <span className="material-symbols-rounded">play_arrow</span>
                  Seguir
                </button>
              )}
              {t.fase === "foco" && (
                <button type="button" className="btn btn-secundario" onClick={t.terminar}>
                  <span className="material-symbols-rounded">stop</span>
                  Terminar y guardar
                </button>
              )}
              <Link to="/herramientas/estudiar" className="btn btn-secundario">
                <span className="material-symbols-rounded">open_in_full</span>
                Abrir
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="estudiar-ahora__titulo">
              <span className="estudiar-ahora__icono material-symbols-rounded" aria-hidden="true">
                timer
              </span>
              <div>
                <h2>¿Arrancamos a estudiar?</h2>
                <p className="campo-ayuda">
                  {meta > 0 && hoy < meta
                    ? `Hoy llevás ${formatoHoras(hoy)} de ${formatoHoras(meta)}.`
                    : "Elegí y empezá."}
                </p>
              </div>
            </div>
            <div className="estudiar-ahora__controles">
              <SelectorMateria
                materias={materias}
                value={t.materiaId}
                onChange={t.elegirMateria}
                opcionVacia="Sin materia"
                ariaLabel="Materia"
              />
              <div className="segmented" role="group" aria-label="Duración">
                {AJUSTES_POMODORO.map((a) => (
                  <button
                    key={a.foco}
                    type="button"
                    aria-pressed={t.modo === "pomodoro" && t.ajustes.foco === a.foco}
                    onClick={() => elegirDuracion(a.foco)}>
                    {a.foco}/{a.descanso}
                  </button>
                ))}
                <button type="button" aria-pressed={t.modo === "libre"} onClick={() => elegirDuracion("libre")}>
                  Libre
                </button>
              </div>
              <button type="button" className="btn btn-primario" onClick={empezarYAbrir}>
                <span className="material-symbols-rounded">play_arrow</span>
                Empezar
              </button>
            </div>
          </>
        )}
      </section>

      {resumen && (
        <section className="estadisticas estadisticas--tres" aria-label="Lo que estudiaste">
          <div className="card estadistica" style={{ "--tono": "var(--accent)" } as React.CSSProperties}>
            <span className="estadistica__icono material-symbols-rounded" aria-hidden="true">
              today
            </span>
            <span className="estadistica__valor">{formatoHoras(hoy)}</span>
            <span className="estadistica__titulo">hoy · meta {formatoHoras(meta)}</span>
            <div className="barra" role="progressbar" aria-valuenow={porcentaje} aria-valuemin={0} aria-valuemax={100}>
              <div style={{ width: `${porcentaje}%` }} />
            </div>
          </div>
          <div className="card estadistica" style={{ "--tono": "var(--green)" } as React.CSSProperties}>
            <span className="estadistica__icono material-symbols-rounded" aria-hidden="true">
              date_range
            </span>
            <span className="estadistica__valor">{formatoHoras(semana)}</span>
            <span className="estadistica__titulo">esta semana</span>
          </div>
          <div className="card estadistica" style={{ "--tono": "var(--orange)" } as React.CSSProperties}>
            <span className="estadistica__icono material-symbols-rounded" aria-hidden="true">
              local_fire_department
            </span>
            <span className="estadistica__valor">
              {resumen.racha_dias}
              <small> {resumen.racha_dias === 1 ? "día" : "días"}</small>
            </span>
            <span className="estadistica__titulo">de racha estudiando</span>
          </div>
        </section>
      )}
    </>
  );
}

export default EstudioInicio;
