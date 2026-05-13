/**
 * ==============================
 * COMPONENTE DE RESEÑAS
 * ==============================
 * Muestra y permite crear reseñas de productos
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import api from '../services/api';
import Spinner from './ui/Spinner';

const ProductReviews = ({ productoId }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    calificacion: 5,
    comentario: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Cargar reseñas
  useEffect(() => {
    cargarReviews();
  }, [productoId]);

  const cargarReviews = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reviews/producto/${productoId}`);
      setReviews(response.data.data.reviews);
      setEstadisticas(response.data.data.estadisticas);
    } catch (error) {
      console.error('Error cargando reseñas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      showToast('Debes iniciar sesión para dejar una reseña', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/reviews', {
        productoId,
        ...formData
      });

      showToast('Reseña enviada exitosamente', 'success');
      setShowForm(false);
      setFormData({ calificacion: 5, comentario: '' });
      cargarReviews(); // Recargar reseñas
    } catch (error) {
      console.error('Error enviando reseña:', error);
      showToast('Error al enviar la reseña', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating, interactive = false, onChange = null) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? 'button' : 'span'}
            className={`text-lg ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
            onClick={interactive ? () => onChange && onChange(star) : undefined}
            disabled={!interactive}
          >
            {star <= rating ? '⭐' : '☆'}
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="small" />
      </div>
    );
  }

  return (
    <div className="mt-8 border-t pt-8">
      <h3 className="text-2xl font-bold text-cuero-dark mb-6">Reseñas de Clientes</h3>

      {/* Estadísticas */}
      {estadisticas && estadisticas.total > 0 && (
        <div className="bg-pastel-beige rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-3xl font-bold text-cuero-dark">
              {estadisticas.promedio}
            </div>
            <div>
              {renderStars(Math.round(estadisticas.promedio))}
              <div className="text-sm text-gray-600">
                {estadisticas.total} reseña{estadisticas.total !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Distribución de estrellas */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-3">{star}</span>
                <span>⭐</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-cuero h-2 rounded-full"
                    style={{
                      width: `${estadisticas.total > 0 ? (estadisticas.distribucion[star] / estadisticas.total) * 100 : 0}%`
                    }}
                  />
                </div>
                <span className="w-8 text-right">{estadisticas.distribucion[star]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botón para dejar reseña */}
      {user && (
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-cuero text-white rounded-lg hover:bg-cuero-dark transition"
          >
            {showForm ? 'Cancelar' : 'Dejar una reseña'}
          </button>
        </div>
      )}

      {/* Formulario de reseña */}
      {showForm && user && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Calificación
            </label>
            {renderStars(formData.calificacion, true, (rating) =>
              setFormData({ ...formData, calificacion: rating })
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentario (opcional)
            </label>
            <textarea
              value={formData.comentario}
              onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cuero focus:border-transparent"
              rows={4}
              placeholder="Comparte tu experiencia con este producto..."
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-cuero text-white rounded-lg hover:bg-cuero-dark transition disabled:opacity-50"
          >
            {submitting ? 'Enviando...' : 'Enviar Reseña'}
          </button>
        </form>
      )}

      {/* Lista de reseñas */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Este producto aún no tiene reseñas.</p>
            {user && <p>¡Sé el primero en dejar tu opinión!</p>}
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-cuero-dark">
                      {review.usuario_nombre}
                    </span>
                    {review.verificado_compra && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Compra verificada
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    {renderStars(review.calificacion)}
                    <span className="text-sm text-gray-500">
                      {new Date(review.creado_en).toLocaleDateString('es-CO')}
                    </span>
                  </div>

                  {review.comentario && (
                    <p className="text-gray-700 leading-relaxed">
                      {review.comentario}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductReviews;