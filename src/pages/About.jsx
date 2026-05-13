import { SparklesIcon, HandThumbUpIcon, UsersIcon } from "@heroicons/react/24/outline";
import artisanImage from '../images/pexels-macjoy-penaredondo-17632248-7139029.jpg';

function About() {
  return (
    <div className="max-w-5xl mx-auto py-16 px-4 lg:px-6 space-y-12">
      <section className="grid md:grid-cols-2 gap-6 items-center p-4 md:p-0">
        <div className="space-y-4 md:space-y-5">
          <div className="inline-flex items-center gap-2 text-cuero-dark/80 text-xs uppercase tracking-[0.3em] font-semibold">
            <SparklesIcon className="w-4 h-4" /> Artesanías con historia
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-cuero-dark">Sobre Nosotros</h1>
          <p className="text-cuero-dark/90 leading-relaxed">
            Somos un emprendimiento dedicado a preservar la tradición artesanal,
            transformando cada pieza en un reflejo de cultura, pasión y autenticidad.
            Cada producto cuenta una historia de manos expertas y de técnica heredada.
          </p>
          <p className="text-cuero-dark/70 leading-relaxed">
            Creemos en productos auténticos, comercio justo y en dar visibilidad
            a los artesanos locales con una experiencia de compra cercana.
          </p>
          <div className="mt-4">
            <a
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-cuero text-white rounded-lg hover:bg-cuero-dark transition"
            >
              Ver catálogo
            </a>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden border border-cuero/20 shadow-md">
          <img
            src={artisanImage}
            alt="Artesano trabajando"
            className="w-full h-64 md:h-full object-cover"
          />
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <article className="bg-white p-6 rounded-2xl border border-cuero/15 shadow-sm hover:-translate-y-0.5 transition animate-fadeIn">
          <div className="flex items-center gap-2 text-cuero-dark mb-3">
            <HandThumbUpIcon className="w-5 h-5 text-cuero" />
            <span className="font-semibold">Nuestra Historia</span>
          </div>
          <p className="text-cuero-dark/85 leading-relaxed">
            Desde hace más de 20 años trabajamos junto a artesanos locales,
            llevando sus creaciones a un público que valora lo auténtico y lo hecho a mano.
          </p>
        </article>

        <article className="bg-white p-6 rounded-2xl border border-cuero/15 shadow-sm hover:-translate-y-0.5 transition animate-fadeIn delay-100">
          <div className="flex items-center gap-2 text-cuero-dark mb-3">
            <UsersIcon className="w-5 h-5 text-cuero" />
            <span className="font-semibold">Nuestro Compromiso</span>
          </div>
          <p className="text-cuero-dark/85 leading-relaxed">
            Apoyamos trabajo justo, materiales responsables y piezas diseñadas para durar,
            combinando técnica artesanal con un estilo contemporáneo.
          </p>
        </article>
      </section>

      <section className="bg-pastel-beige border border-cuero/20 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-4 bg-white rounded-xl border border-cuero/10">
            <h3 className="font-semibold text-cuero-dark">Misión</h3>
            <p className="mt-2 text-cuero-dark/85 leading-relaxed">
              Brindar piezas únicas que reflejen riqueza cultural con calidad y calidez.
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-cuero/10">
            <h3 className="font-semibold text-cuero-dark">Visión</h3>
            <p className="mt-2 text-cuero-dark/85 leading-relaxed">
              Ser la plataforma de referencia para artesanías auténticas y de confianza.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white border border-cuero/15 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cuero-dark/60 font-semibold">Nuestros valores</p>
            <h3 className="text-xl md:text-2xl font-semibold text-cuero-dark mt-1">Tradición, calidad y comunidad</h3>
          </div>
          <div className="text-cuero-dark text-3xl" aria-hidden="true">✨</div>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="bg-pastel-beige p-3 rounded-xl border border-cuero/10">
            <p className="text-xs uppercase tracking-wider text-cuero-dark/70 font-semibold">Calidad</p>
            <p className="mt-2 text-sm text-cuero-dark/85">Materiales duraderos y atención artesanal.</p>
          </div>
          <div className="bg-pastel-beige p-3 rounded-xl border border-cuero/10">
            <p className="text-xs uppercase tracking-wider text-cuero-dark/70 font-semibold">Comunidad</p>
            <p className="mt-2 text-sm text-cuero-dark/85">Apoyamos artesanos locales en cada pieza.</p>
          </div>
          <div className="bg-pastel-beige p-3 rounded-xl border border-cuero/10">
            <p className="text-xs uppercase tracking-wider text-cuero-dark/70 font-semibold">Autenticidad</p>
            <p className="mt-2 text-sm text-cuero-dark/85">Productos con estilo único y significado.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
