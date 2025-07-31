import CondicionEnMaterias from "../features/estado_academico/CondicionEnMaterias";
import YearSelector from "../features/estado_academico/YearSelector";
import "../styles.css";

function Estado() {
  return (
    <>
      <div className="estado-header">
        <h1>Estado académico</h1>
        <p>
          Llevá registro de tu progreso, así podrás obtener estadísticas de tu
          estado académico en la sección Home.
        </p>
      </div>
      <YearSelector />

      <CondicionEnMaterias />
    </>
  );
}

export default Estado;
