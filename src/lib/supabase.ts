import { createClient } from '@supabase/supabase-js';
// Importamos también AudioTrack, que lo añadimos a types.ts para tu música de fondo
import { EventDetails, RSVPRecord, GalleryPhoto, AdminPost, AudioTrack } from '../types';

// Gracias a que configuraste vite-env.d.ts, esto ahora es 100% tipado y seguro
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Una alerta amigable por si te olvidas de ponerlas en Vercel o en tu .env local
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('🚨 Faltan las variables de entorno de Supabase (URL o ANON_KEY). Revisa tu configuración.');
}

// Creamos y exportamos el cliente. 
// Le pasamos placeholders vacíos en caso de que falten, para que TypeScript 
// no te marque error de "Object is possibly null" en el resto del archivo.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);

// Local storage helper keys
const STORAGE_KEYS = {
  EVENT_DETAILS: 'xv_event_details_v1',
  RSVPS: 'xv_rsvps_v1',
  GALLERY: 'xv_gallery_v1',
  POSTS: 'xv_posts_v1'
};

// --- DATA ACCESS LAYER ---
// 1. Event Details (CERO CACHÉ)
export async function fetchEventDetails(): Promise<EventDetails | null> {
  try {
    const { data, error } = await supabase
      .from('event_details')
      .select('*')
      .maybeSingle(); // 👈 Clave para que no falle si la tabla está vacía
    
    if (error) {
      console.error('Error de Supabase al obtener detalles:', error.message);
      return null;
    }

    if (data) {
      return data as EventDetails; 
    }
  } catch (err) {
    console.error('Excepción de red al obtener datos de Supabase:', err);
  }

  // Si algo falla o la tabla está literalmente vacía, devolvemos null.
  // Ni localStorage, ni datos por defecto.
  return null;
}

export async function updateEventDetails(details: EventDetails): Promise<boolean> {
  // Actualizamos el caché local
  localStorage.setItem(STORAGE_KEYS.EVENT_DETAILS, JSON.stringify(details));

  try {
    // Solo le pasamos el objeto entero, Supabase ya sabe qué hacer
    // porque las llaves se llaman igual que las columnas.
    const { data } = await supabase.from('event_details').select('id').limit(1);

    if (data && data.length > 0) {
      await supabase.from('event_details').update(details).eq('id', data[0].id);
    } else {
      await supabase.from('event_details').insert([details]);
    }
    return true;
  } catch (err) {
    console.error('Error actualizando event details en Supabase:', err);
    return false;
  }
}

// 2. RSVPs & Invitation Links (CERO CACHÉ)
export const fetchRSVPs = async () => {
  try {
    // La coma y el asterisco entre paréntesis hacen el "Join" automáticamente
    const { data, error } = await supabase
      .from('rsvps')
      .select('*, asistentes_detalle(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching RSVPs:', error);
      return [];
    }
    return data as RSVPRecord[];
  } catch (error) {
    console.error('Network error fetching RSVPs:', error);
    return [];
  }
};

export async function createInvitationLink(nombre: string, acompanantes: number, email?: string): Promise<RSVPRecord | null> {
  const token = 'inv-' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const URLinvitacion = `${origin}/?invitation=${token}`;

  const payload = {
    nombre: nombre.trim(),
    email: email ? email.trim() : '',
    token: token,
    "URLinvitacion": URLinvitacion,
    attending: 'Pendiente',
    confirmado: null,
    is_verified: false,
    acompanantes: acompanantes,
    mensaje: ''
  };

  try {
    const { data, error } = await supabase
      .from('rsvps')
      .insert([payload])
      .select()
      .single();

    if (!error && data) return data as RSVPRecord;
    console.error('Error de Supabase al crear invitación:', error);
  } catch (err) {
    console.error('Error inesperado al crear la invitación:', err);
  }
  return null;
}

const getStorageFilePath = (publicUrl: string) => {
  if (!publicUrl) return null;
  const urlParts = publicUrl.split('/public/xv_media/'); 
  return urlParts.length > 1 ? urlParts[1] : null;
};

export const updateRSVPAdmin = async (id: string, updates: { nombre: string; email?: string; acompanantes: number }) => {
  try {
    const { error } = await supabase
      .from('rsvps')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error al actualizar RSVP:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error de red al actualizar RSVP:', error);
    return false;
  }
};

export async function getInvitationByToken(tokenOrRoute: string): Promise<RSVPRecord | null> {
  if (!tokenOrRoute) return null;
  const cleanToken = tokenOrRoute.trim();

  try {
    const { data, error } = await supabase
      .from('rsvps')
      .select('*')
      .or(`token.eq.${cleanToken},id.eq.${cleanToken},"URLinvitacion".ilike.%${cleanToken}%`)
      .limit(1)
      .maybeSingle();

    if (!error && data) return data as RSVPRecord;
  } catch (err) {
    console.error('Fallo al obtener la invitación:', err);
  }
  return null;
}

export const confirmGuestRSVP = async (
  id: string,
  data: {
    email: string;
    mensaje: string;
    confirmado: boolean;
    attendeesList: { nombre: string; es_titular: boolean; asistira: boolean }[];
  }
) => {
  try {
    // 1. Actualizar el registro principal de la invitación (Tabla: rsvps)
    const { data: rsvpData, error: rsvpError } = await supabase
      .from('rsvps')
      .update({
        email: data.email,
        mensaje: data.mensaje,
        confirmado: data.confirmado,
        updated_at: new Date().toISOString(), // Actualizamos la fecha de modificación
      })
      .eq('id', id)
      .select()
      .single();

    if (rsvpError) {
      console.error('Error actualizando la tabla principal rsvps:', rsvpError);
      throw rsvpError;
    }

    // 2. Limpiar registros anteriores en caso de que esté modificando su respuesta
    const { error: deleteError } = await supabase
      .from('asistentes_detalle')
      .delete()
      .eq('rsvp_id', id);

    if (deleteError) {
      console.error('Error limpiando los asistentes anteriores:', deleteError);
      throw deleteError;
    }

    // 3. Preparar el arreglo para la inserción masiva (Tabla: asistentes_detalle)
    const detallesInsert = data.attendeesList.map((attendee) => ({
      rsvp_id: id,
      nombre: attendee.nombre,
      es_titular: attendee.es_titular,
      asistira: attendee.asistira,
    }));

    // 4. Insertar todos los asistentes de un solo golpe
    const { error: insertError } = await supabase
      .from('asistentes_detalle')
      .insert(detallesInsert);

    if (insertError) {
      console.error('Error insertando los detalles de asistentes:', insertError);
      throw insertError;
    }

    // Retornamos los datos actualizados al frontend
    return rsvpData;
    
  } catch (error) {
    console.error('Error crítico al procesar la confirmación RSVP:', error);
    throw error;
  }
};

export async function deleteRSVP(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('rsvps').delete().eq('id', id);
    if (!error) return true;
    
    console.error('Error al borrar RSVP en Supabase:', error);
    return false;
  } catch (err) {
    console.error('Excepción al borrar RSVP:', err);
    return false;
  }
}

// 3. Gallery Photos (CERO CACHÉ)
export async function fetchGalleryPhotos(): Promise<GalleryPhoto[]> {
  try {
    const { data, error } = await supabase
      .from('gallery_photos')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Si la base de datos está vacía y quieres usar tus fotos por defecto, 
      // puedes descomentar la siguiente línea:
      // if (data.length === 0) return DEFAULT_GALLERY;
      
      return data as GalleryPhoto[];
    }
    console.error('Error al consultar fotos de la galería:', error);
  } catch (err) {
    console.error('Fallo de red al obtener fotos:', err);
  }
  return [];
}

export async function addGalleryPhoto(
  photo: { url: string; caption?: string; category?: string }
): Promise<GalleryPhoto | null> {
  
  const payload = {
    url: photo.url,
    caption: photo.caption || '',
    category: photo.category || 'General'
  };

  try {
    const { data, error } = await supabase
      .from('gallery_photos')
      .insert([payload])
      .select()
      .single();

    if (!error && data) return data as GalleryPhoto;
    console.error('Error de Supabase al agregar foto:', error);
  } catch (err) {
    console.error('Error inesperado al agregar foto:', err);
  }
  
  return null;
}

export const deleteGalleryPhoto = async (id: string, imageUrl: string) => {
  try {
    const filePath = getStorageFilePath(imageUrl);

    if (filePath) {
      const { error: storageError } = await supabase.storage
        .from('xv_media')
        .remove([filePath]);

      if (storageError) {
        console.error('Error al borrar el archivo del storage:', storageError);
        return false; 
      }
    }

    const { error: dbError } = await supabase
      .from('gallery_photos')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('Error al borrar el registro de la base de datos:', dbError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error de red al eliminar foto:', error);
    return false;
  }
};

// 4. Admin Posts / Announcements (CERO CACHÉ)
export async function fetchAdminPosts(): Promise<AdminPost[]> {
  try {
    const { data, error } = await supabase
      .from('admin_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Opcional: si quieres mostrar el DEFAULT_POST cuando no hay nada
      // if (data.length === 0) return DEFAULT_POSTS;
      
      return data as AdminPost[];
    }
    console.error('Error al consultar posts:', error);
  } catch (err) {
    console.error('Fallo de red al obtener posts:', err);
  }
  return [];
}

export async function createAdminPost(
  post: { title: string; content: string; image_url?: string }
): Promise<AdminPost | null> {
  
  const payload = {
    title: post.title,
    content: post.content,
    image_url: post.image_url || null
  };

  try {
    const { data, error } = await supabase
      .from('admin_posts')
      .insert([payload])
      .select()
      .single();

    if (!error && data) return data as AdminPost;
    console.error('Error de Supabase al crear post:', error);
  } catch (err) {
    console.error('Error inesperado al crear el post:', err);
  }
  
  return null;
}

export async function deleteAdminPost(id: string, imageUrl: string): Promise<boolean> {
  try {
    if (imageUrl) {
      const filePath = getStorageFilePath(imageUrl);

      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('xv_media')
          .remove([filePath]);

        if (storageError) {
          console.error('Error al borrar el archivo del storage:', storageError);
          return false; 
        }
      }
    }
  
    const { error } = await supabase.from('admin_posts').delete().eq('id', id);
    if (!error) return true;
    
    console.error('Error al borrar post en Supabase:', error);
    return false;
  } catch (err) {
    console.error('Excepción al borrar post:', err);
    return false;
  }
}

// 5. Audio Tracks Management (CERO CACHÉ)
export async function fetchAudioTracks(): Promise<AudioTrack[]> {
  try {
    const { data, error } = await supabase
      .from('audio_tracks')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data as AudioTrack[];
    }
    console.error('Error al consultar pistas de audio:', error);
  } catch (err) {
    console.error('Fallo de red al obtener audios:', err);
  }
  return [];
}

export async function addAudioTrack(file: File, customTitle?: string, setAsMain: boolean = true): Promise<AudioTrack | null> {
  // Asumo que uploadFileToSupabaseStorage viene en el último bloque
  const uploadedUrl = await uploadFileToSupabaseStorage(file, 'xv_media');
  if (!uploadedUrl) {
    console.error('No se pudo subir el archivo de audio a Storage');
    return null;
  }

  const title = customTitle || file.name.replace(/\.[^/.]+$/, '');
  
  const payload = {
    title,
    url: uploadedUrl,
    is_main: setAsMain
  };

  try {
    const { data, error } = await supabase
      .from('audio_tracks')
      .insert([payload])
      .select()
      .single();

    if (error || !data) {
      console.error('Error de Supabase al insertar track:', error);
      return null;
    }

    const newTrack = data as AudioTrack;

    if (setAsMain) {
      await selectMainAudioTrack(newTrack);
    }

    return newTrack;
  } catch (err) {
    console.error('Error inesperado al agregar audio:', err);
    return null;
  }
}

export async function selectMainAudioTrack(track: AudioTrack): Promise<boolean> {
  try {
    // 1. Actualizamos la tabla event_details para que el frontend lo lea rápido
    const eventDetails = await fetchEventDetails();
    if (eventDetails) {
      const updatedDetails = {
        ...eventDetails,
        background_music_url: track.url,
        background_music_title: track.title
      };
      await updateEventDetails(updatedDetails);
    }

    // 2. Le quitamos la etiqueta "principal" a todas las DEMÁS canciones
    await supabase
      .from('audio_tracks')
      .update({ is_main: false })
      .neq('id', track.id); // Aquí usamos el filtro correcto en lugar de 'dummy'

    // 3. Se la ponemos a la canción elegida
    await supabase
      .from('audio_tracks')
      .update({ is_main: true })
      .eq('id', track.id);

    return true;
  } catch (err) {
    console.error('Excepción al cambiar la canción principal:', err);
    return false;
  }
}

export async function deleteAudioTrack(id: string, trackUrl: string): Promise<boolean> {
  try {
    const filePath = getStorageFilePath(trackUrl);

    if (filePath) {
      const { error: storageError } = await supabase.storage
        .from('xv_media')
        .remove([filePath]);

      if (storageError) {
        console.error('Error al borrar el archivo del storage:', storageError);
        return false; 
      }
    }

    const { error } = await supabase.from('audio_tracks').delete().eq('id', id);
    if (!error) return true;
    
    console.error('Error al borrar audio en Supabase:', error);
    return false;
  } catch (err) {
    console.error('Excepción al borrar audio:', err);
    return false;
  }
}

// 6. Supabase Storage File Upload Helper (SEGURO Y SIN FALLBACKS PELIGROSOS)
export async function uploadFileToSupabaseStorage(
  file: File, 
  bucketName: string = 'xv_media'
): Promise<string | null> {

  if (!supabase) {
    console.error('El cliente de Supabase no está inicializado.');
    return null;
  }

  try {
    // Generamos un nombre único y limpio para el archivo
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const cleanFileName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${Date.now()}_${cleanFileName}.${fileExt}`;

    // Intentamos subir el archivo
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, { 
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error al subir el archivo a Storage:', uploadError.message);
      return null; // Fallamos limpiamente, sin inventar datos
    }

    // Si se subió, pedimos la URL pública
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    if (urlData?.publicUrl) {
      return urlData.publicUrl;
    }
    
    console.error('No se pudo generar la URL pública del archivo.');
    return null;

  } catch (err) {
    console.error('Excepción al intentar subir el archivo a Supabase:', err);
    return null;
  }
}
