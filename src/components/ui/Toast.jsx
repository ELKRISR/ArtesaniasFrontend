// ============================================================
//  Toast.jsx — Componente individual de notificación
//
//  📦 Usado por ToastContext para renderizar notificaciones
//  🎨 Estilos según tipo: success | error | info
// ============================================================

export default function Toast({ message, type, onClose }) {
  // Colores según tipo
  const styles = {
    success: "bg-pastel-green border-green-600 text-green-800",
    error: "bg-pastel-rose border-red-600 text-red-800",
    info: "bg-pastel-blue border-blue-600 text-blue-800",
  };

  // Íconos según tipo
  const icons = {
    success: "✓",
    error: "✕",
    info: "ℹ",
  };

  return (
    <div
      className={`
        ${styles[type]}
        pointer-events-auto
        min-w-[280px] max-w-[400px]
        px-4 py-3 rounded-lg shadow-lg
        border-l-4
        flex items-center justify-between gap-3
        animate-slideIn
      `}
    >
      {/* Ícono + Mensaje */}
      <div className="flex items-center gap-2 font-sans text-sm">
        <span className="text-lg font-bold">{icons[type]}</span>
        <span>{message}</span>
      </div>

      {/* Botón cerrar */}
      <button
        onClick={onClose}
        className="text-current opacity-60 hover:opacity-100 transition font-bold text-lg"
      >
        ×
      </button>
    </div>
  );
}