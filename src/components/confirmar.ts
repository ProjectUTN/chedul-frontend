export interface OpcionesConfirmacion {
  titulo: string;
  mensaje?: string;
  aceptar?: string;
  cancelar?: string;
  // Pinta el boton de aceptar en rojo (borrar, etc.)
  peligro?: boolean;
}

export interface Pedido extends OpcionesConfirmacion {
  responder: (ok: boolean) => void;
}

// Estado global del popup: hay a lo sumo un pedido abierto a la vez
let pedido: Pedido | null = null;
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((o) => o());

// confirmar abre el popup de <Confirmacion /> y resuelve true si el alumno
// acepta. Reemplaza al window.confirm del navegador.
export const confirmar = (opciones: OpcionesConfirmacion) =>
  new Promise<boolean>((resolve) => {
    pedido?.responder(false);
    pedido = {
      ...opciones,
      responder: (ok) => {
        pedido = null;
        avisar();
        resolve(ok);
      },
    };
    avisar();
  });

export const suscribirConfirmacion = (oyente: () => void) => {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
};

export const pedidoActual = () => pedido;
