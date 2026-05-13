import { useContext, useState, useMemo } from "react";
import { CartContext } from "../context/CartContext";
import { useToast } from "../hooks/useToast";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Spinner from "../components/ui/Spinner";
import analyticsService from "../services/analyticsService";
import { getProductById } from "../services/productService";

function Checkout() {
  const { cartItems, clearCart, updateCartItems } = useContext(CartContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    direccion: "",
    telefono: "",
    paymentMethod: "efectivo",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const total = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const precio = Number(item.precio) || 0;
      const cantidad = Number(item.cantidad) || 0;
      return acc + precio * cantidad;
    }, 0);
  }, [cartItems]);

  const validate = () => {
    let newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio";
    }

    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!formData.direccion.trim()) {
      newErrors.direccion = "La dirección es obligatoria";
    }

    if (!/^3\d{9}$/.test(formData.telefono)) {
      newErrors.telefono =
        "Teléfono inválido (Debe empezar por 3 y tener 10 dígitos)";
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = "Selecciona un método de pago";
    }

    if (formData.paymentMethod === "tarjeta") {
      // El pago con tarjeta se procesa de forma segura con Bold en el Checkout.
      // No almacenamos ni validamos datos de tarjeta sensibles en el frontend.
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  // 🔥 ESTE ES EL handleSubmit (el que maneja enviar el pedido)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    if (cartItems.length === 0) {
      showToast("El carrito está vacío", "error");
      return;
    }

    // Sincronizar stock con el backend antes de confirmar el pedido
    const refreshedCartItems = await Promise.all(
      cartItems.map(async (item) => {
        try {
          const response = await getProductById(item.id);
          const product = response?.data || response;
          const stock = Number(product?.stock);
          return {
            ...item,
            stock: Number.isFinite(stock) ? stock : item.stock,
          };
        } catch {
          return item;
        }
      })
    );

    updateCartItems(refreshedCartItems);

    for (const item of refreshedCartItems) {
      if (item.cantidad > item.stock) {
        showToast(
          `⚠️ Stock insuficiente: "${item.nombre}" solo tiene ${item.stock} unidad${item.stock === 1 ? '' : 'es'} disponible(s)`,
          "error"
        );
        return;
      }
      if (item.stock === 0) {
        showToast(
          `❌ "${item.nombre}" ya no tiene stock disponible. Por favor, remueve este producto del carrito.`,
          "error"
        );
        return;
      }
    }

    try {
      setLoading(true);

      // Track begin checkout
      analyticsService.beginCheckout(cartItems, total);

      const payload = {
        cliente: {
          nombre: formData.nombre,
          email: formData.email,
          direccion: formData.direccion,
          telefono: formData.telefono,
        },
        items: cartItems.map((item) => ({
          productoId: Number(item.id),
          cantidad: Number(item.cantidad),
        })),
      };

      if (formData.paymentMethod === "efectivo") {
        const response = await api.post("/pedidos", {
          ...payload,
          paymentMethod: "efectivo",
        });

        const pedidoId = response.data?.data?.pedidoId;

        if (!pedidoId) {
          console.error("No se pudo obtener el ID del pedido:", response.data);
          showToast("Error interno creando el pedido", "error");
          return;
        }

        showToast("Pedido creado correctamente", "success");
        clearCart();
        
        // Track purchase
        analyticsService.purchase({
          id: pedidoId,
          total: total,
          productos: cartItems
        });
        
        navigate(`/success/${pedidoId}`);
        return;
      }

      const response = await api.post("/pedidos/bold-session", payload);
      const { paymentUrl } = response.data?.data || response.data;

      if (!paymentUrl) {
        console.error("No se pudo obtener la URL de pago de Bold:", response.data);
        showToast("Error interno creando la sesión de pago", "error");
        return;
      }

      showToast("Redirigiendo a Bold para completar el pago...", "success");

      // Redirigir a la URL de pago de Bold
      window.location.href = paymentUrl;

    } catch (error) {
      console.error("Error creando pedido:", error);

      const backendMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Hubo un error al procesar el pedido";

      showToast(backendMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-2xl font-serif font-bold text-cuero-dark">
          No tienes productos en el carrito
        </h2>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-16 px-4 grid md:grid-cols-2 gap-10">
      <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100">
        <h1 className="heading mb-5">Finalizar Compra</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {["nombre", "email", "direccion", "telefono"].map((field) => (
            <div key={field}>
              <input
                type={field === "email" ? "email" : "text"}
                name={field}
                placeholder={
                  field === "telefono"
                    ? "Teléfono (Ej: 3001234567)"
                    : field.charAt(0).toUpperCase() + field.slice(1)
                }
                value={formData[field]}
                onChange={handleChange}
                className="w-full border border-slate-300 p-3 rounded-lg focus:border-cuero focus:ring-cuero/30 transition"
              />
              {errors[field] && (
                <p className="text-red-500 text-sm mt-1">{errors[field]}</p>
              )}
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium mb-1">Método de pago</label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className="w-full border border-slate-300 p-3 rounded-lg focus:border-cuero focus:ring-cuero/30 transition"
            >
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
            </select>
            {errors.paymentMethod && (
              <p className="text-red-500 text-sm mt-1">{errors.paymentMethod}</p>
            )}
          </div>

          {formData.paymentMethod === 'tarjeta' && (
            <div className="rounded-xl border border-cuero/20 bg-cuero/5 p-4 text-sm text-cuero-dark">
              <p className="font-medium mb-2">Pago con tarjeta seguro</p>
              <p>
                Serás redirigido a Bold para completar el pago. En ningún
                momento almacenamos tus datos de tarjeta en nuestros servidores.
              </p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-white transition font-sans bg-cuero hover:bg-cuero-dark disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Spinner size="small" color="white" />}
            {loading ? "Procesando..." : "Confirmar Pedido"}
          </button>
        </form>
      </div>

      <div className="bg-pastel-beige p-6 rounded-xl h-fit shadow-md">
        <h2 className="subheading mb-6">Resumen del Pedido</h2>

        {cartItems.map((item) => {
          const subtotal =
            (Number(item.precio) || 0) *
            (Number(item.cantidad) || 0);

          return (
            <div key={item.id} className="flex justify-between mb-4 font-sans">
              <span>
                {item.nombre} x {item.cantidad}
              </span>
              <span>
                {new Intl.NumberFormat("es-CO", {
                  style: "currency",
                  currency: "COP",
                }).format(subtotal)}
              </span>
            </div>
          );
        })}

        <hr className="my-6" />

        <div className="flex justify-between font-bold text-lg font-sans text-cuero-dark">
          <span>Total</span>
          <span>
            {new Intl.NumberFormat("es-CO", {
              style: "currency",
              currency: "COP",
            }).format(total)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Checkout;