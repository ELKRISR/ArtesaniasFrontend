/**
 * @fileoverview Guard de rutas para autenticación y control de acceso por roles.
 *
 * Intercepta la renderización de cualquier ruta protegida y aplica tres capas
 * de control antes de mostrar el contenido:
 *
 *  Capa 1 — Loading:
 *   Mientras AuthProvider verifica el token inicial contra /auth/me, muestra
 *   una pantalla de carga. Esto evita que la ruta redirija a /login durante
 *   el instante en que `user` todavía es null (antes de la verificación).
 *
 *  Capa 2 — Autenticación:
 *   Si no hay usuario autenticado, redirige a /login guardando la ruta
 *   original en `location.state.from`. Login.jsx usa ese estado para
 *   redirigir de vuelta a la ruta protegida tras el login exitoso.
 *
 *  Capa 3 — Autorización por rol (opcional):
 *   Si se pasa la prop `roles`, verifica que el rol del usuario esté
 *   en la lista. Si no, redirige a /unauthorized (no a /login).
 *   Esto separa "no autenticado" (→ login) de "sin permisos" (→ 403).
 *
 * NOTA: Este archivo (src/routes/ProtectedRoute.jsx) es el que usa App.jsx.
 * Existe una copia antigua en src/components/ProtectedRoute.jsx marcada
 * como DEPRECATED — no la importa ningún archivo activo.
 *
 * @module routes/ProtectedRoute
 *
 * @example
 * // Ruta solo para usuarios autenticados:
 * <ProtectedRoute>
 *   <MainLayout><Cart /></MainLayout>
 * </ProtectedRoute>
 *
 * @example
 * // Ruta solo para admins (con roles):
 * <ProtectedRoute roles={["admin"]}>
 *   <AdminLayout />
 * </ProtectedRoute>
 *
 * @example
 * // Si un cliente intenta acceder a /admin/*:
 * // → Está autenticado → pasa la capa 2
 * // → Tiene rol "cliente", no "admin" → capa 3 redirige a /unauthorized
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth }               from '../hooks/useAuth';

/**
 * Componente guard que protege rutas con autenticación y/o roles.
 *
 * @param {{ children: React.ReactNode, roles?: string[] }} props
 * @param {React.ReactNode} props.children - Contenido a renderizar si pasa todos los checks.
 * @param {string[]}        [props.roles=[]] - Lista de roles permitidos.
 *                                             Si está vacía, cualquier usuario autenticado accede.
 */
const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();
  const location          = useLocation();

  /* ── Capa 1: Loading ───────────────────────────────────────────────────
     AuthProvider aún está verificando el token con /auth/me.
     Sin esta espera, `user` sería null momentáneamente y la ruta
     redireccionaría a /login incluso si el usuario tiene sesión válida.
  ─────────────────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-md">
          <p className="text-lg font-semibold text-slate-700">
            Cargando sesión...
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Un momento, estamos verificando tu cuenta.
          </p>
        </div>
      </div>
    );
  }

  /* ── Capa 2: Autenticación ─────────────────────────────────────────────
     Sin usuario autenticado → redirigir a /login.
     `state={{ from: location }}` permite que Login.jsx redirija de vuelta
     a esta ruta después de un login exitoso (redirección inteligente).
  ─────────────────────────────────────────────────────────────────────── */
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  /* ── Capa 3: Autorización por rol ──────────────────────────────────────
     Si se especificaron roles y el usuario no tiene ninguno de ellos,
     redirigir a /unauthorized (HTTP 403). NO redirigir a /login porque
     el usuario SÍ está autenticado, solo no tiene permisos suficientes.
  ─────────────────────────────────────────────────────────────────────── */
  if (roles.length > 0 && !roles.includes(user.rol)) {
    return <Navigate to="/unauthorized" replace />;
  }

  /* ── Acceso concedido ───────────────────────────────────────────────── */
  return children;
};

export default ProtectedRoute;