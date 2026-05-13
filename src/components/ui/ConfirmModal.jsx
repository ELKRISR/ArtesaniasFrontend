import Button from "./Button";

export default function ConfirmModal({ open, title, message, onCancel, onConfirm, confirmText = "Confirmar", cancelText = "Cancelar" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl border border-gray-200">
        <h3 className="text-xl font-bold text-cuero-dark mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>{cancelText}</Button>
          <Button variant="danger" onClick={onConfirm}>{confirmText}</Button>
        </div>
      </div>
    </div>
  );
}
