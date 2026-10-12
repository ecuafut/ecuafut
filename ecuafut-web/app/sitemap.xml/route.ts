// Ruta: app/sitemap.xml/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://waeubsejklypofuuihab.supabase.co"
const SUPABASE_KEY = "sb_publishable_s8MhlzKho-k5RKo3II82tw_HaZO1pjN"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export async function GET() {
  const baseUrl = 'https://www.ecuafut.com'

  // Consultamos las noticias publicadas en Supabase (últimos 1000 artículos)
  const { data: noticias } = await supabase
    .from('noticias')
    .select('slug, created_at')
    .order('id', { ascending: false })
    .limit(1000)

  // URLs estáticas principales de tu sitio
  const staticPages = [
    '',
  ]

  const xmlItems = staticPages.map((slug) => {
    return `
      <url>
        <loc>${baseUrl}${slug}</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>
    `
  })

  // Añadimos dinámicamente cada artículo de Supabase
  if (noticias) {
    noticias.forEach((noticia) => {
      const fechaMod = noticia.created_at ? new Date(noticia.created_at).toISOString() : new Date().toISOString()
      xmlItems.push(`
        <url>
          <loc>${baseUrl}/noticia/${noticia.slug}</loc>
          <lastmod>${fechaMod}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
        </url>
      `)
    })
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${xmlItems.join('')}
    </urlset>
  `

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}