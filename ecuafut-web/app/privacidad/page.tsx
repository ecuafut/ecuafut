import Link from 'next/link';

export const metadata = {
  title: 'Política de Privacidad | EcuaFut',
  description: 'Política de privacidad y tratamiento de datos de EcuaFut.',
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-zinc-900 font-sans antialiased">
      <header className="border-b border-zinc-200/80 bg-white/95 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tighter uppercase text-zinc-950">
            ECUA<span className="text-amber-600">FUT</span>
          </Link>
          <Link href="/" className="text-xs font-bold uppercase tracking-wider text-zinc-600 hover:text-zinc-950">
            ← Volver a portada
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 space-y-6 text-zinc-800">
        <h1 className="text-3xl font-black tracking-tight text-zinc-950">Política de Privacidad</h1>
        <p className="text-xs text-zinc-500">Última actualización: Septiembre de 2026</p>
        
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-zinc-950">1. Información recopilada</h2>
          <p className="text-sm leading-relaxed">EcuaFut respeta la privacidad de sus lectores. No recopilamos información personal innecesaria al navegar por nuestro portal de noticias deportivas.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-zinc-950">2. Cookies y analítica</h2>
          <p className="text-sm leading-relaxed">El sitio puede utilizar cookies técnicas de rendimiento y analítica para mejorar la experiencia del usuario y medir el tráfico de forma anónima a través de herramientas estándar de la industria.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-zinc-950">3. Propiedad intelectual</h2>
          <p className="text-sm leading-relaxed">Las crónicas, análisis y viñetas editoriales publicadas en EcuaFut son de autoría propia y están protegidas por normativas de derecho de autor.</p>
        </section>
      </main>

      <footer className="border-t border-zinc-200 bg-white mt-20 py-8 text-center text-xs text-zinc-500">
        <p>© {new Date().getFullYear()} EcuaFut. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}