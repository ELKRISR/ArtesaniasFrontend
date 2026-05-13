/**
 * @fileoverview Hook personalizado para consumir el contexto de autenticación.
 *
 * Encapsula `useContext(AuthContext)` añadiendo una guardia de seguridad:
 * si el hook se usa fuera del árbol de `AuthProvider`, lanza un error
 * descriptivo en lugar del críptico `Cannot destructure property 'user'
 * of undefined` que aparecería sin la guardia.
 *
 * Este patrón es el estándar de la industria para hooks de contexto
 * (idéntico al que ya usa `useToast.js` en el mismo proyecto).
 *
 * @module hooks/useAuth
 *
 * @example
 * // Uso básico en cualquier componente dentro de AuthProvider:
 * import { useAuth } from '../hooks/useAuth';
 *
 * function MiComponente() {
 *   const { user, login, logout, isAdmin, loading } = useAuth();
 *
 *   if (loading) return <Spinner />;
 *   if (!user)   return <p>No autenticado</p>;
 *
 *   return <p>Hola, {user.nombre}</p>;
 * }
 *
 * @example
 * // Verificar rol admin:
 * const { isAdmin } = useAuth();
 * if (isAdmin) { // mostrar panel admin }
 *
 * @example
 * // ERROR — usar fuera de AuthProvider lanza:
 * // "useAuth debe usarse dentro de <AuthProvider>"
 * function ComponenteFuera() {
 *   const { user } = useAuth(); // ← lanza Error descriptivo
 * }
 */

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Hook para acceder al contexto de autenticación global.
 *
 * Valores que expone:
 *  - `user`    {object|null}  Datos del usuario autenticado o null.
 *  - `login`   {Function}     Inicia sesión con userData y token.
 *  - `logout`  {Function}     Cierra sesión local y limpia cookie del servidor.
 *  - `loading` {boolean}      true mientras se verifica el token inicial.
 *  - `isAdmin` {boolean}      true si user.rol === "admin".
 *
 * @returns {{ user: object|null, login: Function, logout: Function, loading: boolean, isAdmin: boolean }}
 * @throws {Error} Si se usa fuera del árbol de AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      '[useAuth] debe usarse dentro de <AuthProvider>. ' +
      'Asegúrate de que AuthProvider envuelve el componente en main.jsx.'
    );
  }

  return context;
};