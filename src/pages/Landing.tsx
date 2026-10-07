import { Link } from "react-router-dom";
import logo from "../assets/1B-Chedul_Logo_Horizontal_Azul.svg";
import inicioClaro from "../assets/landing/inicio-claro.jpg";
import inicioOscuro from "../assets/landing/inicio-oscuro.jpg";
import correlativasClaro from "../assets/landing/correlativas-claro.jpg";
import correlativasOscuro from "../assets/landing/correlativas-oscuro.jpg";
import calendarioClaro from "../assets/landing/calendario-claro.jpg";
import calendarioOscuro from "../assets/landing/calendario-oscuro.jpg";
import movilClaro from "../assets/landing/movil-claro.jpg";
import movilOscuro from "../assets/landing/movil-oscuro.jpg";
import useTema from "../hooks/useTema";
import "./landing.css";

const FUNCIONES = [
  {
    icono: "school",
    titulo: "Estado académico",
    texto: "Marcá cada materia como cursando, regular o aprobada, con su nota. Chedul calcula tu promedio y cuánto te falta.",
  },
  {
    icono: "account_tree",
    titulo: "Mapa de correlativas",
    texto: "Todo el plan de ISI en un mapa. Tocá una materia y ves qué necesitás para cursarla y qué te habilita.",
  },
  {
    icono: "calendar_month",
    titulo: "Calendario",
    texto: "Elegí tu comisión y se carga tu horario de la semana. Anotá parciales, finales y entregas para no olvidarte.",
  },
  {
    icono: "library_books",
    titulo: "Aportes",
    texto: "Resúmenes, parciales resueltos y videos que comparten otros alumnos, filtrados por materia.",
  },
  {
    icono: "mail",
    titulo: "Mails de profesores",
    texto: "Buscá por profesor o materia y copiá el mail con un toque.",
  },
  {
    icono: "smartphone",
    titulo: "En el celu también",
    texto: "Pensada para usarla en el bondi o en el pasillo antes de entrar a clase. Con modo claro y oscuro.",
  },
];

const PASOS = [
  { titulo: "Creá tu cuenta", texto: "Solo tu nombre, tu mail y una contraseña." },
  { titulo: "Cargá cómo vas", texto: "Marcá las materias que ya aprobaste, de a una o un año entero de una." },
  { titulo: "Organizá la cursada", texto: "Mirá qué podés cursar, armá tu horario y anotá las fechas importantes." },
];

// Muestra la captura que corresponde al tema actual
function Captura({ claro, oscuro, alt, className = "" }: { claro: string; oscuro: string; alt: string; className?: string }) {
  const { tema } = useTema();
  return (
    <img
      className={`landing-captura ${className}`}
      src={tema === "claro" ? claro : oscuro}
      alt={alt}
      loading="lazy"
      decoding="async"
    />
  );
}

// Landing es la pagina publica que se ve antes de iniciar sesion
function Landing() {
  const { tema, alternar } = useTema();

  return (
    <div className="landing">
      <header className="landing-nav">
        <img className="landing-nav__logo" src={logo} alt="Chedul" />
        <nav className="landing-nav__acciones" aria-label="Cuenta">
          <button
            type="button"
            className="landing-tema"
            onClick={alternar}
            aria-label={tema === "claro" ? "Activar modo oscuro" : "Activar modo claro"}>
            <span className="material-symbols-rounded">{tema === "claro" ? "dark_mode" : "light_mode"}</span>
          </button>
          <Link to="/login" className="btn btn-secundario">
            Ingresar
          </Link>
          <Link to="/registro" className="btn btn-primario landing-solo-escritorio">
            Crear cuenta
          </Link>
        </nav>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero__texto">
            <span className="landing-etiqueta">
              <span className="material-symbols-rounded">school</span>
              Para Ingeniería en Sistemas · UTN
            </span>
            <h1>
              Tu carrera, <span className="landing-degradado">ordenada</span> en un solo lugar
            </h1>
            <p>
              Llevá tu estado académico, mirá qué materias podés cursar, armá tu horario y encontrá los apuntes que
              comparten otros alumnos. Gratis.
            </p>
            <div className="landing-hero__ctas">
              <Link to="/registro" className="btn btn-primario landing-cta">
                Empezar gratis
                <span className="material-symbols-rounded">arrow_forward</span>
              </Link>
              <Link to="/login" className="btn btn-secundario landing-cta">
                Ya tengo cuenta
              </Link>
            </div>
            <ul className="landing-datos">
              <li>
                <b>51</b> materias del plan
              </li>
              <li>
                <b>109</b> correlativas
              </li>
              <li>
                <b>2° cuatri</b> con horarios y aulas
              </li>
            </ul>
          </div>

          <div className="landing-hero__visual">
            <div className="landing-ventana">
              <div className="landing-ventana__barra" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <Captura claro={inicioClaro} oscuro={inicioOscuro} alt="Pantalla de inicio de Chedul con el progreso de la carrera" />
            </div>
            <Captura
              claro={movilClaro}
              oscuro={movilOscuro}
              alt="Chedul en el celular"
              className="landing-movil"
            />
          </div>
        </section>

        <section className="landing-seccion" aria-labelledby="funciones-titulo">
          <div className="landing-seccion__encabezado">
            <h2 id="funciones-titulo">Todo lo que necesitás para cursar</h2>
            <p>Chedul junta lo que hoy tenés repartido entre el SIU, planillas, grupos de WhatsApp y el campus.</p>
          </div>
          <div className="landing-funciones">
            {FUNCIONES.map((f) => (
              <article key={f.titulo} className="landing-funcion">
                <span className="landing-funcion__icono material-symbols-rounded" aria-hidden="true">
                  {f.icono}
                </span>
                <h3>{f.titulo}</h3>
                <p>{f.texto}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-seccion landing-muestra">
          <div className="landing-muestra__texto">
            <h2>Sabé qué podés cursar el próximo cuatrimestre</h2>
            <p>
              El mapa de correlativas se arma con tu estado: ves en verde lo aprobado, en amarillo lo regular y en violeta
              lo que ya podés cursar. Tocás una materia y se marcan sus correlativas.
            </p>
          </div>
          <Captura claro={correlativasClaro} oscuro={correlativasOscuro} alt="Mapa de correlativas de Chedul" />
        </section>

        <section className="landing-seccion landing-muestra landing-muestra--invertida">
          <div className="landing-muestra__texto">
            <h2>Tu semana armada en dos clics</h2>
            <p>
              Elegí la materia y la comisión, y Chedul carga todos los horarios con su aula. Sumá parciales y entregas y
              en el inicio ves cuántos días te quedan.
            </p>
          </div>
          <Captura claro={calendarioClaro} oscuro={calendarioOscuro} alt="Calendario semanal de Chedul" />
        </section>

        <section className="landing-seccion" aria-labelledby="pasos-titulo">
          <div className="landing-seccion__encabezado">
            <h2 id="pasos-titulo">Empezá en un minuto</h2>
          </div>
          <ol className="landing-pasos">
            {PASOS.map((p, i) => (
              <li key={p.titulo} className="landing-paso">
                <span className="landing-paso__numero">{i + 1}</span>
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="landing-final">
          <img src="/favicon.svg" alt="" className="landing-final__mascota" aria-hidden="true" />
          <h2>¿Arrancamos?</h2>
          <p>Creá tu cuenta y dejá de hacer la cuenta de correlativas a mano.</p>
          <Link to="/registro" className="btn btn-primario landing-cta">
            Crear mi cuenta
            <span className="material-symbols-rounded">arrow_forward</span>
          </Link>
        </section>
      </main>

      <footer className="landing-pie">
        <img src={logo} alt="Chedul" className="landing-pie__logo" />
        <span>Hecho por Eduardo Ramírez para alumnos de la UTN FRRe.</span>
      </footer>
    </div>
  );
}

export default Landing;
