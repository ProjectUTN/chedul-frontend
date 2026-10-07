import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/authProvider";
import { mensajeDeError } from "../../api/client";
import useTema from "../../hooks/useTema";
import { getGoogleClientId } from "./api";
import "./botonGoogle.css";

interface GoogleId {
  initialize: (opciones: { client_id: string; callback: (r: { credential: string }) => void }) => void;
  renderButton: (contenedor: HTMLElement, opciones: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

const SCRIPT = "https://accounts.google.com/gsi/client?hl=es-419";

// Carga el script de Google una sola vez
let cargaScript: Promise<void> | null = null;
const cargarScript = () => {
  cargaScript ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      cargaScript = null;
      reject(new Error("No se pudo cargar Google"));
    };
    document.head.appendChild(s);
  });
  return cargaScript;
};

// BotonGoogle muestra "Continuar con Google". Si la API no tiene client ID
// configurado no muestra nada.
function BotonGoogle({ texto = "continue_with" }: { texto?: "continue_with" | "signup_with" | "signin_with" }) {
  const { loginGoogle } = useAuth();
  const { tema } = useTema();
  const navigate = useNavigate();
  const contenedor = useRef<HTMLDivElement>(null);
  const [clientId, setClientId] = useState("");
  const [entrando, setEntrando] = useState(false);

  useEffect(() => {
    getGoogleClientId()
      .then(setClientId)
      .catch(() => setClientId(""));
  }, []);

  useEffect(() => {
    if (!clientId) return;
    let vigente = true;
    cargarScript()
      .then(() => {
        const google = window.google?.accounts.id;
        if (!vigente || !google || !contenedor.current) return;
        google.initialize({
          client_id: clientId,
          callback: async ({ credential }) => {
            setEntrando(true);
            try {
              await loginGoogle(credential);
              navigate("/inicio", { replace: true });
            } catch (err) {
              toast.error(mensajeDeError(err, "No se pudo entrar con Google"));
              setEntrando(false);
            }
          },
        });
        contenedor.current.innerHTML = "";
        google.renderButton(contenedor.current, {
          type: "standard",
          theme: tema === "claro" ? "outline" : "filled_black",
          size: "large",
          shape: "pill",
          text: texto,
          logo_alignment: "center",
          width: Math.min(contenedor.current.offsetWidth || 356, 400),
          locale: "es-419",
        });
      })
      .catch(() => {
        // Sin Google (bloqueador, sin red) queda el login con mail
      });
    return () => {
      vigente = false;
    };
  }, [clientId, tema, texto, loginGoogle, navigate]);

  if (!clientId) return null;

  return (
    <div className="boton-google">
      <div className="boton-google__separador">
        <span>o</span>
      </div>
      <div ref={contenedor} className="boton-google__contenedor" aria-busy={entrando} />
      {entrando && <p className="boton-google__estado">Entrando con Google...</p>}
    </div>
  );
}

export default BotonGoogle;
