import { api } from "../../api/client";

interface getEstadoAcademicoRequest {
  alumnoId: number;
}

export const getEstado = async (data: getEstadoAcademicoRequest) => {
  const response = await api.get(`/condicion_alumno/${data.alumnoId}`);

  return response.data;
};
