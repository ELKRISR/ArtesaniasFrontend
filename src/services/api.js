/**
 * @fileoverview Instancia global de Axios con interceptores de seguridad.
 *
 * Esta capa centraliza todo el tráfico HTTP entre el frontend y la API.
 * Cualquier componente o servicio que importe `api` hereda automáticamente:
 *
 *  1. El baseURL correcto según el entorno (.env / fallback localhost).
 *  2. `withCredentials: true` — necesario para que el navegador envíe y
 *     reciba la cookie httpOnly del refresh token en cada petición.
 *  3. Token JWT en el header Authorization de cada request.
 *  4. Renovación automática del access token al recibir 401 (token expirado),
 *     con cola de peticiones pendientes para no perder ninguna durante el refresh.
 *  5. Indicador global de carga (evento `globalLoading`) sincronizado con
 *     el número real de peticiones en vuelo.
 *  6. Notificación global de errores (evento `globalError`) recogida por
 *     ToastContext para mostrar mensajes al usuario.
 *
 * ─── Bugs corregidos en esta versión ──────────────────────────────────────
 *
 *  BUG 1 — Bucle infinito al expirar el refresh token:
 *   La versión anterior intentaba renovar el token ante CUALQUIER 401,
 *   incluidas las propias requests a /auth/refresh y /auth/login.
 *   Si /auth/refresh respondía con 401 (refresh expirado), el interceptor
 *   volvía a intentar refrescar → nueva 401 → nuevo intento → bucle infinito.
 *   FIX: las rutas /auth/* quedan excluidas del mecanismo de auto-refresh.
 *
 *  BUG 2 — Toast de error innecesario al expirar sesión:
 *   Cuando el refresh fallaba y se redirigía a /login, el flujo caía
 *   al bloque de globalError y mostraba un toast de "error en la petición"
 *   antes de la redirección, confundiendo al usuario.
 *   FIX: `return Promise.reject(err)` en el catch del refresh para que
 *   el interceptor salga antes de llegar al bloque de globalError.
 *
 *  BUG 3 — Error de red tratado igual que error de servidor:
 *   Timeouts y cortes de internet llegaban con `error.message` genérico
 *   de Axios ("timeout of 10000ms exceeded"), que no es legible para el usuario.
 *   FIX: detección de `error.code === 'ECONNABORTED'` y errores sin
 *   `error.response` (sin internet) con mensajes humanizados en español.
 *
 *  🔒 NUEVO — Protección SSRF (Server-Side Request Forgery):
 *   Se valida que ningún parámetro de ruta contenga URLs absolutas maliciosas
 *   (http://, https://, //, etc.) que podrían redirigir a servidores externos.
 *   Se sanitizan los parámetros con encodeURIComponent antes de ser usados.
 *
 * @module services/api
 */

import axios from 'axios';

/* ── Instancia principal ────────────────────────────────────────────────── */

/**
 * Instancia de Axios configurada para la API de Artesanías.
 *
 * - `baseURL`: leída de VITE_API_URL en .env; fallback a localhost para desarrollo.
 * - `timeout`: 10 segundos. Peticiones que superen este tiempo se cancelan.
 * - `withCredentials`: true — permite enviar/recibir cookies cross-origin
 *   (necesario para la cookie httpOnly del refresh token).
 */
const rawApiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');
const apiUrl = rawApiUrl.replace(/\/+$/, '');
const normalizedApiUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;

const api = axios.create({
  baseURL:         normalizedApiUrl,
  timeout:         10_000,
  withCredentials: true,
  // 🔒 Seguridad: No seguir redirecciones automáticas
  maxRedirects: 0,
});

const fetchCsrfToken = async () => {
  try {
    const response = await api.get('/auth/csrf-token');
    const csrfToken = response.data?.csrfToken;
    if (csrfToken) {
      localStorage.setItem('csrfToken', csrfToken);
    }
    return csrfToken;
  } catch (error) {
    console.warn('[CSRF] No se pudo obtener token CSRF:', error.message);
    return null;
  }
};

/* ============================================================
   🔒 PROTECCIÓN SSRF - Validación de parámetros
   ============================================================ */

/**
 * Patrones de URLs absolutas maliciosas que podrían causar SSRF
 */
const SSRF_PATTERNS = [
  /^https?:\/\//i,           // http:// o https://
  /^\/\//,                    // // (protocol-relative URL)
  /^[a-zA-Z]+:\/\//,         // otros protocolos (ftp://, file://, etc.)
  /^\\\\/,                    // Windows UNC paths
  /^\.\.\//,                  // Path traversal
];

/**
 * Valida que un parámetro no sea una URL absoluta maliciosa
 * Previene ataques SSRF donde el usuario intenta redirigir a un servidor externo
 * 
 * @param {string} param - Parámetro a validar
 * @param {string} paramName - Nombre del parámetro (para logs)
 * @throws {Error} Si el parámetro parece una URL absoluta
 */
const validatePathParam = (param, paramName = 'param') => {
  if (!param || typeof param !== 'string') return;
  
  for (const pattern of SSRF_PATTERNS) {
    if (pattern.test(param)) {
      console.warn(`[SSRF Prevention] Intento de SSRF detectado en parámetro '${paramName}': ${param.substring(0, 100)}`);
      throw new Error(`Parámetro inválido: ${paramName}`);
    }
  }
};

/**
 * Sanitiza y codifica un parámetro para uso en URL
 * 
 * @param {string} param - Parámetro a sanitizar
 * @returns {string} Parámetro sanitizado
 */
const sanitizeParam = (param) => {
  if (!param) return '';
  validatePathParam(param);
  return encodeURIComponent(String(param));
};

/* ── Contador de peticiones activas ────────────────────────────────────── */

/**
 * Número de peticiones HTTP actualmente en vuelo.
 * Se incrementa en el interceptor de request y se decrementa en el de response.
 * Cuando llega a 0 se emite `globalLoading: false` para ocultar el spinner global.
 * @type {number}
 */
let activeRequestCount = 0;

/**
 * Emite el evento personalizado `globalLoading` en window.
 * LoadingContext.jsx escucha este evento para mostrar/ocultar el overlay de carga.
 *
 * @param {boolean} loading - true para mostrar el spinner, false para ocultarlo.
 */
const notifyLoading = (loading) => {
  window.dispatchEvent(
    new CustomEvent('globalLoading', { detail: { loading } })
  );
};

/* ── URLs que NO deben disparar el refresh automático ──────────────────── */

/**
 * Segmentos de URL que quedan excluidos del mecanismo de auto-refresh.
 *
 * Si una petición a /auth/refresh o /auth/login recibe un 401,
 * NO intentamos refrescar de nuevo — eso causaría un bucle infinito.
 * El interceptor simplemente deja pasar el error para que cada
 * componente lo maneje directamente (Login.jsx, AuthProvider.jsx).
 *
 * @param {string} url - URL relativa de la petición (ej: "/auth/refresh").
 * @returns {boolean} true si la URL debe saltarse el auto-refresh.
 */
const esRutaDeAuth = (url = '') => url.includes('/auth/');

/* ══════════════════════════════════════════════════════════════════════════
   INTERCEPTOR DE REQUEST
   Adjunta el token JWT a cada petición y activa el indicador de carga.
   🔒 NUEVO: También valida que la URL no sea absoluta (SSRF prevention)
══════════════════════════════════════════════════════════════════════════ */

api.interceptors.request.use(
  (config) => {
    /* ── 🔒 SSRF Prevention: Validar que la URL no sea absoluta ──────── */
    if (config.url && typeof config.url === 'string') {
      // Detectar URLs absolutas maliciosas
      for (const pattern of SSRF_PATTERNS) {
        if (pattern.test(config.url)) {
          console.error('[SSRF Prevention] Intento de usar URL absoluta:', config.url);
          return Promise.reject(new Error('URL de petición inválida'));
        }
      }
    }

    /* ── Activar indicador de carga ──────────────────────────────────── */
    activeRequestCount += 1;
    notifyLoading(true);

    /* ── Adjuntar access token desde localStorage ────────────────────── */
    // El access token se guarda en localStorage por Login.jsx y AuthProvider.jsx.
    // El refresh token vive en una cookie httpOnly (no accesible desde JS).
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    /* ── Adjuntar token CSRF para endpoints de cookie-based auth ─────── */
    if (config.url?.includes('/auth/refresh') || config.url?.includes('/auth/logout')) {
      const csrfToken = localStorage.getItem('csrfToken');
      if (csrfToken) {
        config.headers['x-csrf-token'] = csrfToken;
      }
    }

    return config;
  },
  (error) => {
    /* ── Error antes de enviar la petición (configuración inválida) ──── */
    activeRequestCount = Math.max(0, activeRequestCount - 1);
    if (activeRequestCount === 0) notifyLoading(false);
    return Promise.reject(error);
  }
);

/* ══════════════════════════════════════════════════════════════════════════
   INTERCEPTOR DE RESPONSE
   Maneja errores 401 con refresh automático y emite errores globales.
══════════════════════════════════════════════════════════════════════════ */

/**
 * Indica si ya hay un refresh de token en curso.
 * Evita lanzar múltiples peticiones de refresh simultáneas.
 * @type {boolean}
 */
let isRefreshing = false;

/**
 * Cola de peticiones que fallaron con 401 mientras se estaba refrescando.
 * Cuando el refresh termina, se procesan todas de golpe con el nuevo token.
 * @type {Array<{resolve: Function, reject: Function}>}
 */
let failedQueue = [];

/**
 * Resuelve o rechaza todas las peticiones en cola tras un intento de refresh.
 *
 * @param {Error|null} error - null si el refresh fue exitoso, el error si falló.
 * @param {string|null} token - El nuevo access token si fue exitoso.
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  /* ── Respuesta exitosa ───────────────────────────────────────────────── */
  (response) => {
    activeRequestCount = Math.max(0, activeRequestCount - 1);
    if (activeRequestCount === 0) notifyLoading(false);
    return response;
  },

  /* ── Respuesta con error ─────────────────────────────────────────────── */
  async (error) => {
    activeRequestCount = Math.max(0, activeRequestCount - 1);
    if (activeRequestCount === 0) notifyLoading(false);

    const originalRequest = error.config;

    /* ── Manejo de 401 con auto-refresh ──────────────────────────────────
       Condiciones para intentar el refresh:
        ✅ El servidor respondió con 401 (token expirado / inválido).
        ✅ La petición no ha sido reintentada ya (_retry no está marcado).
        ✅ La URL no es una ruta de auth (evita bucle infinito).
            Si /auth/refresh devuelve 401 → la sesión expiró completamente
            → redirigir a login, sin intentar refrescar el refresh.
    ─────────────────────────────────────────────────────────────────────── */
    const es401        = error.response?.status === 401;
    const noReintento  = !originalRequest?._retry;
    const noEsAuth     = !esRutaDeAuth(originalRequest?.url);

    const isCsrfError = error.response?.status === 403 &&
      (error.response?.data?.code === 'EBADCSRFTOKEN' ||
        /csrf/i.test(error.response?.data?.message || ''));

    if (isCsrfError && originalRequest && !originalRequest._retryCsrf) {
      originalRequest._retryCsrf = true;
      const csrfToken = await fetchCsrfToken();
      if (csrfToken) {
        originalRequest.headers['x-csrf-token'] = csrfToken;
        return api(originalRequest);
      }
    }

    if (es401 && noReintento && noEsAuth) {

      /* ── Si ya hay un refresh en curso → encolar esta petición ──────── */
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      /* ── Iniciar refresh ─────────────────────────────────────────────── */
      originalRequest._retry = true;
      isRefreshing           = true;

      try {
        /* Solicitar nuevo access token usando la cookie httpOnly del refresh */
        const res      = await api.post('/auth/refresh');
        const newToken = res.data.token;

        /* Persistir el nuevo token y actualizar el header por defecto */
        localStorage.setItem('token', newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;

        /* Resolver todas las peticiones que estaban en espera */
        processQueue(null, newToken);

        /* Reintentar la petición original con el nuevo token */
        return api(originalRequest);

      } catch (err) {
        /* ── Refresh falló (refresh token expirado o inválido) ──────────
           → Rechazar la cola, limpiar sesión y redirigir a login.
           → `return Promise.reject(err)` es CRÍTICO: evita que el flujo
             continúe hacia el bloque de globalError de abajo, lo que
             mostraría un toast de error innecesario durante el logout
             automático por sesión expirada.
        ──────────────────────────────────────────────────────────────── */
        processQueue(err, null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(err); // ← salida temprana, sin toast de error
      } finally {
        isRefreshing = false;
      }
    }

    /* ── Construcción del mensaje de error legible ───────────────────────
       Jerarquía de fuentes del mensaje (de más a menos específico):
        1. message del body JSON del backend (ej: "Stock insuficiente")
        2. error de red detallado: sin internet o timeout
        3. Fallback genérico
    ─────────────────────────────────────────────────────────────────────── */
    let message = error.response?.data?.message;

    if (!message) {
      if (error.code === 'ECONNABORTED') {
        /* Timeout: el servidor tardó más de 10 segundos en responder */
        message = 'La petición tardó demasiado. Verifica tu conexión e intenta de nuevo.';
      } else if (!error.response) {
        /* Sin respuesta del servidor: sin internet o servidor caído */
        message = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
      } else {
        message = error.message || 'Error en la petición.';
      }
    }

    /* ── Emitir evento global para que ToastContext muestre el mensaje ─── */
    window.dispatchEvent(
      new CustomEvent('globalError', { detail: { message } })
    );

    return Promise.reject(error);
  }
);

/* ============================================================
   🔒 EXPORTACIÓN DE UTILIDADES SSRF
   ============================================================ */

/**
 * Construye una URL segura con parámetros codificados
 * Previene SSRF sanitizando los parámetros antes de insertarlos
 * 
 * @example
 * buildUrl('/productos/:id', { id: 123 })  // → '/productos/123'
 * buildUrl('/productos/:id/detalles', { id: 123 })  // → '/productos/123/detalles'
 * 
 * @param {string} pattern - Patrón de URL con :parametros
 * @param {object} params - Objeto con parámetros
 * @returns {string} URL construida de forma segura
 */
export const buildUrl = (pattern, params = {}) => {
  let url = pattern;
  
  for (const [key, value] of Object.entries(params)) {
    const sanitizedValue = sanitizeParam(String(value));
    url = url.replace(`:${key}`, sanitizedValue);
  }
  
  // Verificar que después del reemplazo no queden parámetros sin reemplazar
  if (url.match(/:[a-zA-Z]+/)) {
    console.warn('[SSRF] URL con parámetros faltantes:', url);
  }
  
  return url;
};

/**
 * Valida un ID numérico (función auxiliar común en APIs)
 * 
 * @param {any} id - ID a validar
 * @param {string} name - Nombre del campo (para error)
 * @returns {number} ID validado
 * @throws {Error} Si el ID no es válido
 */
export const validateId = (id, name = 'ID') => {
  const numId = Number(id);
  if (isNaN(numId) || numId <= 0) {
    throw new Error(`${name} inválido`);
  }
  return numId;
};

// Exportar las utilidades SSRF junto con el cliente api
export { sanitizeParam, validatePathParam };

export default api;