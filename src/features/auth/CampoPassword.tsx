import { useState, type ChangeEvent, type ReactNode } from "react";

interface Props {
  etiqueta: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  autoComplete: "current-password" | "new-password";
  children?: ReactNode;
}

// Campo de contraseña con el ojito para verla
function CampoPassword({ etiqueta, name, value, onChange, autoComplete, children }: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="campo">
      <span>{etiqueta}</span>
      <div className="campo-password">
        <input
          type={visible ? "text" : "password"}
          name={name}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          required
        />
        <button
          type="button"
          className="campo-password__ojo"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}>
          <span className="material-symbols-rounded">{visible ? "visibility_off" : "visibility"}</span>
        </button>
      </div>
      {children}
    </label>
  );
}

export default CampoPassword;
