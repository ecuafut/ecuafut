import Link from 'next/link';

export const metadata = {
  title: 'Contacto y Redacción | EcuaFut',
  description: 'Ponte en contacto con el equipo editorial de EcuaFut.',
};

export default function ContactoPage() {
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
        <h1 className="text-3xl font-black tracking-tight text-zinc-950 mb-4">Contacto Editorial</h1>
        <p className="text-zinc-700 text-base leading-relaxed mb-6">
          ¿Tienes alguna sugerencia, nota de prensa o reporte de interés sobre el fútbol ecuatoriano? El equipo de redacción de EcuaFut está disponible a través de nuestros canales oficiales.
        </p>
        <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm space-y-3">
          <p className="text-sm font-bold text-zinc-900">Redacción y Redes Oficiales:</p>
          <p className="text-sm text-zinc-600">X (Twitter): <a href="https://x.com/EcuaFutCom" target="_blank" rel="noopener noreferrer" className="text-amber-700 font-bold underline">@EcuaFutCom</a></p>
          <p className="text-sm text-zinc-600">Correo electrónico institucional: <span className="font-mono text-zinc-900">araujo7@proton.me</span></p>
        </div>
      </main>

      <footer className="border-t border-zinc-200 bg-white mt-20 py-8 text-center text-xs text-zinc-500">
        <p>© {new Date().getFullYear()} EcuaFut. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}