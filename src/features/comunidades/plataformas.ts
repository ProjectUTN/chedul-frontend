import type { PlataformaComunidad } from "../../api/types";

export const PLATAFORMAS: { valor: PlataformaComunidad; nombre: string; icono: string }[] = [
  { valor: "whatsapp", nombre: "WhatsApp", icono: "chat" },
  { valor: "discord", nombre: "Discord", icono: "sports_esports" },
  { valor: "telegram", nombre: "Telegram", icono: "send" },
  { valor: "instagram", nombre: "Instagram", icono: "photo_camera" },
  { valor: "otra", nombre: "Otra", icono: "link" },
];

export const plataforma = (valor: PlataformaComunidad) =>
  PLATAFORMAS.find((p) => p.valor === valor) ?? PLATAFORMAS[PLATAFORMAS.length - 1];
