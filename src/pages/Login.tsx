import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authProvider";
import { mensajeDeError } from "../api/client";
import logo from "../assets/1B-Chedul_Logo_Horizontal_Azul.svg";
import "./auth.css";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const desde = (location.state as { desde?: string } | null)?.desde ?? "/inicio";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setEnviando(true);

    try {
      await login(formData.email, formData.password);
      navigate(desde, { replace: true });
    } catch (err) {
      setError(mensajeDeError(err, "Credenciales inválidas"));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <img className="auth-logo" src={logo} alt="Chedul" />
        <div>
          <h1 className="auth-title">Bienvenido nuevamente</h1>
          <p className="auth-subtitle">
            ¿Sos nuevo? <Link to="/registro">Registrate</Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <label className="campo">
            <span>Correo electrónico</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </label>
          <label className="campo">
            <span>Contraseña</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-primario" disabled={enviando}>
            {enviando ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
