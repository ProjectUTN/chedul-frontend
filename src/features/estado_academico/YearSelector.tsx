import "./yearSelector.css";

const niveles = [
  { id: 1, label: "1er año" },
  { id: 2, label: "2do año" },
  { id: 3, label: "3er año" },
  { id: 4, label: "4to año" },
  { id: 5, label: "5to año" },
];

interface YearSelectorProps {
  nivelActual: number;
  onChange: (nivel: number) => void;
}

function YearSelector({ nivelActual, onChange }: YearSelectorProps) {
  return (
    <div className="radio-buttons-container" role="radiogroup" aria-label="Año">
      {niveles.map(({ id, label }) => (
        <label
          key={id}
          className={
            nivelActual === id ? "radio-button radio-button--activo" : "radio-button"
          }>
          <input
            name="nivel"
            className="radio-button__input"
            type="radio"
            checked={nivelActual === id}
            onChange={() => onChange(id)}
          />
          {label}
        </label>
      ))}
    </div>
  );
}

export default YearSelector;
