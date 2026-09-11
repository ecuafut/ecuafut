import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://waeubsejklypofuuihab.supabase.co';
const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_s8MhlzKho-k5RKo3II82tw_HaZO1pjN';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Noticia {
  id: number;
  created_at: string;
  fecha?: string; // <--- Añadido para solucionar el error en Vercel
  titulo: string;
  slug: string;
  contenido: string;
  meta_descripcion: string;
  tweet_copy: string;
  imagen_url: string;
  autor: string;
  categoria: string;
}