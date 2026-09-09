import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase, Noticia } from '../../../lib/supabase';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

function formatearFecha(fechaStr?: string): string {
  if (!fechaStr) return 'Hoy';
  const fecha = new Date(fechaStr);
  if (isNaN(fecha.getTime())) return 'Hoy';
  return fecha.toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

async function obtenerNoticia(slug: string): Promise<Noticia | null> {
  const { data, error } = await supabase
    .from('noticias')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const nota = await obtenerNoticia(slug);

  if (!nota) {
    return { title: 'Noticia no encontrada | EcuaFut' };
  }

  const titulo = `${nota.titulo} | EcuaFut`;
  const descripcion = nota.meta_descripcion || nota.contenido?.slice(0, 155) || '';

  return {
    title: titulo,
    description: descripcion,
    openGraph: {
      title: titulo,
      description: descripcion,
      url: `https://ecuafut.com/noticias/${nota.slug}`,
      siteName: 'EcuaFut',
      images: [
        {
          url: nota.imagen_url,
          width: 1280,
          height: 720,
          alt: nota.titulo,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@EcuaFutCom',
      creator: '@EcuaFutCom',
      title: titulo,
      description: descripcion,
      images: [nota.imagen_url],
    },
  };
}

export default async function DetalleNoticiaPage({ params }: PageProps) {
  const { slug } = await params;
  const nota = await obtenerNoticia(slug);

  if (!nota) {
    notFound();
  }

  const urlArticulo = `https://ecuafut.com/noticias/${nota.slug}`;
  const textoCompartir = encodeURIComponent(`${nota.titulo} vía @EcuaFutCom`);
  const urlCompartirEncoded = encodeURIComponent(urlArticulo);
  const enlaceX = `https://twitter.com/intent/tweet?text=${textoCompartir}&url=${urlCompartirEncoded}`;

  const bloques = (nota.contenido || '')
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const schemaNoticia = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: nota.titulo,
    description: nota.meta_descripcion || nota.contenido?.slice(0, 155),
    image: [nota.imagen_url],
    datePublished: nota.created_at,
    dateModified: nota.created_at,
    author: [
      {
        '@type': 'Person',
        name: nota.autor || 'Miguel Araujo',
      },
    ],
    publisher: {
      '@type': 'Organization',
      name: 'EcuaFut',
      url: 'https://ecuafut.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://ecuafut.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': urlArticulo,
    },
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-zinc-900 font-sans antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaNoticia) }}
      />

      <header className="border-b border-zinc-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tighter uppercase text-zinc-950">
              ECUA<span className="text-amber-600">FUT</span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs font-bold uppercase tracking-wider text-zinc-600 hover:text-zinc-950 transition"
          >
            ← Volver a portada
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-amber-100 text-amber-900 text-xs font-black tracking-wider uppercase px-3 py-1 rounded-md">
            {nota.categoria || 'Actualidad'}
          </span>
          <span className="text-zinc-400 text-xs">•</span>
          <time className="text-xs font-semibold text-zinc-500">
            {formatearFecha(nota.created_at)}
          </time>
        </div>

        <h1 className="text-2xl md:text-4xl font-black tracking-tight text-zinc-950 leading-tight md:leading-snug mb-4">
          {nota.titulo}
        </h1>

        {nota.meta_descripcion && (
          <p className="text-zinc-600 text-base md:text-lg leading-relaxed mb-6 font-medium">
            {nota.meta_descripcion}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-zinc-200/80 mb-8 text-xs text-zinc-600 font-semibold">
          <div className="flex items-center gap-2">
            <span>Por <strong className="text-zinc-900">{nota.autor || 'Miguel Araujo'}</strong></span>
            <span>•</span>
            <span>Edición Digital Ecuafut</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-zinc-600 font-bold">Compartir:</span>
            <a
              href={`https://api.whatsapp.com/send?text=${textoCompartir}%20${urlCompartirEncoded}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-md text-[11px] font-bold transition"
            >
              WhatsApp
            </a>
            <a
              href={enlaceX}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1 rounded-md text-[11px] font-bold transition"
            >
              X
            </a>
          </div>
        </div>

        {nota.imagen_url && (
          <figure className="mb-8 rounded-2xl overflow-hidden border border-zinc-200/80 shadow-sm bg-zinc-100">
            <img
              src={nota.imagen_url}
              alt={nota.titulo}
              className="w-full aspect-video object-cover"
            />
            <figcaption className="p-3 text-[11px] text-zinc-600 text-center font-medium bg-white/70">
              Viñeta editorial original creada para Ecuafut
            </figcaption>
          </figure>
        )}

        <div className="text-zinc-800 text-base md:text-lg leading-relaxed space-y-5">
          {bloques.map((bloque, i) => {
            if (bloque.startsWith('## ')) {
              return (
                <h2 key={i} className="text-xl md:text-2xl font-bold text-zinc-950 pt-4 pb-1 border-b border-zinc-100">
                  {bloque.replace('## ', '')}
                </h2>
              );
            }
            return <p key={i}>{bloque}</p>;
          })}
        </div>

        <div className="mt-12 p-6 bg-zinc-100 rounded-2xl border border-zinc-200 text-center">
          <p className="text-sm font-bold text-zinc-900 mb-1">¿Qué opinas de este partido?</p>
          <p className="text-xs text-zinc-600 mb-4">Súmate a la conversación con nuestra comunidad en @EcuaFutCom.</p>
          <a
            href={enlaceX}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-zinc-950 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-zinc-800 transition"
          >
            Comentar en X (Twitter)
          </a>
        </div>
      </main>

      <footer className="border-t border-zinc-200 bg-white mt-20 py-8 text-center text-xs text-zinc-600">
        <p>© {new Date().getFullYear()} EcuaFut. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}