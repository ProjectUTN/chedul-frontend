import { useCallback, useEffect, useRef, useState } from "react";
import type { ModoEstudio } from "../../api/types";

// Temporizador de estudio. El estado se guarda en localStorage con la hora de
// inicio, asi sigue contando aunque el alumno cambie de seccion o recargue.

export type Fase = "foco" | "descanso";

export interface Ajustes {
  foco: number; // minutos
  descanso: number;
}

export const AJUSTES_POMODORO: Ajustes[] = [
  { foco: 25, descanso: 5 },
  { foco: 50, descanso: 10 },
];

interface Estado {
  modo: ModoEstudio;
  fase: Fase;
  ajustes: Ajustes;
  materiaId: number;
  // Milisegundos ya contados antes del tramo actual (por las pausas)
  acumulado: number;
  // Cuando arranco el tramo actual; null si esta en pausa o sin empezar
  desde: number | null;
}

const CLAVE = "chedul.temporizador";

const INICIAL: Estado = {
  modo: "pomodoro",
  fase: "foco",
  ajustes: AJUSTES_POMODORO[0],
  materiaId: 0,
  acumulado: 0,
  desde: null,
};

const leer = (): Estado => {
  try {
    const guardado = localStorage.getItem(CLAVE);
    return guardado ? { ...INICIAL, ...JSON.parse(guardado) } : INICIAL;
  } catch {
    return INICIAL;
  }
};

const escribir = (estado: Estado) => {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
  } catch {
    // Sin storage el temporizador anda igual mientras la pagina este abierta
  }
};

const transcurrido = (e: Estado, ahora: number) => e.acumulado + (e.desde ? ahora - e.desde : 0);

const duracionFase = (e: Estado) => (e.fase === "foco" ? e.ajustes.foco : e.ajustes.descanso) * 60_000;

// Un pitido corto para avisar que termino una fase
const pitar = () => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.frequency.value = 880;
    vol.gain.setValueAtTime(0.2, ctx.currentTime);
    vol.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.connect(vol).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch {
    // Sin audio no pasa nada
  }
};

interface Opciones {
  // Se llama cuando termina un bloque de foco o el alumno corta: hay que guardarlo
  onSesion: (sesion: { modo: ModoEstudio; minutos: number; materiaId: number }) => void;
}

export default function useTemporizador({ onSesion }: Opciones) {
  const [estado, setEstado] = useState<Estado>(leer);
  const [ahora, setAhora] = useState(() => Date.now());
  const onSesionRef = useRef(onSesion);
  onSesionRef.current = onSesion;
  // Fase ya cerrada, para no guardar dos veces el mismo foco
  const cerrada = useRef("");

  const actualizar = useCallback((cambio: (e: Estado) => Estado) => {
    setEstado((e) => {
      const nuevo = cambio(e);
      escribir(nuevo);
      return nuevo;
    });
  }, []);

  const corriendo = estado.desde !== null;
  const ms = transcurrido(estado, ahora);

  useEffect(() => {
    if (!corriendo) return;
    const id = window.setInterval(() => setAhora(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [corriendo]);

  // Fin de una fase del pomodoro: el foco se guarda y arranca el descanso;
  // al terminar el descanso queda listo para el proximo foco
  useEffect(() => {
    if (estado.modo !== "pomodoro" || !corriendo || ms < duracionFase(estado)) return;
    const clave = `${estado.fase}-${estado.desde}-${estado.acumulado}`;
    if (cerrada.current === clave) return;
    cerrada.current = clave;
    pitar();
    if (estado.fase === "foco") {
      onSesionRef.current({ modo: "pomodoro", minutos: estado.ajustes.foco, materiaId: estado.materiaId });
      // El descanso arranca cuando termino el foco, aunque se note despues
      const finFoco = (estado.desde ?? Date.now()) + duracionFase(estado) - estado.acumulado;
      actualizar((e) => ({ ...e, fase: "descanso", acumulado: 0, desde: finFoco }));
    } else {
      actualizar((e) => ({ ...e, fase: "foco", acumulado: 0, desde: null }));
    }
  }, [estado, corriendo, ms, actualizar]);

  const empezar = () => actualizar((e) => (e.desde ? e : { ...e, desde: Date.now() }));

  const pausar = () => actualizar((e) => (e.desde ? { ...e, acumulado: transcurrido(e, Date.now()), desde: null } : e));

  // Corta y guarda lo hecho en foco (o en el cronometro); el descanso no se guarda
  const terminar = () => {
    const minutos = Math.floor(transcurrido(estado, Date.now()) / 60_000);
    if (estado.fase === "foco" && minutos >= 1) {
      onSesionRef.current({ modo: estado.modo, minutos, materiaId: estado.materiaId });
    }
    actualizar((e) => ({ ...e, fase: "foco", acumulado: 0, desde: null }));
  };

  const descartar = () => actualizar((e) => ({ ...e, fase: "foco", acumulado: 0, desde: null }));

  const elegirModo = (modo: ModoEstudio) =>
    actualizar((e) => ({ ...e, modo, fase: "foco", acumulado: 0, desde: null }));

  const elegirAjustes = (ajustes: Ajustes) => actualizar((e) => ({ ...e, ajustes }));

  const elegirMateria = (materiaId: number) => actualizar((e) => ({ ...e, materiaId }));

  // En pomodoro cuenta para atras; en libre, para adelante
  const mostrar = estado.modo === "pomodoro" ? Math.max(0, duracionFase(estado) - ms) : ms;
  const progreso = estado.modo === "pomodoro" ? Math.min(1, ms / duracionFase(estado)) : (ms % 3_600_000) / 3_600_000;

  return {
    ...estado,
    corriendo,
    empezado: corriendo || estado.acumulado > 0,
    transcurridoMs: ms,
    mostrarMs: mostrar,
    progreso,
    empezar,
    pausar,
    terminar,
    descartar,
    elegirModo,
    elegirAjustes,
    elegirMateria,
  };
}

export const formatoReloj = (ms: number) => {
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mmss = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return h > 0 ? `${h}:${mmss}` : mmss;
};

export const formatoHoras = (minutos: number) => {
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
};
