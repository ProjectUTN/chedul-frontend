import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { mensajeDeError } from "../../api/client";
import type { EventoConfirmado } from "../../api/types";
import { crearEvento, desmentirEvento, getEventosConfirmados } from "./api";
import { cuantoFalta, fechaLarga, nombreTipo } from "./fechas";

// Alertas de parciales, entregas y finales que cargaron varios compañeros de
// tu comision y vos no tenes. Nada entra solo a tu calendario: lo agregás o
// decís que no es así.

interface Props {
  // Para que el calendario se recargue al agregar uno
  onAgregado?: () => void;
}

const clave = (e: EventoConfirmado) => `${e.materia.id}-${e.comision_id}-${e.tipo}-${e.fecha}`;

const quienes = (e: EventoConfirmado) =>
  e.tipo === "final"
    ? `${e.confirmaciones} compañeros que la cursan o la tienen regular`
    : `${e.confirmaciones} compañeros de tu comisión`;

function EventosConfirmados({ onAgregado }: Props) {
  const [lista, setLista] = useState<EventoConfirmado[]>([]);
  const [ocupado, setOcupado] = useState("");

  useEffect(() => {
    getEventosConfirmados()
      .then(setLista)
      .catch(() => setLista([]));
  }, []);

  if (lista.length === 0) return null;

  const sacar = (e: EventoConfirmado) => setLista((l) => l.filter((x) => clave(x) !== clave(e)));

  const agregar = async (e: EventoConfirmado) => {
    setOcupado(clave(e));
    try {
      await crearEvento({
        titulo: `${nombreTipo(e.tipo)} de ${e.materia.nombre}`,
        tipo: e.tipo,
        fecha: e.fecha,
        hora: e.hora ?? "",
        descripcion: "",
        materia_id: e.materia.id,
      });
      sacar(e);
      toast.success("Agregado a tu calendario");
      onAgregado?.();
    } catch (err) {
      toast.error(mensajeDeError(err));
    } finally {
      setOcupado("");
    }
  };

  const desmentir = async (e: EventoConfirmado) => {
    setOcupado(clave(e));
    try {
      await desmentirEvento(e);
      sacar(e);
      toast.info("Gracias, no te lo mostramos más");
    } catch (err) {
      toast.error(mensajeDeError(err));
    } finally {
      setOcupado("");
    }
  };

  return (
    <section className="confirmados" aria-label="Fechas que cargaron tus compañeros">
      {lista.map((e) => (
        <article key={clave(e)} className={`card confirmado evento--${e.tipo}`}>
          <span className="confirmado__icono material-symbols-rounded" aria-hidden="true">
            campaign
          </span>
          <div className="confirmado__texto">
            <strong>
              {nombreTipo(e.tipo)} de {e.materia.nombre}
            </strong>
            <span>
              {fechaLarga(e.fecha)}
              {e.hora && ` · ${e.hora}`} · {cuantoFalta(e.fecha).toLowerCase()}
            </span>
            <span className="campo-ayuda">
              <span className="material-symbols-rounded confirmado__check" aria-hidden="true">
                verified
              </span>
              Confirmado por {quienes(e)}
            </span>
          </div>
          <div className="confirmado__acciones">
            <button
              type="button"
              className="btn btn-primario btn-chico"
              disabled={ocupado === clave(e)}
              onClick={() => agregar(e)}>
              Agregar
            </button>
            <button
              type="button"
              className="btn btn-secundario btn-chico"
              disabled={ocupado === clave(e)}
              onClick={() => desmentir(e)}>
              No es así
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}

export default EventosConfirmados;
