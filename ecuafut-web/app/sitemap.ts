import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://waeubsejklypofuuihab.supabase.co"
const SUPABASE_KEY = "sb_publishable_s8MhlzKho-k5RKo3II82tw_HaZO1pjN"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.ecuafut.com'

  // Consultamos las noticias usando la columna correcta 'fecha'
  const { data: noticias } = await supabase
    .from('noticias')
    .select('slug, fecha')
    .order('id', { ascending: false })
    .limit(1000)

  const posts = noticias ? noticias.map((noticia) => ({
    url: `${baseUrl}/noticia/${noticia.slug}`,
    lastModified: noticia.fecha ? new Date(noticia.fecha) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  })) : []

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...posts,
  ]
}