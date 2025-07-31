import { useState } from "react";
import "./condicionEnMaterias.css";
import useIsMobile from "../../hooks/useIsMobile";

const materias = [
  {
    id: 1,
    nombre: "Analisis matematico",
    cuatrimestre: "1C",
    tipo: "Obligatoria",
    programa: "https://www.frre.utn.edu.ar/iq/clean/files/get/item/7373",
    estado: "Pendiente",
  },
  {
    id: 2,
    nombre: "Analisis matematico",
    cuatrimestre: "1C",
    tipo: "Obligatoria",
    programa: "https://www.frre.utn.edu.ar/iq/clean/files/get/item/7373",
    estado: "Regular",
  },
  {
    id: 3,
    nombre: "Analisis matematico",
    cuatrimestre: "2C",
    tipo: "Obligatoria",
    programa: "https://www.frre.utn.edu.ar/iq/clean/files/get/item/7373",
    estado: "Aprobada",
  },
];

const estados = ["Pendiente", "Cursando", "Regular", "Aprobada"];

function CondicionEnMaterias() {
  const isMobile = useIsMobile();

  const [estadoMaterias, setEstadoMaterias] = useState(
    materias.map((m) => ({ id: m.id, estado: m.estado }))
  );

  const handleEstadoChange = async (id: number, nuevoEstado: string) => {
    setEstadoMaterias((prev) =>
      prev.map((m) => (m.id === id ? { ...m, estado: nuevoEstado } : m))
    );

    // try {
    //   await axios.patch(`/api/materias/${id}`, {
    //     estado: nuevoEstado,
    //   });
    //   console.log(`Materia ${id} actualizada a ${nuevoEstado}`);
    // } catch (error) {
    //   console.error("Error al actualizar el estado:", error);
    //   // Opcional: revertir el estado si falla
    //   setEstadoMaterias((prev) =>
    //     prev.map((m) =>
    //       m.id === id
    //         ? {
    //             ...m,
    //             estado:
    //               materias.find((mat) => mat.id === id)?.estado || "Pendiente",
    //           }
    //         : m
    //     )
    //   );
    // }
  };

  // TODO: por ahora lo saco para que la ruta sea publica
  // const { user } = useAuth();

  // if (!user) {
  //   return <Navigate to="/login" replace />;
  // }

  // useEffect(() => {
  //   const fetchEstadoAcademico = async () => {
  //     try {
  //       const data = await getEstado({
  //         alumnoId: user.id,
  //       });
  //       console.log("Estado académico:", data);
  //       setCondiciones(data);
  //     } catch (err) {
  //       console.error("Error al cargar el estado académico:", err);
  //     }
  //   };

  //   fetchEstadoAcademico();
  // }, []);

  return (
    <>
      {!isMobile ? (
        <div className="tabla-form">
          <table className="tabla-materias">
            <thead>
              <tr>
                <th>N°</th>
                <th>Materia</th>
                <th>Cuatrimestre</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Programa</th>
              </tr>
            </thead>
            <tbody>
              {materias.map((materia, index) => (
                <tr key={materia.id}>
                  <td>{index + 1}</td>
                  <td>
                    <strong>{materia.nombre}</strong>
                  </td>
                  <td>{materia.cuatrimestre}</td>
                  <td>{materia.tipo}</td>
                  <td>
                    <select
                      className="estado-select"
                      value={
                        estadoMaterias.find((m) => m.id === materia.id)
                          ?.estado || "Pendiente"
                      }
                      onChange={(e) =>
                        handleEstadoChange(materia.id, e.target.value)
                      }>
                      {estados.map((estado) => (
                        <option key={estado} value={estado}>
                          {estado}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <a
                      className="table-icon"
                      href={materia.programa}
                      target="_blank"
                      rel="noopener noreferrer">
                      <span className="material-symbols-rounded">article</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="tabla-form-mobile">
          {materias.map((materia) => (
            <div className="cardMateria" key={materia.nombre}>
              <div className="headerMateria">
                <div>
                  <h3>{materia.nombre}</h3>
                  <p>
                    {materia.cuatrimestre} | {materia.tipo}
                  </p>
                </div>
                <a
                  className="table-icon"
                  href={materia.programa}
                  target="_blank"
                  rel="noopener noreferrer">
                  <span className="material-symbols-rounded">article</span>
                </a>
              </div>

              <div className="condiciones">
                {estados.map((estado) => (
                  <label className="estado-label" key={estado}>
                    <input
                      type="radio"
                      value={estado}
                      checked={
                        estadoMaterias.find((m) => m.id === materia.id)
                          ?.estado === estado
                      }
                      onChange={(e) =>
                        handleEstadoChange(materia.id, e.target.value)
                      }
                    />
                    <span>{estado}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default CondicionEnMaterias;
