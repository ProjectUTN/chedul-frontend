import { useSyncExternalStore } from "react";

export type Tema = "claro" | "oscuro";

const CLAVE = "chedul-tema";
const oyentes = new Set<() => void>();

const leerGuardado = (): Tema | null => {
  try {
    const v = localStorage.getItem(CLAVE);
    return v === "claro" || v === "oscuro" ? v : null;
  } catch {
    return null;
  }
};

const temaDelSistema = (): Tema =>
  window.matchMedia?.("(prefers-color-scheme: light)").matches ? "claro" : "oscuro";

let actual: Tema = leerGuardado() ?? temaDelSistema();

const aplicar = (tema: Tema) => {
  document.documentElement.dataset.theme = tema === "claro" ? "light" : "dark";
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", tema === "claro" ? "#f3f5fa" : "#0b0f17");
};

aplicar(actual);

// Si el alumno nunca eligio, se sigue el tema del sistema
window.matchMedia?.("(prefers-color-scheme: light)").addEventListener("change", () => {
  if (leerGuardado()) return;
  actual = temaDelSistema();
  aplicar(actual);
  oyentes.forEach((o) => o());
});

export const setTema = (tema: Tema) => {
  actual = tema;
  try {
    localStorage.setItem(CLAVE, tema);
  } catch {
    // Sin almacenamiento (modo privado): el tema dura hasta recargar
  }
  aplicar(tema);
  oyentes.forEach((o) => o());
};

function useTema() {
  const tema = useSyncExternalStore(
    (oyente) => {
      oyentes.add(oyente);
      return () => oyentes.delete(oyente);
    },
    () => actual
  );
  return { tema, setTema, alternar: () => setTema(tema === "claro" ? "oscuro" : "claro") };
}

export default useTema;
