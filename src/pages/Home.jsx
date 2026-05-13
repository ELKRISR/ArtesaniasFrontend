/**
 * @fileoverview Página de inicio — catálogo público de productos artesanales.
 *
 * Muestra el hero de bienvenida y la grilla de productos disponibles.
 * Es una ruta pública — no requiere autenticación.
 *
 * Bugs corregidos:
 *  1. Sin loading state → grilla vacía sin feedback durante la carga.
 *     → Se agregó estado `loading` con Spinner mientras llegan los datos.
 *  2. Sin error state → si la API falla, la página quedaba vacía sin mensaje.
 *     → Se agregó estado `error` con mensaje claro y botón de reintento.
 *  3. setProducts(data) sin guardia → crash si la API devolvía null/undefined.
 *     → Se verifica que data sea array antes de setear el estado.
 *  4. href="/register" y href="/about" causaban recarga completa de página.
 *     → Reemplazados por <Link to=""> de React Router (SPA navigation).
 *  5. Indentación rota en setProducts(data) — fuera del bloque try visualmente.
 *     → Corregida a la indentación correcta dentro del try.
 *  6. Sin estado vacío — si no hay productos, la grilla aparecía en blanco.
 *     → Se muestra un mensaje cuando el catálogo está vacío.
 *
 * @module pages/Home
 */

import { useCallback, useEffect, useState } from 'react';
import { Link }                            from 'react-router-dom';
import { getProducts, getCategorias }     from '../services/productService';
import ProductCard             from '../components/ProductCard';
import ProductFilters          from '../components/ProductFilters';
import Spinner                 from '../components/ui/Spinner';

/**
 * Página de inicio con hero y catálogo de productos.
 *
 * @returns {JSX.Element}
 */
function Home() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [, setFilters] = useState({
    search: '',
    categoria: '',
    precioMin: '',
    precioMax: '',
    ordenarPor: 'nombre'
  });

  useEffect(() => {
    document.title = 'Artesanías - Catálogo de artesanías';
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) {
      descMeta.content = 'Explora artesanías únicas hechas a mano. Filtra por categoría, precio y más.';
    }
  }, []);

  /* ── Cargar productos al montar ──────────────────────────────────────── */
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');

      const [productosData, categoriasData] = await Promise.all([
        getProducts(),
        getCategorias()
      ]);

      // Guardia defensiva: solo setear si es un array válido
      const productos = Array.isArray(productosData) ? productosData : [];
      const categoriasList = Array.isArray(categoriasData) ? categoriasData : [];

      setProducts(productos);
      setCategorias(categoriasList);
      setFilteredProducts(productos);

    } catch (err) {
      console.error('Error al obtener productos:', err);
      setError('No se pudieron cargar los productos. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  /* ── Aplicar filtros y ordenamiento ──────────────────────────────────── */
  const applyFilters = useCallback((newFilters) => {
    setFilters(newFilters);

    let filtered = [...products];

    // Filtro por búsqueda
    if (newFilters.search) {
      const searchTerm = newFilters.search.toLowerCase();
      filtered = filtered.filter(product =>
        product.nombre.toLowerCase().includes(searchTerm) ||
        product.descripcion.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro por categoría
    if (newFilters.categoria) {
      filtered = filtered.filter(product =>
        product.categoria_nombre === newFilters.categoria
      );
    }

    // Filtro por precio mínimo
    if (newFilters.precioMin) {
      const minPrice = parseFloat(newFilters.precioMin);
      filtered = filtered.filter(product => product.precio >= minPrice);
    }

    // Filtro por precio máximo
    if (newFilters.precioMax) {
      const maxPrice = parseFloat(newFilters.precioMax);
      filtered = filtered.filter(product => product.precio <= maxPrice);
    }

    // Ordenamiento
    switch (newFilters.ordenarPor) {
      case 'precio_asc':
        filtered.sort((a, b) => a.precio - b.precio);
        break;
      case 'precio_desc':
        filtered.sort((a, b) => b.precio - a.precio);
        break;
      case 'mas_reciente':
        filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        break;
      case 'nombre':
      default:
        filtered.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
    }

    setFilteredProducts(filtered);
  }, [products]);

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-20">

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="text-center py-20 bg-pastel-beige rounded-xl shadow-md">
        <h1 className="text-5xl font-serif font-bold text-cuero-dark mb-6">
          Artesanías hechas con amor
        </h1>
        <p className="text-body text-lg">
          Descubre piezas únicas hechas a mano.
        </p>
        <div className="mt-6 flex justify-center gap-3 flex-wrap">
          {/* Corrección: <Link> en vez de <a href> para evitar recarga completa */}
          <Link
            to="/register"
            className="px-4 py-2 rounded-lg bg-cuero text-white font-semibold hover:bg-cuero-dark transition"
          >
            Regístrate para tu primer pedido
          </Link>
          <Link
            to="/about"
            className="px-4 py-2 rounded-lg border border-cuero text-cuero font-semibold hover:bg-cuero/10 transition"
          >
            Conócenos
          </Link>
        </div>
      </section>

      {/* ── CATÁLOGO DE PRODUCTOS ────────────────────────────────────────── */}
      <section>
        <h2 className="subheading mb-10">Productos</h2>

        {/* Filtros */}
        {!loading && !error && products.length > 0 && (
          <ProductFilters
            onFiltersChange={applyFilters}
            categorias={categorias}
          />
        )}

        {/* Estado: cargando */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Spinner size="large" color="#8B5E3C" />
            <p className="text-cuero-dark font-sans text-sm">Cargando productos...</p>
          </div>
        )}

        {/* Estado: error de red o servidor */}
        {!loading && error && (
          <div className="text-center py-16 bg-pastel-beige rounded-xl border border-cuero/20">
            <p className="text-cuero-dark font-semibold text-lg mb-2">
              No se pudieron cargar los productos
            </p>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <button
              onClick={fetchProducts}
              className="px-4 py-2 rounded-lg bg-cuero text-white font-semibold hover:bg-cuero-dark transition text-sm"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Estado: sin productos en el catálogo */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-16 bg-pastel-beige rounded-xl border border-cuero/20">
            <p className="text-cuero-dark font-semibold text-lg mb-1">
              Aún no hay productos disponibles
            </p>
            <p className="text-sm text-gray-500">
              Vuelve pronto — estamos preparando nuevas piezas.
            </p>
          </div>
        )}

        {/* Estado: catálogo cargado con productos */}
        {!loading && !error && products.length > 0 && (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Mostrando {filteredProducts.length} de {products.length} productos
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </section>

    </div>
  );
}

export default Home;