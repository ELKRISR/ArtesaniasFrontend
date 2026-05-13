// ============================================================
//  useToast.js — Hook para usar el sistema de notificaciones
//
//  📦 Uso:
//  import { useToast } from "../hooks/useToast";
//  
//  const { showToast } = useToast();
//  
//  showToast("Producto agregado", "success");
//  showToast("Error al guardar", "error");
//  showToast("Cargando datos...", "info");
// ============================================================

import { useContext } from "react";
import { ToastContext } from "../context/ToastContextObject";

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }

  return context;
};