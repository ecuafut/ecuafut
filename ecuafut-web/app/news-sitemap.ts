import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://waeubsejklypofuuihab.supabase.co"
const SUPABASE_KEY = "sb_publishable_s8MhlzKho-k5RKo3II82tw_HaZO1pjN"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export async function GET() {
  const baseUrl = 'https://www.ecuafut.com'
  const hace48Horas = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  const { data: noticias } = await supabase
    .from('noticias')
    .select('titulo, slug, created_at')
    .gte('created_at', hace48Horas)
    .order('id', { ascending: false })

  const xmlItems: string[] = []

  if (noticias) {
    noticias.forEach((noticia) => {
      const fechaPub = noticia.created_at ? new Date(noticia.created_at).toISOString() : new Date().toISOString()
      const tituloSeguro = (noticia.titulo || 'Noticia Ecuafut').replace(/[&<>'"]/g, (tag) => {
        const chars: { [key: string]: string } = { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&apos;', '"': '&quot;' };
        return chars[tag] || tag;
      });

      xmlItems.push(`
        <url>
          <loc>${baseUrl}/noticia/${noticia.slug}</loc>
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
            xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
      ${xmlItems.join('')}
    </urlset>
  `

  return new NextResponse(newsSitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}