import { Link } from "react-router-dom";
import logo from "../assets/1B-Chedul_Logo_Horizontal_Azul.svg";
import inicioClaro from "../assets/landing/inicio-claro.jpg";
import inicioOscuro from "../assets/landing/inicio-oscuro.jpg";
import correlativasClaro from "../assets/landing/correlativas-claro.jpg";
import correlativasOscuro from "../assets/landing/correlativas-oscuro.jpg";
import horariosClaro from "../assets/landing/horarios-claro.jpg";
import horariosOscuro from "../assets/landing/horarios-oscuro.jpg";
import estudiarClaro from "../assets/landing/estudiar-claro.jpg";
import estudiarOscuro from "../assets/landing/estudiar-oscuro.jpg";
import comunidadesClaro from "../assets/landing/comunidades-claro.jpg";
import comunidadesOscuro from "../assets/landing/comunidades-oscuro.jpg";
import movilClaro from "../assets/landing/movil-claro.jpg";
import movilOscuro from "../assets/landing/movil-oscuro.jpg";
import useTema from "../hooks/useTema";
import fotoEduardo from "../assets/equipo/eduardo.jpg";
import fotoLautaro from "../assets/equipo/lautaro.jpg";
import fotoTobias from "../assets/equipo/tobias.jpg";
import "./landing.css";

const FUNCIONES = [
  {
    icono: "school",
    titulo: "Estado académico",
    texto: "Marcá cada materia como cursando, regular o aprobada, con su nota. Las electivas van aparte y calcula tu promedio.",
  },
  {
    icono: "account_tree",
    titulo: "Mapa de correlativas",
    texto: "Todo el plan de ISI en un mapa. Tocá una materia y ves qué necesitás para cursarla y qué te habilita.",
  },
  {
    icono: "schedule",
    titulo: "Horarios",
    texto: "Marcás una materia como cursando, elegís la comisión y tu semana se arma sola, con aulas.",
  },
  {
    icono: "campaign",
    titulo: "Parciales confirmados",
    texto: "Si varios de tu comisión cargan el mismo parcial, te avisa para que no se te pase.",
  },
  {
    icono: "event",
    titulo: "En tu Google Calendar",
    texto: "Clases, parciales, finales y feriados en el calendario del celu, y se actualiza solo.",
  },
  {
    icono: "timer",
    titulo: "Estudiar",
    texto: "Pomodoro, meta diaria, rachas, medallas y un ranking semanal con otros alumnos, si querés entrar.",
  },
  {
    icono: "library_books",
    titulo: "Aportes",
    texto: "Resúmenes, parciales resueltos y videos que comparten otros alumnos, por materia o de toda la carrera.",
  },
  {
    icono: "groups",
    titulo: "Comunidades",
    texto: "Los grupos de WhatsApp, Discord y Telegram de la carrera y de cada materia, en un solo lugar.",
  },
  {
    icono: "task_alt",
    titulo: "Ordenanza 531 y electivas",
    texto: "Te dice cuántas horas de electivas llevás y cuándo podés pedir cursar sin correlativas.",
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
// El equipo que hace Chedul, para Quiénes somos
const EQUIPO: { nombre: string; rol: string; link: string; foto?: string }[] = [
  { nombre: "Eduardo Ramírez", rol: "Idea, coordinación y fullstack", link: "https://eduramirez.dev", foto: fotoEduardo },
  {
    nombre: "Lautaro Acosta Quintana",
    rol: "Backend e infraestructura",
    link: "https://www.linkedin.com/in/lautaro-acosta-quintana/",
    foto: fotoLautaro,
  },
  {
    nombre: "Tobías Stegmayer",
    rol: "Frontend y UI",
    link: "https://www.linkedin.com/in/tobias-stegmayer-612551218/",
    foto: fotoTobias,
  },
];

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
              Llevá tu estado académico, mirá qué materias podés cursar, armá tu horario, medí lo que estudiás y encontrá
              los apuntes y grupos de otros alumnos. En la compu y en el celu. Gratis.
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
            <p>Chedul junta lo que hoy tenés repartido entre el SysAcad, planillas, grupos de WhatsApp y el campus.</p>
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
            <h2>Tu semana armada sola</h2>
            <p>
              Marcás una materia como cursando, elegís la comisión y Chedul carga sus horarios con el aula. Sumá el
              trabajo o lo que se repita y llevate todo a Google Calendar con un link.
            </p>
          </div>
          <Captura claro={horariosClaro} oscuro={horariosOscuro} alt="Horario semanal de Chedul" />
        </section>

        <section className="landing-seccion landing-muestra">
          <div className="landing-muestra__texto">
            <h2>Estudiá con una meta</h2>
            <p>
              Pomodoro o cronómetro, una meta por día y tus horas de la semana y del mes. Sumá rachas, medallas y
              trofeos, y mirá cuánto falta para el próximo parcial.
            </p>
          </div>
          <Captura claro={estudiarClaro} oscuro={estudiarOscuro} alt="Sección Estudiar de Chedul con el pomodoro y la meta diaria" />
        </section>

        <section className="landing-seccion landing-muestra landing-muestra--invertida">
          <div className="landing-muestra__texto">
            <h2>Los grupos de la carrera, juntos</h2>
            <p>
              Los alumnos suman los grupos de WhatsApp, Discord y Telegram de cada materia. Si un link no anda, se
              reporta y desaparece.
            </p>
          </div>
          <Captura claro={comunidadesClaro} oscuro={comunidadesOscuro} alt="Comunidades de la carrera en Chedul" />
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
        <section className="landing-nosotros" id="quienes-somos" aria-labelledby="nosotros-titulo">
          <h2 id="nosotros-titulo">Quiénes somos</h2>
          <p>
            Somos estudiantes de Ingeniería en Sistemas de la UTN Facultad Regional Resistencia. Hicimos Chedul porque
            llevar la carrera entre planillas, el SysAcad y grupos de WhatsApp era un lío. Es gratis, sin publicidad, y
            lo vamos mejorando con lo que nos piden los alumnos.
          </p>
          <ul className="landing-equipo">
            {EQUIPO.map((persona) => (
              <li key={persona.nombre}>
                {persona.foto ? (
                  <img className="landing-equipo__avatar" src={persona.foto} alt="" loading="lazy" />
                ) : (
                  <span className="landing-equipo__avatar" aria-hidden="true">
                    {persona.nombre
                      .split(" ")
                      .slice(0, 2)
                      .map((p) => p[0])
                      .join("")}
                  </span>
                )}
                <div>
                  <a href={persona.link} target="_blank" rel="noopener noreferrer">
                    {persona.nombre}
                  </a>
                  <span>{persona.rol}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <div className="landing-pie__fila">
          <img src={logo} alt="Chedul" className="landing-pie__logo" />
          <span>Hecho por estudiantes de la UTN FRRe, para estudiantes.</span>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
