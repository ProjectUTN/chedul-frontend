import type { CSSProperties, KeyboardEvent } from "react";
import "./selectorEstado.css";

export interface OpcionEstado {
  valor: string;
  texto: string;
  icono: string;
  // Sufijo de la clase estado--x que le da el color
  color: string;
}

interface Props {
  opciones: OpcionEstado[];
  valor: string;
  onChange: (valor: string) => void;
  etiqueta: string;
}

// SelectorEstado es un control segmentado con una pastilla de color que se
// desliza hasta el estado elegido.
function SelectorEstado({ opciones, valor, onChange, etiqueta }: Props) {
  const indice = Math.max(
    0,
    opciones.findIndex((o) => o.valor === valor)
  );
  const elegida = opciones[indice];

  // Flechas para moverse entre opciones, como un grupo de radios
  const teclas = (e: KeyboardEvent<HTMLDivElement>) => {
    const paso =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!paso) return;
    e.preventDefault();
    const siguiente = opciones[(indice + paso + opciones.length) % opciones.length];
    onChange(siguiente.valor);
    (
      e.currentTarget.querySelectorAll("button")[(indice + paso + opciones.length) % opciones.length] as HTMLElement
    )?.focus();
  };

  return (
    <div
      className={`selector-estado estado--${elegida.color}`}
      role="radiogroup"
      aria-label={etiqueta}
      onKeyDown={teclas}
      style={{ "--cantidad": opciones.length, "--indice": indice } as CSSProperties}>
      <span className="selector-estado__pastilla" aria-hidden="true" />
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          role="radio"
          aria-checked={o.valor === valor}
          tabIndex={o.valor === valor ? 0 : -1}
          className="selector-estado__opcion"
          onClick={() => onChange(o.valor)}>
          <span className="material-symbols-rounded" aria-hidden="true">
            {o.icono}
          </span>
          <span className="selector-estado__texto">{o.texto}</span>
        </button>
      ))}
    </div>
  );
}

export default SelectorEstado;
