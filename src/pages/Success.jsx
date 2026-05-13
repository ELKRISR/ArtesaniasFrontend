/**
 * @fileoverview Página de confirmación de pedido exitoso.
 *
 * Se muestra después de completar un checkout exitoso. Recibe el ID del
 * pedido como parámetro de ruta (/success/:id), consulta los detalles
 * del pedido y permite descargar la factura en PDF.
 *
 * Corrección aplicada:
 *  La función `descargarFactura` usaba `alert()` nativo del navegador cuando
 *  fallaba la descarga del PDF. El sistema de notificaciones del proyecto
 *  usa el hook `useToast` — `alert()` es bloqueante (congela el hilo de JS
 *  hasta que el usuario lo cierra) y visualmente inconsistente con el resto.
 *  → Reemplazado por `showToast('...', 'error')` no-bloqueante y consistente.
 *
 * @module pages/Success
 */

import { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams }  from 'react-router-dom';
import api                         from '../services/api';
import Spinner                     from '../components/ui/Spinner';
import StatusBadge                 from '../components/ui/StatusBadge';
import { useToast }                from '../hooks/useToast';
import { CartContext }            from '../context/CartContext';
import analyticsService           from '../services/analyticsService';

function Success() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { showToast } = useToast();

  const { clearCart } = useContext(CartContext);
  const [pedido,         setPedido]         = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [showAnimation,  setShowAnimation]  = useState(false);

  useEffect(() => {
    let isMounted       = true;
    let animationTimeout;

    const fetchPedido = async () => {
      try {
        const response = await api.get(`/pedidos/${id}`);
        const data = response.data?.data || response.data;

        if (isMounted) {
          setPedido(data);
          clearCart(); // Limpiar carrito después de pedido exitoso
          
          // Track purchase completion
          analyticsService.purchase(data);
          
          animationTimeout = setTimeout(() => {
            setShowAnimation(true);
          }, 200);
        }
      } catch (err) {
        console.error('Error cargando pedido:', err);
        if (isMounted) {
          setError('No se pudo cargar el pedido.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPedido();

    return () => {
      isMounted = false;
      clearTimeout(animationTimeout);
    };
  }, [id, clearCart]);

  useEffect(() => {
    if (!loading && pedido?.estado === 'pagado') {
      clearCart();
    }
  }, [loading, pedido, clearCart]);

  const descargarFactura = async () => {
    if (!pedido?.id) return;

    try {
      const response = await api.get(`/pedidos/${pedido.id}/factura`, {
        responseType: 'blob',
      });

      const url  = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `factura-${pedido.id}.pdf`);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Spinner size="large" />
      </div>
    );
  }

  if (error || !pedido) {
    return (
      <div className="max-w-3xl mx-auto text-center py-32 bg-pastel-beige rounded-lg shadow-md">
        <h1 className="text-3xl font-serif font-bold mb-6 text-cuero-dark">
          Pedido no encontrado
        </h1>
        <button onClick={() => navigate('/')} className="btn-primary">
          Volver al inicio
        </button>
      </div>
    );
  }

  const fechaFormateada = pedido.fecha
    ? new Date(pedido.fecha).toLocaleString('es-CO')
    : 'Fecha no disponible';

  return (
    <div
      className={`max-w-4xl mx-auto py-20 px-4 transition-all duration-700 ${
        showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <h1 className="text-4xl font-serif font-bold mb-6 text-cuero-dark text-center">
        🎉 ¡Pedido confirmado!
      </h1>

      <p className="text-body mb-10 text-center">
        Gracias por confiar en nuestras artesanías.
      </p>

      <div className="bg-white rounded-xl p-8 mb-10 shadow-md text-left space-y-4">
        <div className="flex justify-between">
          <span className="font-medium">Número de pedido:</span>
          <span className="font-bold">#{pedido.id}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Estado:</span>
          <StatusBadge estado={pedido.estado} />
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Fecha:</span>
          <span>{fechaFormateada}</span>
        </div>
        <div className="flex justify-between text-lg">
          <span className="font-semibold">Total:</span>
          <span className="font-bold">
            {new Intl.NumberFormat('es-CO', {
              style:    'currency',
              currency: 'COP',
            }).format(Number(pedido.total) || 0)}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl p-8 mb-10 shadow-md text-left">
        <h2 className="text-xl font-semibold mb-6">Detalle del pedido</h2>

        {(pedido.detalle || []).map((item, index) => (
          <div key={index} className="flex justify-between mb-4 border-b pb-3">
            <span>
              {item.nombre} x {item.cantidad}
            </span>
            <span>
              {new Intl.NumberFormat('es-CO', {
                style:    'currency',
                currency: 'COP',
              }).format(
                (Number(item.precio_unitario) || 0) *
                (Number(item.cantidad) || 0)
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-4 flex-wrap">
        <button
          onClick={descargarFactura}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
        >
          Descargar factura
        </button>

        <button
          onClick={() => navigate('/mis-pedidos')}
          className="btn-primary"
        >
          Ver mis pedidos
        </button>

        <button
          onClick={() => navigate('/')}
          className="border border-cuero text-cuero px-6 py-2 rounded-lg hover:bg-cuero hover:text-white transition"
        >
          Seguir comprando
        </button>
      </div>
    </div>
  );
}

export default Success;