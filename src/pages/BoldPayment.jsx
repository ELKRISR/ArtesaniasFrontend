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
 const [sdkLoaded, setSdkLoaded] = useState(false);
  // ============================================================
  // CARGAR SDK DE BOLD
  // ============================================================
  useEffect(() => {
     const existingScript = document.querySelector(
      'script[src="https://checkout.bold.co/library/boldPaymentButton.js"]'
    );
const onScriptLoad = () => {
      // Esperar un microciclo para asegurar que el constructor esté disponible
      if (window.BoldCheckout) {
        setSdkLoaded(true);
      } else {
        // Si por algún motivo no está, reintentar después de un pequeño delay
        setTimeout(() => {
          if (window.BoldCheckout) setSdkLoaded(true);
          else setError("No se pudo inicializar Bold. Recarga la página.");
        }, 100);
      }
    };
      if (existingScript) {
      // El script ya está en el DOM, pero ¿ya se ejecutó?
      if (window.BoldCheckout) {
        setSdkLoaded(true);
      } else {
        // Esperar a que el script existente termine de ejecutarse
        existingScript.addEventListener('load', onScriptLoad);
        // Si ya se cargó pero no se disparó el evento, verificamos rápido
        if (window.BoldCheckout) setSdkLoaded(true);
      }
      return;
    }
    // Cargar el SDK de Bold desde CDN
    const script = document.createElement('script');

    script.src = 'https://checkout.bold.co/library/boldPaymentButton.js';

    script.async = true;

    script.onerror = () => {
      setError('Error cargando el servicio de pago. Por favor, intenta nuevamente.');
      setLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      if (existingScript) existingScript.removeEventListener('load', onScriptLoad);
      // No removemos el script del DOM porque puede ser reutilizado
    };
  }, []);

  // ============================================================
  // CARGAR DATOS DEL PAGO
  // ============================================================
  useEffect(() => {
    if (!sdkLoaded) return; // ⚠️ Esperar a que el SDK esté disponible
    const loadPaymentIntent = async () => {
      try {
        setLoading(true);
        // Verificar referencia
        const pedidoId = referenceId?.split("-")[1];

        if (!pedidoId) {
          setError("ID de pedido inválido");
          setLoading(false);
          return;
        }

        // Obtener intención de pago
        const response = await api.get(
          `/pedidos/bold-payment-intent/${referenceId}`
        );

        const intentData = response.data?.data;
        if (!intentData) {
          setError("No se pudo cargar la información del pago");
          setLoading(false);
          return;
        }

        // Verificar clave pública
        if (!import.meta.env.VITE_BOLD_PUBLIC_KEY) {
          setError(
            "La variable VITE_BOLD_PUBLIC_KEY no está configurada."
          );

          setLoading(false);
          return;
        }

        setPaymentData(intentData);
        // Crear instancia de checkout de Bold
        const checkout = new BoldCheckout({
          orderId: intentData.reference_id,
          currency: intentData.amount.currency,
          amount: intentData.amount.totalAmount.toString(), 
          apiKey: import.meta.env.VITE_BOLD_PUBLIC_KEY,
          integritySignature:
            intentData.integritySignature,
          description: intentData.description,
          redirectionUrl: "/pago-finalizado" // url de redirección después de pago - para produccion usar la url real del frontend desplegado que tenga https y NO http
        });

        setBoldInstance(checkout);
            setLoading(false);
          } catch (err) {
            console.error("Error cargando pago:", err);

            setError(
              err.response?.data?.message ||
                "Error cargando la página de pago"
            );

            setLoading(false);
          }
    };
    
    loadPaymentIntent();
    

  }, [referenceId, sdkLoaded]);

  // ============================================================
  // CANCELAR PAGO
  // ============================================================
  const handleCancel = () => {
    showToast("Pago cancelado", "info");
    navigate("/checkout");
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
                Total: ${(paymentData?.amount?.totalAmount).toLocaleString('es-CO')} {paymentData?.amount?.currency}
              </p>
            </div>

            {/* Contenedor del Widget de Bold */}
            <div
              ref={boldWidgetRef}
              className="bg-pastel-beige rounded-lg p-6 min-h-[300px] flex items-center justify-center"
            >
              <div className="text-center">
                <p className="text-gray-600 text-sm mb-4">
                  El widget Bold se abrirá automáticamente. Si no se abre, pulsa el botón.
                </p>
                <button
                  type="button"
                  data-bold-button="true"
                  data-bold-publishable-key={import.meta.env.VITE_BOLD_PUBLIC_KEY}
                  data-bold-amount={paymentData.amount.total_amount}
                  data-bold-currency={paymentData.amount.currency}
                  data-bold-reference={referenceId}
                  onClick={() => boldInstance?.open()}
                  className="px-6 py-3 bg-[#0f172a] text-white rounded-lg hover:bg-[#111827] transition font-medium disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                  {paymentLoading ? "Procesando..." : "Pagar con Bold"}
                </button>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="space-y-3 pt-4 border-t">
              <button
                onClick={handleCancel}
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