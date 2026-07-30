-- ==============================================================================
-- BASE DE DATOS SEGURA PARA INVITACIÓN DIGITAL EN SUPABASE
-- Coherente con types.ts y protegida con RLS estricto
-- ==============================================================================

-- ==========================================
-- 1. CREACIÓN DE TABLAS
-- ==========================================

-- TABLA: DETALLES DEL EVENTO (event_details)
CREATE TABLE IF NOT EXISTS event_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quinceanera_name TEXT NOT NULL DEFAULT 'Valeria Sofía',
  subtitle TEXT DEFAULT 'Te invito a celebrar mis 15 Años',
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '2026-11-21T18:00:00Z',
  church_name TEXT DEFAULT 'Parroquia San Francisco de Asís',
  church_address TEXT DEFAULT 'Av. Insurgentes Sur 456, Col. Roma, CDMX',
  church_time TEXT DEFAULT '17:00 HRS',
  church_map_url TEXT DEFAULT 'https://maps.google.com/?q=Parroquia+San+Francisco+de+Asis',
  hall_name TEXT DEFAULT 'Jardín & Salón de Eventos Las Flores',
  hall_address TEXT DEFAULT 'Av. De las Rosas 123, Del Valle, CDMX',
  hall_time TEXT DEFAULT '19:00 HRS',
  hall_map_url TEXT DEFAULT 'https://maps.google.com/?q=Jardin+Las+Flores',
  parents_names TEXT DEFAULT 'Roberto Sofía & María Elena Morales',
  godparents_names TEXT DEFAULT 'Carlos Mendoza & Patricia Delgado',
  dress_code TEXT DEFAULT 'Formal / Vestido de Noche / Etiqueta',
  gift_registry TEXT DEFAULT 'Lluvia de Sobres',
  welcomemessage TEXT DEFAULT 'Con la bendición de Dios y el amor de mis padres, me llena de alegría celebrar mis quince años rodeada de las personas que más quiero.',
  background_music_url TEXT DEFAULT 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
  background_music_title TEXT DEFAULT 'Vals de las Flores',
  cover_image_url TEXT DEFAULT 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: CONFIRMACIONES (rsvps)
CREATE TABLE IF NOT EXISTS rsvps (
  id TEXT PRIMARY KEY DEFAULT ('rsvp-' || gen_random_uuid()::text),
  nombre TEXT NOT NULL,
  email TEXT DEFAULT '',
  confirmado BOOLEAN DEFAULT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  acompanantes INT NOT NULL DEFAULT 0,
  mensaje TEXT DEFAULT '',
  "URLinvitacion" TEXT DEFAULT '', -- Mantenemos las mayúsculas porque así está en tu types.ts
  token TEXT NOT NULL,
  attending TEXT DEFAULT 'Pendiente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: GALERÍA DE FOTOS (gallery_photos)
CREATE TABLE IF NOT EXISTS gallery_photos (
  id TEXT PRIMARY KEY DEFAULT ('photo-' || gen_random_uuid()::text),
  url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  category TEXT DEFAULT 'Sesión Principal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: ANUNCIOS Y PUBLICACIONES (admin_posts)
CREATE TABLE IF NOT EXISTS admin_posts (
  id TEXT PRIMARY KEY DEFAULT ('post-' || gen_random_uuid()::text),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: BIBLIOTECA DE CANCIONES (audio_tracks)
CREATE TABLE IF NOT EXISTS audio_tracks (
  id TEXT PRIMARY KEY DEFAULT ('track-' || gen_random_uuid()::text),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  is_main BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. DATOS INICIALES Y BUCKETS
-- ==========================================

-- INSERTAR REGISTRO INICIAL EN event_details SI ESTÁ VACÍO
INSERT INTO event_details (id, quinceanera_name, subtitle)
SELECT gen_random_uuid(), 'Valeria Sofía', 'Te invito a celebrar mis 15 Años'
WHERE NOT EXISTS (SELECT 1 FROM event_details);

-- CONFIGURACIÓN DE SUPABASE STORAGE (BUCKETS)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('xv_media', 'xv_media', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('public', 'public', true)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 3. POLÍTICAS DE SEGURIDAD (RLS) CORREGIDAS
-- ==========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE event_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_tracks ENABLE ROW LEVEL SECURITY;

-- EVENT_DETAILS: Invitados solo leen, Admin hace todo
CREATE POLICY "Invitados pueden leer detalles" ON event_details FOR SELECT USING (true);
CREATE POLICY "Admin total en detalles" ON event_details FOR ALL USING (auth.role() = 'authenticated');

-- RSVPs: Invitados pueden insertar y leer, Admin hace todo (borrar/editar)
CREATE POLICY "Invitados pueden leer RSVPs" ON rsvps FOR SELECT USING (true);
CREATE POLICY "Invitados pueden enviar RSVP" ON rsvps FOR INSERT WITH CHECK (true);
CREATE POLICY "Solo Admin puede editar RSVPs" ON rsvps FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Solo Admin puede borrar RSVPs" ON rsvps FOR DELETE USING (auth.role() = 'authenticated');

-- GALERÍA, POSTS Y AUDIO: Invitados solo leen, Admin hace todo
CREATE POLICY "Invitados pueden leer galeria" ON gallery_photos FOR SELECT USING (true);
CREATE POLICY "Admin total en galeria" ON gallery_photos FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Invitados pueden leer posts" ON admin_posts FOR SELECT USING (true);
CREATE POLICY "Admin total en posts" ON admin_posts FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Invitados pueden leer audio" ON audio_tracks FOR SELECT USING (true);
CREATE POLICY "Admin total en audio" ON audio_tracks FOR ALL USING (auth.role() = 'authenticated');

-- POLÍTICAS DE STORAGE (BUCKETS) PROTEGIDAS
-- Todos pueden ver/descargar los archivos (fotos, audios)
CREATE POLICY "Acceso publico lectura Storage" ON storage.objects FOR SELECT USING (bucket_id IN ('xv_media', 'public'));
-- SOLO el administrador autenticado puede subir, modificar o borrar archivos
CREATE POLICY "Solo Admin puede subir archivos" ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND bucket_id IN ('xv_media', 'public'));
CREATE POLICY "Solo Admin puede editar archivos" ON storage.objects FOR UPDATE USING (auth.role() = 'authenticated' AND bucket_id IN ('xv_media', 'public'));
CREATE POLICY "Solo Admin puede borrar archivos" ON storage.objects FOR DELETE USING (auth.role() = 'authenticated' AND bucket_id IN ('xv_media', 'public'));