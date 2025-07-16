import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { useState } from "react";

const HomePage = () => <h1>Página de Inicio (Pública)</h1>;
const AboutPage = () => <h1>Página Sobre Nosotros (Pública)</h1>;
const DashboardPage = () => <h1>Dashboard (Privada)</h1>;
const ProfilePage = () => <h1>Perfil de Usuario (Privada)</h1>;
const LoginPage = ({
  onLogin,
}: {
  onLogin: (user: { id: string; name: string }) => void;
}) => {
  const handleLogin = () => {
    onLogin({ id: "123", name: "Tobias fokintemayer" });
  };

  return (
    <div>
      <h1>Página de Login</h1>
      <button onClick={handleLogin}>Iniciar Sesión</button>
    </div>
  );
};

export const AppRouter = () => {
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);

  const handleLogin = (loggedInUser: { id: string; name: string }) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <BrowserRouter>
      <header style={{ padding: "20px", borderBottom: "1px solid #ccc" }}>
        <nav>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              display: "flex",
              gap: "20px",
            }}>
            {/* Reemplaza <a> con <Link> */}
            <li>
              <Link to="/">Inicio</Link>
            </li>
            <li>
              <Link to="/about">Sobre Nosotros</Link>
            </li>
            {user && (
              <>
                <li>
                  <Link to="/dashboard">Dashboard</Link>
                </li>
                <li>
                  <Link to="/profile">Perfil</Link>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    style={{
                      background: "none",
                      border: "none",
                      color: "blue",
                      cursor: "pointer",
                    }}>
                    Cerrar Sesión
                  </button>
                </li>
              </>
            )}
            {!user && (
              <li>
                <Link to="/login">Login</Link>
              </li>
            )}
          </ul>
        </nav>
        {user && <p>Bienvenido, {user.name}!</p>}
      </header>

      <div style={{ padding: "20px" }}>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />

          {/* Rutas Privadas */}
          <Route element={<ProtectedRoute user={user} redirectPath="/login" />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Ruta para 404 (No encontrada) */}
          <Route path="*" element={<h1>404: Página no encontrada</h1>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};
