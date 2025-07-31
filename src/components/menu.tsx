import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./menu.css";
import { useAuth } from "../context/authProvider";
import logo from "../assets/1B-Chedul_Logo_Horizontal_Azul.svg";

const navigation = [
  {
    title: "Inicio",
    href: "/inicio",
    icon: "grid_view",
  },
  {
    title: "Estado Académico",
    href: "/estado",
    icon: "rocket_launch",
  },

  {
    title: "Mails",
    href: "/correos",
    icon: "mail",
  },
];

const Menu = () => {
  const location = useLocation();
  const [paginaActual, setPaginaActual] = useState("");

  useEffect(() => {
    const routesMap: { [key: string]: string } = {
      "/inicio": "Inicio",
      "/estado": "Estado Académico",
      "/mails": "Mails",
    };

    const currentPage = routesMap[location.pathname] || "";
    setPaginaActual(currentPage);
  }, [location]);

  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    // TODO: por ahora logout solo devuelve void, en un futuro tendra que hacer una llamada a la API
    logout();
    navigate("/login");
  };

  return (
    <>
      <nav className="navigation">
        <img className="logo" src={logo} alt="Logo" />
        {/* <img className="logoSm" alt="Logo" /> */}

        <div className="navigation__options">
          <ul className="navigation__menu">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={
                    paginaActual === item.title
                      ? "paginaActual"
                      : "navigation__link"
                  }>
                  <span className="material-symbols-rounded icon-size">
                    {item.icon}
                  </span>
                  {/* <i className={`${item.icon} icon-size`}></i> */}
                  <p className="descrip-menu">{item.title}</p>
                  <span className="tooltipNav">{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
          <button className="salirBtn navigation__link" onClick={handleLogout}>
            <span className="material-symbols-rounded">logout</span>
            <p className="descrip-menu">Salir</p>
            <span className="tooltipNav">Salir</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default Menu;
