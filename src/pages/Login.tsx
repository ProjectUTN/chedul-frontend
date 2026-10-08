import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../features/auth/AuthLayout";
import BotonGoogle from "../features/auth/BotonGoogle";
import CampoPassword from "../features/auth/CampoPassword";
import { useAuth } from "../context/authProvider";
import { mensajeDeError } from "../api/client";

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
    <AuthLayout titulo="¡Hola de nuevo!" subtitulo="Entrá para ver cómo va tu carrera.">
      <BotonGoogle texto="continue_with" separador="o con tu correo" />

      <form onSubmit={handleSubmit} className="form">
        <label className="campo">
          <span>Correo electrónico</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </label>
        <CampoPassword
          etiqueta="Contraseña"
          name="password"
          autoComplete="current-password"
          value={formData.password}
          onChange={handleChange}
        />

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn btn-primario" disabled={enviando}>
          {enviando ? "Ingresando..." : "Ingresar"}
          {!enviando && <span className="material-symbols-rounded">arrow_forward</span>}
        </button>
      </form>

      <p className="auth-pie">
        ¿Todavía no tenés cuenta? <Link to="/registro">Creala gratis</Link>
      </p>
    </AuthLayout>
  );
}

export default Login;
