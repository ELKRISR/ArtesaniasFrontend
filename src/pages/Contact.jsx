/**
 * @fileoverview Página de contacto — formulario para enviar mensajes al negocio.
 *
 * Muestra información de contacto del negocio y un formulario con los
 * campos nombre, email y mensaje. Ruta pública — no requiere autenticación.
 *
 * Correcciones aplicadas:
 *
 *  1. Llamada directa a api.post() → ahora usa contactService.enviarMensajeContacto().
 *     La versión anterior hacía `api.post("/contacto", form)` directamente en el
 *     componente, rompiendo la separación de capas (UI → servicio → API).
 *     Si la URL cambia o se agrega lógica extra al servicio, el componente
 *     no se beneficia. Ahora delega correctamente al servicio existente.
 *
 *  2. Límites de longitud en campos — seguridad y UX:
 *     El backend tiene columnas VARCHAR(255) para nombre/email y TEXT para mensaje.
 *     Sin límite en el frontend, un usuario podía enviar strings enormes que
 *     MySQL trunca silenciosamente o que saturan el payload HTTP.
 *     → nombre:  máx 100 caracteres (con contador visible).
 *     → email:   máx 100 caracteres.
 *     → mensaje: máx 1000 caracteres (con contador visible).
 *     → Validación server-side en contactController.js ya valida también.
 *
 *  3. Lectura de error normalizada:
 *     La versión anterior leía `error.response?.data?.error`. El backend de
 *     submitContact devuelve `{ error: "..." }` en algunos casos, pero
 *     también puede devolver `{ message: "..." }`. Ahora lee ambos con
 *     fallback: `data?.message || data?.error || error.message`.
 *
 * @module pages/Contact
 */

import { useState }                    from 'react';
import { enviarMensajeContacto }        from '../services/contactService';
import { useToast }                     from '../hooks/useToast';

/* ── Límites de caracteres — deben coincidir con la validación del backend ── */
const LIMITES = {
  NOMBRE:  100,
  EMAIL:   100,
  MENSAJE: 1000,
};

/* ── Regex de email — idéntico al del backend para consistencia ──────────── */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Página de contacto con información del negocio y formulario de envío.
 *
 * @returns {JSX.Element}
 */
function Contact() {
  const [form, setForm]     = useState({ nombre: '', email: '', mensaje: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();

  /* ── Validación del formulario ───────────────────────────────────────── */
  const validate = () => {
    const next = {};

    if (!form.nombre.trim()) {
      next.nombre = 'El nombre es obligatorio.';
    } else if (form.nombre.trim().length > LIMITES.NOMBRE) {
      next.nombre = `Máximo ${LIMITES.NOMBRE} caracteres.`;
    }

    if (!form.email.trim()) {
      next.email = 'El correo es obligatorio.';
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      next.email = 'El formato del correo no es válido.';
    } else if (form.email.trim().length > LIMITES.EMAIL) {
      next.email = `Máximo ${LIMITES.EMAIL} caracteres.`;
    }

    if (!form.mensaje.trim()) {
      next.mensaje = 'El mensaje es obligatorio.';
    } else if (form.mensaje.trim().length > LIMITES.MENSAJE) {
      next.mensaje = `Máximo ${LIMITES.MENSAJE} caracteres.`;
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  /* ── Manejar cambio de campo ─────────────────────────────────────────── */
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Aplicar límite de caracteres directamente en el onChange
    const limites = { nombre: LIMITES.NOMBRE, email: LIMITES.EMAIL, mensaje: LIMITES.MENSAJE };
    if (value.length > limites[name]) return;

    setForm((prev) => ({ ...prev, [name]: value }));

    // Limpiar error del campo al escribir
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  /* ── Enviar formulario ───────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || !validate()) return;

    try {
      setLoading(true);

      // Corrección: usa el servicio en vez de api.post directamente
      const data = await enviarMensajeContacto({
        nombre:  form.nombre.trim(),
        email:   form.email.trim().toLowerCase(),
        mensaje: form.mensaje.trim(),
      });

      // Leer message del response (el servicio devuelve data directamente)
      showToast(data?.message || '¡Mensaje enviado! Te responderemos pronto.', 'success');

      // Limpiar formulario
      setForm({ nombre: '', email: '', mensaje: '' });
      setErrors({});

    } catch (error) {
      // Normalizar mensaje de error: leer message o error del body del backend
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error   ||
        error.message                 ||
        'Error al enviar el mensaje. Inténtalo de nuevo.';

      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ── Helpers de UI ───────────────────────────────────────────────────── */

  /** Clase base de los inputs del formulario */
  const inputClass = (field) =>
    `w-full border-2 p-3 rounded-xl text-sm font-sans transition-colors duration-150
     focus:outline-none focus:border-cuero
     ${errors[field] ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`;

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className="max-w-5xl mx-auto py-16 px-6">

      {/* ── Encabezado ────────────────────────────────────────────── */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-serif font-bold text-cuero-dark mb-2">
          Contáctanos
        </h1>
        <p className="text-gray-500 font-sans text-sm">
          Escríbenos y te respondemos en menos de 24 horas.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">

        {/* ── Info de contacto ──────────────────────────────────── */}
        <div className="bg-pastel-beige p-8 rounded-2xl border border-cuero/10 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-cuero-dark font-sans mb-4">
            Información de contacto
          </h2>

          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5">📧</span>
            <div>
              <p className="text-sm font-semibold text-cuero-dark font-sans">Correo</p>
              <p className="text-sm text-gray-500 font-sans">contacto@artesanias.com</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5">📞</span>
            <div>
              <p className="text-sm font-semibold text-cuero-dark font-sans">Teléfono</p>
              <p className="text-sm text-gray-500 font-sans">+57 300 123 4567</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5">🕐</span>
            <div>
              <p className="text-sm font-semibold text-cuero-dark font-sans">Horario</p>
              <p className="text-sm text-gray-500 font-sans">
                Lunes a viernes<br />8:00 – 18:00
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5">📍</span>
            <div>
              <p className="text-sm font-semibold text-cuero-dark font-sans">Ubicación</p>
              <p className="text-sm text-gray-500 font-sans">
                Pereira, Risaralda — Colombia
              </p>
            </div>
          </div>
        </div>

        {/* ── Formulario ────────────────────────────────────────── */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-cuero/10">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Nombre */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-semibold text-cuero-dark font-sans">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-gray-400 font-sans">
                  {form.nombre.length}/{LIMITES.NOMBRE}
                </span>
              </div>
              <input
                name="nombre"
                type="text"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Tu nombre completo"
                maxLength={LIMITES.NOMBRE}
                className={inputClass('nombre')}
              />
              {errors.nombre && (
                <p className="text-red-500 text-xs mt-1 font-sans">{errors.nombre}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-cuero-dark mb-1.5 font-sans">
                Correo electrónico <span className="text-red-500">*</span>
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="tucorreo@ejemplo.com"
                maxLength={LIMITES.EMAIL}
                className={inputClass('email')}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1 font-sans">{errors.email}</p>
              )}
            </div>

            {/* Mensaje */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-semibold text-cuero-dark font-sans">
                  Mensaje <span className="text-red-500">*</span>
                </label>
                <span className={`text-xs font-sans ${
                  form.mensaje.length > LIMITES.MENSAJE * 0.9
                    ? 'text-amber-500'
                    : 'text-gray-400'
                }`}>
                  {form.mensaje.length}/{LIMITES.MENSAJE}
                </span>
              </div>
              <textarea
                name="mensaje"
                value={form.mensaje}
                onChange={handleChange}
                rows={5}
                placeholder="¿En qué podemos ayudarte?"
                maxLength={LIMITES.MENSAJE}
                className={`${inputClass('mensaje')} resize-none`}
              />
              {errors.mensaje && (
                <p className="text-red-500 text-xs mt-1 font-sans">{errors.mensaje}</p>
              )}
            </div>

            {/* Botón enviar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-cuero text-white font-semibold
                         font-sans text-sm hover:bg-cuero-dark
                         disabled:opacity-60 disabled:cursor-not-allowed
                         transition-colors duration-150"
            >
              {loading ? 'Enviando...' : 'Enviar mensaje'}
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}

export default Contact;