// ============================================================
//  ErrorMessage.jsx — Mensajes de error elegantes
//
//  📦 Uso:
//  <ErrorMessage>Algo salió mal</ErrorMessage>
//  <ErrorMessage onClose={() => setError("")}>Error...</ErrorMessage>
//
//  🎨 Muestra el error con ícono y opción de cerrar
// ============================================================

export default function ErrorMessage({ children, onClose, className = "" }) {
  if (!children) return null;

  return (
    <div
      className={`
        bg-pastel-rose border-l-4 border-red-600
        text-red-800
        px-4 py-3 rounded-lg
        flex items-start justify-between gap-3
        font-sans text-sm
        ${className}
      `}
      role="alert"
    >
      {/* Ícono + Mensaje */}
      <div className="flex items-start gap-2">
        <span className="text-lg font-bold mt-0.5">⚠</span>
        <span className="flex-1">{children}</span>
      </div>

      {/* Botón cerrar (opcional) */}
      {onClose && (
        <button
          onClick={onClose}
          className="text-red-600 hover:text-red-800 font-bold text-lg transition"
          aria-label="Cerrar"
        >
          ×
        </button>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  Variante: Success Message
// ══════════════════════════════════════════════════════════

export function SuccessMessage({ children, onClose, className = "" }) {
  if (!children) return null;

  return (
    <div
      className={`
        bg-pastel-green border-l-4 border-green-600
        text-green-800
        px-4 py-3 rounded-lg
        flex items-start justify-between gap-3
        font-sans text-sm
        ${className}
      `}
      role="alert"
    >
      {/* Ícono + Mensaje */}
      <div className="flex items-start gap-2">
        <span className="text-lg font-bold mt-0.5">✓</span>
        <span className="flex-1">{children}</span>
      </div>

      {/* Botón cerrar (opcional) */}
      {onClose && (
        <button
          onClick={onClose}
          className="text-green-600 hover:text-green-800 font-bold text-lg transition"
          aria-label="Cerrar"
        >
          ×
        </button>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  Variante: Info Message
// ══════════════════════════════════════════════════════════

export function InfoMessage({ children, onClose, className = "" }) {
  if (!children) return null;

  return (
    <div
      className={`
        bg-pastel-blue border-l-4 border-blue-600
        text-blue-800
        px-4 py-3 rounded-lg
        flex items-start justify-between gap-3
        font-sans text-sm
        ${className}
      `}
      role="alert"
    >
      {/* Ícono + Mensaje */}
      <div className="flex items-start gap-2">
        <span className="text-lg font-bold mt-0.5">ℹ</span>
        <span className="flex-1">{children}</span>
      </div>

      {/* Botón cerrar (opcional) */}
      {onClose && (
        <button
          onClick={onClose}
          className="text-blue-600 hover:text-blue-800 font-bold text-lg transition"
          aria-label="Cerrar"
        >
          ×
        </button>
      )}
    </div>
  );
}