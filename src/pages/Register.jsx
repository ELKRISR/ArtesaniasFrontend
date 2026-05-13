import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/useToast";
import api from "../services/api";

export default function Register() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register", {
        nombre,
        email,
        password,
      });

      showToast("Registro exitoso. Inicia sesión.", "success");
      navigate("/login");
    } catch (err) {
      const message =
        err.response?.data?.error || err.message || "Error al registrarse";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f4ee] via-[#fff] to-[#f6f0e4] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#eddcc2] rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-[#4a2a0f] mb-2">Crear cuenta</h2>
        <p className="text-sm text-gray-600 mb-5">Regístrate para hacer pedidos y seguir tus compras.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className="w-full border border-[#ddd] rounded-lg px-3 py-2 focus:border-cuero focus:ring-2 focus:ring-cuero/20"
          />
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-[#ddd] rounded-lg px-3 py-2 focus:border-cuero focus:ring-2 focus:ring-cuero/20"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-[#ddd] rounded-lg px-3 py-2 focus:border-cuero focus:ring-2 focus:ring-cuero/20"
          />
          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full border border-[#ddd] rounded-lg px-3 py-2 focus:border-cuero focus:ring-2 focus:ring-cuero/20"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-cuero text-white font-semibold hover:bg-cuero-dark disabled:opacity-60"
          >
            {loading ? "Registrando..." : "Registrarme"}
          </button>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>
      </div>
    </div>
  );
}
