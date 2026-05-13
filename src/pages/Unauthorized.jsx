/**
 * @fileoverview Página de acceso denegado — HTTP 403 Forbidden.
 *
 * Se muestra cuando un usuario autenticado intenta acceder a una ruta
 * para la que no tiene el rol requerido. ProtectedRoute redirige aquí
 * cuando el usuario está logueado pero no tiene permisos suficientes.
 *
 * Distinción importante con la página de Login:
 *  - /login   → el usuario NO está autenticado (401).
 *  - /unauthorized → el usuario SÍ está autenticado pero NO tiene permisos (403).
 *
 * Correcciones aplicadas:
 *  La versión anterior era un div con texto plano sin estilos, sin
 *  navegación, y sin ningún contexto visual que explicara qué pasó.
 *  Un usuario que llegara aquí no sabía cómo volver ni qué hacer.
 *  → Rediseñada con el sistema de diseño del proyecto (colores cuero/pastel).
 *  → Botones de navegación claros: volver atrás e ir al inicio.
 *  → Mensaje explicativo sin exponer detalles técnicos de seguridad.
 *
 * @module pages/Unauthorized
 */

import { useNavigate } from 'react-router-dom';
import { useAuth }     from '../hooks/useAuth';

/**
 * Página de error 403 — Acceso denegado.
 *
 * @returns {JSX.Element}
 */
const Unauthorized = () => {
  const navigate    = useNavigate();
  const { user }    = useAuth();

  return (
    <div className="min-h-screen bg-pastel-beige flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">

        {/* ── Número de error ────────────────────────────────── */}
        <p className="text-8xl font-bold text-cuero/20 font-serif select-none mb-2">
          403
        </p>

        {/* ── Ícono ──────────────────────────────────────────── */}
        <div className="text-5xl mb-6">🔒</div>

        {/* ── Título ─────────────────────────────────────────── */}
        <h1 className="text-2xl font-bold font-serif text-cuero-dark mb-3">
          Acceso restringido
        </h1>

        {/* ── Descripción ────────────────────────────────────── */}
        <p className="text-gray-500 font-sans text-sm leading-relaxed mb-8">
          {user
            ? `Hola, ${user.nombre}. Tu cuenta no tiene permisos para ver este contenido.
               Si crees que esto es un error, contacta al administrador.`
            : 'No tienes permisos para acceder a esta sección.'}
        </p>

        {/* ── Acciones ───────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-xl border-2 border-cuero text-cuero
                       font-semibold font-sans text-sm
                       hover:bg-cuero hover:text-white
                       transition-colors duration-150"
          >
            ← Volver atrás
          </button>

          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl bg-cuero text-white
                       font-semibold font-sans text-sm
                       hover:bg-cuero-dark
                       transition-colors duration-150"
          >
            Ir al inicio
          </button>
        </div>

        {/* ── Separador ──────────────────────────────────────── */}
        <div className="mt-8 pt-6 border-t border-cuero/10">
          <p className="text-xs text-gray-400 font-sans">
            ¿Necesitas acceso de administrador?{' '}
            <button
              onClick={() => navigate('/contact')}
              className="text-cuero hover:underline"
            >
              Contáctanos
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Unauthorized;