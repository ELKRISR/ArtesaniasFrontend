/**
 * @fileoverview Tarjeta de producto para la grilla del catálogo público.
 *
 * Muestra la imagen, nombre, descripción, precio y dos botones de acción
 * (ver detalle y agregar al carrito) para cada producto del catálogo.
 * Se renderiza en Home.jsx dentro de una grilla responsive.
 *
 * Corrección aplicada:
 *  La versión anterior renderizaba `src={product.imagen}` sin ningún
 *  fallback. Si el campo `imagen` era null, undefined, o si la URL
 *  fallaba al cargar, el navegador mostraba el ícono de imagen rota
 *  en cada tarjeta, degradando visualmente todo el catálogo.
 *
 *  → Se agrega estado `imgError` (boolean) que se activa en el handler
 *    `onError` del <img>. Cuando está activo, o cuando `product.imagen`
 *    no tiene valor, se muestra un SVG de placeholder inline que:
 *    - No depende de servicios externos (placeholder.com está deprecado).
 *    - Mantiene las dimensiones correctas de la tarjeta.
 *    - Es consistente con el sistema de colores del proyecto (cuero/beige).
 *
 *  Todas las clases CSS existentes (card, subheading, text-body, price,
 *  btn-secondary, btn-primary) se mantienen intactas sin modificación.
 *
 * @module components/ProductCard
 */

import { useState, useContext } from 'react';
import { useNavigate }          from 'react-router-dom';
import analyticsService          from '../services/analyticsService';
import { CartContext }           from '../context/CartContext';
import WishlistButton            from './WishlistButton';

/**
 * SVG de fallback inline cuando la imagen del producto no está disponible.
 * Usar inline evita la dependencia de cualquier servicio externo.
 * El color de fondo (#FDF6EC) es el mismo que `pastel-beige` del proyecto.
 *
 * @constant {string}
 */
const IMAGEN_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23FDF6EC'/%3E%3Crect x='150' y='100' width='100' height='80' rx='6' fill='none' stroke='%238B5E3C' stroke-width='1.5' opacity='0.4'/%3E%3Ccircle cx='173' cy='118' r='9' fill='none' stroke='%238B5E3C' stroke-width='1.5' opacity='0.4'/%3E%3Cpath d='M150 168 L178 142 L200 160 L220 145 L250 168' fill='none' stroke='%238B5E3C' stroke-width='1.5' opacity='0.4'/%3E%3Ctext x='200' y='215' text-anchor='middle' font-family='sans-serif' font-size='12' fill='%238B5E3C' opacity='0.5'%3ESin imagen%3C/text%3E%3C/svg%3E";

/**
 * Tarjeta de producto para el catálogo público.
 *
 * @param {{ product: object }} props
 * @param {object}  props.product           - Objeto producto del backend.
 * @param {number}  props.product.id        - ID del producto.
 * @param {string}  props.product.nombre    - Nombre del producto.
 * @param {string}  props.product.descripcion - Descripción.
 * @param {number}  props.product.precio    - Precio en COP.
 * @param {string|null} props.product.imagen - URL de la imagen (puede ser null).
 * @returns {JSX.Element}
 */
function ProductCard({ product }) {
  const navigate      = useNavigate();
  const { addToCart } = useContext(CartContext);

  /**
   * true cuando la imagen del producto falla al cargar.
   * Activado por el handler onError del elemento <img>.
   */
  const [imgError, setImgError] = useState(false);

  /**
   * Determina el src final de la imagen.
   * Usa `imagen` o `imagen_url` si está disponible.
   * Si no hay ninguna URL válida o la imagen falla al cargar, usa el fallback.
   */
  const imageUrl = product.imagen || product.imagen_url;
  const imageSrc = (!imageUrl || imgError)
    ? IMAGEN_FALLBACK
    : imageUrl;

  return (
    <div className="card">

      {/* ── Imagen del producto con fallback ──────────────── */}
      <div className="relative mb-4">
        <img
          src={imageSrc}
          alt={product.nombre || 'Producto artesanal'}
          className="h-64 w-full object-cover object-center rounded-lg shadow-sm"
          onError={() => setImgError(true)}
        />

        {/* Botón de wishlist en esquina superior derecha */}
        <div className="absolute top-2 right-2">
          <WishlistButton productoId={product.id} size="small" />
        </div>
      </div>

      {/* ── Nombre ────────────────────────────────────────── */}
      <h2 className="subheading mb-3">{product.nombre}</h2>

      {/* ── Precio ────────────────────────────────────────── */}
      <p className="price mb-3">
        {new Intl.NumberFormat('es-CO', {
          style:    'currency',
          currency: 'COP',
        }).format(product.precio)}
      </p>

      {/* ── Stock indicator ──────────────────────────────── */}
      <div className="text-xs font-medium mb-3">
        {product.stock > 0 ? (
          <span className="text-green-600">
            {product.stock} {product.stock === 1 ? 'unidad disponible' : 'unidades disponibles'}
          </span>
        ) : (
          <span className="text-red-600 font-semibold">Sin stock disponible</span>
        )}
      </div>

      {/* ── Botones de acción ─────────────────────────────── */}
      <div className="mt-auto flex gap-3">
        <button
          onClick={() => navigate(`/producto/${product.id}`)}
          className="btn-secondary flex-1"
        >
          Ver detalle
        </button>

        <button
          onClick={() => {
            addToCart(product);
            analyticsService.addToCart(product, 1);
          }}
          disabled={product.stock === 0}
          className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          title={product.stock === 0 ? 'Producto sin stock disponible' : 'Agregar al carrito'}
        >
          {product.stock > 0 ? 'Agregar' : 'Sin stock'}
        </button>
      </div>

    </div>
  );
}

export default ProductCard;