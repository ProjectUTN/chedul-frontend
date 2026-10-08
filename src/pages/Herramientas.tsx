import { Link } from "react-router-dom";
import "../features/herramientas/herramientas.css";

// Funciones extra agrupadas en una sola entrada del menu
const HERRAMIENTAS = [
  {
    href: "/herramientas/estudiar",
    icono: "timer",
    titulo: "Estudiar",
    detalle: "Pomodoro o cronómetro por materia, tu racha y el ranking de la semana.",
  },
  {
    href: "/herramientas/electivas",
    icono: "calculate",
    titulo: "Calculadora de electivas",
    detalle: "Cuántas horas de electivas llevás y cuántas te faltan.",
  },
  {
    href: "/herramientas/531",
    icono: "gavel",
    titulo: "Ordenanza 531",
    detalle: "Si ya podés cursar lo que te falta sin correlativas.",
  },
  {
    href: "/correlativas",
    icono: "account_tree",
    titulo: "Mapa de correlativas",
    detalle: "Todo el plan y qué necesita cada materia.",
  },
  {
    href: "/correos",
    icono: "mail",
    titulo: "Mails de profesores",
    detalle: "Los correos de las cátedras.",
  },
];

function Herramientas() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1>Herramientas</h1>
          <p>Cosas útiles para la cursada.</p>
        </div>
      </div>

      <ul className="herramientas">
        {HERRAMIENTAS.map((h) => (
          <li key={h.href}>
            <Link to={h.href} className="card herramienta">
              <span className="herramienta__icono material-symbols-rounded" aria-hidden="true">
                {h.icono}
              </span>
              <strong>{h.titulo}</strong>
              <span className="campo-ayuda">{h.detalle}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export default Herramientas;
