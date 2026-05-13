/**
 * @fileoverview Página de gestión de productos del panel de administración.
 *
 * Permite al administrador realizar las operaciones CRUD completas sobre
 * el catálogo de productos: listar, buscar, crear, editar y eliminar.
 *
 * Funcionalidades:
 *  - Tabla con todos los productos ordenada por ID descendente.
 *  - Búsqueda en tiempo real por nombre O categoría.
 *  - Botón "Crear Producto" que abre ProductForm en modo creación.
 *  - Botón "Editar" por fila que abre ProductForm en modo edición.
 *  - Botón "Eliminar" por fila con modal de confirmación (ConfirmModal).
 *  - Contador de resultados al pie de la tabla.
 *
 * Correcciones aplicadas:
 *  1. Todos los inline styles migrados a Tailwind con los tokens del proyecto.
 *     El panel admin ahora es visualmente consistente con la tienda pública.
 *  2. El precio se mostraba como "$50000.00". Ahora usa Intl.NumberFormat
 *     con locale es-CO y moneda COP: "$ 50.000".
 *  3. La búsqueda solo filtraba por nombre. Ahora filtra también por
 *     categoría, lo que agiliza encontrar productos en catálogos grandes.
 *  4. Loading state rediseñado con el Spinner del proyecto y layout consistente.
 *  5. Estado vacío (sin resultados de búsqueda) mejorado visualmente.
 *
 * Lógica de estado:
 *  productos        → lista completa descargada del backend
 *  filteredProductos → subconjunto filtrado por searchTerm (lo que se renderiza)
 *  loading          → true mientras se carga la lista
 *  error            → mensaje de error si el fetch falla
 *  showModal        → controla visibilidad del formulario de crear/editar
 *  editingProduct   → null (crear) o el objeto producto (editar)
 *  deleteTarget     → producto seleccionado para eliminar, null si ninguno
 *
 * @module pages/AdminProductos
 */

import { useState, useEffect, useCallback } from 'react';
import { getProducts, deleteProduct }       from '../services/productService';
import { useToast }                         from '../hooks/useToast';
import Button                               from '../components/ui/Button';
import Spinner                              from '../components/ui/Spinner';
import ErrorMessage                         from '../components/ui/ErrorMessage';
import ProductForm                          from '../components/ProductForm';
import ConfirmModal                         from '../components/ui/ConfirmModal';

/* ── Helper: formato de moneda COP ────────────────────────────────────── */

/**
 * Formatea un valor numérico como moneda colombiana.
 * Ej: 50000 → "$ 50.000"
 *
 * @param {number|string} valor
 * @returns {string}
 */
const formatCOP = (valor) =>
  new Intl.NumberFormat('es-CO', {
    style:                 'currency',
    currency:              'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(valor) || 0);

/* ── Helper: normalizar respuesta del servicio a array ────────────────── */

/**
 * Garantiza que el valor devuelto por el servicio sea siempre un array.
 * Maneja las variantes de respuesta: array directo, { data: [...] },
 * { productos: [...] }, { items: [...] } o cualquier objeto.
 *
 * @param {*} data - Valor devuelto por getProducts().
 * @returns {Array}
 */
const normalizeProducts = (data) => {
  if (!data)                       return [];
  if (Array.isArray(data))         return data;
  if (Array.isArray(data.data))    return data.data;
  if (Array.isArray(data.productos)) return data.productos;
  if (Array.isArray(data.items))   return data.items;
  if (typeof data === 'object')    return Object.values(data).filter((v) => v && typeof v === 'object');
  return [];
};

/* ── Componente ────────────────────────────────────────────────────────── */

/**
 * Página de gestión de productos del panel admin.
 *
 * @returns {JSX.Element}
 */
export default function AdminProductos() {
  const [productos,         setProductos]         = useState([]);
  const [filteredProductos, setFilteredProductos] = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState('');
  const [searchTerm,        setSearchTerm]        = useState('');

  const [showModal,      setShowModal]      = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteTarget,   setDeleteTarget]   = useState(null);

  const { showToast } = useToast();

  /* ── Cargar productos desde el backend ──────────────────────────────── */

  const fetchProductos = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const data = await getProducts();
      const list = normalizeProducts(data);

      setProductos(list);
      setFilteredProductos(list);

    } catch (err) {
      console.error('Error cargando productos:', err);
      setError('No se pudieron cargar los productos.');
      showToast('Error al cargar productos', 'error');
      setProductos([]);
      setFilteredProductos([]);

    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  /* ── Búsqueda en tiempo real — filtra por nombre Y categoría ───────── */

  useEffect(() => {
    const base = Array.isArray(productos) ? productos : [];

    if (!searchTerm.trim()) {
      setFilteredProductos(base);
      return;
    }

    const term = searchTerm.toLowerCase().trim();

    setFilteredProductos(
      base.filter((p) => {
        const nombre        = (p?.nombre    || '').toLowerCase();
        const categoriaName = (p?.categoria_nombre || p?.categoria || '').toLowerCase();
        // Búsqueda mejorada: nombre O categoría
        return nombre.includes(term) || categoriaName.includes(term);
      })
    );
  }, [searchTerm, productos]);

  /* ── Handlers de acciones ────────────────────────────────────────────── */

  const handleCreate = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const handleEdit = (producto) => {
    setEditingProduct(producto);
    setShowModal(true);
  };

  const handleDelete = (producto) => {
    setDeleteTarget(producto);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    const id = deleteTarget?.id ?? deleteTarget?._id;
    setDeleteTarget(null);

    try {
      await deleteProduct(id);
      showToast('Producto eliminado exitosamente', 'success');
      fetchProductos();
    } catch (err) {
      console.error('Error eliminando producto:', err);
      showToast('Error al eliminar el producto', 'error');
    }
  };

  const handleSaveSuccess = () => {
    setShowModal(false);
    fetchProductos();
  };

  /* ── Estado de carga ─────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Spinner size="large" color="#5C3A24" />
        <p className="text-cuero-dark font-sans text-sm">Cargando productos...</p>
      </div>
    );
  }

  /* ── Render principal ────────────────────────────────────────────────── */

  const safeFiltered = Array.isArray(filteredProductos) ? filteredProductos : [];

  return (
    <div className="space-y-6">

      {/* ── Encabezado ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cuero-dark">
            Gestión de Productos
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 font-sans">
            Catálogo completo de artesanías
          </p>
        </div>

        <Button onClick={handleCreate} variant="accent">
          + Crear Producto
        </Button>
      </div>

      {/* ── Buscador ──────────────────────────────────────────────── */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
          🔍
        </span>
        <input
          type="text"
          placeholder="Buscar por nombre o categoría..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm font-sans
                     border-2 border-cuero/20 rounded-xl
                     bg-white focus:outline-none focus:border-cuero
                     transition-colors duration-150 shadow-sm"
        />
      </div>

      {/* ── Error ─────────────────────────────────────────────────── */}
      {error && (
        <ErrorMessage onClose={() => setError('')}>
          {error}
        </ErrorMessage>
      )}

      {/* ── Sin resultados ────────────────────────────────────────── */}
      {safeFiltered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-cuero/10 shadow-sm">
          <p className="text-gray-400 font-sans text-sm">
            {searchTerm
              ? `Sin resultados para "${searchTerm}"`
              : 'No hay productos registrados. Crea el primero.'}
          </p>
          {!searchTerm && (
            <Button
              onClick={handleCreate}
              variant="accent"
              className="mt-4"
            >
              + Crear primer producto
            </Button>
          )}
        </div>

      ) : (

        /* ── Tabla de productos ─────────────────────────────────── */
        <div className="bg-white rounded-2xl border border-cuero/10 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="bg-cuero-dark text-white text-left">
                  <th className="px-4 py-3 font-semibold w-16">ID</th>
                  <th className="px-4 py-3 font-semibold">Nombre</th>
                  <th className="px-4 py-3 font-semibold">Precio</th>
                  <th className="px-4 py-3 font-semibold w-20 text-center">Stock</th>
                  <th className="px-4 py-3 font-semibold">Categoría</th>
                  <th className="px-4 py-3 font-semibold text-center w-40">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cuero/10">
                {safeFiltered.map((producto, index) => {
                  const id     = producto?.id ?? producto?._id;
                  const nombre = producto?.nombre ?? '—';
                  const stock  = producto?.stock ?? '—';
                  const key    = id != null ? id : `producto-${index}`;

                  return (
                    <tr
                      key={key}
                      className="hover:bg-pastel-beige/40 transition-colors duration-100"
                    >
                      {/* ID */}
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                        #{id}
                      </td>

                      {/* Nombre */}
                      <td className="px-4 py-3 font-medium text-cuero-dark max-w-[200px] truncate">
                        {nombre}
                      </td>

                      {/* Precio — formateado como COP */}
                      <td className="px-4 py-3 text-cuero font-semibold">
                        {formatCOP(producto?.precio)}
                      </td>

                      {/* Stock — color según disponibilidad */}
                      <td className="px-4 py-3 text-center">
                        <span className={`
                          inline-block px-2 py-0.5 rounded-full text-xs font-semibold
                          ${Number(stock) > 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-600'}
                        `}>
                          {stock}
                        </span>
                      </td>

                      {/* Categoría */}
                      <td className="px-4 py-3 text-gray-500">
                        {(producto?.categoria_nombre || producto?.categoria)
                          ? (
                            <span className="px-2 py-0.5 rounded-full bg-cuero/10 text-cuero text-xs font-medium">
                              {producto.categoria_nombre || producto.categoria}
                            </span>
                          )
                          : <span className="text-gray-300">—</span>
                        }
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            onClick={() => handleEdit(producto)}
                            variant="secondary"
                            className="!px-3 !py-1.5 !text-xs"
                          >
                            ✏️ Editar
                          </Button>
                          <Button
                            onClick={() => handleDelete(producto)}
                            variant="danger"
                            className="!px-3 !py-1.5 !text-xs"
                          >
                            🗑️ Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Contador de resultados ────────────────────────────────── */}
      <p className="text-right text-xs text-gray-400 font-sans">
        {safeFiltered.length} producto{safeFiltered.length !== 1 ? 's' : ''}
        {searchTerm ? ` encontrado${safeFiltered.length !== 1 ? 's' : ''}` : ' en total'}
      </p>

      {/* ── Modal formulario crear/editar ─────────────────────────── */}
      {showModal && (
        <ProductForm
          product={editingProduct}
          onClose={() => setShowModal(false)}
          onSuccess={handleSaveSuccess}
        />
      )}

      {/* ── Modal de confirmación de eliminación ───────────────────── */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Confirmar eliminación"
        message={`¿Estás seguro de eliminar "${deleteTarget?.nombre || 'este producto'}"? Esta acción no se puede deshacer.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

    </div>
  );
}