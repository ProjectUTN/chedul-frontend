import { ToastContainer, cssTransition, type ToastContainerProps } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./avisos.css";

// Los avisos chiquitos ("¡Guardado!", errores, etc). Usan el estilo de Chedul
// en vez del de react-toastify: tarjeta redondeada, icono de color y entrada
// con rebote suave. En el celu salen arriba de la barra de abajo.

const ICONOS: Record<string, string> = {
  success: "check_circle",
  error: "error",
  warning: "warning",
  info: "info",
  default: "notifications",
};

const Rebote = cssTransition({
  enter: "aviso-entra",
  exit: "aviso-sale",
  collapseDuration: 220,
});

const icono: ToastContainerProps["icon"] = ({ type, isLoading }) =>
  isLoading ? (
    <span className="aviso__cargando" aria-hidden="true" />
  ) : (
    <span className="material-symbols-rounded aviso__icono" aria-hidden="true">
      {ICONOS[type] ?? ICONOS.default}
    </span>
  );

const Cerrar = ({ closeToast }: { closeToast: () => void }) => (
  <button type="button" className="aviso__cerrar" onClick={closeToast} aria-label="Cerrar aviso">
    <span className="material-symbols-rounded">close</span>
  </button>
);

function Avisos() {
  return (
    <ToastContainer
      className="avisos"
      limit={3}
      position="bottom-right"
      autoClose={3000}
      hideProgressBar
      newestOnTop
      transition={Rebote}
      icon={icono}
      closeButton={Cerrar}
    />
  );
}

export default Avisos;
