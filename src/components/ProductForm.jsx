/**
 * @fileoverview Modal de formulario para crear y editar productos.
 *
 * Se renderiza sobre AdminProductos cuando el admin pulsa "Crear Producto"
 * o "Editar" en una fila de la tabla.
 *
 * Props:
 *  - product  {object|null} null → modo crear · objeto producto → modo editar
 *  - onClose  {Function}    Cierra el modal sin guardar cambios
 *  - onSuccess {Function}   Callback invocado tras guardar exitosamente
 *                           (AdminProductos lo usa para recargar la lista)
 *
 * Validaciones del formulario:
 *  - nombre: requerido, mínimo 3 caracteres
 *  - precio: requerido, mayor a 0
 *  - stock:  requerido, mayor o igual a 0
 *  - imagen_url: opcional, solo URL con http/https
 *
 * BUG CRÍTICO CORREGIDO:
 *  Al editar un producto, el campo `imagen_url` del formulario se inicializaba
 *  con `product.imagen_url || ""`. Sin embargo, el backend devuelve el campo
 *  de imagen con el nombre `imagen` (columna real de la DB), NO `imagen_url`.
 *  Resultado: `product.imagen_url` era siempre `undefined` → el campo quedaba
 *  vacío → al guardar se enviaba `imagen_url: ""` → el backend guardaba `null`
 *  en la columna imagen → TODAS las ediciones borraban la imagen del producto.
 *
 *  FIX: inicializar con `product.imagen || product.imagen_url || ""`
 *  Ahora lee el campo correcto (`imagen`) que devuelve el backend, con
 *  fallback a `imagen_url` por compatibilidad futura.
 *
 * CORRECCIONES ADICIONALES:
 *  - Inline styles del overlay y modal migrados a Tailwind.
 *  - Labels e inputs migrados a Tailwind para consistencia con la tienda.
 *  - Validación de URL de imagen: avisa si la URL no empieza con http/https.
 *
 * @module components/ProductForm
 */

import { useState, useEffect } from 'react';
import { createProduct, updateProduct, getCategorias } from '../services/productService';
import { imageAssets } from '../utils/imageAssets';
import { useToast }                     from '../hooks/useToast';
import Button                           from '../components/ui/Button';
import ErrorMessage                     from '../components/ui/ErrorMessage';

/**
 * Modal de formulario CRUD para productos.
 *
 * @param {{ product: object|null, onClose: Function, onSuccess: Function }} props
 */
export default function ProductForm({ product, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nombre:      '',
    descripcion: '',
    precio:      '',
    stock:       '',
    categoria_id:'',
    imagen_url:  '',
  });
  const [categorias, setCategorias] = useState([]);

  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [imgPreviewError, setImgPreviewError] = useState(false);

  const { showToast } = useToast();
  const isEditing     = !!product;

  /* ── Cargar datos del producto al editar ─────────────────────────────── */
  useEffect(() => {
    if (product) {
      setFormData({
        nombre:      product.nombre      || '',
        descripcion: product.descripcion || '',
        precio:      product.precio      || '',
        stock:       product.stock       || '',
        categoria_id: product.categoria_id ? String(product.categoria_id) : '',
        /*
         * CORRECCIÓN CRÍTICA:
         * El backend devuelve el campo como `imagen` (columna de la DB),
         * NO como `imagen_url`. La versión anterior usaba `product.imagen_url`
         * que siempre era undefined, causando que todas las ediciones
         * borraran la imagen del producto en la base de datos.
         */
        imagen_url: product.imagen || product.imagen_url || '',
      });
      setImgPreviewError(false);
    }
  }, [product]);

  /* ── Manejar cambios del formulario ─────────────────────────────────── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Resetear error de preview al cambiar la URL de imagen
    if (name === 'imagen_url') setImgPreviewError(false);
  };

  const handleAssetSelect = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, imagen_url: value || '' }));
    setImgPreviewError(false);
  };

  /* ── Validaciones del lado del cliente ──────────────────────────────── */
  const validate = () => {
    if (!formData.nombre.trim() || formData.nombre.trim().length < 3) {
      setError('El nombre debe tener al menos 3 caracteres.');
      return false;
    }
    if (!formData.precio || Number(formData.precio) <= 0) {
      setError('El precio debe ser mayor a 0.');
      return false;
    }
    if (formData.stock === '' || Number(formData.stock) < 0) {
      setError('El stock debe ser mayor o igual a 0.');
      return false;
    }
    if (formData.imagen_url && !/^((https?:\/\/)|\/|data:|blob:).+/.test(formData.imagen_url.trim())) {
      setError('La URL de imagen debe ser válida. Usa http://, https://, /, data: o blob:.');
      return false;
    }
    setError('');
    return true;
  };

  /* ── Enviar formulario ───────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || !validate()) return;

    setLoading(true);
    setError('');

    try {
      const payload = {
        nombre:      formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        precio:      Number(formData.precio),
        stock:       Number(formData.stock),
        categoria_id: formData.categoria_id ? Number(formData.categoria_id) : null,
        imagen_url:  formData.imagen_url.trim() || null,
      };

      console.log('Enviando payload de producto:', payload);
      if (isEditing) {
        await updateProduct(product.id, payload);
        showToast('Producto actualizado exitosamente', 'success');
      } else {
        await createProduct(payload);
        showToast('Producto creado exitosamente', 'success');
      }

      onSuccess();

    } catch (err) {
      console.error('Error guardando producto:', err);
      console.error('Error response data:', err.response?.data);

      const serverErrors = err.response?.data?.errors;
      const message = serverErrors
        ? serverErrors.map((item) => `${item.field}: ${item.message}`).join(' · ')
        : err.response?.data?.message
        || err.response?.data
        || err.message
        || 'Error al guardar el producto.';

      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const data = await getCategorias();
        setCategorias(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error cargando categorías en el formulario:', err);
        setCategorias([]);
      }
    };

    fetchCategorias();
  }, []);

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <>
      {/* ── Overlay oscuro — click fuera cierra el modal ─────────── */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* ── Panel del modal ───────────────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="w-full max-w-xl max-h-[88vh] overflow-y-auto
                        bg-white rounded-2xl shadow-2xl border border-cuero/15">

          {/* ── Encabezado ──────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-cuero/10">
            <h2
              id="product-form-title"
              className="text-xl font-bold text-cuero-dark font-sans"
            >
              {isEditing ? '✏️ Editar Producto' : '➕ Crear Producto'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none
                         transition-colors duration-150 font-light"
              aria-label="Cerrar formulario"
            >
              ×
            </button>
          </div>

          {/* ── Formulario ──────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4" noValidate>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-semibold text-cuero-dark mb-1.5 font-sans">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Mochila artesanal wayuu"
                className="w-full px-3 py-2.5 text-sm font-sans border-2 border-gray-200
                           rounded-xl focus:outline-none focus:border-cuero
                           transition-colors duration-150"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-semibold text-cuero-dark mb-1.5 font-sans">
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={3}
                placeholder="Descripción del producto..."
                className="w-full px-3 py-2.5 text-sm font-sans border-2 border-gray-200
                           rounded-xl focus:outline-none focus:border-cuero
                           transition-colors duration-150 resize-none"
              />
            </div>

            {/* Precio y Stock — fila */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-cuero-dark mb-1.5 font-sans">
                  Precio (COP) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="precio"
                  value={formData.precio}
                  onChange={handleChange}
                  min="1"
                  step="0.01"
                  placeholder="20000"
                  className="w-full px-3 py-2.5 text-sm font-sans border-2 border-gray-200
                             rounded-xl focus:outline-none focus:border-cuero
                             transition-colors duration-150"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-cuero-dark mb-1.5 font-sans">
                  Stock <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  min="0"
                  placeholder="10"
                  className="w-full px-3 py-2.5 text-sm font-sans border-2 border-gray-200
                             rounded-xl focus:outline-none focus:border-cuero
                             transition-colors duration-150"
                />
              </div>
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-semibold text-cuero-dark mb-1.5 font-sans">
                Categoría
              </label>
              <select
                name="categoria_id"
                value={formData.categoria_id}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm font-sans border-2 border-gray-200
                           rounded-xl focus:outline-none focus:border-cuero
                           transition-colors duration-150"
              >
                <option value="">Selecciona una categoría</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Imagen desde assets */}
            <div>
              <label className="block text-sm font-semibold text-cuero-dark mb-1.5 font-sans">
                Elegir imagen guardada
              </label>
              <select
                value={imageAssets.some((asset) => asset.url === formData.imagen_url) ? formData.imagen_url : ''}
                onChange={handleAssetSelect}
                className="w-full px-3 py-2.5 text-sm font-sans border-2 border-gray-200
                           rounded-xl focus:outline-none focus:border-cuero
                           transition-colors duration-150"
              >
                <option value="">Usar URL externa o ninguna</option>
                {imageAssets.map((asset) => (
                  <option key={asset.filename} value={asset.url}>
                    {asset.filename}
                  </option>
                ))}
              </select>
            </div>

            {/* URL de imagen */}
            <div>
              <label className="block text-sm font-semibold text-cuero-dark mb-1.5 font-sans">
                URL de imagen
              </label>
              <input
                type="url"
                name="imagen_url"
                value={formData.imagen_url}
                onChange={handleChange}
                placeholder="https://ejemplo.com/imagen.jpg"
                className="w-full px-3 py-2.5 text-sm font-sans border-2 border-gray-200
                           rounded-xl focus:outline-none focus:border-cuero
                           transition-colors duration-150"
              />
            </div>

            {/* Preview de imagen — solo si hay URL y no ha dado error */}
            {formData.imagen_url && !imgPreviewError && (
              <div>
                <p className="text-xs font-semibold text-cuero-dark mb-1.5 font-sans">
                  Vista previa:
                </p>
                <img
                  src={formData.imagen_url}
                  alt="Vista previa del producto"
                  className="w-full h-40 object-cover rounded-xl border-2 border-cuero/20"
                  onError={() => setImgPreviewError(true)}
                />
              </div>
            )}
            {formData.imagen_url && imgPreviewError && (
              <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg font-sans">
                ⚠ La URL de imagen no se pudo cargar. Verifica que sea una URL válida y accesible.
              </p>
            )}

            {/* Error de validación o del servidor */}
            {error && (
              <ErrorMessage onClose={() => setError('')}>
                {error}
              </ErrorMessage>
            )}

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-2 border-t border-cuero/10">
              <Button
                type="button"
                onClick={onClose}
                variant="secondary"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="accent"
                loading={loading}
              >
                {loading
                  ? 'Guardando...'
                  : isEditing
                  ? 'Guardar cambios'
                  : 'Crear producto'}
              </Button>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}