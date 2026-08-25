export interface EventDetails {
  id?: string;
  quinceanera_name: string;
  subtitle: string;
  date: string; // ISO format or YYYY-MM-DDTHH:mm
  church_name: string;
  church_address: string;
  church_time: string;
  church_map_url: string;
  hall_name: string;
  hall_address: string;
  hall_time: string;
  hall_map_url: string;
  parents_names: string;
  godparents_names: string;
  dress_code: string;
  gift_registry: string;
  welcomemessage: string;
  background_music_url: string;
  background_music_title: string;
  cover_image_url?: string;
  updated_at?: string;
}

export interface RSVPRecord {
  id: string;
  nombre: string;
  email?: string;
  confirmado?: boolean | null;
  is_verified?: boolean;
  acompanantes?: number;
  mensaje?: string;
  URLinvitacion: string;
  token: string;
  attending?: 'Asistiré' | 'No podré asistir' | 'Pendiente';
  created_at: string;
  updated_at?: string;
}

export interface AttendeesDetails {
  id: number;
  rsvp_id: string;
  nombre: string;
  es_titular?: boolean;
  asistira?: boolean;
}

export interface GalleryPhoto {
  id: string;
  url: string;
  caption: string;
  category?: string;
  created_at: string;
}

export interface AdminPost {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  created_at: string;
}

export interface AudioTrack {
  id: string;
  title: string;
  url: string;
  is_main: boolean;
  created_at: string;
}



// Esta interfaz es para peticiones frontend, se puede quedar como tú la prefieras
export interface RSVPVerificationRequest {
  name: string;
  email: string;
  attending: 'Asistiré' | 'No podré asistir';
  companionsCount: number;
  message?: string;
}
