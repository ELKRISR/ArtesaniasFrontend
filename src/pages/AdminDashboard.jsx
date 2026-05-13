/**
 * @fileoverview Dashboard administrativo con métricas de ventas en tiempo real.
 *
 * Muestra cuatro secciones de datos de negocio obtenidas del backend:
 *  - Total vendido acumulado (pedidos pagados + enviados).
 *  - Ventas por día en gráfico de línea (tendencia diaria).
 *  - Ventas mensuales en gráfico de barras.
 *  - Top 10 productos más vendidos.
 *
 * Solo accesible para administradores (protegido por ProtectedRoute en App.jsx).
 *
 * Bugs corregidos:
 *  1. Fechas en XAxis mostraban ISO string completo ("2026-02-14T05:00:00.000Z").
 *     mysql2 deserializa DATE de MySQL como objeto Date de JavaScript, y recharts
 *     llama a .toString() que produce el ISO string. Se corrige formateando la
 *     fecha en el tickFormatter del XAxis con toLocaleDateString('es-CO').
 *  2. Total vendido sin formato de moneda → mostraba "$320000" en lugar de
 *     "$ 320.000" o el formato COP correcto.
 *     → Se usa Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).
 *  3. Tooltip de recharts sin formato → mostraba valores crudos como 320000.
 *     → Se implementa CustomTooltip con formato COP.
 *  4. Todo en inline styles → inconsistente con el resto del proyecto (Tailwind).
 *     → Migrado completamente a clases Tailwind con los colores del proyecto.
 *  5. Loading y error states sin diseño → texto plano con emojis.
 *     → Rediseñados con Spinner y tarjeta consistente con el resto del admin.
 *
 * @module pages/AdminDashboard
 */

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

import {
  obtenerTotalVendido,
  obtenerVentasPorFecha,
  obtenerTopProductos,
  obtenerVentasMensuales,
} from '../services/reportesService';

import Spinner from '../components/ui/Spinner';

/* ── Helpers de formato ────────────────────────────────────────────────── */

/**
 * Formatea un número como moneda colombiana (COP).
 * Ej: 320000 → "$ 320.000"
 *
 * @param {number} valor
 * @returns {string}
 */
const formatCOP = (valor) =>
  new Intl.NumberFormat('es-CO', {
    style:                 'currency',
    currency:              'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(valor) || 0);

/**
 * Formatea una fecha (Date object o string ISO) a formato corto en español.
 * Ej: Date("2026-02-14") → "14 feb"
 * Resuelve el bug: mysql2 deserializa DATE de MySQL como Date JS,
 * lo que hacía que recharts mostrara el ISO string completo en los ejes.
 *
 * @param {Date|string} fecha
 * @returns {string}
 */
const formatFecha = (fecha) => {
  if (!fecha) return '';
  try {
    return new Date(fecha).toLocaleDateString('es-CO', {
      day:   'numeric',
      month: 'short',
    });
  } catch {
    return String(fecha);
  }
};

/* ── Tooltip personalizado para recharts ───────────────────────────────── */

/**
 * Tooltip personalizado con formato de moneda COP.
 * Reemplaza el tooltip por defecto que mostraba valores crudos sin formato.
 *
 * @param {{ active: boolean, payload: Array, label: * }} props
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white border border-cuero/20 rounded-lg shadow-lg px-4 py-3 text-sm font-sans">
      <p className="font-semibold text-cuero-dark mb-1">
        {formatFecha(label)}
      </p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {formatCOP(entry.value)}
        </p>
      ))}
    </div>
  );
};

/* ── Tooltip para ventas mensuales (label ya viene como "2026-02") ──────── */

const CustomTooltipMensual = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white border border-cuero/20 rounded-lg shadow-lg px-4 py-3 text-sm font-sans">
      <p className="font-semibold text-cuero-dark mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {formatCOP(entry.value)}
        </p>
      ))}
    </div>
  );
};

/* ── Helper: normalizar arrays de la API ───────────────────────────────── */

/**
 * Garantiza que un valor sea un array, manejando las variantes de respuesta
 * del backend estándar { success, data: [...] } o array directo.
 *
 * @param {*} data
 * @returns {Array}
 */
const ensureArray = (data) => {
  if (Array.isArray(data))       return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

/* ── Componente principal ──────────────────────────────────────────────── */

/**
 * Dashboard administrativo con métricas y gráficos de ventas.
 *
 * @returns {JSX.Element}
 */
const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    total:           0,
    ventasPorFecha:  [],
    topProductos:    [],
    ventasMensuales: [],
  });

  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  /* ── Fetch de todos los reportes en paralelo ─────────────────────────── */
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [totalRes, fechaRes, topRes, mensualRes] = await Promise.all([
          obtenerTotalVendido(),
          obtenerVentasPorFecha(),
          obtenerTopProductos(),
          obtenerVentasMensuales(),
        ]);

        if (!isMounted) return;

        setDashboardData({
          // El backend devuelve { success, data: { total_vendido: X } }
          // El servicio retorna data (= { success, data: {...} })
          // Por eso se accede a .data.total_vendido
          total: totalRes?.data?.total_vendido ?? totalRes?.total_vendido ?? 0,

          ventasPorFecha: ensureArray(fechaRes),

          topProductos: ensureArray(topRes),

          // Construir label legible para el eje X del gráfico mensual
          ventasMensuales: ensureArray(mensualRes).map((item) => ({
            ...item,
            mesLabel: `${item.año}-${String(item.mes).padStart(2, '0')}`,
          })),
        });

      } catch (err) {
        if (!isMounted) return;
        console.error('Error cargando reportes:', err);
        setError('No se pudieron cargar los reportes.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => { isMounted = false; };
  }, []);

  /* ── Estados de UI ───────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Spinner size="large" color="#8B5E3C" />
        <p className="text-cuero-dark font-sans text-sm">Cargando reportes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-md shadow-sm">
          <p className="text-red-600 font-semibold text-lg mb-1">Error al cargar</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  /* ── Render principal ────────────────────────────────────────────────── */
  return (
    <div className="space-y-10">

      {/* ── Encabezado ───────────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-bold text-cuero-dark">Dashboard Administrativo</h1>
        <p className="text-sm text-gray-500 mt-1 font-sans">
          Métricas de ventas en tiempo real
        </p>
      </div>

      {/* ── Tarjeta — Total vendido ───────────────────────────────────── */}
      <div className="bg-cuero-dark text-white rounded-2xl p-6 shadow-md">
        <p className="text-sm font-sans opacity-75 mb-1 uppercase tracking-wider">
          Total vendido acumulado
        </p>
        <p className="text-4xl font-bold font-sans">
          {formatCOP(dashboardData.total)}
        </p>
        <p className="text-xs opacity-60 mt-2 font-sans">
          Pedidos pagados y enviados
        </p>
      </div>

      {/* ── Gráfico: Ventas por Día ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-cuero/15 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-cuero-dark mb-6">
          Ventas por día
        </h2>

        {dashboardData.ventasPorFecha.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">
            Sin datos de ventas por día
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={dashboardData.ventasPorFecha}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe4" />
              <XAxis
                dataKey="fecha"
                tick={{ fontSize: 12, fill: '#6b7280', fontFamily: 'sans-serif' }}
                /* Corrección del bug de fechas ISO:
                   mysql2 devuelve Date JS object → formateamos a "14 feb" */
                tickFormatter={formatFecha}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280', fontFamily: 'sans-serif' }}
                tickFormatter={(v) => formatCOP(v)}
                width={90}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="total_dia"
                stroke="#8B5E3C"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#8B5E3C' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Gráfico: Ventas Mensuales ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-cuero/15 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-cuero-dark mb-6">
          Ventas mensuales
        </h2>

        {dashboardData.ventasMensuales.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">
            Sin datos de ventas mensuales
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={dashboardData.ventasMensuales}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe4" />
              <XAxis
                dataKey="mesLabel"
                tick={{ fontSize: 12, fill: '#6b7280', fontFamily: 'sans-serif' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280', fontFamily: 'sans-serif' }}
                tickFormatter={(v) => formatCOP(v)}
                width={90}
              />
              <Tooltip content={<CustomTooltipMensual />} />
              <Bar
                dataKey="total_mes"
                fill="#8B5E3C"
                radius={[6, 6, 0, 0]}
                maxBarSize={80}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Top Productos ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-cuero/15 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-cuero-dark mb-6">
          Top productos vendidos
        </h2>

        {dashboardData.topProductos.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">
            Sin datos de productos vendidos
          </p>
        ) : (
          <div className="space-y-3">
            {dashboardData.topProductos.map((producto, index) => (
              <div
                key={producto.id || index}
                className="flex items-center justify-between p-3 rounded-xl bg-pastel-beige border border-cuero/10"
              >
                <div className="flex items-center gap-3">
                  {/* Posición */}
                  <span className="w-7 h-7 rounded-full bg-cuero text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="font-medium text-cuero-dark font-sans text-sm">
                    {producto.nombre}
                  </span>
                </div>
                <span className="text-sm font-semibold text-cuero font-sans">
                  {Number(producto.total_vendido).toLocaleString('es-CO')} vendido{Number(producto.total_vendido) !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminDashboard;