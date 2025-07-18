import React, { useState } from "react";
import { signup } from "../features/signup/api";
import { useNavigate } from "react-router";

const forbiddenChars = ["/", "(", ")", '"', "<", ">", "\\", "{", "}"];
const contieneCaracteresProhibidos = (texto: string) => {
  return forbiddenChars.some((char) => texto.includes(char));
};

const validarFormulario = (
  nombre: string,
  password: string,
  password2: string
): string | null => {
  if (nombre.length < 4) {
    return "El nombre debe tener al menos 4 caracteres.";
  }

  if (contieneCaracteresProhibidos(nombre)) {
    return "El nombre contiene caracteres no permitidos.";
  }

  if (password.length < 6) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }

  if (password !== password2) {
    return "Las contraseñas no coinciden.";
  }

  return null;
};

function SignUp() {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    carrera: "ISI",
    password: "",
    password2: "",
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();

  const carrerasData = [{ id: "ISI", nombre: "Ingeniería en sistemas" }];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const error = validarFormulario(
      formData.nombre,
      formData.password,
      formData.password2
    );

    if (error) {
      setError(error);
      return;
    }

    try {
      await signup({
        nombre: formData.nombre,
        email: formData.email,
        carrera: formData.carrera,
        password: formData.password,
      });

      console.log("Registro exitoso");
      navigate("/login");
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Ocurrió un error al registrar");
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h1 className="title">
          <strong>Crear Cuenta</strong>
        </h1>
        <p>
          ¿Ya tienes una cuenta?{" "}
          <span>
            <a href="/login">
              <u>Inicia sesión</u>
            </a>
          </span>
        </p>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="nombre">
              <strong>Nombre</strong>
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </div>

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

          {/* Esto sirve para cuando tengamos más de una materia, por ahora solo ISI */}
          {/* <div>
            <label htmlFor="carrera">
              <strong>Carrera</strong>
            </label>
            <select
              id="carrera"
              name="carrera"
              value={formData.carrera}
              onChange={handleChange}
              required>
              <option value="">Seleccione una carrera</option>
              {carrerasData.map((carrera) => (
                <option key={carrera.id} value={carrera.id}>
                  {carrera.nombre}
                </option>
              ))}
            </select>
          </div> */}

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
          <div>
            <label htmlFor="password2">
              <strong>Confirmar Contraseña</strong>
            </label>
            <div className="password-input">
              <input
                type="password"
                id="password2"
                name="password2"
                value={formData.password2}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <button type="submit" className="login-btn">
            <strong>Registrarse</strong>
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}

export default SignUp;
