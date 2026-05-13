// ============================================================
//  Button.jsx — Botón profesional con estados
//
//  📦 Variantes:
//  <Button>Guardar</Button>                        // Primary
//  <Button variant="secondary">Cancelar</Button>   // Secondary
//  <Button variant="danger">Eliminar</Button>      // Danger
//  <Button loading>Guardando...</Button>           // Loading
//  <Button disabled>No disponible</Button>         // Disabled
//
//  🎨 Estados: normal | loading | disabled
//  🎯 Tipos: button (default) | submit | reset
// ============================================================

import Spinner from "./Spinner";

export default function Button({
  children,
  variant = "primary",
  loading = false,
  disabled = false,
  type = "button",
  onClick,
  className = "",
  ...props
}) {
  // ── Estilos base ──────────────────────────────────────────
  const baseStyles = `
    px-6 py-3
    rounded-lg
    font-sans font-semibold
    transition-all duration-200
    flex items-center justify-center gap-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  // ── Variantes ─────────────────────────────────────────────
  const variants = {
    primary: `
      bg-cuero text-white
      hover:bg-cuero-dark
      active:scale-95
    `,
    secondary: `
      bg-pastel-beige text-cuero border-2 border-cuero
      hover:bg-cuero hover:text-white
      active:scale-95
    `,
    danger: `
      bg-red-600 text-white
      hover:bg-red-700
      active:scale-95
    `,
    accent: `
      bg-accent text-white
      hover:bg-accent-dark
      active:scale-95
    `,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {/* Spinner mientras carga */}
      {loading && <Spinner size="small" color="white" />}

      {/* Texto del botón */}
      <span>{children}</span>
    </button>
  );
}
