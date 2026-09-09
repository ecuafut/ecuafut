import Link from 'next/link';
import Image from 'next/image';
import { supabase, Noticia } from '../lib/supabase';

export const revalidate = 60;

async function obtenerNoticias(): Promise<Noticia[]> {
  const { data, error } = await supabase
    .from('noticias')
    .select('*')
    .order('id', { ascending: false })
    .limit(24);

  if (error) {
    console.error('Error al consultar Supabase:', error);
    return [];
  }
  return data || [];
}

function formatearFecha(fechaStr?: string): string {
  if (!fechaStr) return 'Hoy';
  const fecha = new Date(fechaStr);
  if (isNaN(fecha.getTime())) return 'Hoy';
  return fecha.toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'short'
  });
}

export default async function HomePage() {
  const noticias = await obtenerNoticias();

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-zinc-900 font-sans antialiased">
      {/* Barra Superior */}
      <header className="border-b border-zinc-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo Oficial con Imagen */}
          <Link href="/" className="flex items-center gap-2">
            <Image 
              src="/logo.png" 
              alt="EcuaFut Logo" 
              width={140} 
              height={40} 
              priority 
              className="h-10 w-auto object-contain"
            />
          </Link>

          {/* Menú Superior Funcional */}
          <nav className="flex items-center gap-6 text-xs md:text-sm font-bold uppercase tracking-wider text-zinc-600">
            <Link href="/?categoria=LigaPro" className="hover:text-amber-600 transition">LigaPro</Link>
            <Link href="/?categoria=Legionarios" className="hover:text-amber-600 transition">Legionarios</Link>
            <Link href="/?categoria=Seleccion" className="hover:text-amber-600 transition">Selección</Link>
          </nav>
        </div>
      </header>

      {/* Feed Principal */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8 border-b border-zinc-200 pb-4">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase text-zinc-900">
            Última Hora
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Fútbol ecuatoriano, legionarios y torneos internacionales.
          </p>
        </div>

        {noticias.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-500 font-medium">No hay noticias publicadas aún.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {noticias.map((nota) => (
              <article 
                key={nota.id} 
                className="group flex flex-col bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
              >
                {/* Portada 16:9 con contenedor seguro */}
                <Link href={`/noticias/${nota.slug}`} className="block relative aspect-video w-full overflow-hidden bg-zinc-200">
                  {nota.imagen_url ? (
                    <img
                      src={nota.imagen_url}
                      alt={nota.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-amber-50 text-amber-800 font-bold text-xs uppercase tracking-widest">
                      EcuaFut Editorial
                    </div>
                  )}
                  <span className="absolute top-3 left-3 bg-zinc-950/85 backdrop-blur-sm text-white text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-md shadow-sm">
                    {nota.categoria || 'Legionarios'}
                  </span>
                </Link>

                {/* Cuerpo del titular */}
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <Link href={`/noticias/${nota.slug}`}>
                      <h2 className="text-base md:text-lg font-bold leading-snug group-hover:text-amber-700 transition-colors line-clamp-3 mb-2 text-zinc-900">
                        {nota.titulo}
                      </h2>
                    </Link>
                    <p className="text-zinc-600 text-xs md:text-sm line-clamp-2 leading-relaxed mb-4">
                      {nota.meta_descripcion || nota.contenido?.slice(0, 110) + '...'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-4 border-t border-zinc-100 font-semibold tracking-wide">
                    <span>{nota.autor || 'Miguel Araujo'}</span>
                    <time>{formatearFecha(nota.created_at)}</time>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-200 bg-white mt-20 py-8 text-center text-xs text-zinc-500">
        <p>© {new Date().getFullYear()} EcuaFut. Periodismo deportivo independiente.</p>
      </footer>
    </div>
  );
}