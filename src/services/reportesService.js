import api from "./api";

/* =========================
   REPORTES SERVICE
   ========================= */

export const obtenerTotalVendido = async () => {
  const { data } = await api.get("/reportes/total");
  return data;
};

export const obtenerVentasPorFecha = async () => {
  const { data } = await api.get("/reportes/por-fecha");
  return data;
};

export const obtenerTopProductos = async () => {
  const { data } = await api.get("/reportes/top-productos");
  return data;
};

export const obtenerVentasMensuales = async () => {
  const { data } = await api.get("/reportes/mensuales");
  return data;
};