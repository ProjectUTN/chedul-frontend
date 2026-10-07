import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  crearAporte,
  editarAporte,
  getAporte,
  getTags,
  type DatosAporte,
} from "../features/aportes/api";
import { getMaterias } from "../features/estado_academico/api";
import {
  EXTENSIONES_PERMITIDAS,
  TAMANO_MAXIMO_MB,
  formatearTamano,
  iconoDeArchivo,
} from "../features/aportes/formato";
import { useAuth } from "../context/authProvider";
import { erroresDeCampo, mensajeDeError, type ErroresCampo } from "../api/client";
import type { Aporte, AporteTag, Materia } from "../api/types";
import "../features/aportes/aportes.css";

const datosVacios: DatosAporte = {
  titulo: "",
  descripcion: "",
  materia_id: 0,
  tag_id: 0,
  link: "",
};

const extensionDe = (nombre: string) => {
  const i = nombre.lastIndexOf(".");
  return i >= 0 ? nombre.slice(i).toLowerCase() : "";
};

function FormularioAporte() {
  const { id } = useParams();
  const editando = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [datos, setDatos] = useState<DatosAporte>(datosVacios);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [aporteOriginal, setAporteOriginal] = useState<Aporte | null>(null);

  const [materias, setMaterias] = useState<Materia[]>([]);
  const [tags, setTags] = useState<AporteTag[]>([]);

  const [errores, setErrores] = useState<ErroresCampo>({});
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);
  const inputArchivo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    getMaterias(user.carrera).then(setMaterias).catch((err) => setError(mensajeDeError(err)));
    getTags().then(setTags).catch((err) => setError(mensajeDeError(err)));
  }, [user]);

  useEffect(() => {
    if (!id) return;
    getAporte(Number(id))
      .then((aporte) => {
        if (!aporte.es_mio) {
          setError("Solo podés editar tus propios aportes.");
          return;
        }
        setAporteOriginal(aporte);
        setDatos({
          titulo: aporte.titulo,
          descripcion: aporte.descripcion,
          materia_id: aporte.materia.id,
          tag_id: aporte.tag.id,
          link: aporte.link ?? "",
        });
      })
      .catch((err) => setError(mensajeDeError(err, "No se encontró el aporte")));
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setDatos((prev) => ({
      ...prev,
      [name]: name === "materia_id" || name === "tag_id" ? Number(value) : value,
    }));
    setErrores((prev) => ({ ...prev, [name]: "" }));
  };

  const elegirArchivo = (file: File | undefined) => {
    if (!file) return;

    if (!EXTENSIONES_PERMITIDAS.includes(extensionDe(file.name))) {
      setErrores((prev) => ({
        ...prev,
        archivo: "Tipo de archivo no permitido. Se aceptan PDF, imágenes, Word, Excel, PowerPoint, texto y ZIP.",
      }));
      return;
    }
    if (file.size > TAMANO_MAXIMO_MB * 1024 * 1024) {
      setErrores((prev) => ({
        ...prev,
        archivo: `El archivo no puede pesar más de ${TAMANO_MAXIMO_MB} MB.`,
      }));
      return;
    }

    setArchivo(file);
    setErrores((prev) => ({ ...prev, archivo: "", link: "" }));
    if (!datos.titulo) {
      const sinExtension = file.name.replace(/\.[^.]+$/, "");
      setDatos((prev) => ({ ...prev, titulo: sinExtension.slice(0, 100) }));
    }
  };

  const validar = (): ErroresCampo => {
    const e: ErroresCampo = {};
    if (!datos.titulo.trim()) e.titulo = "Poné un título.";
    if (!datos.materia_id) e.materia_id = "Elegí la materia.";
    if (!datos.tag_id) e.tag_id = "Elegí el tipo de aporte.";

    const tieneArchivo = archivo || aporteOriginal?.archivo;
    if (datos.link.trim() && !/^https?:\/\/\S+$/i.test(datos.link.trim())) {
      e.link = "El link tiene que empezar con http:// o https://";
    } else if (!datos.link.trim() && !tieneArchivo) {
      e.link = "Subí un archivo o agregá un link.";
    }
    return e;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const locales = validar();
    setErrores(locales);
    if (Object.values(locales).some(Boolean)) return;

    setEnviando(true);
    setProgreso(0);
    try {
      if (editando && aporteOriginal) {
        await editarAporte(aporteOriginal.id, datos);
        toast.success("Aporte actualizado");
      } else {
        await crearAporte(datos, archivo, setProgreso);
        toast.success("¡Gracias por tu aporte!");
      }
      navigate(`/aportes?materia_id=${datos.materia_id}`);
    } catch (err) {
      const deCampo = erroresDeCampo(err);
      if (Object.keys(deCampo).length > 0) setErrores(deCampo);
      else setError(mensajeDeError(err, "No se pudo guardar el aporte"));
    } finally {
      setEnviando(false);
    }
  };

  const materiasPorNivel = [1, 2, 3, 4, 5]
    .map((nivel) => ({ nivel, materias: materias.filter((m) => m.nivel === nivel) }))
    .filter((g) => g.materias.length > 0);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{editando ? "Editar aporte" : "Subir aporte"}</h1>
          <p>
            Compartí un archivo (PDF, imagen, Word, etc.) o un link a Drive,
            YouTube o donde lo tengas.
          </p>
        </div>
      </div>

      <form className="form form-aporte card" onSubmit={handleSubmit} noValidate>
        {!editando && (
          <div className="campo">
            <span>Archivo</span>
            {archivo ? (
              <div className="archivo-elegido">
                <span className="material-symbols-rounded">
                  {iconoDeArchivo(archivo.type)}
                </span>
                <span className="archivo-elegido__nombre">{archivo.name}</span>
                <small className="campo-ayuda">{formatearTamano(archivo.size)}</small>
                <button
                  type="button"
                  className="btn btn-icono"
                  onClick={() => setArchivo(null)}
                  aria-label="Quitar archivo">
                  <span className="material-symbols-rounded">close</span>
                </button>
              </div>
            ) : (
              <div
                className={arrastrando ? "dropzone dropzone--activa" : "dropzone"}
                role="button"
                tabIndex={0}
                onClick={() => inputArchivo.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") inputArchivo.current?.click();
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setArrastrando(true);
                }}
                onDragLeave={() => setArrastrando(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setArrastrando(false);
                  elegirArchivo(e.dataTransfer.files[0]);
                }}>
                <span className="material-symbols-rounded">upload_file</span>
                <strong>Arrastrá un archivo o hacé click para elegirlo</strong>
                <small>Hasta {TAMANO_MAXIMO_MB} MB. Opcional si agregás un link.</small>
              </div>
            )}
            <input
              ref={inputArchivo}
              type="file"
              hidden
              accept={EXTENSIONES_PERMITIDAS.join(",")}
              onChange={(e) => {
                elegirArchivo(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            {errores.archivo && <small className="campo-error">{errores.archivo}</small>}
          </div>
        )}

        {editando && aporteOriginal?.archivo && (
          <p className="campo-ayuda">
            Archivo: {aporteOriginal.archivo.nombre}. Para cambiarlo, borrá el
            aporte y subilo de nuevo.
          </p>
        )}

        <label className="campo">
          <span>Título</span>
          <input
            name="titulo"
            maxLength={100}
            value={datos.titulo}
            onChange={handleChange}
            placeholder="Ej: Resumen primer parcial"
          />
          {errores.titulo && <small className="campo-error">{errores.titulo}</small>}
        </label>

        <div className="form-aporte__fila">
          <label className="campo">
            <span>Materia</span>
            <select name="materia_id" value={datos.materia_id} onChange={handleChange}>
              <option value={0} disabled>
                Elegí la materia
              </option>
              {materiasPorNivel.map((grupo) => (
                <optgroup key={grupo.nivel} label={`${grupo.nivel}° año`}>
                  {grupo.materias.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {errores.materia_id && (
              <small className="campo-error">{errores.materia_id}</small>
            )}
          </label>

          <label className="campo">
            <span>Tipo</span>
            <select name="tag_id" value={datos.tag_id} onChange={handleChange}>
              <option value={0} disabled>
                Elegí el tipo
              </option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
            {errores.tag_id && <small className="campo-error">{errores.tag_id}</small>}
          </label>
        </div>

        <label className="campo">
          <span>Link {archivo || aporteOriginal?.archivo ? "(opcional)" : ""}</span>
          <input
            name="link"
            type="url"
            value={datos.link}
            onChange={handleChange}
            placeholder="https://drive.google.com/..."
          />
          {errores.link && <small className="campo-error">{errores.link}</small>}
        </label>

        <label className="campo">
          <span>Descripción (opcional)</span>
          <textarea
            name="descripcion"
            maxLength={2000}
            value={datos.descripcion}
            onChange={handleChange}
            placeholder="¿Qué temas cubre? ¿De qué año es?"
          />
          {errores.descripcion && (
            <small className="campo-error">{errores.descripcion}</small>
          )}
        </label>

        {enviando && archivo && (
          <div
            className="progreso-subida"
            role="progressbar"
            aria-valuenow={progreso}
            aria-valuemin={0}
            aria-valuemax={100}>
            <div style={{ width: `${progreso}%` }} />
          </div>
        )}

        {error && <p className="form-error">{error}</p>}

        <div className="form-acciones">
          <Link className="btn btn-secundario" to="/aportes">
            Cancelar
          </Link>
          <button className="btn btn-primario" type="submit" disabled={enviando}>
            {enviando
              ? "Guardando..."
              : editando
                ? "Guardar cambios"
                : "Publicar aporte"}
          </button>
        </div>
      </form>
    </>
  );
}

export default FormularioAporte;
