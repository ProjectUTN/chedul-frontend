import { useState } from "react";
import { useAuth } from "../context/authProvider";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await login(formData.email, formData.password);

      console.log("Login exitoso");

      // TODO: verificar si la primer ruta será inicio, home o dashboard
      navigate("/inicio");
    } catch (err: any) {
      setError("Credenciales inválidas");
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <div>
          <h1 className="title">
            <strong>Bienvenido nuevamente</strong>
          </h1>
          <p>
            ¿Sos nuevo?{" "}
            <span>
              <Link to="/">
                <u>Registrate</u>
              </Link>
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="formulario">
          <div>
            <label htmlFor="email">
              <strong>Correo Electrónico</strong>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="password">
              <strong>Contraseña</strong>
            </label>
            <div className="password-input">
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button type="submit" className="login-btn">
            <strong>Iniciar Sesión</strong>
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}

export default Login;
