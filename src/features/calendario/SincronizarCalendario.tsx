import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { confirmar } from "../../components/confirmar";
import { mensajeDeError } from "../../api/client";
import { getSuscripcionCalendario, linkCalendario, renovarSuscripcionCalendario } from "./api";

// Link de calendario (.ics) para ver Chedul en Google Calendar, el calendario
// del iPhone u Outlook. Se agrega una vez y la app lo va actualizando sola.

function SincronizarCalendario() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [renovando, setRenovando] = useState(false);

  useEffect(() => {
    getSuscripcionCalendario()
      .then(setToken)
      .catch((err) => setError(mensajeDeError(err, "No se pudo armar tu link de calendario")));
  }, []);

  if (error) return <p className="form-error">{error}</p>;
  if (!token) return <p className="vacio">Armando tu link...</p>;

  const link = linkCalendario(token);
  const webcal = link.replace(/^https?:/, "webcal:");
  const google = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copiado");
    } catch {
      toast.info("Mantené apretado el link para copiarlo");
    }
  };

  const renovar = async () => {
    const ok = await confirmar({
      titulo: "¿Cambiar el link?",
      mensaje:
        "El link de ahora deja de andar y vas a tener que agregar el nuevo en tu calendario. Usalo si lo compartiste sin querer.",
      aceptar: "Cambiar link",
      peligro: true,
    });
    if (!ok) return;
    setRenovando(true);
    try {
      setToken(await renovarSuscripcionCalendario());
      toast.success("Listo, ahora agregá el link nuevo");
    } catch (err) {
      toast.error(mensajeDeError(err));
    } finally {
      setRenovando(false);
    }
  };

  return (
    <div className="sincronizar">
      <p>
        Tus clases, parciales, finales y las fechas de la facultad aparecen en tu calendario de siempre y se actualizan
        solos cuando cambiás algo en Chedul.
      </p>

      <div className="sincronizar__botones">
        <a className="btn btn-primario" href={google} target="_blank" rel="noopener noreferrer">
          <span className="material-symbols-rounded">event</span>
          Agregar a Google Calendar
        </a>
        <a className="btn btn-secundario" href={webcal}>
          <span className="material-symbols-rounded">calendar_month</span>
          iPhone, Mac u Outlook
        </a>
      </div>

      <label className="campo">
        <span>O copiá el link y pegalo en tu app de calendario</span>
        <div className="sincronizar__link">
          <input
            className="control"
            readOnly
            value={link}
            onFocus={(e) => e.target.select()}
            aria-label="Link del calendario"
          />
          <button type="button" className="btn btn-secundario" onClick={copiar}>
            <span className="material-symbols-rounded">content_copy</span>
            Copiar
          </button>
        </div>
      </label>

      <ul className="sincronizar__notas campo-ayuda">
        <li>
          En Google Calendar los cambios tardan unas horas en aparecer. En el celu, agregalo una vez desde la compu
          (calendar.google.com, “Otros calendarios”, “Desde URL”) y después lo ves en la app.
        </li>
        <li>Es solo para ver: lo que cambies allá no vuelve a Chedul.</li>
        <li>Cualquiera con el link ve tu calendario, así que no lo compartas.</li>
      </ul>

      <button
        type="button"
        className="btn btn-secundario btn-chico sincronizar__renovar"
        onClick={renovar}
        disabled={renovando}>
        Cambiar el link
      </button>
    </div>
  );
}

export default SincronizarCalendario;
