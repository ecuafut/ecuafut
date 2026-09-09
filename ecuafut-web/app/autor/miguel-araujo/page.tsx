import Link from 'next/link';

export const metadata = {
  title: 'Miguel Araujo - Fundador y Analista de Fútbol | EcuaFut',
  description: 'Apasionado por el fútbol ecuatoriano, la Tri, LigaPro y el seguimiento a nuestros legionarios en EcuaFut.',
};

export default function AutorPage() {
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

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-black tracking-tight text-zinc-950 mb-2">Miguel Araujo</h1>
        <p className="text-amber-700 font-bold text-sm uppercase tracking-wider mb-6">Creador y Analista de Fútbol Ecuatoriano</p>
        
        <div className="prose prose-zinc max-w-none text-zinc-800 space-y-4 text-base leading-relaxed">
          <p>
            ¡Hola! Soy ecuatoriano y un apasionado total por el fútbol. Aunque no tengo un título de periodismo tradicional, mi compromiso con este deporte es absoluto: sigo de cerca todo lo que pasa en el fútbol ecuatoriano, la Selección Nacional (La Tri), la LigaPro y el panorama internacional.
          </p>
          <p>
            Abrí <strong>EcuaFut.com</strong> con una premisa muy clara: compartir contenido verificado, de alta calidad y con análisis rigurosos basados en datos reales, estadísticas y crónicas cuidadas, alejándome de los humos y rumores sin fundamentos.
          </p>
          <p>
            Aquí el motor principal es el amor por el balompié y el respeto por el lector. Puedes seguir toda la cobertura, debates y actualizaciones oficiales en nuestra cuenta de X: <a href="https://x.com/EcuaFutCom" target="_blank" rel="noopener noreferrer" className="text-amber-700 font-bold underline">@EcuaFutCom</a>.
          </p>
        </div>
      </main>

      <footer className="border-t border-zinc-200 bg-white mt-20 py-8 text-center text-xs text-zinc-500">
        <p>© {new Date().getFullYear()} EcuaFut. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}