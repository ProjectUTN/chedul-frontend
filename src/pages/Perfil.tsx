import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/authProvider";
import { erroresDeCampo, mensajeDeError, type ErroresCampo } from "../api/client";
import { getCarreras } from "../features/auth/api";
import { actualizarPerfil, borrarCuenta, cambiarPassword } from "../features/perfil/api";
import { confirmar } from "../components/confirmar";
import type { Carrera } from "../api/types";
import "../features/perfil/perfil.css";

// Perfil: corregir el nombre (y la carrera si hay mas de una), cambiar la
// contraseña y borrar la cuenta.

const iniciales = (nombre: string) =>
  nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

function Perfil() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [carreras, setCarreras] = useState<Carrera[]>([]);

  const [nombre, setNombre] = useState(user?.nombre ?? "");
  const [apellido, setApellido] = useState(user?.apellido ?? "");
  const [carrera, setCarrera] = useState(user?.carrera ?? 0);
  const [erroresDatos, setErroresDatos] = useState<ErroresCampo>({});
  const [guardandoDatos, setGuardandoDatos] = useState(false);

  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetida, setRepetida] = useState("");
  const [erroresClave, setErroresClave] = useState<ErroresCampo>({});
  const [guardandoClave, setGuardandoClave] = useState(false);

  useEffect(() => {
    getCarreras()
      .then(setCarreras)
      .catch(() => {});
  }, []);

  if (!user) return null;

  const datosCambiaron =
    nombre.trim() !== user.nombre || apellido.trim() !== (user.apellido ?? "") || carrera !== user.carrera;

  const guardarDatos = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErroresDatos({ nombre: "Poné tu nombre" });
      return;
    }
    if (carrera !== user.carrera) {
      const ok = await confirmar({
        titulo: "¿Cambiar de carrera?",
        mensaje:
          "Vas a ver las materias de la otra carrera. Lo que marcaste en estado académico queda guardado, pero solo cuenta para la carrera de cada materia.",
        aceptar: "Cambiar",
      });
      if (!ok) return;
    }
    setErroresDatos({});
    setGuardandoDatos(true);
    try {
      const alumno = await actualizarPerfil(nombre.trim(), apellido.trim(), carrera);
      setUser(alumno);
      setNombre(alumno.nombre);
      setApellido(alumno.apellido ?? "");
      toast.success("Listo, guardamos tus datos");
    } catch (err) {
      const errores = erroresDeCampo(err);
      if (Object.keys(errores).length > 0) setErroresDatos(errores);
      else toast.error(mensajeDeError(err, "No se pudieron guardar tus datos"));
    } finally {
      setGuardandoDatos(false);
    }
  };

  const guardarClave = async (e: FormEvent) => {
    e.preventDefault();
    const errores: ErroresCampo = {};
    if (!actual) errores.actual = "Poné tu contraseña actual";
    if (!nueva) errores.nueva = "Poné la contraseña nueva";
    else if (nueva !== repetida) errores.repetida = "Las contraseñas no coinciden";
    setErroresClave(errores);
    if (Object.keys(errores).length > 0) return;

    setGuardandoClave(true);
    try {
      await cambiarPassword(actual, nueva);
      setActual("");
      setNueva("");
      setRepetida("");
      toast.success("Contraseña cambiada");
    } catch (err) {
      const errores = erroresDeCampo(err);
      if (Object.keys(errores).length > 0) setErroresClave(errores);
      else toast.error(mensajeDeError(err, "No se pudo cambiar la contraseña"));
    } finally {
      setGuardandoClave(false);
    }
  };

  const borrar = async () => {
    const ok = await confirmar({
      titulo: "¿Borrar tu cuenta?",
      mensaje: "Se borran tu estado académico, horarios, eventos, aportes y sesiones de estudio. No se puede deshacer.",
      aceptar: "Borrar mi cuenta",
      peligro: true,
    });
    if (!ok) return;
    try {
      await borrarCuenta();
      await logout().catch(() => {});
      toast.info("Tu cuenta se borró");
      navigate("/");
    } catch (err) {
      toast.error(mensajeDeError(err, "No se pudo borrar la cuenta"));
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Mi perfil</h1>
          <p>Corregí tus datos o cambiá la contraseña.</p>
        </div>
      </div>

      <div className="mi-perfil">
        <form className="form card" onSubmit={guardarDatos} noValidate>
          <div className="mi-perfil__cabecera">
            <span className="avatar" aria-hidden="true">
              {iniciales(`${(nombre || user.nombre).split(" ")[0]} ${apellido}`)}
            </span>
            <div>
              <strong>{`${user.nombre} ${user.apellido ?? ""}`.trim()}</strong>
              <span>{user.email}</span>
            </div>
          </div>

          <label className="campo">
            <span>Nombre</span>
            <input
              name="nombre"
              autoComplete="name"
              maxLength={100}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            {erroresDatos.nombre && <small className="campo-error">{erroresDatos.nombre}</small>}
          </label>

          <label className="campo">
            <span>Apellido</span>
            <input
              name="apellido"
              autoComplete="family-name"
              maxLength={100}
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
            />
            {erroresDatos.apellido ? (
              <small className="campo-error">{erroresDatos.apellido}</small>
            ) : (
              <small className="campo-ayuda">
                En los aportes y el ranking los demás ven solo tu nombre y la inicial del apellido.
                {!apellido.trim() && " Todavía no lo cargaste."}
              </small>
            )}
          </label>

          {carreras.length > 1 && (
            <label className="campo">
              <span>Carrera</span>
              <select value={carrera} onChange={(e) => setCarrera(Number(e.target.value))}>
                {carreras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              {erroresDatos.carrera_id && <small className="campo-error">{erroresDatos.carrera_id}</small>}
            </label>
          )}

          <label className="campo">
            <span>Correo</span>
            <input value={user.email} disabled readOnly />
            <small className="campo-ayuda">El correo no se puede cambiar porque es con el que entrás.</small>
          </label>

          <div className="form-acciones">
            <button className="btn btn-primario" type="submit" disabled={guardandoDatos || !datosCambiaron}>
              {guardandoDatos ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>

        <form className="form card" onSubmit={guardarClave} noValidate>
          <h2>Contraseña</h2>
          <p className="campo-ayuda">Si entrás con Google no necesitás contraseña, podés ignorar esto.</p>

          <label className="campo">
            <span>Contraseña actual</span>
            <input
              type="password"
              autoComplete="current-password"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
            />
            {erroresClave.actual && <small className="campo-error">{erroresClave.actual}</small>}
          </label>

          <label className="campo">
            <span>Contraseña nueva</span>
            <input
              type="password"
              autoComplete="new-password"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
            />
            {erroresClave.nueva && <small className="campo-error">{erroresClave.nueva}</small>}
          </label>

          <label className="campo">
            <span>Repetí la contraseña nueva</span>
            <input
              type="password"
              autoComplete="new-password"
              value={repetida}
              onChange={(e) => setRepetida(e.target.value)}
            />
            {erroresClave.repetida && <small className="campo-error">{erroresClave.repetida}</small>}
          </label>

          <div className="form-acciones">
            <button className="btn btn-primario" type="submit" disabled={guardandoClave}>
              {guardandoClave ? "Cambiando..." : "Cambiar contraseña"}
            </button>
          </div>
        </form>

        <section className="form card mi-perfil__peligro">
          <h2>Borrar cuenta</h2>
          <p className="campo-ayuda">
            Se borra todo lo tuyo, también los aportes que subiste. Las comunidades que sumaste quedan para los demás.
          </p>
          <div className="form-acciones">
            <button type="button" className="btn btn-peligro" onClick={borrar}>
              <span className="material-symbols-rounded">delete</span>
              Borrar mi cuenta
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

export default Perfil;
