import { useState, useEffect } from "react";
import { CartContext } from "./CartContext";

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product) => {
    setCartItems((prevItems) => {
      const existingProduct = prevItems.find(
        (item) => item.id === product.id
      );

      if (existingProduct) {
        const nextQuantity = existingProduct.cantidad + 1;
        if (typeof existingProduct.stock === 'number' && nextQuantity > existingProduct.stock) {
          return prevItems;
        }
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, cantidad: nextQuantity }
            : item
        );
      }

      return [...prevItems, { ...product, cantidad: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== id)
    );
  };

  const increaseQuantity = (id) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id && item.cantidad < item.stock
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      )
    );
  };

  const decreaseQuantity = (id) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) =>
          item.id === id
            ? { ...item, cantidad: item.cantidad - 1 }
            : item
        )
        .filter((item) => item.cantidad > 0)
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const updateCartItems = (updatedItems) => {
    setCartItems(updatedItems);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        updateCartItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}