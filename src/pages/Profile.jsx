import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Profile = () => {
  const { user } = useAuth();

  useEffect(() => {
    document.title = 'Perfil | Artesanías';
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) {
      descMeta.content = 'Administra tu perfil de usuario y accede rápidamente a tus pedidos y wishlist.';
    }
  }, []);

  if (!user) {
    return (
      <div className="text-center py-24">
        <p className="text-cuero-dark font-semibold">No se encontró información del perfil.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-cuero-dark">Perfil de usuario</h1>
        <p className="text-sm text-gray-600 mt-2">
          Aquí puedes consultar los datos de tu cuenta y acceder a tus pedidos.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-cuero/10 shadow-sm p-8 max-w-3xl">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">Nombre</p>
            <p className="text-lg font-semibold text-cuero-dark">{user.nombre}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">Email</p>
            <p className="text-lg font-semibold text-cuero-dark">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">Rol</p>
            <p className="text-lg font-semibold text-cuero-dark">{user.rol}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">ID de usuario</p>
            <p className="text-lg font-semibold text-cuero-dark">{user.id}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            to="/mis-pedidos"
            className="btn-primary inline-flex items-center justify-center"
          >
            Ver mis pedidos
          </Link>
          <Link
            to="/wishlist"
            className="btn-secondary inline-flex items-center justify-center"
          >
            Ver wishlist
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Profile;
