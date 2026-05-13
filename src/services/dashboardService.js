import api from "./api";

/* =========================
   DASHBOARD SERVICE
   ========================= */

export const obtenerMetricas = async () => {
  const [productosRes, pedidosRes] = await Promise.all([
    api.get("/productos"),
    api.get("/pedidos"),
  ]);

  const productos = productosRes.data?.data || productosRes.data || [];
  const pedidos = pedidosRes.data?.data || pedidosRes.data || [];

  const totalProductos = productos.length;
  const totalPedidos = pedidos.length;

  const pedidosPendientes = pedidos.filter(
    (p) => p.estado === "pendiente"
  ).length;

  const ingresosTotales = pedidos
    .filter((p) => p.estado === "pagado" || p.estado === "enviado")
    .reduce((acc, p) => acc + Number(p.total || 0), 0);

  return {
    totalProductos,
    totalPedidos,
    pedidosPendientes,
    ingresosTotales,
  };
};