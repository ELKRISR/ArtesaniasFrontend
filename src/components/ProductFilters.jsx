/**
 * ==============================
 * COMPONENTE DE FILTROS
 * ==============================
 * Filtros para productos: precio, categoría, búsqueda
 */

import { useState, useEffect } from 'react';

const ProductFilters = ({ onFiltersChange, categorias = [] }) => {
  const [filters, setFilters] = useState({
    search: '',
    categoria: '',
    precioMin: '',
    precioMax: '',
    ordenarPor: 'nombre'
  });

  // Aplicar filtros cuando cambian
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handleInputChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      categoria: '',
      precioMin: '',
      precioMax: '',
      ordenarPor: 'nombre'
    });
  };

  const hasActiveFilters = filters.search || filters.categoria ||
                          filters.precioMin || filters.precioMax ||
                          filters.ordenarPor !== 'nombre';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-cuero/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-cuero-dark">Filtros de búsqueda</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-cuero hover:text-cuero-dark underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Búsqueda por texto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar producto
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleInputChange('search', e.target.value)}
            placeholder="Nombre o descripción..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cuero focus:border-transparent"
          />
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoría
          </label>
          <select
            value={filters.categoria}
            onChange={(e) => handleInputChange('categoria', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cuero focus:border-transparent"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((cat) => (
              <option key={cat.nombre} value={cat.nombre}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Precio mínimo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Precio mínimo
          </label>
          <input
            type="number"
            value={filters.precioMin}
            onChange={(e) => handleInputChange('precioMin', e.target.value)}
            placeholder="0"
            min="0"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cuero focus:border-transparent"
          />
        </div>

        {/* Precio máximo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Precio máximo
          </label>
          <input
            type="number"
            value={filters.precioMax}
            onChange={(e) => handleInputChange('precioMax', e.target.value)}
            placeholder="Sin límite"
            min="0"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cuero focus:border-transparent"
          />
        </div>

      </div>

      {/* Ordenar por */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ordenar por
        </label>
        <select
          value={filters.ordenarPor}
          onChange={(e) => handleInputChange('ordenarPor', e.target.value)}
          className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cuero focus:border-transparent"
        >
          <option value="nombre">Nombre (A-Z)</option>
          <option value="precio_asc">Precio (menor a mayor)</option>
          <option value="precio_desc">Precio (mayor a menor)</option>
          <option value="mas_reciente">Más reciente</option>
        </select>
      </div>
    </div>
  );
};

export default ProductFilters;