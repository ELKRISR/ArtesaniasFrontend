// ============================================================
//  Spinner.jsx — Indicador de carga reutilizable
//
//  Props:
//  <Spinner size="small" color="white" />
//  size: small | medium | large
//  color: cualquier valor CSS válido (ej: "black", "#fff")
// ============================================================

export default function Spinner({ size = "small", color = "black" }) {
  const sizes = {
    small: "w-4 h-4",
    medium: "w-6 h-6",
    large: "w-8 h-8",
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-t-transparent ${sizes[size]}`}
      style={{ borderColor: color }}
    />
  );
}
