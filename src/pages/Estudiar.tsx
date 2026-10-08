import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import SelectorMateria from "../components/SelectorMateria";
import { useAuth } from "../context/authProvider";
import { mensajeDeError } from "../api/client";
import { getMaterias } from "../features/estado_academico/api";
import { borrarSesion, getRanking, getResumen, getSesiones, guardarSesion, participarEnRanking } from "../features/estudio/api";
import useTemporizador, { AJUSTES_POMODORO, formatoHoras, formatoReloj } from "../features/estudio/useTemporizador";
import { DIAS_CORTOS, desdeISO, diaSemana } from "../features/calendario/fechas";
import type { Materia, ModoEstudio, RankingEstudio, ResumenEstudio, SesionEstudio } from "../api/types";
import "./inicio.css";
import "../features/estudio/estudio.css";

// Estudiar: temporizador pomodoro o libre por materia, lo estudiado por dia y
// por materia, y un ranking semanal en el que solo aparece quien se suma.

const horaDe = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", { weekday: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

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

  const alTerminarSesion = useCallback(
    async (sesion: { modo: ModoEstudio; minutos: number; materiaId: number }) => {
      try {
        await guardarSesion({ modo: sesion.modo, minutos: sesion.minutos, materia_id: sesion.materiaId });
        toast.success(`Sumaste ${formatoHoras(sesion.minutos)} de estudio`);
        recargar();
      } catch (err) {
        toast.error(mensajeDeError(err, "No se pudo guardar la sesión"));
      }
    },
    [recargar]
  );

  const t = useTemporizador({ onSesion: alTerminarSesion });

  // El tiempo en la pestaña, para verlo desde otra
  useEffect(() => {
    const anterior = document.title;
    if (t.empezado) document.title = `${formatoReloj(t.mostrarMs)} · ${t.fase === "foco" ? "Estudiando" : "Descanso"}`;
    return () => {
      document.title = anterior;
    };
  }, [t.empezado, t.mostrarMs, t.fase]);

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

  const maxDia = Math.max(60, ...(resumen?.por_dia.map((d) => d.minutos) ?? []));
  const maxMateria = Math.max(1, ...(resumen?.por_materia.map((m) => m.minutos) ?? []));
  const radio = 88;
  const circunferencia = 2 * Math.PI * radio;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Estudiar</h1>
          <p>Medí lo que estudiás con pomodoros o con el cronómetro, y compará tu semana con la de otros.</p>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="estudio-layout">
        <section className={`card temporizador temporizador--${t.fase}`} aria-label="Temporizador">
          <div className="segmented" role="group" aria-label="Modo">
            <button type="button" aria-pressed={t.modo === "pomodoro"} disabled={t.empezado} onClick={() => t.elegirModo("pomodoro")}>
              Pomodoro
            </button>
            <button type="button" aria-pressed={t.modo === "libre"} disabled={t.empezado} onClick={() => t.elegirModo("libre")}>
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
            <SelectorMateria materias={materias} value={t.materiaId} onChange={t.elegirMateria} opcionVacia="Sin materia" />
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
              <button type="button" className="btn btn-icono" onClick={t.descartar} aria-label="Descartar" title="Descartar sin guardar">
                <span className="material-symbols-rounded">restart_alt</span>
              </button>
            )}
          </div>
          <p className="campo-ayuda temporizador__ayuda">
            {t.modo === "pomodoro"
              ? "Cada bloque de foco que terminás se guarda solo. Podés cambiar de sección: sigue contando."
              : "Cuando cortes, se guarda lo que estudiaste (desde 1 minuto)."}
          </p>
        </section>

        <div className="estudio-columna">
          {resumen && (
            <section className="estadisticas estudio-numeros" aria-label="Lo que estudiaste">
              <div className="card estadistica">
                <span className="estadistica__valor">{formatoHoras(resumen.hoy_minutos)}</span>
                <span className="estadistica__titulo">hoy</span>
              </div>
              <div className="card estadistica">
                <span className="estadistica__valor">{formatoHoras(resumen.semana_minutos)}</span>
                <span className="estadistica__titulo">esta semana</span>
              </div>
              <div className="card estadistica">
                <span className="estadistica__valor">
                  {resumen.racha_dias}
                  <small> {resumen.racha_dias === 1 ? "día" : "días"}</small>
                </span>
                <span className="estadistica__titulo">de racha</span>
              </div>
            </section>
          )}

          {resumen && (
            <section className="card inicio-seccion">
              <div className="inicio-seccion__header">
                <h2>Últimas 4 semanas</h2>
              </div>
              <div className="barras-dias" role="img" aria-label="Minutos estudiados por día en las últimas 4 semanas">
                {resumen.por_dia.map((d) => {
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
                          <div style={{ width: `${(m.minutos / maxMateria) * 100}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          )}
        </div>

        {ranking && (
          <section className="card inicio-seccion ranking">
            <div className="inicio-seccion__header">
              <h2>Ranking de la semana</h2>
              <button type="button" className="btn btn-secundario btn-chico" onClick={alternarRanking} disabled={cambiandoRanking}>
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
