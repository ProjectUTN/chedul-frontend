import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import type { Aporte } from "../../api/types";
import { mensajeDeError } from "../../api/client";
import { confirmar } from "../../components/confirmar";
import { borrarAporte, descargarArchivo, setFavorito } from "./api";
import { formatearFecha, formatearTamano, iconoDeArchivo } from "./formato";
import "./aportes.css";

interface AporteCardProps {
  aporte: Aporte;
  onActualizado: (aporte: Aporte) => void;
  onBorrado: (id: number) => void;
}

function AporteCard({ aporte, onActualizado, onBorrado }: AporteCardProps) {
  const [ocupado, setOcupado] = useState(false);

  const toggleFavorito = async () => {
    setOcupado(true);
    try {
      const res = await setFavorito(aporte.id, !aporte.es_favorito);
      onActualizado({ ...aporte, ...res });
    } catch (err) {
      toast.error(mensajeDeError(err));
    } finally {
      setOcupado(false);
    }
  };

  const descargar = async () => {
    setOcupado(true);
    try {
      await descargarArchivo(aporte);
    } catch (err) {
      toast.error(mensajeDeError(err, "No se pudo descargar el archivo"));
    } finally {
      setOcupado(false);
    }
  };

  const borrar = async () => {
    const ok = await confirmar({
      titulo: "¿Borrar este aporte?",
      mensaje: `"${aporte.titulo}" se borra para todos y no se puede deshacer.`,
      aceptar: "Borrar",
      peligro: true,
    });
    if (!ok) return;
    setOcupado(true);
    try {
      await borrarAporte(aporte.id);
      toast.success("Aporte borrado");
      onBorrado(aporte.id);
    } catch (err) {
      toast.error(mensajeDeError(err));
      setOcupado(false);
    }
  };

  return (
    <article className="aporte-card card">
      <div className="aporte-card__tags">
        <span className="chip chip-azul">{aporte.tag.nombre}</span>
        <span className="chip">{aporte.materia.nombre}</span>
      </div>

      <div className="aporte-card__cuerpo">
        <h3>{aporte.titulo}</h3>
        {aporte.descripcion && <p className="aporte-card__descripcion">{aporte.descripcion}</p>}
      </div>

      <p className="aporte-card__meta">
        {aporte.es_mio ? "Subido por vos" : `Por ${aporte.autor.nombre}`} ·{" "}
        {formatearFecha(aporte.creado_en)}
      </p>

      <div className="aporte-card__acciones">
        {aporte.archivo && (
          <button
            className="btn btn-secundario"
            onClick={descargar}
            disabled={ocupado}
            title={aporte.archivo.nombre}>
            <span className="material-symbols-rounded">
              {iconoDeArchivo(aporte.archivo.tipo)}
            </span>
            Descargar
            <small className="aporte-card__tamano">
              {formatearTamano(aporte.archivo.tamano)}
            </small>
          </button>
        )}
        {aporte.link && (
          <a
            className="btn btn-secundario"
            href={aporte.link}
            target="_blank"
            rel="noopener noreferrer nofollow">
            <span className="material-symbols-rounded">open_in_new</span>
            Abrir link
          </a>
        )}

        <div className="aporte-card__acciones-derecha">
          {aporte.es_mio && (
            <>
              <Link
                className="btn btn-icono"
                to={`/aportes/${aporte.id}/editar`}
                title="Editar"
                aria-label="Editar">
                <span className="material-symbols-rounded">edit</span>
              </Link>
              <button
                className="btn btn-icono"
                onClick={borrar}
                disabled={ocupado}
                title="Borrar"
                aria-label="Borrar">
                <span className="material-symbols-rounded">delete</span>
              </button>
            </>
          )}
          <button
            className={aporte.es_favorito ? "btn btn-icono favorito activo" : "btn btn-icono favorito"}
            onClick={toggleFavorito}
            disabled={ocupado}
            aria-pressed={aporte.es_favorito}
            title={aporte.es_favorito ? "Quitar de favoritos" : "Agregar a favoritos"}>
            <span className="material-symbols-rounded">favorite</span>
            {aporte.favoritos > 0 && <span>{aporte.favoritos}</span>}
          </button>
        </div>
      </div>
    </article>
  );
}

export default AporteCard;
