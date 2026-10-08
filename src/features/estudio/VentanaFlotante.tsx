import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useTemporizadorGlobal } from "./TemporizadorProvider";
import { formatoReloj } from "./useTemporizador";
import { documentPiP, ventanaAparteSoportada } from "./ventanaAparte";
import "./ventanaFlotante.css";

// Ventanita con el temporizador para dejarla a un costado: se arrastra a
// cualquier lado, se cierra con la X (el temporizador sigue) y, en los
// navegadores que lo permiten, se puede sacar fuera de la pestaña.

const CLAVE_POSICION = "chedul.flotante.pos";

interface Posicion {
  x: number;
  y: number;
}

const leerPosicion = (): Posicion | null => {
  try {
    const guardado = localStorage.getItem(CLAVE_POSICION);
    return guardado ? (JSON.parse(guardado) as Posicion) : null;
  } catch {
    return null;
  }
};

const limitar = (pos: Posicion, ancho: number, alto: number): Posicion => ({
  x: Math.min(Math.max(0, pos.x), Math.max(0, window.innerWidth - ancho)),
  y: Math.min(Math.max(0, pos.y), Math.max(0, window.innerHeight - alto)),
});

function Reloj({ enAparte = false }: { enAparte?: boolean }) {
  const { t } = useTemporizadorGlobal();
  const etiqueta = t.modo === "libre" ? "Cronómetro" : t.fase === "foco" ? "Foco" : "Descanso";

  return (
    <div className={`mini-reloj mini-reloj--${t.fase}`} data-aparte={enAparte || undefined}>
      <div className="mini-reloj__texto">
        <span className="mini-reloj__fase">{etiqueta}</span>
        <span className="mini-reloj__tiempo" role="timer">
          {formatoReloj(t.mostrarMs)}
        </span>
      </div>
      <div className="mini-reloj__acciones">
        {t.corriendo ? (
          <button type="button" className="mini-reloj__boton" onClick={t.pausar} aria-label="Pausar" title="Pausar">
            <span className="material-symbols-rounded">pause</span>
          </button>
        ) : (
          <button
            type="button"
            className="mini-reloj__boton mini-reloj__boton--principal"
            onClick={t.empezar}
            aria-label={t.empezado ? "Seguir" : "Empezar"}
            title={t.empezado ? "Seguir" : "Empezar"}>
            <span className="material-symbols-rounded">play_arrow</span>
          </button>
        )}
        {t.empezado && t.fase === "foco" && (
          <button
            type="button"
            className="mini-reloj__boton"
            onClick={t.terminar}
            aria-label="Terminar y guardar"
            title="Terminar y guardar">
            <span className="material-symbols-rounded">stop</span>
          </button>
        )}
      </div>
    </div>
  );
}

// Copia los estilos de la app a la ventana que se abre aparte
const copiarEstilos = (destino: Window) => {
  for (const hoja of Array.from(document.styleSheets)) {
    try {
      const estilo = destino.document.createElement("style");
      estilo.textContent = Array.from(hoja.cssRules)
        .map((regla) => regla.cssText)
        .join("\n");
      destino.document.head.appendChild(estilo);
    } catch {
      if (hoja.href) {
        const enlace = destino.document.createElement("link");
        enlace.rel = "stylesheet";
        enlace.href = hoja.href;
        destino.document.head.appendChild(enlace);
      }
    }
  }
  destino.document.documentElement.className = document.documentElement.className;
  const tema = document.documentElement.dataset.theme;
  if (tema) destino.document.documentElement.dataset.theme = tema;
};

function VentanaFlotante() {
  const { setFlotante } = useTemporizadorGlobal();
  const caja = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Posicion | null>(leerPosicion);
  const arrastre = useRef<{ dx: number; dy: number } | null>(null);
  const [aparte, setAparte] = useState<Window | null>(null);

  const medir = useCallback(() => {
    const r = caja.current?.getBoundingClientRect();
    return { ancho: r?.width ?? 200, alto: r?.height ?? 72 };
  }, []);

  // Si se achica la pantalla, la ventanita no puede quedar afuera
  useEffect(() => {
    const alRedimensionar = () => {
      setPos((p) => {
        if (!p) return p;
        const { ancho, alto } = medir();
        return limitar(p, ancho, alto);
      });
    };
    window.addEventListener("resize", alRedimensionar);
    return () => window.removeEventListener("resize", alRedimensionar);
  }, [medir]);

  const empezarArrastre = (e: ReactPointerEvent<HTMLDivElement>) => {
    const r = caja.current?.getBoundingClientRect();
    if (!r) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    arrastre.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    setPos({ x: r.left, y: r.top });
  };

  const arrastrar = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!arrastre.current) return;
    const { ancho, alto } = medir();
    setPos(limitar({ x: e.clientX - arrastre.current.dx, y: e.clientY - arrastre.current.dy }, ancho, alto));
  };

  const soltar = () => {
    if (!arrastre.current) return;
    arrastre.current = null;
    setPos((p) => {
      try {
        if (p) localStorage.setItem(CLAVE_POSICION, JSON.stringify(p));
      } catch {
        // Sin storage vuelve a su lugar la proxima vez
      }
      return p;
    });
  };

  const sacarDeLaPestana = async () => {
    const pip = documentPiP();
    if (!pip) return;
    try {
      const ventana = await pip.requestWindow({ width: 260, height: 150 });
      copiarEstilos(ventana);
      ventana.addEventListener("pagehide", () => setAparte(null));
      setAparte(ventana);
    } catch {
      // El navegador la rechazo (hay que pedirla con un click): queda la ventanita de siempre
    }
  };

  // Al cerrar la ventanita se cierra tambien la que esta aparte
  useEffect(() => () => aparte?.close(), [aparte]);

  const estilo = pos ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" } : undefined;

  return (
    <>
      {!aparte && (
        <div ref={caja} className="ventana-flotante" style={estilo} role="region" aria-label="Temporizador de estudio">
          <div
            className="ventana-flotante__asa"
            onPointerDown={empezarArrastre}
            onPointerMove={arrastrar}
            onPointerUp={soltar}
            onPointerCancel={soltar}
            title="Arrastrala donde quieras">
            <span className="material-symbols-rounded" aria-hidden="true">
              drag_indicator
            </span>
          </div>
          <Reloj />
          <div className="ventana-flotante__extras">
            {ventanaAparteSoportada() && (
              <button
                type="button"
                className="mini-reloj__boton"
                onClick={sacarDeLaPestana}
                aria-label="Sacar de la pestaña"
                title="Sacar de la pestaña">
                <span className="material-symbols-rounded">picture_in_picture_alt</span>
              </button>
            )}
            <Link
              to="/herramientas/estudiar"
              className="mini-reloj__boton"
              aria-label="Abrir Estudiar"
              title="Abrir Estudiar">
              <span className="material-symbols-rounded">open_in_full</span>
            </Link>
            <button
              type="button"
              className="mini-reloj__boton"
              onClick={() => setFlotante(false)}
              aria-label="Cerrar ventanita"
              title="Cerrar (el temporizador sigue)">
              <span className="material-symbols-rounded">close</span>
            </button>
          </div>
        </div>
      )}
      {aparte && createPortal(<Reloj enAparte />, aparte.document.body)}
    </>
  );
}

export default VentanaFlotante;
