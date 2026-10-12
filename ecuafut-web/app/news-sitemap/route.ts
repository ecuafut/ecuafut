import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://waeubsejklypofuuihab.supabase.co"
const SUPABASE_KEY = "sb_publishable_s8MhlzKho-k5RKo3II82tw_HaZO1pjN"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export async function GET() {
  const baseUrl = 'https://www.ecuafut.com'
  
  // Consultamos las noticias incluyendo la columna 'imagen_url'
  const { data: noticias } = await supabase
    .from('noticias')
    .select('titulo, slug, fecha, imagen_url')
    .order('id', { ascending: false })
    .limit(50) // Traemos las últimas 50 noticias para asegurar que aparezcan en las pruebas

  const xmlItems: string[] = []

  if (noticias) {
    noticias.forEach((noticia) => {
      const fechaPub = noticia.fecha ? new Date(noticia.fecha).toISOString() : new Date().toISOString()
      
      const tituloSeguro = (noticia.titulo || 'Noticia Ecuafut').replace(/[&<>'"]/g, (tag: string) => {
        const chars: { [key: string]: string } = { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&apos;', '"': '&quot;' };
        return chars[tag] || tag;
      });

      // Bloque para incluir la imagen en el sitemap de noticias (Google News / Discover / Images)
      const imagenTag = noticia.imagen_url ? `
        <image:image>
          <image:loc>${noticia.imagen_url}</image:loc>
          <image:title>${tituloSeguro}</image:title>
        </image:image>
      ` : ''

      xmlItems.push(`
        <url>
          <loc>${baseUrl}/noticia/${noticia.slug}</loc>
          ${imagenTag}
          <news:news>
            <news:publication>
              <news:name>Ecuafut IA</news:name>
              <news:language>es</news:language>
            </news:publication>
            <news:publication_date>${fechaPub}</news:publication_date>
            <news:title>${tituloSeguro}</news:title>
          </news:news>
        </url>
      `)
    })
  }

  const newsSitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
            xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
            xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
      ${xmlItems.join('')}
    </urlset>
  `

  return new NextResponse(newsSitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}