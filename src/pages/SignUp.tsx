import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AuthLayout from "../features/auth/AuthLayout";
import BotonGoogle from "../features/auth/BotonGoogle";
import CampoPassword from "../features/auth/CampoPassword";
import { getCarreras, signup } from "../features/auth/api";
import { erroresDeCampo, mensajeDeError, type ErroresCampo } from "../api/client";
import type { Carrera } from "../api/types";
import { useAuth } from "../context/authProvider";

const forbiddenChars = ["/", "(", ")", '"', "<", ">", "\\", "{", "}"];
const contieneCaracteresProhibidos = (texto: string) => {
  return forbiddenChars.some((char) => texto.includes(char));
};

// Mismas reglas que valida la API (domain/password.go)
const tiposDeCaracter = (password: string) =>
  [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length;

// De 0 a 4 para la barrita: largo minimo y variedad de caracteres
const fuerzaPassword = (password: string) => {
  if (!password) return 0;
  if (password.length < 8) return 1;
  const tipos = tiposDeCaracter(password);
  if (tipos < 3) return 2;
  return password.length >= 12 && tipos === 4 ? 4 : 3;
};

const validarFormulario = (nombre: string, password: string, carreraId: number): ErroresCampo => {
  const errores: ErroresCampo = {};

  if (nombre.trim().length === 0) {
    errores.nombre = "Poné tu nombre.";
  } else if (contieneCaracteresProhibidos(nombre)) {
    errores.nombre = "El nombre contiene caracteres no permitidos.";
  }

  if (password.length < 8) {
    errores.password = "La contraseña debe tener al menos 8 caracteres.";
  } else if (/\s/.test(password)) {
    errores.password = "La contraseña no puede tener espacios.";
  } else if (tiposDeCaracter(password) < 3) {
    errores.password = "Usá al menos 3 de estos: mayúsculas, minúsculas, números y símbolos.";
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "carrera_id" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const erroresLocales = validarFormulario(formData.nombre, formData.password, formData.carrera_id);
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

  const fuerza = fuerzaPassword(formData.password);
  const unicaCarrera = carreras.length === 1 ? carreras[0] : null;

  return (
    <AuthLayout titulo="Creá tu cuenta" subtitulo="Es gratis y te lleva un minuto.">
      <BotonGoogle texto="signup_with" separador="o con tu correo" />

      <form onSubmit={handleSubmit} className="form" noValidate>
        <label className="campo">
          <span>Nombre</span>
          <input
            type="text"
            name="nombre"
            autoComplete="name"
            placeholder="Cómo te llamás"
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
            placeholder="tu@correo.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
          {errores.email && <small className="campo-error">{errores.email}</small>}
        </label>

        {unicaCarrera ? (
          <div className="auth-carrera">
            <span className="material-symbols-rounded">school</span>
            {unicaCarrera.nombre}
          </div>
        ) : (
          <label className="campo">
            <span>Carrera</span>
            <select name="carrera_id" value={formData.carrera_id} onChange={handleChange} required>
              <option value={0} disabled>
                Elegí tu carrera
              </option>
              {carreras.map((carrera) => (
                <option key={carrera.id} value={carrera.id}>
                  {carrera.nombre}
                </option>
              ))}
            </select>
            {errores.carrera_id && <small className="campo-error">{errores.carrera_id}</small>}
          </label>
        )}

        <CampoPassword
          etiqueta="Contraseña"
          name="password"
          autoComplete="new-password"
          value={formData.password}
          onChange={handleChange}>
          <div className="fuerza" data-nivel={fuerza} aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          {errores.password ? (
            <small className="campo-error">{errores.password}</small>
          ) : (
            <small className="campo-ayuda">
              8 o más caracteres, mezclando mayúsculas, minúsculas, números o símbolos.
            </small>
          )}
        </CampoPassword>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn btn-primario" disabled={enviando}>
          {enviando ? "Creando cuenta..." : "Crear cuenta"}
          {!enviando && <span className="material-symbols-rounded">arrow_forward</span>}
        </button>
      </form>

      <p className="auth-pie">
        ¿Ya tenés cuenta? <Link to="/login">Ingresá</Link>
      </p>
    </AuthLayout>
  );
}

export default SignUp;
