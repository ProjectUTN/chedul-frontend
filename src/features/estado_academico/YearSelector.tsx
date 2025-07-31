import "./yearSelector.css";

function YearSelector() {
  const niveles = [
    { id: 1, label: "1er año" },
    { id: 2, label: "2do año" },
    { id: 3, label: "3er año" },
    { id: 4, label: "4to año" },
    { id: 5, label: "5to año" },
  ];

  return (
    <div className="radio-buttons-container">
      {niveles.map(({ id, label }) => (
        <div key={id} className="radio-button">
          <input
            name="radio-group"
            id={`radio${id}`}
            className="radio-button__input"
            type="radio"
            // checked={nivelActual === id}
            // onChange={() => handleNivelChange(id)}
          />
          <label htmlFor={`radio${id}`} className="radio-button__label">
            <span className="radio-button__custom"></span>
            {label}
          </label>
        </div>
      ))}
    </div>
  );
}

export default YearSelector;
