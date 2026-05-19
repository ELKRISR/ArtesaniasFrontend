// ============================================================
//  Navbar.jsx — Barra de navegación con UI dinámica
//  ✔ Redirección al cerrar sesión
//  ✔ Muestra nombre del usuario
//  ✔ "Mis pedidos" solo para clientes
// ============================================================

import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";

// 🛒 Contexto del carrito
import { CartContext } from "../context/CartContext";

// 🔐 Hook de autenticación
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import logo from "../images/logo.jpeg";

function Navbar() {
  // ── Carrito ───────────────────────────────────────────────
  const { cartItems } = useContext(CartContext);
  const totalItems = cartItems.reduce(
    (acc, item) => acc + item.cantidad,
    0
  );

  // ── Auth ──────────────────────────────────────────────────
  const { user, isAdmin, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showToast("Sesión cerrada", "success");
    navigate("/"); // ✅ Redirige al inicio después de cerrar sesión
  };

  return (
    <nav className="bg-cuero text-white px-6 py-4 flex justify-between items-center shadow-md">
      
     {/* ── Logo ─────────────────────────────────────────── */}
<Link
  to="/"
  className="flex items-center gap-3 hover:text-pastel.beige transition"
>
  <img
    src={logo}
    alt="Artesanías Katerine"
    className="h-12 w-12 rounded-full object-cover"
  />

  <span className="font-serif text-2xl font-bold tracking-wide">
    Artesanías Katerine
  </span>
</Link>

      {/* ── Links ─────────────────────────────────────────── */}
      <div className="flex gap-6 items-center font-sans">

        {/* Siempre visibles */}
        <Link to="/" className="hover:text-pastel.beige transition">
          Inicio
        </Link>

        <Link to="/about" className="hover:text-pastel.beige transition">
          Sobre Nosotros
        </Link>

        <Link to="/contact" className="hover:text-pastel.beige transition">
          Contacto
        </Link>

        <Link
          to="/carrito"
          className="relative hover:text-pastel.beige transition"
        >
          🛒 Carrito ({totalItems})
        </Link>

        {user && !isAdmin && (
          <Link to="/wishlist" className="hover:text-pastel.beige transition">
            Wishlist
          </Link>
        )}

        {user && (
          <Link to="/perfil" className="hover:text-pastel.beige transition">
            Perfil
          </Link>
        )}

        {/* 🔐 Panel Admin (solo admin) */}
        {isAdmin && (
          <Link
            to="/admin/dashboard"
            className="bg-white text-cuero px-3 py-1 rounded font-bold hover:bg-pastel.beige transition text-sm"
          >
            🔐 Panel Admin
          </Link>
        )}

        {/* 👤 Usuario logueado */}
        {user && (
          <>
            {/* ✅ Mis pedidos SOLO si NO es admin */}
            {!isAdmin && (
              <Link
                to="/mis-pedidos"
                className="hover:text-pastel.beige transition"
              >
                Mis pedidos
              </Link>
            )}

            {/* Mostrar nombre en vez de email */}
            <span className="text-sm opacity-75 hidden md:block">
              {user.nombre}
            </span>

            <button
              onClick={handleLogout}
              className="border border-white px-3 py-1 rounded hover:bg-white hover:text-cuero transition text-sm"
            >
              Cerrar sesión
            </button>
          </>
        )}

        {/* 🚪 Sin sesión */}
        {!user && (
          <>
            <Link
              to="/register"
              className="border border-white px-3 py-1 rounded hover:bg-white hover:text-cuero transition text-sm"
            >
              Registrarse
            </Link>
            <Link
              to="/login"
              className="border border-white px-3 py-1 rounded hover:bg-white hover:text-cuero transition text-sm"
            >
              Iniciar sesión
            </Link>
          </>
        )}

      </div>
    </nav>
  );
}

export default Navbar;