/**
 * ==============================
 * BOTÓN DE WISHLIST
 * ==============================
 * Botón para agregar/remover productos de wishlist
 */

import { useState } from 'react';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

const WishlistButton = ({ productoId, size = 'normal', showText = false }) => {
  const { user } = useAuth();
  const { estaEnWishlist, agregarAWishlist, removerDeWishlist, loading } = useWishlist();
  const { showToast } = useToast();
  const [localLoading, setLocalLoading] = useState(false);

  const enWishlist = estaEnWishlist(productoId);
  const isLoading = loading || localLoading;

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      showToast('Debes iniciar sesión para usar la lista de deseos', 'error');
      return;
    }

    setLocalLoading(true);

    try {
      let success;
      if (enWishlist) {
        success = await removerDeWishlist(productoId);
        if (success) {
          showToast('Removido de lista de deseos', 'info');
        }
      } else {
        success = await agregarAWishlist(productoId);
        if (success) {
          showToast('Agregado a lista de deseos', 'success');
        }
      }

      if (!success) {
        showToast('Error al actualizar lista de deseos', 'error');
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      showToast('Error al actualizar lista de deseos', 'error');
    } finally {
      setLocalLoading(false);
    }
  };

  const buttonSize = size === 'small' ? 'w-8 h-8' : 'w-10 h-10';
  const iconSize = size === 'small' ? 'text-lg' : 'text-xl';

  return (
    <button
      onClick={handleToggleWishlist}
      disabled={isLoading}
      className={`
        ${buttonSize} rounded-full flex items-center justify-center
        transition-all duration-200 disabled:opacity-50
        ${enWishlist
          ? 'bg-red-100 text-red-600 hover:bg-red-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }
      `}
      title={enWishlist ? 'Remover de lista de deseos' : 'Agregar a lista de deseos'}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
      ) : (
        <span className={iconSize}>
          {enWishlist ? '❤️' : '🤍'}
        </span>
      )}

      {showText && (
        <span className="ml-2 text-sm">
          {enWishlist ? 'En wishlist' : 'Agregar'}
        </span>
      )}
    </button>
  );
};

export default WishlistButton;