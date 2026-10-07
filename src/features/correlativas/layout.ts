import type { Materia, Progreso } from "../../api/types";

export type EstadoMapa = "aprobada" | "regularizada" | "cursando" | "disponible" | "bloqueada";

export const ESTADOS: { valor: EstadoMapa; nombre: string }[] = [
  { valor: "aprobada", nombre: "Aprobada" },
  { valor: "regularizada", nombre: "Regularizada" },
  { valor: "cursando", nombre: "Cursando" },
  { valor: "disponible", nombre: "Podés cursarla" },
  { valor: "bloqueada", nombre: "Te faltan correlativas" },
];

export const NODO_ANCHO = 196;
export const NODO_ALTO = 62;
const SEPARACION_X = 76;
const SEPARACION_Y = 14;
const MARGEN = 8;

export interface Nodo {
  materia: Materia;
  x: number;
  y: number;
}

export interface Arista {
  desde: number; // materia requerida
  hasta: number; // materia que la pide
  tipo: "regular" | "aprobada";
}

export interface Grafo {
  nodos: Map<number, Nodo>;
  aristas: Arista[];
  niveles: number[];
  ancho: number;
  alto: number;
}

// estadosDesdeProgreso pasa el resultado de /alumnos/me/progreso a un mapa
// materia -> estado.
export const estadosDesdeProgreso = (progreso: Progreso) => {
  const estados = new Map<number, EstadoMapa>();
  const cargar = (lista: { id: number }[], estado: EstadoMapa) =>
    lista.forEach((m) => estados.set(m.id, estado));

  cargar(progreso.materias_pendientes_no_disponibles, "bloqueada");
  cargar(progreso.materias_pendientes_disponibles, "disponible");
  cargar(progreso.materias_cursando, "cursando");
  cargar(progreso.materias_regularizadas, "regularizada");
  cargar(progreso.materias_aprobadas, "aprobada");
  return estados;
};

// cumple indica si el estado de la materia requerida alcanza para la correlativa.
export const cumple = (tipo: "regular" | "aprobada", estado: EstadoMapa | undefined) =>
  estado === "aprobada" || (tipo === "regular" && estado === "regularizada");

const promedio = (valores: number[]) =>
  valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : Number.POSITIVE_INFINITY;

// armarGrafo ubica una columna por nivel. Dentro de cada columna ordena las
// materias por la posicion promedio de sus correlativas (y despues de las
// materias que habilitan) para que se crucen menos flechas.
export const armarGrafo = (materias: Materia[]): Grafo => {
  const niveles = [...new Set(materias.map((m) => m.nivel))].sort((a, b) => a - b);
  const columnas = niveles.map((nivel) =>
    materias
      .filter((m) => m.nivel === nivel)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
  );

  const aristas: Arista[] = materias.flatMap((m) =>
    m.correlativas.map((c) => ({ desde: c.materia_id, hasta: m.id, tipo: c.tipo }))
  );

  const fila = new Map<number, number>();
  const actualizarFilas = () =>
    columnas.forEach((col) => col.forEach((m, i) => fila.set(m.id, i)));
  actualizarFilas();

  // Ida: cada columna segun sus correlativas
  for (let i = 1; i < columnas.length; i++) {
    const clave = (m: Materia) => promedio(m.correlativas.map((c) => fila.get(c.materia_id) ?? 0));
    columnas[i].sort((a, b) => clave(a) - clave(b));
    actualizarFilas();
  }

  // Vuelta: la primera columna segun lo que habilita
  const habilita = (id: number) =>
    aristas.filter((a) => a.desde === id).map((a) => fila.get(a.hasta) ?? 0);
  columnas[0]?.sort((a, b) => promedio(habilita(a.id)) - promedio(habilita(b.id)));
  actualizarFilas();

  const maxFilas = Math.max(0, ...columnas.map((c) => c.length));
  const altoTotal = maxFilas * (NODO_ALTO + SEPARACION_Y) - SEPARACION_Y;

  const nodos = new Map<number, Nodo>();
  columnas.forEach((col, i) => {
    // Las columnas con menos materias se centran verticalmente
    const altoCol = col.length * (NODO_ALTO + SEPARACION_Y) - SEPARACION_Y;
    const offset = (altoTotal - altoCol) / 2;
    col.forEach((materia, j) => {
      nodos.set(materia.id, {
        materia,
        x: MARGEN + i * (NODO_ANCHO + SEPARACION_X),
        y: MARGEN + 28 + offset + j * (NODO_ALTO + SEPARACION_Y),
      });
    });
  });

  return {
    nodos,
    aristas: aristas.filter((a) => nodos.has(a.desde) && nodos.has(a.hasta)),
    niveles,
    ancho: MARGEN * 2 + niveles.length * (NODO_ANCHO + SEPARACION_X) - SEPARACION_X,
    alto: MARGEN * 2 + 28 + altoTotal,
  };
};

// relacionadas devuelve todas las correlativas (hacia atras) y todo lo que
// habilita (hacia adelante) una materia, recorriendo el grafo completo.
export const relacionadas = (grafo: Grafo, id: number) => {
  const recorrer = (inicio: number, siguiente: (id: number) => number[]) => {
    const vistos = new Set<number>();
    const pila = [inicio];
    while (pila.length) {
      for (const otro of siguiente(pila.pop()!)) {
        if (!vistos.has(otro)) {
          vistos.add(otro);
          pila.push(otro);
        }
      }
    }
    return vistos;
  };

  const previas = recorrer(id, (m) => grafo.aristas.filter((a) => a.hasta === m).map((a) => a.desde));
  const habilita = recorrer(id, (m) => grafo.aristas.filter((a) => a.desde === m).map((a) => a.hasta));
  return { previas, habilita };
};

export const caminoArista = (grafo: Grafo, arista: Arista) => {
  const a = grafo.nodos.get(arista.desde)!;
  const b = grafo.nodos.get(arista.hasta)!;
  const x1 = a.x + NODO_ANCHO;
  const y1 = a.y + NODO_ALTO / 2;
  const x2 = b.x;
  const y2 = b.y + NODO_ALTO / 2;
  const curva = Math.max(40, (x2 - x1) / 2);
  return `M ${x1} ${y1} C ${x1 + curva} ${y1}, ${x2 - curva} ${y2}, ${x2} ${y2}`;
};
