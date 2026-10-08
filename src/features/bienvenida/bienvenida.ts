// La bienvenida se muestra una sola vez por alumno y navegador: si la saltea
// o la termina no vuelve a aparecer, aunque no haya cargado materias.

const clave = (alumnoId: number) => `chedul-bienvenida-${alumnoId}`;

export const bienvenidaVista = (alumnoId: number) => {
  try {
    return localStorage.getItem(clave(alumnoId)) === "1";
  } catch {
    return false;
  }
};

export const marcarBienvenidaVista = (alumnoId: number) => {
  try {
    localStorage.setItem(clave(alumnoId), "1");
  } catch {
    // Sin localStorage se vuelve a ofrecer la proxima vez, no pasa nada
  }
};
