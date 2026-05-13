/**
 * ==============================
 * CONTEXTO DE WISHLIST
 * ==============================
 * Gestión de lista de deseos del usuario
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist debe usarse dentro de WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar wishlist del usuario
  useEffect(() => {
    if (user) {
      cargarWishlist();
    } else {
      setWishlist([]);
    }
  }, [user]);

  const cargarWishlist = async () => {
    try {
      setLoading(true);
      const response = await api.get('/wishlist');
      setWishlist(response.data.data || []);
    } catch (error) {
      console.error('Error cargando wishlist:', error);
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  const agregarAWishlist = async (productoId) => {
    if (!user) return false;

    try {
      await api.post('/wishlist', { productoId });
      await cargarWishlist(); // Recargar la lista
      return true;
    } catch (error) {
      console.error('Error agregando a wishlist:', error);
      return false;
    }
  };

  const removerDeWishlist = async (productoId) => {
    if (!user) return false;

    try {
      await api.delete(`/wishlist/${productoId}`);
      await cargarWishlist(); // Recargar la lista
      return true;
    } catch (error) {
      console.error('Error removiendo de wishlist:', error);
      return false;
    }
  };

  const estaEnWishlist = (productoId) => {
    return wishlist.some(item => item.producto_id === productoId);
  };

  const value = {
    wishlist,
    loading,
    agregarAWishlist,
    removerDeWishlist,
    estaEnWishlist,
    recargarWishlist: cargarWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};