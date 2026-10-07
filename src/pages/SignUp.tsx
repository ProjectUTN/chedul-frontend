import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getCarreras, signup } from "../features/auth/api";
import { erroresDeCampo, mensajeDeError, type ErroresCampo } from "../api/client";
import type { Carrera } from "../api/types";
import { useAuth } from "../context/authProvider";
import logo from "../assets/1B-Chedul_Logo_Horizontal_Azul.svg";
import "./auth.css";

const forbiddenChars = ["/", "(", ")", '"', "<", ">", "\\", "{", "}"];
const contieneCaracteresProhibidos = (texto: string) => {
  return forbiddenChars.some((char) => texto.includes(char));
};

// Mismas reglas que valida la API (domain/password.go)
const tiposDeCaracter = (password: string) =>
  [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(password))
    .length;

const validarFormulario = (
  nombre: string,
  password: string,
  password2: string,
  carreraId: number
): ErroresCampo => {
  const errores: ErroresCampo = {};

  if (nombre.trim().length === 0) {
    errores.nombre = "El nombre es requerido.";
  } else if (contieneCaracteresProhibidos(nombre)) {
    errores.nombre = "El nombre contiene caracteres no permitidos.";
  }

  if (password.length < 8) {
    errores.password = "La contraseña debe tener al menos 8 caracteres.";
  } else if (/\s/.test(password)) {
    errores.password = "La contraseña no puede tener espacios.";
  } else if (tiposDeCaracter(password) < 3) {
    errores.password =
      "Usá al menos 3 de estos: mayúsculas, minúsculas, números y símbolos.";
  }

  if (password !== password2) {
    errores.password2 = "Las contraseñas no coinciden.";
  }

  if (!carreraId) {
    errores.carrera_id = "Elegí tu carrera.";
  }

  return errores;
};

function SignUp() {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    carrera_id: 0,
    password: "",
    password2: "",
  });

  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [errores, setErrores] = useState<ErroresCampo>({});
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    getCarreras()
      .then((data) => {
        setCarreras(data);
        if (data.length === 1) {
          setFormData((prev) => ({ ...prev, carrera_id: data[0].id }));
        }
      })
      .catch((err) => setError(mensajeDeError(err, "No se pudieron cargar las carreras")));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "carrera_id" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const erroresLocales = validarFormulario(
      formData.nombre,
      formData.password,
      formData.password2,
      formData.carrera_id
    );
    setErrores(erroresLocales);
    if (Object.keys(erroresLocales).length > 0) {
      return;
    }

    setEnviando(true);
    try {
      await signup({
        nombre: formData.nombre.trim(),
        email: formData.email,
        carrera_id: formData.carrera_id,
        password: formData.password,
      });

      await login(formData.email, formData.password);
      toast.success("¡Cuenta creada! Bienvenido a Chedul");
      navigate("/inicio", { replace: true });
    } catch (err) {
      const deCampo = erroresDeCampo(err);
      if (Object.keys(deCampo).length > 0) {
        setErrores(deCampo);
      } else {
        setError(mensajeDeError(err, "Ocurrió un error al registrarte"));
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <img className="auth-logo" src={logo} alt="Chedul" />
        <div>
          <h1 className="auth-title">Crear cuenta</h1>
          <p className="auth-subtitle">
            ¿Ya tenés una cuenta? <Link to="/login">Iniciá sesión</Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="form" noValidate>
          <label className="campo">
            <span>Nombre</span>
            <input
              type="text"
              name="nombre"
              autoComplete="name"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
            {errores.nombre && <small className="campo-error">{errores.nombre}</small>}
          </label>

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
            {errores.email && <small className="campo-error">{errores.email}</small>}
          </label>

          <label className="campo">
            <span>Carrera</span>
            <select
              name="carrera_id"
              value={formData.carrera_id}
              onChange={handleChange}
              required>
              <option value={0} disabled>
                Elegí tu carrera
              </option>
              {carreras.map((carrera) => (
                <option key={carrera.id} value={carrera.id}>
                  {carrera.nombre}
                </option>
              ))}
            </select>
            {errores.carrera_id && (
              <small className="campo-error">{errores.carrera_id}</small>
            )}
          </label>

          <label className="campo">
            <span>Contraseña</span>
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            {errores.password ? (
              <small className="campo-error">{errores.password}</small>
            ) : (
              <small className="campo-ayuda">
                Mínimo 8 caracteres, con mayúsculas, minúsculas, números o símbolos.
              </small>
            )}
          </label>

          <label className="campo">
            <span>Confirmar contraseña</span>
            <input
              type="password"
              name="password2"
              autoComplete="new-password"
              value={formData.password2}
              onChange={handleChange}
              required
            />
            {errores.password2 && (
              <small className="campo-error">{errores.password2}</small>
            )}
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-primario" disabled={enviando}>
            {enviando ? "Creando cuenta..." : "Registrarse"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SignUp;
