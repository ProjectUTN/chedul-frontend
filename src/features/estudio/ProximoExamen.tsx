import { useEffect, useState } from "react";
import type { Evento } from "../../api/types";
import { getEventos } from "../calendario/api";
import { aISO, cuantoFalta, desdeISO, fechaLarga, nombreTipo, sumarDias } from "../calendario/fechas";

const DIAS_A_MIRAR = 180;

// Cuenta regresiva al proximo parcial o final que el alumno cargo en el calendario
function ProximoExamen() {
  const [examenes, setExamenes] = useState<Evento[] | null>(null);

  useEffect(() => {
    const hoy = new Date();
    getEventos(aISO(hoy), aISO(sumarDias(hoy, DIAS_A_MIRAR)))
      .then((eventos) =>
        setExamenes(
          eventos
            .filter((e) => e.tipo === "parcial" || e.tipo === "final")
            .sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.hora ?? "").localeCompare(b.hora ?? ""))
        )
      )
      .catch(() => setExamenes([]));
  }, []);

  if (examenes === null) return null;

  const [proximo, ...siguientes] = examenes;
  const dias = proximo
    ? Math.round((desdeISO(proximo.fecha).getTime() - desdeISO(aISO(new Date())).getTime()) / 86_400_000)
    : 0;

  return (
    <section className="card inicio-seccion examen">
      <div className="inicio-seccion__header">
        <h2>Próximo examen</h2>
      </div>
      {proximo ? (
        <>
          <div className="examen__cuenta">
            <span className="examen__dias">{dias}</span>
            <span className="examen__unidad">{dias === 1 ? "día" : "días"}</span>
          </div>
          <p>
            <strong>{proximo.materia?.nombre ?? proximo.titulo}</strong>
            <span className="campo-ayuda">
              {" "}
              · {nombreTipo(proximo.tipo)} · {fechaLarga(proximo.fecha)}
              {proximo.hora ? ` a las ${proximo.hora}` : ""}
            </span>
          </p>
          {siguientes.length > 0 && (
            <ul className="examen__siguientes">
              {siguientes.slice(0, 3).map((e) => (
                <li key={e.id}>
                  <span>{e.materia?.nombre ?? e.titulo}</span>
                  <span className="campo-ayuda">
                    {nombreTipo(e.tipo)} · {cuantoFalta(e.fecha).toLowerCase()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="campo-ayuda">Cargá tus parciales y finales en el Calendario y acá ves cuántos días te quedan.</p>
      )}
    </section>
  );
}

export default ProximoExamen;
