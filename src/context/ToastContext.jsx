// ============================================================
//  ToastContext.jsx — Sistema de notificaciones global
//
//  🎯 API simple:
//  const { showToast } = useToast();
//  showToast("Mensaje", "success"); // success | error | info
//
//  📌 Posición: top-right
//  📌 Auto-dismiss: 3 segundos
//  📌 Máximo: 3 toasts simultáneos
// ============================================================

import { useState, useCallback, useEffect } from "react";
import { ToastContext } from "./ToastContextObject";
import Toast from "../components/ui/Toast";

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // ── Remover toast ─────────────────────────────────────────
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // ── Mostrar toast ─────────────────────────────────────────
  const showToast = useCallback((message, type = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const newToast = { id, message, type };

    setToasts((prev) => {
      // Limitar a 3 toasts máximo
      const updated = [...prev, newToast];
      return updated.slice(-3);
    });

    // Auto-remover después de 3 segundos
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, [removeToast]);

  useEffect(() => {
    const handleGlobalError = (event) => {
      const message = event?.detail?.message;
      if (message) {
        showToast(message, "error");
      }
    };

    window.addEventListener("globalError", handleGlobalError);
    return () => {
      window.removeEventListener("globalError", handleGlobalError);
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* ── Contenedor de toasts (fixed top-right) ─────── */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-auto">
        {toasts.length > 0 && (
          <div className="flex justify-end mb-1">
            <button
              onClick={() => setToasts([])}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-2 py-1 rounded-md bg-white/90 backdrop-blur"
            >
              Cerrar todo
            </button>
          </div>
        )}
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}