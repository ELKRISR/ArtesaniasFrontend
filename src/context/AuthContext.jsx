/**
 * @fileoverview Contexto React para el estado global de autenticación.
 *
 * Este archivo solo crea y exporta el objeto Context.
 * La lógica de estado y las funciones viven en `AuthProvider.jsx`.
 * Los componentes consumen el contexto a través del hook `useAuth.js`.
 *
 * Separar Context de Provider es el patrón estándar de React:
 *  - Evita dependencias circulares entre archivos.
 *  - Permite importar el contexto en `useAuth.js` sin importar el provider.
 *  - Facilita testing al poder mockear solo el Context.
 *
 * Flujo completo:
 *  AuthContext (este archivo) ← AuthProvider.jsx (lógica y estado)
 *                             ← useAuth.js       (hook para consumidores)
 *                             ← Navbar, Login, AdminLayout, ProtectedRoute...
 *
 * @module context/AuthContext
 */

import { createContext } from 'react';

/**
 * Contexto de autenticación.
 *
 * Valor inicial `null` — indica que el hook `useAuth` detectará si se
 * está usando fuera de un AuthProvider y lanzará un error descriptivo.
 *
 * Forma del valor en tiempo de ejecución (provisto por AuthProvider):
 * @type {React.Context<{
 *   user:    { id: number, nombre: string, email: string, rol: string } | null,
 *   login:   (userData: object, token: string) => void,
 *   logout:  () => void,
 *   loading: boolean,
 *   isAdmin: boolean,
 * } | null>}
 */
export const AuthContext = createContext(null);