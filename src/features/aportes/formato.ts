export const formatearFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const formatearTamano = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export const iconoDeArchivo = (tipo: string) => {
  if (tipo === "application/pdf") return "picture_as_pdf";
  if (tipo.startsWith("image/")) return "image";
  if (tipo.includes("spreadsheet") || tipo.includes("excel")) return "table_chart";
  if (tipo.includes("presentation") || tipo.includes("powerpoint")) return "slideshow";
  if (tipo.includes("zip")) return "folder_zip";
  return "description";
};

export const EXTENSIONES_PERMITIDAS = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".md",
  ".zip",
];

export const TAMANO_MAXIMO_MB = 25;
