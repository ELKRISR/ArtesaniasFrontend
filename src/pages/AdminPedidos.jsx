import { useEffect, useState } from "react";
import { listarPedidosAdmin, cambiarEstadoPedido } from "../services/pedidoService";
import { useToast } from "../hooks/useToast";
import Spinner from "../components/ui/Spinner";
import Button from "../components/ui/Button";

const estadosDisponibles = ["pendiente", "pagado", "enviado", "cancelado"];

const transicionesPermitidas = {
  pendiente: ["pagado", "cancelado"],
  pagado: ["enviado", "cancelado"],
  enviado: [],
  cancelado: []
};

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        setLoading(true);
        const data = await listarPedidosAdmin();
        setPedidos(Array.isArray(data) ? data : (data || []));
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los pedidos");
      } finally {
        setLoading(false);
      }
    };
    fetchPedidos();
  }, []);

  const handleEstado = async (pedidoId, nuevoEstado) => {
    setUpdatingId(pedidoId);
    try {
      await cambiarEstadoPedido(pedidoId, nuevoEstado);
      setPedidos((prev) =>
        prev.map((p) => (p.id === pedidoId ? { ...p, estado: nuevoEstado } : p))
      );
      showToast("Estado actualizado", "success");
    } catch (err) {
      console.error(err);
      showToast("No se pudo actualizar el estado", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center"><Spinner /></div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-cuero-dark">Pedidos</h1>
        <p className="text-sm text-gray-600">Gestión de estados (admin)</p>
      </div>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#8b5e3c] text-white">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Usuario</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Acción</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((pedido, index) => (
              <tr key={`${pedido.id ?? "pedido"}-${index}`} className="border-t border-slate-200">
                <td className="px-3 py-2">{pedido.id}</td>
                <td className="px-3 py-2">{pedido.usuario_id}</td>
                <td className="px-3 py-2">${Number(pedido.total || 0).toFixed(2)}</td>
                <td className="px-3 py-2 font-semibold">{pedido.estado}</td>
                <td className="px-3 py-2">{new Date(pedido.fecha).toLocaleString()}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    {estadosDisponibles.map((estado) => {
                      const estadosPermitidos = transicionesPermitidas[pedido.estado] || [];
                      const estaPermitido = estadosPermitidos.includes(estado);

                      return (
                        <Button
                          key={estado}
                          variant={estado === "cancelado" ? "danger" : "secondary"}
                          loading={updatingId === pedido.id && pedido.estado !== estado}
                          disabled={
                            pedido.estado === estado ||
                            updatingId === pedido.id ||
                            !estaPermitido
                          }
                          onClick={() => handleEstado(pedido.id, estado)}
                          className="!px-2 !py-1 !text-xs"
                        >
                          {estado}
                        </Button>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
