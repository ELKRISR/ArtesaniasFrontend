// ============================================================
//  productService.js — Servicio completo de productos
//
//  🔒 SEGURIDAD: Protegido contra SSRF
//  - Usa buildUrl() para construir URLs seguras
//  - Valida IDs antes de usarlos en rutas
//  - Previene inyección de URLs absolutas maliciosas
//
//  📦 Endpoints:
//  GET    /productos           → Listar todos
//  GET    /productos/:id       → Obtener uno
//  POST   /productos           → Crear
//  PUT    /productos/:id       → Actualizar
//  DELETE /productos/:id       → Eliminar
// ============================================================

import api, { buildUrl, validateId } from "./api";

/* =========================
   LISTAR PRODUCTOS (público)
   ========================= */
export const getProducts = async () => {
  const { data } = await api.get("/productos");

  // Normalizar respuesta backend estándar { success, data }
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;

  return [];
};

/* =========================
   OBTENER CATEGORÍAS (público)
   ========================= */
export const getCategorias = async () => {
  const { data } = await api.get("/productos/categorias");

  // Normalizar respuesta backend estándar { success, data }
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;

  return [];
};

/* =========================
   OBTENER UN PRODUCTO (público)
   🔒 Validación SSRF: El ID se valida antes de usarse en la URL
   ========================= */
export const getProductById = async (id) => {
  // 🔒 Validar que el ID sea un número válido (previene SSRF)
  const validatedId = validateId(id, "ID de producto");
  
  // 🔒 Usar buildUrl para construir URL segura
  const url = buildUrl("/productos/:id", { id: validatedId });
  
  const { data } = await api.get(url);
  return data;
};

/* =========================
   CREAR PRODUCTO (solo admin)
   Los datos del body se envían como JSON - no requieren sanitización especial
   ========================= */
export const createProduct = async (productData) => {
  const { data } = await api.post("/productos", productData);
  return data;
};

/* =========================
   ACTUALIZAR PRODUCTO (solo admin)
   🔒 Validación SSRF: El ID se valida antes de usarse en la URL
   ========================= */
export const updateProduct = async (id, productData) => {
  // 🔒 Validar ID
  const validatedId = validateId(id, "ID de producto");
  
  // 🔒 Construir URL segura
  const url = buildUrl("/productos/:id", { id: validatedId });
  
  const { data } = await api.put(url, productData);
  return data;
};

/* =========================
   ELIMINAR PRODUCTO (solo admin)
   🔒 Validación SSRF: El ID se valida antes de usarse en la URL
   ========================= */
export const deleteProduct = async (id) => {
  // 🔒 Validar ID
  const validatedId = validateId(id, "ID de producto");
  
  // 🔒 Construir URL segura
  const url = buildUrl("/productos/:id", { id: validatedId });
  
  const { data } = await api.delete(url);
  return data;
};