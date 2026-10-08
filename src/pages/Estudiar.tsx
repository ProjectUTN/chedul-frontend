import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import SelectorMateria from "../components/SelectorMateria";
import { useAuth } from "../context/authProvider";
import { mensajeDeError } from "../api/client";
import { getMaterias } from "../features/estado_academico/api";
import { borrarSesion, getRanking, getResumen, getSesiones, participarEnRanking } from "../features/estudio/api";
import { AJUSTES_POMODORO, formatoHoras, formatoReloj } from "../features/estudio/useTemporizador";
import { SESION_GUARDADA, useTemporizadorGlobal } from "../features/estudio/TemporizadorProvider";
import { avisosSoportados } from "../features/estudio/avisosEstudio";
import { DIAS_CORTOS, desdeISO, diaSemana } from "../features/calendario/fechas";
import MetaDiaria from "../features/estudio/MetaDiaria";
import CalendarioActividad from "../features/estudio/CalendarioActividad";
import Cotizacion from "../features/estudio/Cotizacion";
import Trofeos from "../features/estudio/Trofeos";
import Tareas from "../features/estudio/Tareas";
import ProximoExamen from "../features/estudio/ProximoExamen";
import { mejorRacha } from "../features/estudio/logros";
import type { Materia, RankingEstudio, ResumenEstudio, SesionEstudio } from "../api/types";
import "./inicio.css";
import "../features/estudio/estudio.css";
import "../features/herramientas/herramientas.css";

// Estudiar: temporizador pomodoro o libre por materia, meta diaria con
// medallas, cotizacion, calendario de actividad, trofeos, tareas, cuenta
// regresiva al proximo examen y un ranking semanal en el que solo aparece
// quien se suma.

const DIAS_DE_BARRAS = 28;

const horaDe = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", {
    weekday: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function Estudiar() {
  const { user } = useAuth();
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [resumen, setResumen] = useState<ResumenEstudio | null>(null);
  const [ranking, setRanking] = useState<RankingEstudio | null>(null);
  const [sesiones, setSesiones] = useState<SesionEstudio[]>([]);
  const [cambiandoRanking, setCambiandoRanking] = useState(false);
  const [error, setError] = useState("");

  const recargar = useCallback(() => {
    getResumen()
      .then(setResumen)
      .catch((err) => setError(mensajeDeError(err, "No se pudo cargar lo que estudiaste")));
    getRanking()
      .then(setRanking)
      .catch(() => {});
    getSesiones()
      .then(setSesiones)
      .catch(() => {});
  }, []);

  useEffect(recargar, [recargar]);

  useEffect(() => {
    if (!user) return;
    getMaterias(user.carrera)
      .then((data) => setMaterias([...data].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))))
      .catch(() => {});
  }, [user]);

  // El temporizador vive en el Layout; cuando guarda una sesion hay que refrescar los numeros
  useEffect(() => {
    window.addEventListener(SESION_GUARDADA, recargar);
    return () => window.removeEventListener(SESION_GUARDADA, recargar);
  }, [recargar]);

  const { t, flotante, alternarFlotante, flotanteAparte, avisar, setAvisar } = useTemporizadorGlobal();

  // Pantalla completa del temporizador, para dejarlo a la vista mientras estudiás
  const reloj = useRef<HTMLElement>(null);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  useEffect(() => {
    const alCambiar = () => setPantallaCompleta(document.fullscreenElement === reloj.current);
    document.addEventListener("fullscreenchange", alCambiar);
    return () => document.removeEventListener("fullscreenchange", alCambiar);
  }, []);
  const alternarPantallaCompleta = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else reloj.current?.requestFullscreen().catch(() => toast.info("Tu navegador no deja usar pantalla completa"));
  };

  // Lo del bloque que esta corriendo cuenta para la meta aunque no se guardo
  const enCurso = t.empezado && t.fase === "foco" ? Math.floor(t.transcurridoMs / 60_000) : 0;
  const materiaActual = materias.find((m) => m.id === t.materiaId);

  const alternarRanking = async () => {
    if (!ranking) return;
    setCambiandoRanking(true);
    try {
      setRanking(await participarEnRanking(!ranking.participo));
    } catch (err) {
      toast.error(mensajeDeError(err));
    } finally {
      setCambiandoRanking(false);
    }
  };

  const borrar = async (sesion: SesionEstudio) => {
    try {
      await borrarSesion(sesion.id);
      toast.info("Sesión borrada");
      recargar();
    } catch (err) {
      toast.error(mensajeDeError(err));
    }
  };

  const ultimosDias = resumen?.por_dia.slice(-DIAS_DE_BARRAS) ?? [];
  const maxDia = Math.max(60, ...ultimosDias.map((d) => d.minutos));
  const maxMateria = Math.max(1, ...(resumen?.por_materia.map((m) => m.minutos) ?? []));
  const radio = 88;
  const circunferencia = 2 * Math.PI * radio;

  return (
    <>
      <div className="page-header">
        <div>
          <Link to="/herramientas" className="volver">
            <span className="material-symbols-rounded">arrow_back</span>
            Herramientas
          </Link>
          <h1>Estudiar</h1>
          <p>
            Medí lo que estudiás, ponete una meta por día, ganá medallas y trofeos, y compará tu semana con la de otros.
          </p>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="estudio-layout">
        <div className="estudio-columna">
          <section ref={reloj} className={`card temporizador temporizador--${t.fase}`} aria-label="Temporizador">
            <button
              type="button"
              className="btn btn-icono temporizador__pantalla"
              onClick={alternarPantallaCompleta}
              aria-label={pantallaCompleta ? "Salir de pantalla completa" : "Pantalla completa"}
              title={pantallaCompleta ? "Salir de pantalla completa" : "Pantalla completa"}>
              <span className="material-symbols-rounded">{pantallaCompleta ? "fullscreen_exit" : "fullscreen"}</span>
            </button>
            <div className="segmented" role="group" aria-label="Modo">
              <button
                type="button"
                aria-pressed={t.modo === "pomodoro"}
                disabled={t.empezado}
                onClick={() => t.elegirModo("pomodoro")}>
                Pomodoro
              </button>
              <button
                type="button"
                aria-pressed={t.modo === "libre"}
                disabled={t.empezado}
                onClick={() => t.elegirModo("libre")}>
                Cronómetro
              </button>
            </div>

            <div className="temporizador__reloj">
              <svg viewBox="0 0 200 200" aria-hidden="true">
                <circle className="temporizador__pista" cx="100" cy="100" r={radio} />
                <circle
                  className="temporizador__avance"
                  cx="100"
                  cy="100"
                  r={radio}
                  strokeDasharray={circunferencia}
                  strokeDashoffset={circunferencia * (1 - t.progreso)}
                />
              </svg>
              <div className="temporizador__texto">
                <span className="temporizador__fase">
                  {t.modo === "libre" ? "Cronómetro" : t.fase === "foco" ? "Foco" : "Descanso"}
                </span>
                <span className="temporizador__tiempo" role="timer">
                  {formatoReloj(t.mostrarMs)}
                </span>
                {pantallaCompleta && materiaActual && (
                  <span className="temporizador__materia-actual">{materiaActual.nombre}</span>
                )}
              </div>
            </div>

            {t.modo === "pomodoro" && (
              <div className="segmented temporizador__ajustes" role="group" aria-label="Duración">
                {AJUSTES_POMODORO.map((a) => (
                  <button
                    key={a.foco}
                    type="button"
                    disabled={t.empezado}
                    aria-pressed={t.ajustes.foco === a.foco}
                    onClick={() => t.elegirAjustes(a)}>
                    {a.foco}/{a.descanso}
                  </button>
                ))}
              </div>
            )}

            <label className="campo temporizador__materia">
              <span>Materia</span>
              <SelectorMateria
                materias={materias}
                value={t.materiaId}
                onChange={t.elegirMateria}
                opcionVacia="Sin materia"
              />
            </label>

            <div className="temporizador__acciones">
              {t.corriendo ? (
                <button type="button" className="btn btn-secundario" onClick={t.pausar}>
                  <span className="material-symbols-rounded">pause</span>
                  Pausar
                </button>
              ) : (
                <button type="button" className="btn btn-primario" onClick={t.empezar}>
                  <span className="material-symbols-rounded">play_arrow</span>
                  {t.empezado ? "Seguir" : t.fase === "descanso" ? "Empezar descanso" : "Empezar"}
                </button>
              )}
              {t.empezado && t.fase === "foco" && (
                <button type="button" className="btn btn-secundario" onClick={t.terminar}>
                  <span className="material-symbols-rounded">stop</span>
                  Terminar y guardar
                </button>
              )}
              {t.empezado && (
                <button
                  type="button"
                  className="btn btn-icono"
                  onClick={t.descartar}
                  aria-label="Descartar"
                  title="Descartar sin guardar">
                  <span className="material-symbols-rounded">restart_alt</span>
                </button>
              )}
            </div>
            <div className="temporizador__extras">
              <button
                type="button"
                className="btn btn-secundario"
                aria-pressed={flotante}
                onClick={alternarFlotante}
                title={
                  flotanteAparte
                    ? "Una ventana con el reloj que queda por encima de todo, aunque cambies de pestaña o minimices"
                    : "Una ventana con el reloj que podés mover mientras usás Chedul"
                }>
                <span className="material-symbols-rounded">picture_in_picture_alt</span>
                {flotante ? "Cerrar ventana flotante" : "Ventana flotante"}
              </button>
              {avisosSoportados() && (
                <label className="temporizador__aviso">
                  <input type="checkbox" checked={avisar} onChange={(e) => setAvisar(e.target.checked)} />
                  <span>Avisarme al terminar</span>
                </label>
              )}
            </div>
          </section>

          <Tareas materias={materias} materiaId={t.materiaId} />
        </div>

        <div className="estudio-columna">
          {resumen && (
            <MetaDiaria
              resumen={resumen}
              enCurso={enCurso}
              corriendo={t.corriendo && t.fase === "foco"}
              foco={t.ajustes.foco}
              onMetaCambiada={(meta) => setResumen((r) => (r ? { ...r, meta_diaria: meta } : r))}
            />
          )}

          {resumen && (
            <section className="estadisticas estudio-numeros" aria-label="Lo que estudiaste">
              <div className="card estadistica">
                <span className="estadistica__valor">{formatoHoras(resumen.semana_minutos)}</span>
                <span className="estadistica__titulo">esta semana</span>
              </div>
              <div className="card estadistica">
                <span className="estadistica__valor">{formatoHoras(resumen.mes_minutos)}</span>
                <span className="estadistica__titulo">este mes</span>
              </div>
              <div className="card estadistica">
                <span className="estadistica__valor">
                  {resumen.racha_dias}
                  <small> {resumen.racha_dias === 1 ? "día" : "días"}</small>
                </span>
                <span className="estadistica__titulo">
                  de racha (mejor: {Math.max(mejorRacha(resumen.por_dia), resumen.racha_dias)})
                </span>
              </div>
            </section>
          )}

          <ProximoExamen />
        </div>

        {resumen && <CalendarioActividad resumen={resumen} />}
        {resumen && <Cotizacion resumen={resumen} />}

        {resumen && (
          <section className="card inicio-seccion">
            <div className="inicio-seccion__header">
              <h2>Últimas 4 semanas</h2>
            </div>
            <div className="barras-dias" role="img" aria-label="Minutos estudiados por día en las últimas 4 semanas">
              {ultimosDias.map((d) => {
                const fecha = desdeISO(d.fecha);
                return (
                  <div
                    key={d.fecha}
                    className="barras-dias__dia"
                    title={`${DIAS_CORTOS[diaSemana(fecha) - 1]} ${fecha.getDate()}/${fecha.getMonth() + 1}: ${formatoHoras(d.minutos)}`}>
                    <div style={{ height: `${(d.minutos / maxDia) * 100}%` }} />
                  </div>
                );
              })}
            </div>
            {resumen.por_materia.length > 0 && (
              <>
                <h3 className="estudio-subtitulo">Esta semana por materia</h3>
                <ul className="barras-materias">
                  {resumen.por_materia.map((m) => (
                    <li key={m.materia_id ?? 0}>
                      <span>{m.nombre || "Sin materia"}</span>
                      <span className="campo-ayuda">{formatoHoras(m.minutos)}</span>
                      <div className="barras-materias__barra">
                        <div
                          style={{
                            width: `${(m.minutos / maxMateria) * 100}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}

        {resumen && <Trofeos resumen={resumen} />}

        {ranking && (
          <section className="card inicio-seccion ranking">
            <div className="inicio-seccion__header">
              <h2>Ranking de la semana</h2>
              <button
                type="button"
                className="btn btn-secundario btn-chico"
                onClick={alternarRanking}
                disabled={cambiandoRanking}>
                {ranking.participo ? "Salir del ranking" : "Sumarme"}
              </button>
            </div>
            <p className="campo-ayuda">
              {ranking.participo
                ? "Aparecés con tu nombre y la inicial del apellido. Se reinicia cada lunes."
                : "Si te sumás, los demás ven tu nombre, la inicial del apellido y tus horas de la semana."}
            </p>
            {ranking.puestos.length === 0 ? (
              <p className="campo-ayuda">Todavía nadie se sumó esta semana.</p>
            ) : (
              <ol className="ranking__lista">
                {ranking.puestos.map((p) => (
                  <li key={`${p.posicion}-${p.nombre}`} className={p.soy_yo ? "ranking__yo" : ""}>
                    <span className={`ranking__puesto ranking__puesto--${p.posicion}`}>{p.posicion}</span>
                    <span>{p.soy_yo ? `${p.nombre} (vos)` : p.nombre}</span>
                    <span className="ranking__minutos">{formatoHoras(p.minutos)}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}

        {sesiones.length > 0 && (
          <section className="card inicio-seccion">
            <div className="inicio-seccion__header">
              <h2>Últimas sesiones</h2>
            </div>
            <ul className="lista-materias">
              {sesiones.map((s) => (
                <li key={s.id}>
                  <span className="chip">{s.modo === "pomodoro" ? "Pomodoro" : "Cronómetro"}</span>
                  <span>
                    {s.materia?.nombre ?? "Sin materia"} · {formatoHoras(s.minutos)}
                    <span className="campo-ayuda"> · {horaDe(s.fin)}</span>
                  </span>
                  <button
                    type="button"
                    className="btn btn-icono lista-materias__link"
                    onClick={() => borrar(s)}
                    aria-label="Borrar sesión"
                    title="Borrar sesión">
                    <span className="material-symbols-rounded">delete</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}

export default Estudiar;
