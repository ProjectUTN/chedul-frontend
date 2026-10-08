import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import useTema from "../../hooks/useTema";
import logo from "../../assets/1B-Chedul_Logo_Horizontal_Azul.svg";
import inicioClaro from "../../assets/landing/inicio-claro.jpg";
import inicioOscuro from "../../assets/landing/inicio-oscuro.jpg";
import "./auth.css";

const PUNTOS = [
  { icono: "account_tree", texto: "Sabé qué materias podés cursar" },
  { icono: "calendar_month", texto: "Horarios, parciales y finales en un lugar" },
  { icono: "library_books", texto: "Apuntes y grupos de toda la carrera" },
];

interface Props {
  titulo: string;
  subtitulo: ReactNode;
  children: ReactNode;
}

// AuthLayout es la pantalla partida de ingreso y registro: a la izquierda (en
// compu) que es Chedul, a la derecha el formulario.
function AuthLayout({ titulo, subtitulo, children }: Props) {
  const { tema } = useTema();
  return (
    <div className="auth">
      <aside className="auth-marca" aria-hidden="true">
        <Link to="/" tabIndex={-1}>
          <img className="auth-marca__logo" src={logo} alt="" />
        </Link>
        <div className="auth-marca__texto">
          <h2>Tu carrera, ordenada.</h2>
          <ul>
            {PUNTOS.map((p, i) => (
              <li key={p.icono} style={{ animationDelay: `${300 + i * 120}ms` }}>
                <span className="material-symbols-rounded">{p.icono}</span>
                {p.texto}
              </li>
            ))}
          </ul>
        </div>
        <div className="auth-marca__muestra">
          <img src={tema === "claro" ? inicioClaro : inicioOscuro} alt="" />
          <img src="/favicon.svg" alt="" className="auth-marca__mascota" />
        </div>
      </aside>

      <main className="auth-lado">
        <div className="auth-card">
          <Link to="/" className="auth-card__logo" aria-label="Volver al inicio de Chedul">
            <img src={logo} alt="Chedul" />
          </Link>
          <div className="auth-card__cabecera">
            <h1>{titulo}</h1>
            <p>{subtitulo}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

export default AuthLayout;
