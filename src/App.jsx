// ============================================================
//  App.jsx — Router principal profesional
//  Sistema:
//    🔓 Público
//    🔒 Privado (login requerido)
//    🔐 Admin (login + rol admin)
// ============================================================

// ============================================================
//  App.jsx — Router principal profesional
// ============================================================

import { Routes, Route } from "react-router-dom";

// ── Layouts ────────────────────────────────────────────────
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";

// ── Páginas Públicas ───────────────────────────────────────
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";import Register from "./pages/Register";
// ── Páginas Privadas ───────────────────────────────────────
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import BoldPayment from "./pages/BoldPayment";
import Success from "./pages/Success";
import MisPedidos from "./pages/MisPedidos";

// ── Páginas Admin ──────────────────────────────────────────
import AdminDashboard from "./pages/AdminDashboard";
import AdminProductos from "./pages/AdminProductos";
import AdminPedidos from "./pages/AdminPedidos";
import AdminContactos from "./pages/AdminContactos";
import Wishlist from "./pages/Wishlist";
import Profile from "./pages/Profile";

// ── NUEVO GUARD ────────────────────────────────────────────
import ProtectedRoute from "./routes/ProtectedRoute";

// ── Unauthorized ───────────────────────────────────────────
import Unauthorized from "./pages/Unauthorized";

function App() {
  return (
    <Routes>

      {/* =====================================================
            🔓 RUTAS PÚBLICAS
         ===================================================== */}

      <Route path="/" element={<MainLayout><Home /></MainLayout>} />
      <Route path="/producto/:id" element={<MainLayout><ProductDetail /></MainLayout>} />
      <Route path="/about" element={<MainLayout><About /></MainLayout>} />
      <Route path="/contact" element={<MainLayout><Contact /></MainLayout>} />
      <Route path="/login" element={<MainLayout><Login /></MainLayout>} />
      <Route path="/register" element={<MainLayout><Register /></MainLayout>} />


      {/* =====================================================
            🔒 RUTAS PRIVADAS
         ===================================================== */}

      <Route
        path="/carrito"
        element={
          <ProtectedRoute>
            <MainLayout><Cart /></MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <MainLayout><Checkout /></MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/bold-payment/:referenceId"
        element={
          <ProtectedRoute>
            <MainLayout><BoldPayment /></MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/success/:id"
        element={
          <ProtectedRoute>
            <MainLayout><Success /></MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/wishlist"
        element={
          <ProtectedRoute>
            <MainLayout><Wishlist /></MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <MainLayout><Profile /></MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/mis-pedidos"
        element={
          <ProtectedRoute>
            <MainLayout><MisPedidos /></MainLayout>
          </ProtectedRoute>
        }
      />


      {/* =====================================================
            🔐 RUTAS ADMIN
         ===================================================== */}

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="productos" element={<AdminProductos />} />
        <Route path="pedidos" element={<AdminPedidos />} />
        <Route path="contactos" element={<AdminContactos />} />
      </Route>


      {/* =====================================================
            🚫 UNAUTHORIZED
         ===================================================== */}

      <Route
        path="/unauthorized"
        element={
          <MainLayout>
            <Unauthorized />
          </MainLayout>
        }
      />


      {/* =====================================================
            ❌ 404
         ===================================================== */}

      <Route
        path="*"
        element={
          <MainLayout>
            <div className="text-center py-32">
              <h1 className="text-4xl font-bold mb-4 text-cuero-dark">
                404
              </h1>
              <p className="mb-6">Página no encontrada</p>
            </div>
          </MainLayout>
        }
      />

    </Routes>
  );
}

export default App;