/**
 * @fileoverview Servicio de pedidos con llamadas seguras a la API
 * 
 * 🔒 SEGURIDAD: Protegido contra SSRF
 *  - Usa buildUrl() para construir URLs seguras
 *  - Valida IDs antes de usarlos en rutas
 *  - Previene inyección de URLs absolutas maliciosas
 * 
 * @module services/pedidoService
 */

import api, { buildUrl, validateId } from "./api";

/* =========================
   LISTAR PEDIDOS (solo admin)
   ========================= */
export const listarPedidosAdmin = async () => {
  const { data } = await api.get("/pedidos");
  return data?.data || data;
};

/* =========================
   CAMBIAR ESTADO DEL PEDIDO (solo admin)
   🔒 Validación SSRF: El ID se valida antes de usarse en la URL
   ========================= */
export const cambiarEstadoPedido = async (id, estado) => {
  // 🔒 Validar ID
  const validatedId = validateId(id, "ID de pedido");
  
  // 🔒 Construir URL segura
  const url = buildUrl("/pedidos/:id/estado", { id: validatedId });
  
  const { data } = await api.patch(url, { estado });
  return data;
};

/* =========================
   LISTAR MIS PEDIDOS (usuario autenticado)
   ========================= */
export const listarPedidosUsuario = async () => {
  const { data } = await api.get("/pedidos/mis-pedidos");
  return data?.data || data;
};

/* =========================
   OBTENER PEDIDO POR ID
   🔒 Validación SSRF: El ID se valida antes de usarse en la URL
   ========================= */
export const obtenerPedidoPorId = async (id) => {
  const validatedId = validateId(id, "ID de pedido");
  const url = buildUrl("/pedidos/:id", { id: validatedId });
  
  const { data } = await api.get(url);
  return data;
};

export const crearBoldCheckoutSession = async (payload) => {
  const { data } = await api.post("/pedidos/bold-session", payload);
  return data?.data || data;
};

/* =========================
   PAGAR PEDIDO
   🔒 Validación SSRF: El ID se valida antes de usarse en la URL
   ========================= */
export const pagarPedido = async (id) => {
  const validatedId = validateId(id, "ID de pedido");
  const url = buildUrl("/pedidos/:id/pagar", { id: validatedId });
  
  const { data } = await api.post(url);
  return data;
};

/* =========================
   DESCARGAR FACTURA (PDF)
   🔒 Validación SSRF: El ID se valida antes de usarse en la URL
   ========================= */
export const descargarFactura = async (id) => {
  const validatedId = validateId(id, "ID de pedido");
  const url = buildUrl("/pedidos/:id/factura", { id: validatedId });
  
  const response = await api.get(url, {
    responseType: "blob",
  });
  
  return response.data;
};

/* =========================
   OBTENER HISTORIAL DEL PEDIDO
   🔒 Validación SSRF: El ID se valida antes de usarse en la URL
   ========================= */
export const obtenerHistorialPedido = async (id) => {
  const validatedId = validateId(id, "ID de pedido");
  const url = buildUrl("/pedidos/:id/historial", { id: validatedId });
  
  const { data } = await api.get(url);
  return data;
};