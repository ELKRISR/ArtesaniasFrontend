/**
 * @fileoverview Layout del panel de administración.
 *
 * Estructura de dos columnas: sidebar fijo a la izquierda y área de
 * contenido principal a la derecha donde se renderizan las páginas admin
 * mediante el componente <Outlet /> de React Router.
 *
 * Rutas que usan este layout (definidas en App.jsx bajo /admin):
 *  /admin/dashboard  → AdminDashboard.jsx
 *  /admin/productos  → AdminProductos.jsx
 *  /admin/pedidos    → AdminPedidos.jsx
 *  /admin/contactos  → AdminContactos.jsx
 *
 * Correcciones aplicadas:
 *  1. Todos los inline styles migrados a clases Tailwind con los tokens
 *     de color del proyecto (cuero, cuero-dark, pastel-beige).
 *     Esto hace que el panel admin sea visualmente consistente con la
 *     tienda pública y simplifica futuros cambios de diseño global.
 *  2. Eliminados los handlers onMouseOver/onMouseOut del botón de logout.
 *     Era un anti-patrón de React: manipulación directa de estilos via
 *     eventos JS en lugar de CSS declarativo. Reemplazado por hover: de Tailwind.
 *  3. El sidebar ahora muestra `user.nombre` primero y el email como dato
 *     secundario. Antes mostraba `user.email || user.nombre` — el admin
 *     veía su email en lugar de su nombre.
 *  4. Highlight del link activo mejorado: borde izquierdo visible además
 *     del fondo semitransparente, más legible visualmente.
 *
 * @module layouts/AdminLayout
 */

import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect }                               from 'react';
import analyticsService                            from '../services/analyticsService';
import { useAuth }                                 from '../hooks/useAuth';
import { useToast }                                from '../hooks/useToast';
import io                                          from 'socket.io-client';

/**
 * Elementos del menú de navegación del sidebar.
 * Centralizado aquí para simplificar agregar nuevas rutas en el futuro.
 *
 * @type {Array<{ to: string, label: string, icon: string }>}
 */
const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard',  icon: '📊' },
  { to: '/admin/productos', label: 'Productos',   icon: '📦' },
  { to: '/admin/pedidos',   label: 'Pedidos',     icon: '🧾' },
  { to: '/admin/contactos', label: 'Contactos',   icon: '✉️'  },
];

/**
 * Layout del panel de administración con sidebar y contenido principal.
 *
 * @returns {JSX.Element}
 */
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { showToast }    = useToast();
  const location         = useLocation();
  const navigate         = useNavigate();

  useEffect(() => {
    analyticsService.pageView(location.pathname, document.title);
  }, [location.pathname]);

  // Conectar Socket.IO para notificaciones en tiempo real
  useEffect(() => {
    const socket = io(import.meta.env.DEV ? 'http://localhost:4000' : '/', {
      withCredentials: true
    });

    // Unirse a la sala de admins
    socket.emit('join', { role: 'admin' });

    // Escuchar eventos de notificaciones
    socket.on('order:created', (data) => {
      showToast(`🛒 Nuevo pedido #${data.id} - $${data.total}`, 'info');
    });

    socket.on('order:paid', (data) => {
      showToast(`💰 Pago recibido pedido #${data.id} - $${data.total}`, 'success');
    });

    socket.on('contact:submitted', (data) => {
      showToast(`✉️ Nuevo mensaje de ${data.nombre}`, 'info');
    });

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, [showToast]);

  /**
   * Determina si un path de navegación está activo.
   * @param {string} path - Ruta a comparar con la ubicación actual.
   * @returns {boolean}
   */
  const isActive = (path) => location.pathname === path;

  /**
   * Cierra sesión, muestra notificación y redirige al inicio.
   */
  const handleLogout = () => {
    logout();
    showToast('Sesión cerrada correctamente', 'success');
    navigate('/');
  };

  return (
    <div className="flex min-h-screen font-sans">

      {/* ══════════════════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════════════════ */}
      <aside className="w-60 bg-cuero-dark text-white flex flex-col justify-between py-6 px-5 flex-shrink-0">

        {/* ── Encabezado del sidebar ──────────────────────── */}
        <div>
          <h2 className="text-xl font-bold mb-8 tracking-tight">
            Panel Admin
          </h2>

          {/* ── Links de navegación ─────────────────────────── */}
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors duration-150
                  ${isActive(to)
                    /* Activo: fondo semitransparente + borde izquierdo destacado */
                    ? 'bg-white/15 border-l-2 border-white pl-2.5 font-semibold'
                    /* Inactivo: hover suave */
                    : 'text-white/80 hover:bg-white/10 hover:text-white border-l-2 border-transparent pl-2.5'
                  }
                `}
              >
                <span className="text-base leading-none">{icon}</span>
                {label}
              </Link>
            ))}

            {/* Separador */}
            <div className="my-3 border-t border-white/20" />

            {/* Link: ir a tienda pública */}
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                         text-white/80 hover:bg-white/10 hover:text-white
                         border-l-2 border-transparent pl-2.5 transition-colors duration-150"
            >
              <span className="text-base leading-none">🏪</span>
              Ir a tienda
            </Link>
          </nav>
        </div>

        {/* ── Pie del sidebar: usuario + logout ─────────────── */}
        <div className="border-t border-white/20 pt-4">
          {/* Nombre e email del admin */}
          <div className="mb-3 px-1">
            <p className="text-sm font-semibold text-white truncate">
              {user?.nombre || 'Administrador'}
            </p>
            <p className="text-xs text-white/60 truncate mt-0.5">
              {user?.email}
            </p>
          </div>

          {/* Botón cerrar sesión — hover declarativo con Tailwind (sin onMouseOver) */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2
                       px-4 py-2.5 rounded-lg text-sm font-semibold
                       bg-cuero hover:bg-cuero-light
                       text-white transition-colors duration-150"
          >
            <span>🚪</span>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════
          CONTENIDO PRINCIPAL
          <Outlet /> renderiza la página admin activa
      ══════════════════════════════════════════════════════ */}
      <main className="flex-1 bg-slate-50 overflow-y-auto p-8 min-h-screen">
        <Outlet />
      </main>

    </div>
  );
}