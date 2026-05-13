import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../hooks/useToast';
import Spinner from '../components/ui/Spinner';

const Wishlist = () => {
  const { wishlist, loading, removerDeWishlist } = useWishlist();
  const { showToast } = useToast();

  useEffect(() => {
    document.title = 'Wishlist | Artesanías';
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) {
      descMeta.content = 'Revisa tus productos favoritos guardados en la lista de deseos.';
    }
  }, []);

  const handleRemove = async (productoId) => {
    const success = await removerDeWishlist(productoId);
    if (success) {
      showToast('Producto removido de la wishlist', 'info');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Spinner size="large" color="#8B5E3C" />
        <p className="text-cuero-dark text-sm">Cargando tu lista de deseos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-cuero-dark">Wishlist</h1>
        <p className="text-sm text-gray-600 mt-2">
          Tus productos favoritos para revisar más tarde.
        </p>
      </div>

      {wishlist.length === 0 ? (
        <div className="bg-pastel-beige border border-cuero/20 rounded-3xl p-10 text-center">
          <p className="text-cuero-dark font-semibold text-lg mb-3">Tu wishlist está vacía</p>
          <p className="text-sm text-gray-600 mb-6">
            Agrega productos a tu lista de deseos desde el catálogo o la página de detalle.
          </p>
          <Link
            to="/"
            className="inline-block px-5 py-3 bg-cuero text-white rounded-lg hover:bg-cuero-dark transition"
          >
            Ir al catálogo
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {wishlist.map((item) => (
            <div key={item.producto_id} className="bg-white rounded-3xl border border-cuero/10 shadow-sm overflow-hidden">
              <img
                src={item.imagen || item.imagen_url || 'https://via.placeholder.com/400x300?text=Sin+imagen'}
                alt={item.nombre}
                className="h-52 w-full object-cover"
              />
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-cuero-dark text-lg">{item.nombre}</h2>
                    <p className="text-sm text-gray-500">{item.categoria || 'Artesanía'}</p>
                  </div>
                  <span className="text-cuero font-semibold">
                    {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP'
                    }).format(item.precio)}
                  </span>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                  {item.descripcion || 'Sin descripción disponible.'}
                </p>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    to={`/producto/${item.producto_id}`}
                    className="text-sm text-cuero font-semibold hover:text-cuero-dark transition"
                  >
                    Ver producto
                  </Link>
                  <button
                    onClick={() => handleRemove(item.producto_id)}
                    className="text-sm px-4 py-2 rounded-full border border-red-200 text-red-600 hover:bg-red-50 transition"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
