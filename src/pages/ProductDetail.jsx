/**
 * @fileoverview Página de detalle de un producto individual.
 *
 * Muestra la imagen, descripción, precio, stock y permite al usuario
 * agregar el producto al carrito. Ruta pública — no requiere autenticación.
 *
 * El ID del producto se obtiene del parámetro de ruta `/producto/:id`.
 *
 * Bugs corregidos:
 *  1. Sin loading state real — solo mostraba texto "Cargando..." sin Spinner.
 *     → Se usa el componente Spinner con estado loading correcto.
 *  2. Sin error state — si el producto no existía o había error de red,
 *     la página quedaba atrapada en "Cargando..." indefinidamente.
 *     → Se agregó estado `error` con mensaje y botón para volver.
 *  3. Imagen sin fallback — src={null} o src={undefined} mostraba ícono roto.
 *     → Se agregó onError handler que cambia a una imagen SVG local inline.
 *     → Se eliminó placeholder.com que está deprecado y puede ser bloqueado.
 *  4. Sin botón para volver al catálogo — el usuario quedaba atrapado.
 *     → Se agregó botón "Volver al catálogo" con useNavigate.
 *  5. Cleanup de useEffect — si el usuario navegaba antes de que terminara
 *     el fetch, se intentaba setear estado en un componente desmontado.
 *     → Se agregó isMounted para evitar memory leaks.
 *
 * @module pages/ProductDetail
 */

import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate }          from 'react-router-dom';
import { getProductById }                  from '../services/productService';
import { CartContext }                     from '../context/CartContext';
import Spinner                             from '../components/ui/Spinner';
import { useToast }                        from '../hooks/useToast';
import analyticsService                    from '../services/analyticsService';
import ProductReviews                      from '../components/ProductReviews';
import WishlistButton                      from '../components/WishlistButton';

/**
 * Imagen SVG de placeholder usada cuando un producto no tiene imagen
 * o cuando la URL de imagen falla al cargar.
 * Se usa inline para evitar dependencia de servicios externos
 * (placeholder.com está deprecado y puede ser bloqueado por CSP).
 *
 * @constant {string}
 */
const IMAGEN_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='400' viewBox='0 0 500 400'%3E%3Crect width='500' height='400' fill='%23FDF6EC'/%3E%3Crect x='190' y='140' width='120' height='100' rx='8' fill='none' stroke='%238B5E3C' stroke-width='2'/%3E%3Ccircle cx='220' cy='165' r='12' fill='none' stroke='%238B5E3C' stroke-width='2'/%3E%3Cpath d='M190 220 L225 185 L255 210 L275 190 L310 220' fill='none' stroke='%238B5E3C' stroke-width='2'/%3E%3Ctext x='250' y='280' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%238B5E3C'%3ESin imagen%3C/text%3E%3C/svg%3E";

/**
 * Página de detalle de producto.
 *
 * @returns {JSX.Element}
 */
function ProductDetail() {
  const { id }             = useParams();
  const navigate           = useNavigate();
  const { addToCart }      = useContext(CartContext);
  const { showToast }      = useToast();

  const [product,  setProduct]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [imgError, setImgError] = useState(false);

  /* ── Fetch del producto ──────────────────────────────────────────────── */
  useEffect(() => {
    let isMounted = true;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await getProductById(id);

        // El servicio retorna { success, data: producto }
        // .data accede al objeto del producto
        const producto = response?.data || response;

        if (!producto || !producto.id) {
          throw new Error('Producto no encontrado');
        }

        if (isMounted) {
          setProduct(producto);
          // Track product view
          analyticsService.productView(producto);
        }
      } catch (err) {
        console.error('Error al obtener producto:', err);
        if (isMounted) {
          setError('No se pudo cargar el producto. Puede que no exista o haya un problema de conexión.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProduct();

    // Cleanup: evita actualizar estado en componente desmontado
    return () => { isMounted = false; };
  }, [id]);

  useEffect(() => {
    if (!product) return;

    document.title = `${product.nombre} | Artesanías Katerine`;
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) {
      descMeta.content = product.descripcion || 'Descubre Artesanías Katerine únicas hechas a mano.';
    }
  }, [product]);

  /* ── Agregar al carrito ──────────────────────────────────────────────── */
  const handleAddToCart = () => {
    addToCart(product);
    showToast(`"${product.nombre}" agregado al carrito`, 'success');
    // Track add to cart
    analyticsService.addToCart(product, 1);
  };

  /* ── Formatear precio ────────────────────────────────────────────────── */
  const formatCOP = (valor) =>
    new Intl.NumberFormat('es-CO', {
      style:    'currency',
      currency: 'COP',
    }).format(valor);

  /* ── Estados de UI ───────────────────────────────────────────────────── */

  // Cargando
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Spinner size="large" color="#8B5E3C" />
        <p className="text-cuero-dark font-sans text-sm">Cargando producto...</p>
      </div>
    );
  }

  // Error o producto no encontrado
  if (error || !product) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24 px-4">
        <div className="bg-pastel-beige rounded-2xl border border-cuero/20 p-10">
          <p className="text-cuero-dark font-semibold text-xl mb-2">
            Producto no encontrado
          </p>
          <p className="text-sm text-gray-500 mb-6">
            {error || 'El producto que buscas no está disponible.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2 rounded-lg bg-cuero text-white font-semibold hover:bg-cuero-dark transition"
          >
            Volver al catálogo
          </button>
        </div>
      </div>
    );
  }

  /* ── Render principal ────────────────────────────────────────────────── */
  return (
    <div className="max-w-5xl mx-auto py-16 px-4">

      {/* Botón volver */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-cuero hover:text-cuero-dark transition text-sm font-semibold mb-8"
      >
        ← Volver al catálogo
      </button>

      <div className="grid md:grid-cols-2 gap-10 bg-pastel-beige rounded-2xl shadow-md border border-cuero/10 p-6 md:p-10">

        {/* ── Imagen ─────────────────────────────────────────────────── */}
        {(() => {
          const imageUrl = product.imagen || product.imagen_url;
          return (
            <img
              src={imgError || !imageUrl ? IMAGEN_FALLBACK : imageUrl}
              alt={product.nombre}
              className="w-full h-96 object-cover rounded-xl shadow-lg border border-cuero/20"
              onError={() => setImgError(true)}
            />
          );
        })()}

        {/* ── Información ────────────────────────────────────────────── */}
        <div className="flex flex-col justify-between">
          <div>
            {/* Categoría — si existe */}
            {product.categoria_nombre && (
              <span className="inline-block text-xs font-semibold uppercase tracking-wider text-cuero bg-cuero/10 px-3 py-1 rounded-full mb-3">
                {product.categoria_nombre}
              </span>
            )}

            <h1 className="text-3xl font-serif font-bold mb-4 text-cuero-dark">
              {product.nombre}
            </h1>

            <p className="text-body mb-6 leading-relaxed">
              {product.descripcion || 'Sin descripción disponible.'}
            </p>

            <p className="text-3xl font-bold text-accent mb-2 font-sans">
              {formatCOP(product.precio)}
            </p>

            {/* Indicador de stock */}
            <p className={`text-sm mb-6 font-sans font-medium ${
              product.stock > 0 ? 'text-green-600' : 'text-red-500'
            }`}>
              {product.stock > 0
                ? `${product.stock} unidad${product.stock !== 1 ? 'es' : ''} disponible${product.stock !== 1 ? 's' : ''}`
                : 'Sin stock disponible'}
            </p>
          </div>

          {/* Botón agregar al carrito */}
          <div className="flex gap-3 items-center">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {product.stock > 0 ? 'Agregar al carrito' : 'Sin stock'}
            </button>

            {/* Botón de wishlist */}
            <WishlistButton productoId={product.id} showText={true} />
          </div>
        </div>

      </div>

      {/* Reseñas del producto */}
      <ProductReviews productoId={product.id} />

    </div>
  );
}

export default ProductDetail;