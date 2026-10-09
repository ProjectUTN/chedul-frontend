import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import { mensajeDeError } from "../../api/client";
import { guardarSesion } from "./api";
import {
  guardarPreferenciaAvisos,
  leerPreferenciaAvisos,
  mostrarAviso,
  pedirPermisoDeAvisos,
  permisoDeAvisos,
} from "./avisosEstudio";
import useTemporizador, { formatoHoras, formatoReloj } from "./useTemporizador";
import { Reloj } from "./RelojFlotante";
import { abrirVentanaAparte, ventanaAparteSoportada } from "./ventanaAparte";

// El temporizador vive aca arriba (en el Layout) para que siga andando y se
// pueda ver en una ventana flotante que queda por encima de todo (aunque
// cambies de pestaña o minimices). Solo existe donde el navegador la permite:
// Chrome y Edge de escritorio, no en tablets ni celulares.

export const SESION_GUARDADA = "chedul:sesion-guardada";

type Temporizador = ReturnType<typeof useTemporizador>;

interface Contexto {
  t: Temporizador;
  // Hay una ventana flotante abierta
  flotante: boolean;
  alternarFlotante: () => Promise<void>;
  // El navegador puede abrirla
  puedeFlotar: boolean;
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

export function TemporizadorProvider({ alumnoId, children }: { alumnoId: number; children: ReactNode }) {
  const [avisar, setAvisarEstado] = useState(leerPreferenciaAvisos);
  // Ventana siempre visible, fuera de la pestaña
  const [aparte, setAparte] = useState<Window | null>(null);
  const aparteRef = useRef<Window | null>(null);
  aparteRef.current = aparte;

  const alternarFlotante = useCallback(async () => {
    if (aparteRef.current) {
      aparteRef.current.close();
      return;
    }
    try {
      const ventana = await abrirVentanaAparte();
      ventana.addEventListener("pagehide", () => setAparte(null));
      setAparte(ventana);
    } catch {
      toast.info("Tu navegador no dejó abrir la ventana flotante");
    }
  }, []);

  // Al salir de la sesion se cierra la ventana que quedo afuera
  useEffect(() => () => aparteRef.current?.close(), []);

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

  const flotante = aparte !== null;
  const valor = useMemo(
    () => ({ t, flotante, alternarFlotante, puedeFlotar: ventanaAparteSoportada(), avisar, setAvisar }),
    [t, flotante, alternarFlotante, avisar, setAvisar]
  );

  return (
    <TemporizadorContext.Provider value={valor}>
      {children}
      {aparte && createPortal(<Reloj enAparte />, aparte.document.body)}
    </TemporizadorContext.Provider>
  );
}
