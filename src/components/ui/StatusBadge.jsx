function StatusBadge({ estado }) {
  if (!estado) return null;

  const normalized = estado.trim().toLowerCase();

  const base =
    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-all duration-300";

  const styles = {
    pendiente:
      "bg-amber-200 text-amber-900 border border-amber-300",
    pagado:
      "bg-blue-200 text-blue-900 border border-blue-300",
    enviado:
      "bg-emerald-200 text-emerald-900 border border-emerald-300",
    cancelado:
      "bg-red-200 text-red-900 border border-red-300",
  };

  const labels = {
    pendiente: "Pendiente",
    pagado: "Pagado",
    enviado: "Enviado",
    cancelado: "Cancelado",
  };

  return (
    <span
      className={`${base} ${
        styles[normalized] ||
        "bg-gray-100 text-gray-700 border border-gray-200"
      }`}
    >
      {labels[normalized] || estado}
    </span>
  );
}

export default StatusBadge;