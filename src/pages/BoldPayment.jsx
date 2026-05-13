import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../hooks/useToast";
import Spinner from "../components/ui/Spinner";
import api from "../services/api";

function BoldPayment() {
  const { referenceId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const boldWidgetRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);
  const [boldInstance, setBoldInstance] = useState(null);

  useEffect(() => {
    // Cargar el SDK de Bold desde CDN
    const script = document.createElement('script');
    script.src = 'https://checkout.bold.co/checkout.js';
    script.async = true;
    script.onload = () => {
      initializeBoldPayment();
    };
    script.onerror = () => {
      setError('Error cargando el servicio de pago. Por favor, intenta nuevamente.');
      setLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const initializeBoldPayment = async () => {
    try {
      // Extraer ID del pedido del referenceId (formato: pedido-{id}-{timestamp})
      const pedidoId = referenceId?.split('-')[1];

      if (!pedidoId) {
        setError("ID de pedido inválido");
        setLoading(false);
        return;
      }

      // Obtener detalles de la intención de pago del backend
      const response = await api.get(`/pedidos/bold-payment-intent/${referenceId}`);
      const intentData = response.data?.data;

      if (!intentData) {
        setError("No se pudo cargar los detalles del pago");
        setLoading(false);
        return;
      }

      setPaymentData(intentData);

      // Verificar clave pública de Bold
      if (!import.meta.env.VITE_BOLD_PUBLIC_KEY) {
        setError('La clave pública de Bold no está configurada. Revisa la variable VITE_BOLD_PUBLIC_KEY.');
        setLoading(false);
        return;
      }

      // Verificar que Bold esté disponible
      if (!window.Bold) {
        setError('Bold SDK no cargó correctamente');
        setLoading(false);
        return;
      }

      // Inicializar el widget de Bold
      const bold = new window.Bold({
        publishableKey: import.meta.env.VITE_BOLD_PUBLIC_KEY,
        amount: intentData.amount.total_amount,
        currency: intentData.amount.currency,
        reference: referenceId,
        onSuccess: handlePaymentSuccess,
        onError: handlePaymentError,
        onCancel: handlePaymentCancel
      });

      setBoldInstance(bold);
      setLoading(false);
    } catch (err) {
      console.error("Error inicializando pago Bold:", err);
      setError(err.response?.data?.message || "Error cargando la página de pago");
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (token) => {
    try {
      setPaymentLoading(true);

      // Enviar token a backend para procesar el pago
      const response = await api.post("/pedidos/procesar-bold-payment", {
        referenceId: paymentData.reference_id,
        token: token,
        amount: paymentData.amount.total_amount / 100,
        currency: paymentData.amount.currency
      });

      if (response.data?.data?.estado === "pagado") {
        showToast("¡Pago completado exitosamente!", "success");
        navigate(`/success/${paymentData.pedidoId}`);
      } else {
        showToast("Error procesando el pago", "error");
      }
    } catch (err) {
      console.error("Error procesando pago:", err);
      showToast(
        err.response?.data?.message || "Error al procesar el pago",
        "error"
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentError = (error) => {
    console.error("Error en pago Bold:", error);
    setError(error.message || "Error procesando el pago");
    showToast(error.message || "Hubo un error en el proceso de pago", "error");
  };

  const handlePaymentCancel = () => {
    showToast("Pago cancelado", "info");
    navigate("/checkout");
  };

  const handleOpenWidget = () => {
    if (boldInstance) {
      boldInstance.open();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner size="large" color="cuero" />
          <p className="mt-4 text-gray-600">Cargando página de pago...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-serif font-bold text-red-600 mb-4">
            Error en el Pago
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/checkout")}
            className="px-6 py-2 bg-cuero text-white rounded-lg hover:bg-cuero-dark transition"
          >
            Volver al Checkout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-100">
          <h1 className="text-2xl font-serif font-bold text-cuero-dark mb-6 text-center">
            Procesar Pago con Bold
          </h1>

          <div className="space-y-6">
            {/* Información del Pedido */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 mb-2 font-medium">
                ℹ️ Pedido #{paymentData?.pedidoId}
              </p>
              <p className="text-xs text-blue-800">
                Reference: {referenceId}
              </p>
              <p className="text-sm text-blue-900 font-semibold mt-3">
                Total: ${(paymentData?.amount?.total_amount / 100).toLocaleString('es-CO')} {paymentData?.amount?.currency}
              </p>
            </div>

            {/* Contenedor del Widget de Bold */}
            <div
              ref={boldWidgetRef}
              className="bg-pastel-beige rounded-lg p-6 min-h-[300px] flex items-center justify-center"
            >
              <div className="text-center">
                <p className="text-gray-600 text-sm mb-4">
                  Widget de pago seguro de Bold
                </p>
                <button
                  onClick={handleOpenWidget}
                  disabled={paymentLoading || !boldInstance}
                  className="px-6 py-3 bg-cuero text-white rounded-lg hover:bg-cuero-dark transition font-medium disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                  {paymentLoading ? "Procesando..." : "Ingresar datos de pago"}
                </button>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="space-y-3 pt-4 border-t">
              <button
                onClick={handleOpenWidget}
                disabled={paymentLoading || !boldInstance}
                className="w-full px-6 py-3 bg-cuero text-white rounded-lg hover:bg-cuero-dark transition font-medium disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {paymentLoading && <Spinner size="small" color="white" />}
                {paymentLoading ? "Procesando..." : "💳 Ir al Pago"}
              </button>

              <button
                onClick={handlePaymentCancel}
                disabled={paymentLoading}
                className="w-full px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
              >
                ✕ Cancelar
              </button>
            </div>

            {/* Seguridad */}
            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500 text-center">
                🔒 Tu pago es procesado de forma segura con Bold
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BoldPayment;