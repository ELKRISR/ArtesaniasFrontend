import { useContext } from "react";
import { CartContext } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

function Cart() {
  const {
    cartItems,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
  } = useContext(CartContext);

  const navigate = useNavigate();

  const total = cartItems.reduce(
    (acc, item) => acc + item.precio * item.cantidad,
    0
  );

  if (cartItems.length === 0) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-2xl font-serif font-bold text-cuero-dark">
          Tu carrito está vacío
        </h2>
        <p className="text-body mt-2">Explora nuestras piezas únicas ✨</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-16 px-4 bg-pastel.beige rounded-lg shadow-md">
      <h1 className="heading mb-10">Carrito de Compras</h1>

      {cartItems.map((item) => {
        const subtotal = item.precio * item.cantidad;

        return (
          <div key={item.id} className="flex justify-between items-center border-b py-6">
            {/* IZQUIERDA */}
            <div className="flex items-center gap-6">
              <img
                src={item.imagen || item.imagen_url || 'https://via.placeholder.com/150x150?text=Sin+imagen'}
                alt={item.nombre}
                className="w-24 h-24 object-cover rounded-lg shadow-sm"
              />
              <div>
                <h2 className="subheading">{item.nombre}</h2>
                <p className="text-sm text-gray-500 font-sans">
                  Precio unitario:{" "}
                  {new Intl.NumberFormat("es-CO", {
                    style: "currency",
                    currency: "COP",
                  }).format(item.precio)}
                </p>
                <p className={`text-xs font-semibold mt-1 ${
                  item.cantidad >= item.stock ? 'text-red-500' : 'text-green-600'
                }`}>
                  {item.cantidad >= item.stock 
                    ? `⚠️ Cantidad máxima de stock alcanzada` 
                    : `Stock disponible: ${item.stock}`
                  }
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => decreaseQuantity(item.id)}
                    className="btn-light"
                  >
                    −
                  </button>
                  <span className="font-bold text-cuero-dark">{item.cantidad}</span>
                  <button
                    onClick={() => increaseQuantity(item.id)}
                    disabled={item.cantidad >= item.stock}
                    className="btn-light disabled:opacity-50 disabled:cursor-not-allowed"
                    title={item.cantidad >= item.stock ? 'Stock máximo alcanzado' : 'Aumentar cantidad'}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* DERECHA */}
            <div className="flex flex-col items-end">
              <p className="price text-xl">
                {new Intl.NumberFormat("es-CO", {
                  style: "currency",
                  currency: "COP",
                }).format(subtotal)}
              </p>
              <button
                onClick={() => removeFromCart(item.id)}
                className="text-red-500 text-sm hover:underline"
              >
                Eliminar
              </button>
            </div>
          </div>
        );
      })}

      {/* TOTAL */}
      <div className="text-right mt-12">
        <h2 className="subheading">
          Total:{" "}
          {new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
          }).format(total)}
        </h2>
        <div className="mt-6 flex justify-end gap-6 items-center">
          <button
            onClick={clearCart}
            className="btn-secondary"
          >
            Vaciar carrito
          </button>
          <button
            onClick={() => navigate("/checkout")}
            className="btn-primary"
          >
            Finalizar compra
          </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;
