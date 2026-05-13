/**
 * ==============================
 * 📊 SERVICIO DE ANALYTICS
 * ==============================
 * Google Analytics 4 integration
 * Tracking de eventos y conversiones
 */

// Google Analytics Measurement ID (reemplaza con tu GA4 ID)
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX'; // TODO: Configurar en .env

class AnalyticsService {
  constructor() {
    this.isInitialized = false;
    this.measurementId = GA_MEASUREMENT_ID;
  }

  /**
   * Inicializar Google Analytics
   */
  init() {
    if (this.isInitialized || !this.measurementId || this.measurementId === 'G-XXXXXXXXXX') {
      console.log('📊 Analytics: No inicializado (ID no configurado)');
      return;
    }

    // Cargar gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script);

    // Configurar gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', this.measurementId, {
      page_title: document.title,
      page_location: window.location.href
    });

    window.gtag = gtag;
    this.isInitialized = true;
    console.log('📊 Analytics inicializado:', this.measurementId);
  }

  /**
   * Track page view
   * @param {string} pagePath - Path de la página
   * @param {string} pageTitle - Título de la página
   */
  pageView(pagePath, pageTitle) {
    if (!this.isInitialized) return;

    window.gtag('config', this.measurementId, {
      page_path: pagePath,
      page_title: pageTitle
    });
  }

  /**
   * Track custom event
   * @param {string} eventName - Nombre del evento
   * @param {object} parameters - Parámetros del evento
   */
  event(eventName, parameters = {}) {
    if (!this.isInitialized) return;

    window.gtag('event', eventName, {
      ...parameters,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track product view
   * @param {object} product - Datos del producto
   */
  productView(product) {
    this.event('view_item', {
      currency: 'COP',
      value: product.precio,
      items: [{
        item_id: product.id,
        item_name: product.nombre,
        category: 'artesania',
        price: product.precio
      }]
    });
  }

  /**
   * Track add to cart
   * @param {object} product - Producto agregado
   * @param {number} quantity - Cantidad
   */
  addToCart(product, quantity) {
    this.event('add_to_cart', {
      currency: 'COP',
      value: product.precio * quantity,
      items: [{
        item_id: product.id,
        item_name: product.nombre,
        category: 'artesania',
        price: product.precio,
        quantity: quantity
      }]
    });
  }

  /**
   * Track begin checkout
   * @param {Array} items - Items en el carrito
   * @param {number} total - Total del carrito
   */
  beginCheckout(items, total) {
    this.event('begin_checkout', {
      currency: 'COP',
      value: total,
      items: items.map(item => ({
        item_id: item.productoId,
        item_name: item.nombre,
        category: 'artesania',
        price: item.precio,
        quantity: item.cantidad
      }))
    });
  }

  /**
   * Track purchase completion
   * @param {object} order - Datos del pedido
   */
  purchase(order) {
    this.event('purchase', {
      transaction_id: order.id,
      currency: 'COP',
      value: order.total,
      shipping: 0,
      tax: 0,
      items: order.productos?.map(p => ({
        item_id: p.productoId,
        item_name: p.nombre,
        category: 'artesania',
        price: p.precio,
        quantity: p.cantidad
      })) || []
    });
  }

  /**
   * Track user login
   * @param {string} method - Método de login
   */
  login(method = 'email') {
    this.event('login', {
      method: method
    });
  }

  /**
   * Track user registration
   * @param {string} method - Método de registro
   */
  signUp(method = 'email') {
    this.event('sign_up', {
      method: method
    });
  }

  /**
   * Track contact form submission
   */
  contactFormSubmit() {
    this.event('contact_form_submit');
  }

  /**
   * Track search
   * @param {string} searchTerm - Término de búsqueda
   */
  search(searchTerm) {
    this.event('search', {
      search_term: searchTerm
    });
  }
}

export default new AnalyticsService();