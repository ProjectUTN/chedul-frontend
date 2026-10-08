import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import "./menu.css";
import { useAuth } from "../context/authProvider";
import useTema from "../hooks/useTema";
import logo from "../assets/1B-Chedul_Logo_Horizontal_Azul.svg";

interface Item {
  title: string;
  corto?: string;
  href: string;
  icon: string;
  // En el celular, los que no son principales van en el menu "Más"
  principal?: boolean;
}

const navigation: Item[] = [
  { title: "Inicio", href: "/inicio", icon: "home", principal: true },
  { title: "Estado académico", corto: "Estado", href: "/estado", icon: "school", principal: true },
  { title: "Aportes", href: "/aportes", icon: "library_books", principal: true },
  { title: "Horarios", href: "/horarios", icon: "schedule", principal: true },
  { title: "Calendario", corto: "Agenda", href: "/calendario", icon: "calendar_month", principal: true },
  { title: "Estudiar", href: "/herramientas/estudiar", icon: "timer" },
  { title: "Mapa de correlativas", href: "/correlativas", icon: "account_tree" },
  { title: "Comunidades", href: "/herramientas/comunidades", icon: "groups" },
  // Electivas, 531, mails y lo de arriba: todo junto
  { title: "Herramientas", href: "/herramientas", icon: "apps" },
];

const iniciales = (nombre?: string) =>
  (nombre ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

function BotonTema({ conTexto = false }: { conTexto?: boolean }) {
  const { tema, alternar } = useTema();
  const siguiente = tema === "claro" ? "oscuro" : "claro";
  return (
    <button
      type="button"
      className={conTexto ? "nav-link" : "boton-redondo"}
      onClick={alternar}
      aria-label={`Cambiar a modo ${siguiente}`}
      title={`Cambiar a modo ${siguiente}`}>
      <span className="material-symbols-rounded">{tema === "claro" ? "dark_mode" : "light_mode"}</span>
      {conTexto && <span>Modo {siguiente}</span>}
    </button>
  );
}

const Menu = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [masAbierto, setMasAbierto] = useState(false);
  const sheet = useRef<HTMLDialogElement>(null);

  const handleLogout = async () => {
    setMasAbierto(false);
    await logout();
    navigate("/login");
  };

  useEffect(() => {
    const dialog = sheet.current;
    if (!dialog) return;
    if (masAbierto && !dialog.open) dialog.showModal();
    if (!masAbierto && dialog.open) dialog.close();
  }, [masAbierto]);

  // Al navegar se cierra el menu "Más"
  useEffect(() => setMasAbierto(false), [location.pathname]);

  // Herramientas no se marca cuando estas en una herramienta que tiene su
  // propia entrada (Estudiar, Comunidades)
  const activo = (item: Item) => {
    const ruta = location.pathname;
    const dentro = (href: string) => ruta === href || ruta.startsWith(`${href}/`);
    return dentro(item.href) && !navigation.some((o) => o.href.startsWith(`${item.href}/`) && dentro(o.href));
  };

  const secundarios = navigation.filter((i) => !i.principal);
  const enSecundario = secundarios.some((i) => location.pathname.startsWith(i.href));

  return (
    <>
      {/* Barra lateral (compu) */}
      <nav className="sidebar" aria-label="Principal">
        <img className="sidebar__logo" src={logo} alt="Chedul" />

        <ul className="sidebar__menu">
          {navigation.map((item) => (
            <li key={item.href}>
              <NavLink to={item.href} className={() => (activo(item) ? "nav-link activo" : "nav-link")}>
                <span className="material-symbols-rounded">{item.icon}</span>
                <span>{item.title}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="sidebar__footer">
          <BotonTema conTexto />
          {user && (
            <div className="usuario">
              <span className="avatar" aria-hidden="true">
                {iniciales(user.nombre)}
              </span>
              <div className="usuario__datos">
                <strong>{user.nombre}</strong>
                <span>{user.email}</span>
              </div>
              <button
                type="button"
                className="boton-redondo"
                onClick={handleLogout}
                aria-label="Cerrar sesión"
                title="Cerrar sesión">
                <span className="material-symbols-rounded">logout</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Barra de arriba (celular) */}
      <header className="topbar">
        <img className="topbar__logo" src={logo} alt="Chedul" />
        <div className="topbar__acciones">
          <BotonTema />
          <button
            type="button"
            className="avatar avatar--boton"
            onClick={() => setMasAbierto(true)}
            aria-label="Abrir menú de la cuenta">
            {iniciales(user?.nombre)}
          </button>
        </div>
      </header>

      {/* Menu de abajo (celular) */}
      <nav className="bottom-nav" aria-label="Principal">
        {navigation
          .filter((i) => i.principal)
          .map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) => (isActive ? "bottom-nav__item activo" : "bottom-nav__item")}>
              <span className="bottom-nav__icono material-symbols-rounded">{item.icon}</span>
              <span className="bottom-nav__texto">{item.corto ?? item.title}</span>
            </NavLink>
          ))}
        <button
          type="button"
          className={enSecundario || masAbierto ? "bottom-nav__item activo" : "bottom-nav__item"}
          onClick={() => setMasAbierto(true)}
          aria-haspopup="dialog">
          <span className="bottom-nav__icono material-symbols-rounded">menu</span>
          <span className="bottom-nav__texto">Más</span>
        </button>
      </nav>

      <dialog
        ref={sheet}
        className="sheet"
        onClose={() => setMasAbierto(false)}
        onClick={(e) => {
          if (e.target === sheet.current) setMasAbierto(false);
        }}>
        <div className="sheet__contenido">
          <span className="sheet__agarre" aria-hidden="true" />
          {user && (
            <div className="usuario">
              <span className="avatar" aria-hidden="true">
                {iniciales(user.nombre)}
              </span>
              <div className="usuario__datos">
                <strong>{user.nombre}</strong>
                <span>{user.email}</span>
              </div>
            </div>
          )}
          <ul className="sheet__lista">
            {secundarios.map((item) => (
              <li key={item.href}>
                <NavLink to={item.href} className={() => (activo(item) ? "nav-link activo" : "nav-link")}>
                  <span className="material-symbols-rounded">{item.icon}</span>
                  <span>{item.title}</span>
                </NavLink>
              </li>
            ))}
            <li>
              <BotonTema conTexto />
            </li>
            <li>
              <button type="button" className="nav-link nav-link--peligro" onClick={handleLogout}>
                <span className="material-symbols-rounded">logout</span>
                <span>Cerrar sesión</span>
              </button>
            </li>
          </ul>
        </div>
      </dialog>
    </>
  );
};

export default Menu;
