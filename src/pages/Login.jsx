import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import api from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (loading) return;

    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const { token, usuario, csrfToken } = response.data || {};

      if (!token || !usuario || !usuario.rol) {
        throw new Error("Respuesta inválida del servidor");
      }

      if (csrfToken) {
        localStorage.setItem('csrfToken', csrfToken);
      }

      // Guardar sesión
      login(usuario, token);

      showToast("Sesión iniciada correctamente", "success");

      // Redirección inteligente: vuelve a la ruta protegida desde la que vino
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
        return;
      }

      const rolNormalizado = usuario.rol.toLowerCase();
      if (rolNormalizado === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Credenciales inválidas";

      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-md">
          <p className="text-lg font-semibold text-slate-700">Ingresando...</p>
          <p className="text-sm text-slate-500 mt-2">Estamos iniciando tu sesión.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f4ee] via-[#fff] to-[#f6f0e4] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#eddcc2] rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-[#4a2a0f] mb-2">Iniciar sesión</h2>
        <p className="text-sm text-gray-600 mb-5">Ingresa para continuar con tu panel.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-cuero text-white font-semibold hover:bg-cuero-dark disabled:opacity-60"
          >
            {loading ? "Ingresando..." : "Entrar"}
          </button>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>
      </div>
    </div>
  );
}