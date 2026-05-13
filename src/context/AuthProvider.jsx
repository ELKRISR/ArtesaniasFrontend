/**
 * @fileoverview Provider global de autenticación.
 *
 * Gestiona el ciclo de vida completo de la sesión del usuario:
 *  - Verificación automática de sesión al cargar la app.
 *  - Funciones `login` y `logout` consumibles desde cualquier componente.
 *  - Propiedad calculada `isAdmin` para control de acceso en la UI.
 *  - Estado `loading` para evitar parpadeos en rutas protegidas.
 *
 * ─── Bugs corregidos en esta versión ──────────────────────────────────────
 *
 *  BUG 1 — Pérdida de sesión por errores de red:
 *   La versión anterior limpiaba localStorage ante CUALQUIER error en
 *   la verificación inicial (verifySession). Si el usuario cargaba la app
 *   sin internet o el servidor tardaba, perdía su sesión aunque el token
 *   fuera perfectamente válido.
 *   FIX: solo se limpia la sesión ante errores 401/403 (token inválido o
 *   sin permisos). Los errores de red dejan la sesión intacta y recuperan
 *   el usuario desde localStorage como fallback offline.
 *
 *  BUG 2 — Logout no limpiaba la cookie httpOnly del refresh token:
 *   La versión anterior solo hacía `localStorage.removeItem("token")`.
 *   El refresh token en la cookie httpOnly permanecía activo hasta 7 días,
 *   permitiendo potencialmente renovar el acceso tras un "logout".
 *   FIX: logout llama a POST /auth/logout (que ejecuta res.clearCookie en
 *   el backend) de forma "fire and forget". Si la red falla, la sesión
 *   local se cierra igualmente — el backend expirará el token en 7 días.
 *
 * ─── Árbol de contexto ────────────────────────────────────────────────────
 *
 *  AuthProvider expone a través de AuthContext:
 *  ┌────────────┬──────────┬─────────────────────────────────────────────┐
 *  │ Propiedad  │ Tipo     │ Descripción                                 │
 *  ├────────────┼──────────┼─────────────────────────────────────────────┤
 *  │ user       │ object   │ { id, nombre, email, rol } o null           │
 *  │ login      │ Function │ Persiste token + usuario tras /auth/login   │
 *  │ logout     │ Function │ Limpia sesión local y cookie del servidor   │
 *  │ loading    │ boolean  │ true mientras verifica el token inicial     │
 *  │ isAdmin    │ boolean  │ true si user.rol === "admin"                │
 *  └────────────┴──────────┴─────────────────────────────────────────────┘
 *
 * @module context/AuthProvider
 *
 * @example
 * // En main.jsx (ya está configurado así):
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 *
 * @example
 * // En cualquier componente hijo:
 * const { user, login, logout, isAdmin, loading } = useAuth();
 */

import { useState, useEffect, useCallback } from 'react';
import { AuthContext }                       from './AuthContext';
import api                                   from '../services/api';

/**
 * Provider de autenticación. Debe envolver toda la aplicación en main.jsx.
 *
 * @param {{ children: React.ReactNode }} props
 */
export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  /* ══════════════════════════════════════════════════════════════════════
     VERIFICACIÓN INICIAL DE SESIÓN
     Se ejecuta una sola vez al montar la app.
  ══════════════════════════════════════════════════════════════════════ */

  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('token');

      /* Sin token almacenado → no hay sesión, fin */
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        /* Si falta el token CSRF local, obtenerlo desde el servidor */
        if (!localStorage.getItem('csrfToken')) {
          const csrfResponse = await api.get('/auth/csrf-token');
          if (csrfResponse.data?.csrfToken) {
            localStorage.setItem('csrfToken', csrfResponse.data.csrfToken);
          }
        }

        /* Validar el token contra la DB — obtiene datos frescos del usuario */
        const response = await api.get('/auth/me');
        const userData = response.data.usuario;

        /* Persistir datos actualizados y actualizar estado */
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

      } catch (error) {
        const status = error.response?.status;

        /* ── Solo limpiar sesión si el token es realmente inválido ──────
           401 → Token expirado o inválido — limpiar todo.
           403 → Sin permisos — situación inusual, también limpiar.
           Sin status (red) → No sabemos si el token es válido o no.
                              Recuperar usuario de localStorage como
                              fallback offline y no borrar nada.
                              El usuario podrá navegar por rutas que
                              no necesiten fetch de API mientras tenga
                              internet de vuelta.
        ─────────────────────────────────────────────────────────────── */
        if (status === 401 || status === 403) {
          /* Token definitivamente inválido — cerrar sesión limpiamente */
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('csrfToken');
          setUser(null);

          console.warn('[AUTH] Sesión inválida. Token eliminado.');

        } else {
          /* Error de red / servidor — intentar recuperar sesión del cache */
          console.warn(
            '[AUTH] Error de red al verificar sesión. Recuperando desde localStorage.',
            error.message
          );

          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch {
              /* localStorage corrupto — limpiar por seguridad */
              localStorage.removeItem('user');
              setUser(null);
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  /* ══════════════════════════════════════════════════════════════════════
     login(userData, token)
     Llamado desde Login.jsx después de un POST /auth/login exitoso.
     Guarda el access token y los datos del usuario, actualiza el estado.
  ══════════════════════════════════════════════════════════════════════ */

  /**
   * Inicia sesión localmente con los datos recibidos del backend.
   *
   * @param {{ id: number, nombre: string, email: string, rol: string }} userData
   * @param {string} token - Access token JWT.
   */
  const login = useCallback((userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  /* ══════════════════════════════════════════════════════════════════════
     logout()
     Cierra la sesión local Y limpia la cookie httpOnly del servidor.
     Llamado desde Navbar.jsx y AdminLayout.jsx.
  ══════════════════════════════════════════════════════════════════════ */

  /**
   * Cierra la sesión del usuario.
   *
   * Estrategia "optimistic logout":
   *  1. Limpia estado local e inmediatamente (el usuario ve el efecto al instante).
   *  2. Llama a POST /auth/logout en segundo plano para que el backend
   *     ejecute `res.clearCookie('refreshToken')` y elimine la cookie httpOnly.
   *     Si la llamada falla (sin internet), el token expirará en 7 días
   *     por su propia naturaleza — no es un riesgo crítico en un MVP.
   */
  const logout = useCallback(() => {
    /* Paso 1 — Limpiar sesión local de forma inmediata y síncrona */
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);

    /* Paso 2 — Limpiar cookie httpOnly del servidor (fire and forget) */
    api.post('/auth/logout')
      .catch(() => {
        /* Silenciar el error — la sesión local ya está cerrada */
        console.warn('[AUTH] No se pudo limpiar la cookie de sesión del servidor.');
      })
      .finally(() => {
        localStorage.removeItem('csrfToken');
      });
  }, []);

  /* ══════════════════════════════════════════════════════════════════════
     isAdmin — Propiedad calculada
     Usada en Navbar para mostrar "Panel Admin" y en ProtectedRoute
     para validar acceso a rutas /admin/*.
  ══════════════════════════════════════════════════════════════════════ */

  /**
   * true si el usuario autenticado tiene rol "admin".
   * Se recalcula automáticamente cuando cambia `user`.
   * @type {boolean}
   */
  const isAdmin = user?.rol === 'admin';

  /* ══════════════════════════════════════════════════════════════════════
     RENDER
     No renderiza children hasta completar la verificación inicial.
     Esto evita que rutas protegidas se monten un instante con user=null
     y redirigen a /login antes de que la sesión haya sido verificada.
  ══════════════════════════════════════════════════════════════════════ */

  return (
    <AuthContext.Provider
      value={{
        user,     // { id, nombre, email, rol } o null
        login,    // (userData, token) => void
        logout,   // () => void — limpia local + cookie del servidor
        loading,  // boolean — true mientras verifica el token inicial
        isAdmin,  // boolean — true si user.rol === "admin"
      }}
    >
      {/* Bloquear render hasta terminar verificación inicial */}
      {!loading && children}
    </AuthContext.Provider>
  );
};