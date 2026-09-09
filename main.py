import os
import requests
from supabase import create_client
from datetime import datetime, timedelta
from collections import deque
import json
import time
import re
import unicodedata
import base64
import random
from io import BytesIO
from PIL import Image

# ==============================================================================
# 1. CREDENCIALES Y CONFIGURACIÓN DEL SISTEMA
# ==============================================================================
XAI_API_KEY = os.environ.get("XAI_API_KEY", "")
API_FOOTBALL_KEY = os.environ.get("API_FOOTBALL_KEY", "")
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
MODELO_IMAGEN = "gemini-2.5-flash-image"

SUPABASE_URL = "https://waeubsejklypofuuihab.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

XAI_RESPONSES_URL = "https://api.x.ai/v1/responses"
XAI_HEADERS = {
    "Authorization": f"Bearer {XAI_API_KEY}",
    "Content-Type": "application/json"
}

GROK_MODEL = "grok-4.20-non-reasoning"
TIMEZONE_ECUADOR = "America/Guayaquil"

# Intervalo de goteo entre artículos de la cola (13 minutos = 780s)
TIEMPO_GOTEO_SEGUNDOS = 780

TORNEOS_OFICIALES = {
    242: "LigaPro Serie A",
    13: "Copa Libertadores",
    11: "Copa Sudamericana",
    2: "UEFA Champions League",
    3: "UEFA Europa League"
}

MESES = ["", "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]

POSES_DINAMICAS = [
    "sliding on the grass on his knees, screaming a goal with absolute euphoria",
    "running towards the corner flag with arms wide open like airplane wings",
    "passionately kissing the team crest on his jersey facing the roaring stands",
    "in full sprint dribbling the soccer ball with an intense, focused gaze",
    "celebrating with clenched fists, roaring with emotion",
    "sitting casually on a soccer ball on the pitch, smiling with absolute confidence",
    "giving a double thumbs-up to the crowd with a huge, charismatic toothy smile",
    "standing tall with hands on hips, chest puffed out looking like a heroic team leader"
]

# ==============================================================================
# 2. MOTOR GRÁFICO (CARICATURA EDITORIAL + SUPABASE STORAGE)
# ==============================================================================
def preparar_referencia_16_9(nombre):
    print(f"     🔍 Buscando foto de {nombre} en Wikipedia...")
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    endpoint = f"https://es.wikipedia.org/api/rest_v1/page/summary/{nombre.strip().replace(' ', '_')}"
    try:
        res = requests.get(endpoint, headers=headers, timeout=6).json()
        if "thumbnail" in res and res["thumbnail"].get("source"):
            datos_foto = requests.get(res["thumbnail"]["source"], headers=headers, timeout=10).content
            img = Image.open(BytesIO(datos_foto)).convert("RGB")

            lienzo = Image.new("RGB", (1280, 720), (245, 240, 232))
            escala = (720 * 0.82) / img.height
            nuevo_w, nuevo_h = int(img.width * escala), int(img.height * escala)
            img_redim = img.resize((nuevo_w, nuevo_h), Image.Resampling.LANCZOS)
            lienzo.paste(img_redim, ((1280 - nuevo_w) // 2, (720 - nuevo_h) // 2))

            buf = BytesIO()
            lienzo.save(buf, format="JPEG", quality=90)
            return base64.b64encode(buf.getvalue()).decode("utf-8")
    except Exception as e:
        print(f"     ⚠️ No se pudo obtener foto de {nombre}: {e}")
    return None

def generar_caricatura_bytes(meta_visual):
    nombre = meta_visual.get("nombre_jugador", "Futbolista ecuatoriano")
    dorsal = meta_visual.get("dorsal", "")
    dorsal_txt = f'Squad number "{dorsal}" clearly inked on the jersey center and shorts.' if dorsal else ''
    equipo = meta_visual.get("equipo", "Club")
    kit_hoy = meta_visual.get("colores_del_uniforme_hoy", "minimalist uniform matching match colors")
    kit_historico = meta_visual.get("colores_historicos_del_club", "traditional club colors")
    
    pose_elegida = random.choice(POSES_DINAMICAS)

    print(f"     🎨 Generando viñeta de {nombre} (Pose: {pose_elegida[:30]}...)...")
    foto_b64 = preparar_referencia_16_9(nombre)

    prompt = f"""
    Classic vintage sports newspaper caricature in traditional black ink outlines and rough colored pencil shading on textured cream paper.
    Wide horizontal 16:9 panoramic composition centered for mobile cards.
    Subject: Professional human soccer player named {nombre}. IMPORTANT: This is a real-life human athlete, absolutely NOT a comic book superhero, fictional monster, or Hulk character, regardless of any nickname. Use the facial likeness from the reference photo ONLY as an anatomical guide, but completely redraw the face as an exaggerated hand-drawn cartoon.
    MANDATORY CARICATURE RULES:
    - Exaggerated large stylized head (bobblehead style). CRITICAL ANATOMY: The head MUST NOT float. Draw a clear, proportional thin neck that seamlessly connects the oversized cartoon head to the small body's shoulders and jersey collar. The neck must look anatomically correct for this specific caricature proportion.
    - The face MUST be completely hand-drawn with visible black dip-pen contour lines, rough colored pencil shading, and cross-hatching shade details.
    - STRICTLY FORBIDDEN: Photorealistic skin textures, smooth digital renders, or photographic head collages. It must look 100% hand-sketched by a traditional newspaper cartoonist.
    Uniform & Action: Official and precise colors for {kit_hoy} representing the specific uniform worn by {equipo} today. {dorsal_txt} Dynamic action pose: {pose_elegida}. No invented sponsor logos or typos.
    Background: A packed and deafening blurry stadium. The fans in the stands MUST be waving giant flags and scarves that EXACTLY MATCH the historical and traditional {kit_historico} colors of {equipo}, REGARDLESS of the uniform the player is wearing today. Vibrant, energetic football atmosphere.
    Pure 2D traditional editorial cartoon illustration, no 3D CGI, no text, no signatures.
    """.strip().replace("\n", " ")

    url_api = f"https://generativelanguage.googleapis.com/v1beta/models/{MODELO_IMAGEN}:generateContent?key={GOOGLE_API_KEY}"
    partes = []
    if foto_b64:
        partes.append({"inlineData": {"mimeType": "image/jpeg", "data": foto_b64}})
    partes.append({"text": prompt})

    payload = {
        "contents": [{"parts": partes}],
        "generationConfig": {"responseModalities": ["IMAGE"]}
    }

    try:
        res = requests.post(url_api, json=payload, timeout=90)
        if res.status_code == 200:
            datos = res.json()
            candidates = datos.get("candidates", [])
            if candidates:
                for p in candidates[0].get("content", {}).get("parts", []):
                    if "inlineData" in p:
                        b64_img = p["inlineData"]["data"]
                        img_bytes = base64.b64decode(b64_img)

                        img = Image.open(BytesIO(img_bytes))
                        if img.width < 1200 or img.height > img.width:
                            img = img.resize((1280, 720), Image.Resampling.LANCZOS)

                        salida = BytesIO()
                        img.save(salida, format="JPEG", quality=92, optimize=True)
                        return salida.getvalue()
        else:
            print(f"     ❌ Error API Gemini ({res.status_code}): {res.text[:120]}")
    except Exception as e:
        print(f"     ❌ Error generando imagen: {e}")
    return None

def subir_imagen_a_supabase(img_bytes, slug):
    if not img_bytes:
        return None
    nombre_archivo = f"editorial_{slug}.jpg"
    try:
        supabase.storage.from_("portadas").upload(
            path=nombre_archivo,
            file=img_bytes,
            file_options={"content-type": "image/jpeg", "upsert": "true"}
        )
        return supabase.storage.from_("portadas").get_public_url(nombre_archivo)
    except Exception as e:
        print(f"     ⚠️ Error al subir al bucket 'portadas': {e}")
        return None

# ==============================================================================
# 3. UTILIDADES DE PARSEO Y DEDUPLICACIÓN
# ==============================================================================
def limpiar_cadena(texto):
    if not texto:
        return ""
    texto = unicodedata.normalize('NFKD', texto).encode('ASCII', 'ignore').decode('utf-8')
    return re.sub(r'[^a-z0-9\s]', '', texto.lower()).strip()

def generar_slug_respaldo(titulo):
    texto = unicodedata.normalize('NFKD', titulo).encode('ASCII', 'ignore').decode('utf-8')
    texto = re.sub(r'[^a-zA-Z0-9\s-]', '', texto.lower()).strip()
    return re.sub(r'[\s-]+', '-', texto)[:90]

def parsear_json_seguro(texto):
    if not texto:
        return None
    try:
        return json.loads(texto)
    except Exception:
        match = re.search(r'\{.*\}', texto, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except Exception:
                return None
        return None

def extraer_texto_respuesta_grok(data):
    if not data or not isinstance(data, dict):
        return ""
    output = data.get("output", [])
    if isinstance(output, list):
        for item in reversed(output):
            if isinstance(item, dict) and item.get("type") == "message":
                for c in item.get("content", []):
                    if isinstance(c, dict) and c.get("type") in ["output_text", "text"]:
                        return c.get("text", "")
    return ""

def consultar_grok_agente(prompt_sistema, prompt_usuario):
    payload = {
        "model": GROK_MODEL,
        "input": [
            {"role": "system", "content": prompt_sistema},
            {"role": "user", "content": prompt_usuario}
        ],
        "tools": [
            {"type": "x_search"},
            {"type": "web_search"}
        ]
    }
    try:
        res = requests.post(XAI_RESPONSES_URL, headers=XAI_HEADERS, json=payload, timeout=85)
        if res.status_code == 200:
            texto = extraer_texto_respuesta_grok(res.json())
            return parsear_json_seguro(texto)
        else:
            print(f"   ⚠️ Error xAI {res.status_code}: {res.text[:120]}")
            return None
    except Exception as e:
        print(f"   ⚠️ Error de conexión con xAI: {e}")
        return None

def obtener_registros_existentes():
    try:
        res = supabase.table("noticias").select("titulo, slug").order("id", desc=True).limit(80).execute()
        titulos_raw = [item['titulo'] for item in res.data if item.get('titulo')]
        titulos_norm = [limpiar_cadena(t) for t in titulos_raw]
        slugs = [item['slug'] for item in res.data if item.get('slug')]
        return titulos_norm, slugs, titulos_raw
    except Exception as e:
        print(f"   ⚠️ Error leyendo historial en Supabase: {e}")
        return [], [], []

def noticia_ya_cubierta(titulo_nuevo, slug_nuevo, titulos_norm, slugs_db):
    if slug_nuevo and slug_nuevo in slugs_db:
        return True
    t_norm = limpiar_cadena(titulo_nuevo)
    palabras_nuevo = set([p for p in t_norm.split() if len(p) > 3])

    for t in titulos_norm:
        if t_norm in t or t in t_norm:
            return True
        palabras_db = set([p for p in t.split() if len(p) > 3])
        if not palabras_nuevo or not palabras_db:
            continue
        coincidencias = len(palabras_nuevo.intersection(palabras_db))
        if coincidencias >= 4:
            return True
        ratio_nuevo = coincidencias / len(palabras_nuevo)
        ratio_db = coincidencias / len(palabras_db)
        if ratio_nuevo >= 0.45 or ratio_db >= 0.45:
            return True
    return False

def partido_ya_publicado(local, visitante, titulos_norm):
    loc_norm = limpiar_cadena(local)
    vis_norm = limpiar_cadena(visitante)
    palabras_loc = [p for p in loc_norm.split() if len(p) > 3]
    palabras_vis = [p for p in vis_norm.split() if len(p) > 3]

    for t in titulos_norm:
        coincide_loc = any(p in t for p in palabras_loc) if palabras_loc else loc_norm in t
        coincide_vis = any(p in t for p in palabras_vis) if palabras_vis else vis_norm in t
        if coincide_loc and coincide_vis:
            return True
    return False

# ==============================================================================
# 4. API-FOOTBALL (ACTAS, ESTADÍSTICAS Y ALINEACIONES AVANZADAS)
# ==============================================================================
def cargar_agenda_del_dia():
    url = "https://v3.football.api-sports.io/fixtures"
    headers = {'x-apisports-key': API_FOOTBALL_KEY}
    params = {'date': datetime.now().strftime('%Y-%m-%d'), 'timezone': TIMEZONE_ECUADOR}
    agenda = []
    try:
        res = requests.get(url, headers=headers, params=params, timeout=12).json()
        for p in res.get('response', []):
            league_id = p.get('league', {}).get('id')
            local = p['teams']['home']['name']
            visitante = p['teams']['away']['name']
            categoria = None
            if local.strip().lower() == "ecuador" or visitante.strip().lower() == "ecuador":
                categoria = "Selección Nacional"
            elif league_id in TORNEOS_OFICIALES:
                categoria = TORNEOS_OFICIALES[league_id]

            if categoria:
                hora_fin = datetime.fromtimestamp(p['fixture']['timestamp']) + timedelta(minutes=110)
                agenda.append({
                    "fixture_id": p['fixture']['id'],
                    "league_id": league_id,
                    "categoria": categoria,
                    "local": local,
                    "visitante": visitante,
                    "estado": p['fixture']['status']['short'],
                    "fin_estimado": hora_fin
                })
    except Exception as e:
        print(f"   ⚠️ Error cargando agenda deportiva: {e}")
    return agenda

def obtener_acta_oficial(fixture_id):
    url = "https://v3.football.api-sports.io/fixtures"
    headers = {'x-apisports-key': API_FOOTBALL_KEY}
    params = {'id': str(fixture_id), 'timezone': TIMEZONE_ECUADOR}
    try:
        res = requests.get(url, headers=headers, params=params, timeout=10).json()
        partidos = res.get('response', [])
        if not partidos or partidos[0]['fixture']['status']['short'] not in ['FT', 'AET', 'PEN']:
            return None
        p = partidos[0]
        local = p['teams']['home']['name']
        visitante = p['teams']['away']['name']
        gl = p['goals']['home']
        gv = p['goals']['away']
        goles = []
        rojas = []
        for ev in p.get('events', []):
            jugador = ev.get('player', {}).get('name', 'Desconocido')
            minuto = ev.get('time', {}).get('elapsed', '')
            if ev.get('type') == 'Goal':
                goles.append(f"{jugador} ({minuto}') [{ev.get('team', {}).get('name')}]")
            elif ev.get('type') == 'Card' and 'Red' in ev.get('detail', ''):
                rojas.append(f"{jugador} ({minuto}') [{ev.get('team', {}).get('name')}]")
        return {
            "marcador": f"{local} {gl} - {gv} {visitante}",
            "local": local,
            "visitante": visitante,
            "resumen_duro": f"RESULTADO OFICIAL: {local} {gl} - {gv} {visitante} | GOLES: [{', '.join(goles)}] | EXPULSIONES: [{', '.join(rojas)}]"
        }
    except Exception as e:
        print(f"   ⚠️ Error en acta de API-Football: {e}")
        return None

def obtener_estadisticas_partido(fixture_id):
    url = "https://v3.football.api-sports.io/fixtures/statistics"
    headers = {'x-apisports-key': API_FOOTBALL_KEY}
    try:
        res = requests.get(url, headers=headers, params={'fixture': str(fixture_id)}, timeout=10).json()
        equipos = res.get('response', [])
        if len(equipos) < 2:
            return "Estadísticas en consolidación."
        
        def sacar_dato(stats, tipo):
            for s in stats:
                if s['type'] == tipo:
                    return str(s['value']) if s['value'] is not None else "0"
            return "0"

        info_stats = []
        for eq in equipos:
            n_eq = eq['team']['name']
            s = eq.get('statistics', [])
            pos = sacar_dato(s, 'Ball Possession')
            remates = sacar_dato(s, 'Total Shots')
            al_arco = sacar_dato(s, 'Shots on Goal')
            corners = sacar_dato(s, 'Corner Kicks')
            faltas = sacar_dato(s, 'Fouls')
            info_stats.append(f"{n_eq} -> Posesión: {pos}, Remates totales (al arco): {remates} ({al_arco}), Córners: {corners}, Faltas: {faltas}")
            
        return " | ".join(info_stats)
    except Exception:
        return "Estadísticas avanzadas no disponibles."

def obtener_alineaciones_partido(fixture_id):
    url = "https://v3.football.api-sports.io/fixtures/lineups"
    headers = {'x-apisports-key': API_FOOTBALL_KEY}
    try:
        res = requests.get(url, headers=headers, params={'fixture': str(fixture_id)}, timeout=10).json()
        eq = res.get('response', [])
        if len(eq) < 2:
            return "Alineaciones no disponibles."
            
        info_alineaciones = []
        for team in eq:
            nombre = team['team']['name']
            formacion = team.get('formation', 'N/D')
            dt = team.get('coach', {}).get('name', 'N/D')
            titulares = [p['player']['name'] for p in team.get('startXI', [])]
            xi = ", ".join(titulares) if titulares else "No confirmada"
            info_alineaciones.append(f"{nombre} (Esquema {formacion} - DT: {dt}): {xi}")
            
        return " vs ".join(info_alineaciones)
    except Exception:
        return "Alineaciones no disponibles."

def obtener_posiciones_tabla(league_id, local, visitante):
    url = "https://v3.football.api-sports.io/standings"
    headers = {'x-apisports-key': API_FOOTBALL_KEY}
    try:
        res = requests.get(url, headers=headers, params={'league': str(league_id), 'season': str(datetime.now().year)}, timeout=10).json()
        standings = res.get('response', [])
        return "Tabla de posiciones actualizada disponible." if standings else "Tabla en actualización."
    except Exception:
        return "Tabla en actualización."

# ==============================================================================
# 5. REDACCIÓN CON GROK + CANDADOS EDITORIALES Y ESTRUCTURALES
# ==============================================================================
def redactar_cronica_hibrida_grok(ficha, categoria, tabla_info, estadisticas_info, alineaciones_info):
    sistema = (
        "Eres Miguel Araujo, cronista senior de Ecuafut.com. Redactas crónicas rigurosas, tácticas y apasionantes. "
        "REGLA DE ORO 1: Tienes los datos duros oficiales de la API. OBLIGATORIO: Usa tu herramienta de búsqueda en X (x_search) "
        "para rastrear las reacciones INMEDIATAS de periodistas de prestigio sobre ESTE PARTIDO en los últimos 10 minutos. "
        "REGLA DE ORO 2: ESTÁ TOTALMENTE PROHIBIDO inventar estadísticas acumuladas o reacciones falsas. "
        "REGLA DE ORO 3: ESTÁ ESTRICTAMENTE PROHIBIDO usar negritas (**texto**) para simular subtítulos. OBLIGATORIO usar formato Markdown H2 (##)."
        "REGLA DE ORO 4: ESTÁ ESTRICTAMENTE PROHIBIDO mencionar o describir textualmente los colores de los uniformes o indumentarias en los párrafos de la crónica (por ejemplo, 'con camiseta verde' o 'uniforme alterno'). Esa información es únicamente para el bloque de ilustración JSON, nunca para el texto narrativo. "
        "NUNCA agregues notas del editor ni aclaraciones de estado al final."
    )
    usuario = f"""
CATEGORÍA: {categoria}
PARTIDO: {ficha['local']} vs {ficha['visitante']}
ACTA DEL PARTIDO: {ficha['resumen_duro']}
ESTADÍSTICAS: {estadisticas_info}
ALINEACIONES: {alineaciones_info}
TABLA: {tabla_info}

Misión: Busca in X qué están diciendo AHORA MISMO los expertos sobre este partido, cruza esa información con los datos de la API y redacta.

Genera un JSON con este formato exacto:
{{
  "titulo": "Titular periodístico preciso, claro y de impacto (entre 10 y 16 palabras). Usa nombres completos de equipos y evita el sensacionalismo",
  "slug": "url-amigable-seo",
  "meta_descripcion": "Resumen directo (140-155 caracteres)",
  "tweet_copy": "Copy para X con hashtags sin arrobas",
  "contenido": "Crónica estructurada. REGLA OBLIGATORIA: Debes incluir exactamente uno o dos subtítulos obligatoriamente en Markdown (##) que nazcan de forma orgánica. PROHIBIDO usar negritas (**) para subtítulos. PROHIBIDO describir colores de ropa en el texto. Cierra con fútbol, sin notas meta.",
  "ilustracion": {{
    "nombre_jugador": "Nombre exacto del protagonista principal del partido",
    "dorsal": "Número de camiseta",
    "equipo": "Nombre del club",
    "colores_del_uniforme_hoy": "Colores precisos del uniforme que usó HOY en este partido (ej. alterna negra con vivos dorados)",
    "colores_historicos_del_club": "Colores tradicionales y representativos de la hinchada (ej. celeste y blanco)",
    "estado_animo": "ignorar",
    "contexto_estadio": "estadio"
  }}
}}
"""
    return consultar_grok_agente(sistema, usuario)

def escanear_mision_geografica(mision_nombre, instrucciones_zona, titulares_ya_publicados):
    ahora = datetime.now()
    hoy_str = f"{ahora.day} de {MESES[ahora.month]}"
    ayer = ahora - timedelta(days=1)
    ayer_str = f"{ayer.day} de {MESES[ayer.month]}"
    antier = ahora - timedelta(days=2)
    antier_str = f"{antier.day} de {MESES[antier.month]}"
    
    exclusiones = "\n".join([f"- {t}" for t in titulares_ya_publicados[:15]])
    sistema = f"Editor Especialista en {mision_nombre} de Ecuafut.com. Eres un periodista implacable con las fechas y el cruce de fuentes."
    usuario = f"""
Momento actual: {ahora.strftime('%Y-%m-%d %H:%M')} (Ecuador). MISIÓN: {mision_nombre}.
INSTRUCCIONES: {instrucciones_zona}

=== REGLAS TEMPORALES Y DE INVESTIGACIÓN INQUEBRANTABLES ===
1. FECHA ESTRICTA: Hoy es {hoy_str}. SOLO redacta sobre eventos confirmados EXACTAMENTE hoy ({hoy_str}) o ayer ({ayer_str}).
2. CERO NOTICIAS VIEJAS Y CERO ALTERACIÓN DE FECHAS: Rechaza inmediatamente cualquier información del {antier_str} o fechas anteriores. ESTÁ TOTALMENTE PROHIBIDO alterar o inventar la fecha de un evento para que encaje en el margen permitido (Constraint Hacking). Si el partido fue el {antier_str}, no mientas diciendo que fue el {ayer_str}. Recházalo y devuelve hay_novedad: false.
3. ACUMULACIÓN DE PRUEBAS: Usa tu búsqueda en X (x_search) para rastrear cuentas de PRESTIGIO. No te inventes nada.
4. UN SOLO PROTAGONISTA: Concéntrate EXCLUSIVAMENTE en un solo futbolista ecuatoriano. PROHIBIDO mencionar a otros.
5. CERO TEXTO META: Prohibido incluir frases robóticas, justificaciones o notas de cierre del estilo 'Al momento de...'.
6. FORMATO OBLIGATORIO: PROHIBIDO usar negritas (`**`) para simular subtítulos. Usa SIEMPRE Markdown H2 (`##`).
7. CERO DESCRIPCIONES DE ROPA EN EL TEXTO: PROHIBIDO describir textualmente los colores de la indumentaria de los jugadores en los párrafos de la crónica.
8. Si no hay novedades comprobadas en las fechas permitidas ({hoy_str} o {ayer_str}), responde obligatoriamente:
   {{"hay_novedad": false, "noticias": []}}

EXCLUSIÓN DE TITULARES YA CUBIERTOS:
{exclusiones}

Responde ÚNICAMENTE en JSON:
{{
  "hay_novedad": true,
  "noticias": [
    {{
      "categoria": "Legionarios",
      "titulo": "Titular periodístico preciso, claro y de impacto (entre 10 y 16 palabras). Usa nombres completos y evita el sensacionalismo",
      "slug": "url-amigable-seo",
      "meta_descripcion": "Resumen directo (140-155 caracteres)",
      "tweet_copy": "Copy para X sin arrobas",
      "contenido": "Crónica estructurada. REGLA OBLIGATORIA: Usa OBLIGATORIAMENTE Markdown H2 (##) para los subtítulos. PROHIBIDO usar (**). PROHIBIDO describir colores de ropa. Cita la opinión de la prensa local encontrada en X. Prohibido notas meta.",
      "ilustracion": {{
        "nombre_jugador": "Nombre y apellido del futbolista ecuatoriano protagonista",
        "dorsal": "Dorsal oficial en su club",
        "equipo": "Club actual",
        "colores_del_uniforme_hoy": "Colores precisos del uniforme que usó HOY en este partido",
        "colores_historicos_del_club": "Colores tradicionales y representativos de la hinchada",
        "estado_animo": "ignorar",
        "contexto_estadio": "estadio"
      }}
    }}
  ]
}}
"""
    return consultar_grok_agente(sistema, usuario)

def auditar_articulo_editorial(borrador, origen="NOTICIA"):
    ahora = datetime.now()
    hoy_str = f"{ahora.day} de {MESES[ahora.month]}"
    antier = ahora - timedelta(days=2)
    antier_str = f"{antier.day} de {MESES[antier.month]}"

    sistema = "Editor General de Ecuafut.com. Eres el filtro final anti-noticias viejas y anti-mal formato."
    ilustracion_str = json.dumps(borrador.get('ilustracion', {}), ensure_ascii=False)
    usuario = f"""
Borrador ({origen}):
TITULO: {borrador.get('titulo')}
SLUG: {borrador.get('slug')}
META: {borrador.get('meta_descripcion')}
CONTENIDO: {borrador.get('contenido')}
ILUSTRACION: {ilustracion_str}

CHECKLIST EDITORIAL RIGUROSO:
1. FECHA VERIFICADA: Hoy es {hoy_str}. Si la nota menciona hechos ocurridos el {antier_str} o fechas anteriores, RECHÁZALA INMEDIATAMENTE devolviendo null. Cuidado con fechas falsas alteradas por la IA.
2. Elimina arrobas y menciones de redes sociales.
3. ELIMINA cualquier texto meta, justificación editorial o frases como 'No se reportan otras novedades...'.
4. Asegura que el foco esté en un solo protagonista.
5. Verifica que haya presencia de al menos un subtítulo (##) orgánico; si usó negritas (**texto**) para un subtítulo, CONVIÉRTELO OBLIGATORIAMENTE a Markdown H2 (## texto).
6. ELIMINA cualquier mención o descripción literal de colores de uniformes o indumentarias dentro del cuerpo del contenido.
7. Mantén los datos de 'ilustracion' intactos.

Devuelve JSON con:
{{
  "titulo": "Titular periodístico preciso, claro y de impacto (entre 10 y 16 palabras)",
  "slug": "slug-limpio",
  "meta_descripcion": "Meta ajustada",
  "tweet_copy": "Copy para X",
  "contenido": "Cuerpo final periodístico y estructurado fluidamente SIEMPRE con H2 (##) sin notas meta y sin descripciones de ropa",
  "ilustracion": {ilustracion_str}
}}
"""
    resultado = consultar_grok_agente(sistema, usuario)
    return resultado if resultado else borrador

# ==============================================================================
# 6. PUBLICACIÓN EN SUPABASE
# ==============================================================================
def limpiar_texto_editorial(texto):
    if not texto:
        return ""
    t = str(texto)
    t = re.sub(r'Párrafo\s*\d+:\s*', '', t)
    t = re.sub(r'@([A-Za-z0-9_]+)', r'\1', t)
    
    t = re.sub(r'\(?No se reportan otras novedades.*', '', t, flags=re.IGNORECASE | re.DOTALL)
    t = re.sub(r'\(?Al momento de esta actualizaci[oó]n.*', '', t, flags=re.IGNORECASE | re.DOTALL)
    t = re.sub(r'La fase de liga de la Champions League inicia.*', '', t, flags=re.IGNORECASE | re.DOTALL)
    
    return t.strip()

def publicar_en_supabase(articulo_data, categoria):
    if not articulo_data or not isinstance(articulo_data, dict):
        return False

    titulo = limpiar_texto_editorial(articulo_data.get("titulo", ""))
    contenido = limpiar_texto_editorial(articulo_data.get("contenido", ""))
    if not titulo or not contenido or len(contenido) < 140:
        return False

    slug = articulo_data.get("slug", "") or generar_slug_respaldo(titulo)
    meta_desc = limpiar_texto_editorial(articulo_data.get("meta_descripcion", ""))
    tweet = limpiar_texto_editorial(articulo_data.get("tweet_copy", ""))

    url_final_imagen = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1080"

    meta_visual = articulo_data.get("ilustracion", {})
    if meta_visual and meta_visual.get("nombre_jugador"):
        print(f"\n     🎨 Activando motor gráfico para viñeta editorial 16:9...")
        img_bytes = generar_caricatura_bytes(meta_visual)
        if img_bytes:
            url_subida = subir_imagen_a_supabase(img_bytes, slug)
            if url_subida:
                url_final_imagen = url_subida
                print(f"     📸 Portada vinculada en Supabase Storage: {url_final_imagen}")

    payload = {
        "titulo": titulo,
        "contenido": contenido,
        "slug": slug,
        "meta_descripcion": meta_desc,
        "tweet_copy": tweet,
        "imagen_url": url_final_imagen,
        "autor": "Miguel Araujo",
        "categoria": categoria
    }

    try:
        supabase.table("noticias").insert(payload).execute()
        print(f"\n     🚀 PUBLICADO EN SUPABASE [{categoria}]")
        print(f"     📌 Titular: {titulo}")
        print(f"     🔗 Portada: {url_final_imagen}\n")
        return True
    except Exception as e:
        print(f"     ⚠️ Error al insertar en Supabase: {e}")
        return False

# ==============================================================================
# 7. CICLO PRINCIPAL Y MISIONES
# ==============================================================================
MISIONES = [
    {
        "nombre": "EUROPA Y CHAMPIONS",
        "instrucciones": "Monitorea la actualidad de legionarios ecuatorianos en Europa y torneos UEFA. REGLA OBLIGATORIA: Elige un solo protagonista principal, rastrea en X a periodistas locales de autoridad del país donde juega y acumula perspectivas de las últimas 24 horas."
    },
    {
        "nombre": "SUDAMÉRICA Y CONMEBOL",
        "instrucciones": "Rastrea a legionarios en Sudamérica y partidos Conmebol. REGLA OBLIGATORIA: Elige un solo protagonista principal, cruza tuits de periodistas locales del país del partido y consolida la noticia de las últimas 24 horas."
    },
    {
        "nombre": "NORTEAMÉRICA Y MERCADO",
        "instrucciones": "Monitorea a ecuatorianos en MLS, Liga MX y fichajes confirmados. REGLA OBLIGATORIA: Un solo protagonista y basa la nota comprobando en X qué dicen los expertos locales (últimas 24h)."
    },
    {
        "nombre": "LIGAPRO Y LA TRI",
        "instrucciones": "Monitorea las noticias más relevantes de la LigaPro de Ecuador, Seleccionados (La Tri) y novedades FEF de las últimas 24 horas mediante cruce de periodistas ecuatorianos de prestigio en X."
    }
]

def iniciar_servicio():
    print("🤖 SERVICIO ECUAFUT ACTIVO (REDACCIÓN GROK + MOTOR GRÁFICO GEMINI + STORAGE)...")
    ultimo_escaneo_mision = datetime.min
    ultima_publicacion_goteo = datetime.min
    indice_mision_actual = 0
    cola_legionarios = deque()
    agenda_partidos = []
    fecha_agenda = ""
    partidos_procesados = set()

    while True:
        ahora = datetime.now()
        hoy_str = ahora.strftime('%Y-%m-%d')

        if fecha_agenda != hoy_str:
            print(f"\n📅 Sincronizando agenda deportiva oficial ({hoy_str} - Hora Ecuador)...")
            agenda_partidos = cargar_agenda_del_dia()
            fecha_agenda = hoy_str
            partidos_procesados.clear()

            if not agenda_partidos:
                print("   ℹ️ Sin partidos oficiales programados para hoy.")
            else:
                for p in agenda_partidos:
                    cierre = p['fin_estimado'].strftime('%H:%M')
                    print(f"   ⚽ {p['local']} vs {p['visitante']} [{p['categoria']}] - Cierre estimado: ~{cierre}")

        titulos_norm, slugs_db, titulos_raw = obtener_registros_existentes()

        for p in agenda_partidos:
            if p['fixture_id'] in partidos_procesados:
                continue

            if partido_ya_publicado(p['local'], p['visitante'], titulos_norm):
                partidos_procesados.add(p['fixture_id'])
                continue

            if ahora >= p['fin_estimado'] or p['estado'] in ['FT', 'AET', 'PEN']:
                print(f"\n🚨 [CARRIL PRIORITARIO] Comprobando partido: {p['local']} vs {p['visitante']}...")
                ficha = obtener_acta_oficial(p['fixture_id'])
                if ficha:
                    print(f"   🎯 Concluido: {ficha['marcador']}. Pausando 10 min de oro (API + Búsqueda en X)...")
                    time.sleep(600)
                    stats_info = obtener_estadisticas_partido(p['fixture_id'])
                    lineups_info = obtener_alineaciones_partido(p['fixture_id'])
                    tabla_info = obtener_posiciones_tabla(p['league_id'], p['local'], p['visitante'])

                    borrador = redactar_cronica_hibrida_grok(ficha, p['categoria'], tabla_info, stats_info, lineups_info)
                    if borrador:
                        articulo_auditado = auditar_articulo_editorial(borrador, f"PARTIDO: {ficha['marcador']}")
                        if articulo_auditado and publicar_en_supabase(articulo_auditado, p['categoria']):
                            titulos_norm.append(limpiar_cadena(articulo_auditado.get("titulo", "")))
                            if articulo_auditado.get("slug"):
                                slugs_db.append(articulo_auditado.get("slug"))
                            partidos_procesados.add(p['fixture_id'])

        if ahora - ultimo_escaneo_mision >= timedelta(minutes=45):
            mision = MISIONES[indice_mision_actual]
            print(f"\n🌍 INICIANDO MISIÓN: {mision['nombre']}...")
            ultimo_escaneo_mision = datetime.now()
            indice_mision_actual = (indice_mision_actual + 1) % len(MISIONES)

            respuesta = escanear_mision_geografica(mision['nombre'], mision['instrucciones'], titulos_raw)
            if respuesta and respuesta.get("hay_novedad"):
                print("   ⏳ ¡Novedad detectada en el radar! Pausa táctica de 5 minutos para madurar reacciones en X...")
                time.sleep(300)
                lista_nuevas = respuesta.get("noticias", [])
                if isinstance(lista_nuevas, dict):
                    lista_nuevas = [lista_nuevas]
                for nota in lista_nuevas:
                    t_cand = nota.get("titulo", "")
                    s_cand = nota.get("slug", "")
                    if t_cand and nota.get("contenido") and not noticia_ya_cubierta(t_cand, s_cand, titulos_norm, slugs_db):
                        print(f"   📥 Añadida a cola: {t_cand}")
                        cola_legionarios.append(nota)
            else:
                print(f"   ⏭️ Sin movimientos nuevos verificados en las últimas 24h para {mision['nombre']}.")

        if cola_legionarios and (ahora - ultima_publicacion_goteo >= timedelta(seconds=TIEMPO_GOTEO_SEGUNDOS)):
            borrador_cola = cola_legionarios.popleft()
            t_cand = borrador_cola.get("titulo", "")
            s_cand = borrador_cola.get("slug", "")
            cat = borrador_cola.get("categoria", "Legionarios")

            if not noticia_ya_cubierta(t_cand, s_cand, titulos_norm, slugs_db):
                print(f"\n💧 [GOTEO EDITORIAL] Turno de publicación: {t_cand}")
                articulo_auditado = auditar_articulo_editorial(borrador_cola, f"LEGIONARIO: {t_cand}")
                if articulo_auditado:
                    t_aud = articulo_auditado.get("titulo", "")
                    s_aud = articulo_auditado.get("slug", "")
                    if not noticia_ya_cubierta(t_aud, s_aud, titulos_norm, slugs_db):
                        if publicar_en_supabase(articulo_auditado, cat):
                            titulos_norm.append(limpiar_cadena(t_aud))
                            if s_aud:
                                slugs_db.append(s_aud)
                            ultima_publicacion_goteo = datetime.now()

        proxima_mision = max(0, 45 - int((datetime.now() - ultimo_escaneo_mision).total_seconds() / 60))
        print(f"   ⏱️ Guardia activa | En cola: {len(cola_legionarios)} | Próxima misión ({MISIONES[indice_mision_actual]['nombre']}) en ~{proxima_mision} min...", end='\r')
        time.sleep(300)

if __name__ == "__main__":
    iniciar_servicio()