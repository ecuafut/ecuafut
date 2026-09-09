import Link from 'next/link';
import Image from 'next/image';
import { supabase, Noticia } from '../lib/supabase';

export const revalidate = 60;

interface PageProps {
  searchParams: Promise<{ cat?: string }>;
}

async function obtenerNoticias(categoriaFiltro?: string): Promise<Noticia[]> {
  let query = supabase
    .from('noticias')
    .select('*')
    .order('id', { ascending: false });

  if (categoriaFiltro) {
    query = query.ilike('categoria', `%${categoriaFiltro}%`);
  }

  const { data, error } = await query.limit(24);

  if (error) {
    console.error('Error al consultar Supabase:', error);
    return [];
  }
  return data || [];
}

function formatearFecha(fechaStr?: string): string {
  if (!fechaStr) return 'Reciente';
  const fecha = new Date(fechaStr);
  if (isNaN(fecha.getTime())) return 'Reciente';
  return fecha.toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'short'
  });
}

export default async function HomePage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const categoriaSeleccionada = resolvedParams?.cat;
  
  const noticias = await obtenerNoticias(categoriaSeleccionada);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-zinc-900 font-sans antialiased">
      {/* Barra Superior con scroll horizontal en móviles */}
      <header className="border-b border-zinc-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center shrink-0">
            <Image 
              src="/logo.png" 
              alt="EcuaFut Logo" 
              width={170} 
              height={55} 
              priority 
              className="h-10 md:h-12 w-auto object-contain hover:opacity-95 transition"
            />
          </Link>

          <nav className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2 text-xs font-bold uppercase tracking-wider text-zinc-600 whitespace-nowrap">
            <Link href="/" className={`hover:text-amber-600 transition shrink-0 ${!categoriaSeleccionada ? 'text-amber-600 border-b-2 border-amber-600 pb-1' : ''}`}>Todo</Link>
            <Link href="/?cat=LigaPro" className={`hover:text-amber-600 transition shrink-0 ${categoriaSeleccionada === 'LigaPro' ? 'text-amber-600 border-b-2 border-amber-600 pb-1' : ''}`}>LigaPro</Link>
            <Link href="/?cat=Sudamericana" className={`hover:text-amber-600 transition shrink-0 ${categoriaSeleccionada === 'Sudamericana' ? 'text-amber-600 border-b-2 border-amber-600 pb-1' : ''}`}>Sudamericana</Link>
            <Link href="/?cat=Libertadores" className={`hover:text-amber-600 transition shrink-0 ${categoriaSeleccionada === 'Libertadores' ? 'text-amber-600 border-b-2 border-amber-600 pb-1' : ''}`}>Libertadores</Link>
            <Link href="/?cat=Champions" className={`hover:text-amber-600 transition shrink-0 ${categoriaSeleccionada === 'Champions' ? 'text-amber-600 border-b-2 border-amber-600 pb-1' : ''}`}>Champions</Link>
            <Link href="/?cat=Europa" className={`hover:text-amber-600 transition shrink-0 ${categoriaSeleccionada === 'Europa' ? 'text-amber-600 border-b-2 border-amber-600 pb-1' : ''}`}>Europa League</Link>
            <Link href="/?cat=Legionarios" className={`hover:text-amber-600 transition shrink-0 ${categoriaSeleccionada === 'Legionarios' ? 'text-amber-600 border-b-2 border-amber-600 pb-1' : ''}`}>Legionarios</Link>
            <Link href="/?cat=Seleccion" className={`hover:text-amber-600 transition shrink-0 ${categoriaSeleccionada === 'Seleccion' ? 'text-amber-600 border-b-2 border-amber-600 pb-1' : ''}`}>Selección</Link>
          </nav>
        </div>
      </header>

      {/* Feed Principal */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 border-b border-zinc-200 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase text-zinc-900">
              {categoriaSeleccionada ? `Categoría: ${categoriaSeleccionada}` : 'Última Hora'}
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Fútbol ecuatoriano, legionarios y torneos internacionales en tiempo real.
            </p>
          </div>
          {categoriaSeleccionada && (
            <Link href="/" className="text-xs font-bold bg-zinc-200 hover:bg-zinc-300 text-zinc-800 px-3 py-1.5 rounded-lg transition">
              Ver todo
            </Link>
          )}
        </div>

        {noticias.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-zinc-200">
            <p className="text-zinc-500 font-medium">No hay noticias publicadas en esta categoría aún.</p>
            <Link href="/" className="inline-block mt-4 text-xs font-bold text-amber-600 hover:underline">Volver al inicio</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {noticias.map((nota) => (
              <article 
                key={nota.id} 
                className="group flex flex-col bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
              >
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
                  <span className="absolute top-3 left-3 bg-zinc-950/85 backdrop-blur-sm text-white text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-md shadow-sm z-10">
                    {nota.categoria || 'Actualidad'}
                  </span>
                </Link>

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

                  {/* Autor enlazado al perfil y fecha corregida */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-4 border-t border-zinc-100 font-semibold tracking-wide">
                    <Link href="/autor/miguel-araujo" className="hover:text-amber-600 transition">
                      {nota.autor || 'Miguel Araujo'}
                    </Link>
                    <time>{formatearFecha(nota.created_at)}</time>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Footer con enlaces a Contacto y Privacidad */}
      <footer className="border-t border-zinc-200 bg-white mt-20 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} EcuaFut. Periodismo deportivo independiente.</p>
          <div className="flex items-center gap-6 font-semibold">
            <Link href="/contacto" className="hover:text-amber-600 transition">Contacto</Link>
            <Link href="/privacidad" className="hover:text-amber-600 transition">Política de Privacidad</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}