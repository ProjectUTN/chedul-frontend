import { useCallback, useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import type { ModoEstudio } from "../../api/types";
import { getTemporizador, guardarTemporizador, type EstadoTemporizadorApi, type RespuestaTemporizador } from "./api";

// Temporizador de estudio. El estado vive en el servidor (con una version) y
// se copia en localStorage: sigue contando si cerrás la pantalla, cambiás de
// seccion o lo abrís desde otro dispositivo. Los tiempos son hora del
// servidor; `offset` corrige el reloj de este dispositivo.

export type Fase = "foco" | "descanso";

export interface Ajustes {
  foco: number; // minutos
  descanso: number;
}

export const AJUSTES_POMODORO: Ajustes[] = [
  { foco: 25, descanso: 5 },
  { foco: 50, descanso: 10 },
];

export interface Estado {
  modo: ModoEstudio;
  fase: Fase;
  ajustes: Ajustes;
  materiaId: number;
  // Milisegundos ya contados antes del tramo actual (por las pausas)
  acumulado: number;
  // Cuando arranco el tramo actual (hora del servidor); null si esta en pausa o sin empezar
  desde: number | null;
}

const INICIAL: Estado = {
  modo: "pomodoro",
  fase: "foco",
  ajustes: AJUSTES_POMODORO[0],
  materiaId: 0,
  acumulado: 0,
  desde: null,
};

const SINCRONIZAR_CADA = 10_000;
// Un aviso de fin de fase que se noto tarde (pantalla apagada) ya no sirve
const AVISO_VIGENTE = 60_000;

const aApi = (e: Estado): EstadoTemporizadorApi => ({
  modo: e.modo,
  fase: e.fase,
  foco: e.ajustes.foco,
  descanso: e.ajustes.descanso,
  materia_id: e.materiaId,
  acumulado: Math.round(e.acumulado),
  desde: e.desde === null ? null : Math.round(e.desde),
});

const deApi = (e: EstadoTemporizadorApi): Estado => ({
  modo: e.modo,
  fase: e.fase,
  ajustes: { foco: e.foco, descanso: e.descanso },
  materiaId: e.materia_id,
  acumulado: e.acumulado,
  desde: e.desde,
});

interface Copia {
  estado: Estado;
  rev: number;
}

const claveCopia = (alumnoId: number) => `chedul.temporizador.v2.${alumnoId}`;

const leerCopia = (alumnoId: number): Copia => {
  try {
    const guardado = localStorage.getItem(claveCopia(alumnoId));
    if (guardado) {
      const copia = JSON.parse(guardado) as Copia;
      return { estado: { ...INICIAL, ...copia.estado }, rev: copia.rev ?? 0 };
    }
  } catch {
    // Sin storage se arranca de cero y se pide al servidor
  }
  return { estado: INICIAL, rev: 0 };
};

const escribirCopia = (alumnoId: number, copia: Copia) => {
  try {
    localStorage.setItem(claveCopia(alumnoId), JSON.stringify(copia));
  } catch {
    // Sin storage el temporizador anda igual
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
  alumnoId: number;
  // Se llama cuando termina un bloque de foco o el alumno corta: hay que guardarlo
  onSesion: (sesion: { modo: ModoEstudio; minutos: number; materiaId: number }) => void;
  // Se llama cuando termina una fase del pomodoro (solo si se noto a tiempo)
  onFin?: (fase: Fase, ajustes: Ajustes) => void;
}

export default function useTemporizador({ alumnoId, onSesion, onFin }: Opciones) {
  const [inicio] = useState(() => leerCopia(alumnoId));
  const [estado, setEstado] = useState<Estado>(inicio.estado);
  const estadoRef = useRef(inicio.estado);
  // Version del servidor sobre la que estamos parados
  const rev = useRef(inicio.rev);
  // Cuanto hay que sumarle a Date.now() para tener la hora del servidor
  const offset = useRef(0);
  const ahoraServidor = useCallback(() => Date.now() + offset.current, []);
  const [ahora, setAhora] = useState(ahoraServidor);

  // Los cambios se mandan de a uno, en orden, para que cada uno parta de la version anterior
  const cola = useRef<Promise<unknown>>(Promise.resolve());
  const enVuelo = useRef(0);
  // Un cambio no llego al servidor (sin conexion): se reintenta en la proxima sincronizacion
  const sinSubir = useRef(false);

  const onSesionRef = useRef(onSesion);
  onSesionRef.current = onSesion;
  const onFinRef = useRef(onFin);
  onFinRef.current = onFin;
  // Fase ya cerrada, para no guardar dos veces el mismo foco
  const cerrada = useRef("");

  const fijar = useCallback(
    (nuevo: Estado, nuevaRev?: number) => {
      estadoRef.current = nuevo;
      if (nuevaRev !== undefined) rev.current = nuevaRev;
      setEstado(nuevo);
      escribirCopia(alumnoId, { estado: nuevo, rev: rev.current });
    },
    [alumnoId]
  );

  const adoptar = useCallback(
    (r: RespuestaTemporizador) => {
      offset.current = r.ahora - Date.now();
      setAhora(Date.now() + offset.current);
      const previo = estadoRef.current;
      if (r.estado) fijar(deApi(r.estado), r.rev);
      else if (rev.current !== 0) fijar(INICIAL, 0);
      else rev.current = r.rev;

      // Otro dispositivo cerro la fase justo ahora: igual hay que avisar aca
      if (r.estado && previo.modo === "pomodoro" && previo.desde !== null && r.estado.fase !== previo.fase) {
        const fin = previo.desde + duracionFase(previo) - previo.acumulado;
        const pasado = Date.now() + offset.current - fin;
        if (pasado > -10_000 && pasado < AVISO_VIGENTE) {
          pitar();
          onFinRef.current?.(previo.fase, previo.ajustes);
        }
      }
    },
    [fijar]
  );

  // Aplica el cambio ya y lo manda al servidor. Devuelve false si otro
  // dispositivo se adelanto: en ese caso nos quedamos con lo que hizo el otro.
  const subir = useCallback(
    (nuevo: Estado): Promise<boolean> => {
      fijar(nuevo);
      enVuelo.current += 1;
      const tarea = cola.current.then(async () => {
        try {
          const r = await guardarTemporizador(aApi(nuevo), rev.current);
          rev.current = r.rev;
          offset.current = r.ahora - Date.now();
          sinSubir.current = false;
          escribirCopia(alumnoId, { estado: estadoRef.current, rev: rev.current });
          return true;
        } catch (err) {
          if (isAxiosError(err) && err.response?.status === 409) {
            adoptar(err.response.data as RespuestaTemporizador);
            return false;
          }
          sinSubir.current = true;
          return true;
        } finally {
          enVuelo.current -= 1;
        }
      });
      cola.current = tarea;
      return tarea;
    },
    [alumnoId, adoptar, fijar]
  );

  const actualizar = useCallback((cambio: (e: Estado) => Estado) => subir(cambio(estadoRef.current)), [subir]);

  const sincronizar = useCallback(async () => {
    if (enVuelo.current > 0) return;
    try {
      const r = await getTemporizador();
      if (enVuelo.current > 0) return;
      if (sinSubir.current) {
        offset.current = r.ahora - Date.now();
        await subir(estadoRef.current);
        return;
      }
      if (r.rev !== rev.current || r.estado === null) adoptar(r);
      else offset.current = r.ahora - Date.now();
    } catch {
      // Sin conexion sigue andando con lo que tiene
    }
  }, [adoptar, subir]);

  // Trae el estado al abrir, y despues cada tanto y al volver a la pestaña
  useEffect(() => {
    sincronizar();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") sincronizar();
    }, SINCRONIZAR_CADA);
    const alVolver = () => {
      if (document.visibilityState === "visible") sincronizar();
    };
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("focus", alVolver);
    window.addEventListener("online", alVolver);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("focus", alVolver);
      window.removeEventListener("online", alVolver);
    };
  }, [sincronizar]);

  const corriendo = estado.desde !== null;
  const ms = transcurrido(estado, ahora);

  useEffect(() => {
    if (!corriendo) return;
    const id = window.setInterval(() => setAhora(ahoraServidor()), 500);
    return () => window.clearInterval(id);
  }, [corriendo, ahoraServidor]);

  // Fin de una fase del pomodoro: el foco se guarda y arranca el descanso;
  // al terminar el descanso queda listo para el proximo foco. Solo lo cierra
  // el dispositivo que logra guardar el cambio primero.
  useEffect(() => {
    if (estado.modo !== "pomodoro" || !corriendo || ms < duracionFase(estado)) return;
    const clave = `${estado.fase}-${estado.desde}-${estado.acumulado}`;
    if (cerrada.current === clave) return;
    cerrada.current = clave;
    const fase = estado.fase;
    const cerrando = estado;
    // El descanso arranca cuando termino el foco, aunque se note despues
    const finFase = (cerrando.desde ?? 0) + duracionFase(cerrando) - cerrando.acumulado;
    const vigente = ahoraServidor() - finFase < AVISO_VIGENTE;
    const siguiente: Estado =
      fase === "foco"
        ? { ...cerrando, fase: "descanso", acumulado: 0, desde: finFase }
        : { ...cerrando, fase: "foco", acumulado: 0, desde: null };
    subir(siguiente).then((guardado) => {
      // Solo el dispositivo que logra guardar primero registra la sesion, pero
      // el aviso suena en todos los que lo tengan activado
      if (guardado && fase === "foco") {
        onSesionRef.current({ modo: "pomodoro", minutos: cerrando.ajustes.foco, materiaId: cerrando.materiaId });
      }
      if (vigente) {
        pitar();
        onFinRef.current?.(fase, cerrando.ajustes);
      }
    });
  }, [estado, corriendo, ms, subir, ahoraServidor]);

  const empezar = () => actualizar((e) => (e.desde ? e : { ...e, desde: ahoraServidor() }));

  const pausar = () =>
    actualizar((e) => (e.desde ? { ...e, acumulado: transcurrido(e, ahoraServidor()), desde: null } : e));

  // Corta y guarda lo hecho en foco (o en el cronometro); el descanso no se guarda
  const terminar = async () => {
    const actual = estadoRef.current;
    const minutos = Math.floor(transcurrido(actual, ahoraServidor()) / 60_000);
    const guardado = await subir({ ...actual, fase: "foco", acumulado: 0, desde: null });
    if (guardado && actual.fase === "foco" && minutos >= 1) {
      onSesionRef.current({ modo: actual.modo, minutos, materiaId: actual.materiaId });
    }
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
