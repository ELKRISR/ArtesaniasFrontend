// ============================================================
//  MainLayout.jsx — Layout principal de la app
//
//  Envuelve todas las páginas públicas y privadas del cliente.
//  Incluye: Navbar (con lógica de sesión) + contenido + footer
//
//  📝 No necesita lógica de auth aquí — toda vive en Navbar.jsx
//     Este archivo queda limpio y enfocado solo en estructura
// ============================================================

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import analyticsService from "../services/analyticsService";

function MainLayout({ children }) {
  const location = useLocation();

  useEffect(() => {
    analyticsService.pageView(location.pathname, document.title);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8ED] via-[#FDF1E1] to-[#F7E6CF] flex flex-col">

      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="bg-cuero text-white text-center py-6 mt-12 font-sans">
        © {new Date().getFullYear()} Artesanías - Cada pieza cuenta una historia
      </footer>
    </div>
  );
}

export default MainLayout;