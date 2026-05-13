import { useEffect, useState } from "react";
import { listarMensajesContacto } from "../services/contactService";
import Spinner from "../components/ui/Spinner";

export default function AdminContactos() {
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMensajes = async () => {
      try {
        setLoading(true);
        const data = await listarMensajesContacto();
        setMensajes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los mensajes");
      } finally {
        setLoading(false);
      }
    };
    fetchMensajes();
  }, []);

  if (loading) {
    return <div className="py-20 flex justify-center"><Spinner /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="mb-5">
        <h1 className="text-3xl font-bold text-cuero-dark">Mensajes de contacto</h1>
        <p className="text-sm text-gray-600">Revisa y gestiona los mensajes que llegan desde el formulario de contacto.</p>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {mensajes.length === 0 ? (
        <div className="bg-white p-4 rounded-lg border">Aún no hay mensajes.</div>
      ) : (
        <div className="space-y-3">
          {mensajes.map((m) => (
            <div key={m.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{m.nombre}</p>
                  <p className="text-xs text-gray-500">{m.email}</p>
                </div>
                <span className="text-xs text-gray-500">{new Date(m.creado_en).toLocaleString()}</span>
              </div>
              <p className="mt-2 text-gray-700">{m.mensaje}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
