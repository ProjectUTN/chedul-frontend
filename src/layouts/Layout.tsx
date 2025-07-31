import { Outlet } from "react-router-dom";
import Menu from "../components/menu";
import "./layout.css";

const Layout = () => {
  return (
    <section className="layout">
      <Menu />
      <main className="main-content">
        <Outlet />
      </main>
    </section>
  );
};

export default Layout;
