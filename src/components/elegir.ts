export interface OpcionElegible {
  valor: string;
  etiqueta: string;
  detalle?: string;
}

export interface OpcionesEleccion {
  titulo: string;
  mensaje?: string;
  opciones: OpcionElegible[];
  // Texto del boton para no elegir ninguna
  cancelar?: string;
}

export interface PedidoEleccion extends OpcionesEleccion {
  responder: (valor: string | null) => void;
}

let pedido: PedidoEleccion | null = null;
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((o) => o());

// elegir abre el popup de <Eleccion /> con una lista de opciones y resuelve
// el valor elegido, o null si el alumno cierra sin elegir.
export const elegir = (opciones: OpcionesEleccion) =>
  new Promise<string | null>((resolve) => {
    pedido?.responder(null);
    pedido = {
      ...opciones,
      responder: (valor) => {
        pedido = null;
        avisar();
        resolve(valor);
      },
    };
    avisar();
  });

export const suscribirEleccion = (oyente: () => void) => {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
};

export const eleccionActual = () => pedido;
