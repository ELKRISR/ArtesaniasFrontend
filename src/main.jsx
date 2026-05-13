// ============================================================
//  main.jsx — Punto de entrada de la aplicación
//
//  📦 Providers en orden correcto:
//  1. BrowserRouter (navegación)
//  2. AuthProvider (autenticación)
//  3. ToastProvider (notificaciones) ✨ NUEVO
//  4. CartProvider (carrito)
// ============================================================

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";

// ── Providers ─────────────────────────────────────────────
import { AuthProvider } from "./context/AuthProvider";
import { ToastProvider } from "./context/ToastContext";   // ✨ NUEVO
import { CartProvider } from "./context/CartProvider";
import { LoadingProvider } from "./context/LoadingContext";
import { WishlistProvider } from "./context/WishlistContext";
import analyticsService from "./services/analyticsService";

// Inicializar analytics
analyticsService.init();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LoadingProvider>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <App />
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </LoadingProvider>
  </React.StrictMode>
);