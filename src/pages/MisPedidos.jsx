/**
 * @fileoverview Página de historial de pedidos del usuario autenticado.
 *
 * Muestra todos los pedidos realizados por el usuario, con opciones para
 * ver el detalle, consultar el historial de estados y descargar la factura PDF.
 *
 * Corrección aplicada:
 *  La función `descargarFactura` usaba `alert()` nativo del navegador cuando
 *  fallaba la descarga. El sistema de notificaciones del proyecto usa el
 *  hook `useToast` — mezclar alert() con toasts es inconsistente y además
 *  alert() bloquea el hilo de JavaScript hasta que el usuario lo cierra.
 *  → Reemplazado por `showToast('...', 'error')` que es no-bloqueante
 *    y visualmente consistente con el resto de la aplicación.
 *
 * @module pages/MisPedidos
 */

import { useEffect, useState } from 'react';
import { useNavigate }         from 'react-router-dom';
import api                     from '../services/api';
import Spinner                 from '../components/ui/Spinner';
import StatusBadge             from '../components/ui/StatusBadge';
import { useToast }            from '../hooks/useToast';

function MisPedidos() {
  const [pedidos,          setPedidos]          = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [historial,        setHistorial]        = useState([]);
  const [historialOpen,    setHistorialOpen]    = useState(false);
  const [historialLoading, setHistorialLoading] = useState(false);
  const [selectedPedido,   setSelectedPedido]   = useState(null);
  const [fetchError,       setFetchError]       = useState('');

  const navigate        = useNavigate();
  const { showToast }   = useToast();

  /* =========================
     DESCARGAR FACTURA
  ========================= */
  const descargarFactura = async (pedidoId) => {
    try {
      const response = await api.get(
        `/pedidos/${pedidoId}/factura`,
        { responseType: 'blob' }
      );

      const url  = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.download = `factura-pedido-${pedidoId}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error descargando factura:', error);
      // Corrección: showToast en lugar de alert() bloqueante
      showToast('No se pudo descargar la factura. Inténtalo de nuevo.', 'error');
    }
  };

  /* =========================
     CARGAR PEDIDOS
  ========================= */
  const fetchPedidos = async () => {
    setLoading(true);
    try {
      const response = await api.get('/pedidos/mis-pedidos');
      const data = response.data?.data || response.data;
      setPedidos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPedidos();
  }, []);

  const fetchHistorial = async (pedidoId) => {
    setHistorialLoading(true);
    setFetchError('');
    setSelectedPedido(pedidoId);

    try {
      const response = await api.get(`/pedidos/${pedidoId}/historial`);
      const data = response.data?.data || response.data;
      setHistorial(Array.isArray(data) ? data : []);
      setHistorialOpen(true);
    } catch (error) {
      console.error('Error cargando historial:', error);
      setFetchError('No se pudo cargar el historial');
    } finally {
      setHistorialLoading(false);
    }
  };

  /* =========================
     LOADING
  ========================= */
  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner />
      </div>
    );
  }

  /* =========================
     UI
  ========================= */
  return (
    <div className="max-w-5xl mx-auto py-20 px-4">
      <h1 className="text-4xl font-serif font-bold mb-12 text-cuero-dark text-center">
        Mis pedidos
      </h1>

      {pedidos.length === 0 ? (
        <div className="text-center py-20 bg-pastel-beige rounded-2xl border">
          <p className="text-gray-600 text-lg">
            Aún no tienes pedidos.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Cuando realices una compra, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={fetchPedidos}
              className="px-4 py-2 text-sm font-medium bg-cuero text-white rounded-lg hover:bg-cuero-dark transition"
            >
              Actualizar pedidos
            </button>
          </div>

          <div className="space-y-8">
            {pedidos.map((pedido) => {
              const formattedTotal = new Intl.NumberFormat('es-CO', {
                style:    'currency',
                currency: 'COP',
              }).format(Number(pedido.total) || 0);

              return (
                <div
                  key={pedido.id}
                  className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* HEADER */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-cuero-dark">
                        Pedido #{pedido.id}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(pedido.fecha).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                    <StatusBadge estado={pedido.estado} />
                  </div>

                  {/* DIVIDER */}
                  <div className="border-t border-gray-100 mb-6" />

                  {/* TOTAL + ACCIONES */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                      <p className="text-gray-500 text-sm">Total del pedido</p>
                      <p className="text-2xl font-bold text-cuero">{formattedTotal}</p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => navigate(`/success/${pedido.id}`)}
                        className="px-4 py-2 text-sm font-medium text-cuero border border-cuero rounded-lg hover:bg-cuero hover:text-white transition"
                      >
                        Ver detalle
                      </button>
                      <button
                        onClick={() => fetchHistorial(pedido.id)}
                        className="px-4 py-2 text-sm font-medium bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition"
                      >
                        Historial
                      </button>
                      <button
                        onClick={() => descargarFactura(pedido.id)}
                        className="px-4 py-2 text-sm font-medium bg-cuero text-white rounded-lg hover:bg-cuero-dark transition"
                      >
                        Descargar factura
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal historial */}
      {historialOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center p-4">
          <div className="bg-white max-w-lg w-full rounded-xl p-5 shadow-xl relative">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold">
                  Historial de pedido #{selectedPedido}
                </h3>
                <p className="text-xs text-gray-500">Últimos cambios</p>
              </div>
              <button
                className="text-xl font-bold text-gray-500 hover:text-gray-900"
                onClick={() => setHistorialOpen(false)}
              >
                ×
              </button>
            </div>

            {historialLoading ? (
              <div className="py-10 text-center"><Spinner /></div>
            ) : fetchError ? (
              <p className="text-red-600">{fetchError}</p>
            ) : historial.length === 0 ? (
              <p className="text-gray-600">No hay historial disponible.</p>
            ) : (
              <ul className="space-y-2 text-sm text-gray-700">
                {historial.map((item) => (
                  <li key={item.id} className="border rounded p-2 bg-slate-50">
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>
                        {item.fecha
                          ? new Date(item.fecha).toLocaleString()
                          : 'Fecha desconocida'}
                      </span>
                      <span>por {item.cambiado_por || 'usuario'}</span>
                    </div>
                    <div className="mt-1">
                      <strong>{item.estado_anterior || 'N/A'}</strong>
                      {' → '}
                      <strong>{item.estado_nuevo || 'N/A'}</strong>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MisPedidos;