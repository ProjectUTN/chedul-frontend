import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "react-toastify";
import { mensajeDeError } from "../../api/client";
import { useAuth } from "../../context/authProvider";
import { guardarSesion } from "./api";
import {
  guardarPreferenciaAvisos,
  leerPreferenciaAvisos,
  mostrarAviso,
  pedirPermisoDeAvisos,
  permisoDeAvisos,
} from "./avisosEstudio";
import useTemporizador, { formatoHoras, formatoReloj } from "./useTemporizador";
import VentanaFlotante from "./VentanaFlotante";

// El temporizador vive aca arriba (en el Layout) para que siga andando y se
// pueda ver en una ventanita flotante desde cualquier seccion.

export const SESION_GUARDADA = "chedul:sesion-guardada";

type Temporizador = ReturnType<typeof useTemporizador>;

interface Contexto {
  t: Temporizador;
  flotante: boolean;
  setFlotante: (abierta: boolean) => void;
  avisar: boolean;
  setAvisar: (activo: boolean) => Promise<void>;
}

const TemporizadorContext = createContext<Contexto | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useTemporizadorGlobal = () => {
  const contexto = useContext(TemporizadorContext);
  if (!contexto) throw new Error("useTemporizadorGlobal debe usarse dentro de TemporizadorProvider");
  return contexto;
};

const CLAVE_FLOTANTE = "chedul.flotante";

const leerFlotante = () => {
  try {
    return localStorage.getItem(CLAVE_FLOTANTE) === "1";
  } catch {
    return false;
  }
};

export function TemporizadorProvider({ alumnoId, children }: { alumnoId: number; children: ReactNode }) {
  const { user } = useAuth();
  const [avisar, setAvisarEstado] = useState(leerPreferenciaAvisos);
  const [flotante, setFlotanteEstado] = useState(leerFlotante);

  const setFlotante = useCallback((abierta: boolean) => {
    setFlotanteEstado(abierta);
    try {
      localStorage.setItem(CLAVE_FLOTANTE, abierta ? "1" : "0");
    } catch {
      // Sin storage solo se pierde el recuerdo
    }
  }, []);

  const setAvisar = useCallback(async (activo: boolean) => {
    if (!activo) {
      guardarPreferenciaAvisos(false);
      setAvisarEstado(false);
      return;
    }
    const concedido = await pedirPermisoDeAvisos();
    if (!concedido) {
      toast.info(
        permisoDeAvisos() === "denied"
          ? "El navegador tiene bloqueadas las notificaciones de Chedul. Habilitalas desde el candado de la barra de direcciones."
          : "No pudimos activar las notificaciones en este navegador"
      );
      return;
    }
    guardarPreferenciaAvisos(true);
    setAvisarEstado(true);
    mostrarAviso("Avisos activados", "Te avisamos cuando termine cada bloque de estudio.");
  }, []);

  const alTerminarSesion = useCallback(
    async (sesion: { modo: "pomodoro" | "libre"; minutos: number; materiaId: number }) => {
      try {
        await guardarSesion({ modo: sesion.modo, minutos: sesion.minutos, materia_id: sesion.materiaId });
        toast.success(`Sumaste ${formatoHoras(sesion.minutos)} de estudio`);
        window.dispatchEvent(new Event(SESION_GUARDADA));
      } catch (err) {
        toast.error(mensajeDeError(err, "No se pudo guardar la sesión"));
      }
    },
    []
  );

  const alTerminarFase = useCallback(
    (fase: "foco" | "descanso", ajustes: { foco: number; descanso: number }) => {
      if (!avisar) return;
      if (fase === "foco")
        mostrarAviso("Terminó tu foco", `Descansá ${ajustes.descanso} min. Ya sumaste ${formatoHoras(ajustes.foco)}.`);
      else mostrarAviso("Terminó el descanso", "Cuando quieras, arrancá el próximo bloque.");
    },
    [avisar]
  );

  const t = useTemporizador({ alumnoId, onSesion: alTerminarSesion, onFin: alTerminarFase });

  // El tiempo en la pestaña, para verlo desde otra
  useEffect(() => {
    if (!t.empezado) return;
    const anterior = document.title;
    document.title = `${formatoReloj(t.mostrarMs)} · ${t.modo === "libre" || t.fase === "foco" ? "Estudiando" : "Descanso"}`;
    return () => {
      document.title = anterior;
    };
  }, [t.empezado, t.mostrarMs, t.fase, t.modo]);

  const valor = useMemo(
    () => ({ t, flotante, setFlotante, avisar, setAvisar }),
    [t, flotante, setFlotante, avisar, setAvisar]
  );

  return (
    <TemporizadorContext.Provider value={valor}>
      {children}
      {flotante && user && <VentanaFlotante />}
    </TemporizadorContext.Provider>
  );
}
