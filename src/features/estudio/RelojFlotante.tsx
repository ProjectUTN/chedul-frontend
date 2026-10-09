import { useTemporizadorGlobal } from "./TemporizadorProvider";
import { formatoReloj } from "./useTemporizador";
import "./relojFlotante.css";

// Contenido de la ventana flotante: el reloj con pausa y terminar. Se muestra
// en la ventana que el navegador deja por encima de todo (Chrome y Edge de
// escritorio).

export function Reloj({ enAparte = false }: { enAparte?: boolean }) {
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
