import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Calendar, MapPin, Heart, Music, Mail, CheckCircle2, ChevronDown, AlertCircle } from 'lucide-react';
import { EventDetails, GalleryPhoto, AdminPost, RSVPRecord } from './types';
import { fetchEventDetails, fetchGalleryPhotos, fetchAdminPosts, getInvitationByToken, supabase } from './lib/supabase';
import { EnvelopeCover } from './components/EnvelopeCover';
import { AudioPlayer } from './components/AudioPlayer';
import { CountdownTimer } from './components/CountdownTimer';
import { EventDetailsSection } from './components/EventDetailsSection';
import { PhotoGallery } from './components/PhotoGallery';
import { RSVPSection } from './components/RSVPSection';
import { AnnouncementsSection } from './components/AnnouncementsSection';
import { AdminPanel } from './components/AdminPanel';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showEnvelope, setShowEnvelope] = useState(true);
  const [autoPlayTriggered, setAutoPlayTriggered] = useState(false);

  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);

  const [activeInvitation, setActiveInvitation] = useState<RSVPRecord | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  
  // NUEVO ESTADO: null = verificando, true = pase VIP, false = rebotado
  const [isValidLink, setIsValidLink] = useState<boolean | null>(null);

  const secretAdminRoute = ((import.meta as any).env || {}).VITE_ADMIN_PATH || '/admin-panel-secret';

  // Separamos la carga de datos masivos para llamarla SOLO si está invitado
  const loadData = async () => {
    try {
      const [details, photoList, postList] = await Promise.all([
        fetchEventDetails(),
        fetchGalleryPhotos(),
        fetchAdminPosts(),
      ]);
      setEventDetails(details);
      setPhotos(photoList);
      setPosts(postList);
    } catch (err) {
      console.error('Error loading invitation data:', err);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);

      const hash = window.location.hash || '';
      const search = window.location.search || '';
      const pathname = window.location.pathname || '';

      const normalizedAdminRoute = secretAdminRoute.startsWith('/') ? secretAdminRoute : '/' + secretAdminRoute;
      const cleanAdminRoute = normalizedAdminRoute.replace(/^\//, '');

      // 1. Detectar si estamos en la ruta del administrador
      if (
        hash.includes(cleanAdminRoute) || 
        pathname.includes(cleanAdminRoute) || 
        search.includes('admin') ||
        hash.includes('admin-panel-secret')
      ) {
        setIsAdminOpen(true);
        setIsValidLink(true); // El admin siempre tiene permiso de ver
        await loadData();
        setIsLoading(false);
        return;
      }

      setIsAdminOpen(false);

      // 2. Lógica para detectar token de invitación en la URL
      let invToken = '';
      if (hash.includes('invitacion/')) invToken = hash.split('invitacion/')[1];
      else if (search.includes('invitation=')) invToken = new URLSearchParams(search).get('invitation') || '';
      else if (hash.startsWith('#inv-')) invToken = hash.replace('#', '');
      else if (search.includes('id=')) invToken = new URLSearchParams(search).get('id') || '';

      // 3. Si no hay token, bloqueamos la entrada directamente
      if (!invToken) {
        setIsValidLink(false);
        setIsLoading(false);
        return;
      }

      // 4. Si hay token, lo validamos con Supabase
      try {
        const inv = await getInvitationByToken(invToken);
        if (inv) {
          setActiveInvitation(inv);
          setIsValidLink(true);
          await loadData(); // Carga las fotos/detalles SOLO si pasó la validación
        } else {
          setIsValidLink(false); // Token falso o borrado
        }
      } catch (error) {
        console.error("Error verificando invitación:", error);
        setIsValidLink(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [secretAdminRoute]);

  const handleOpenInvitation = () => {
    setShowEnvelope(false);
    setAutoPlayTriggered(true);
  };

  // 1. PANTALLA DE CARGA
  if (isLoading) {
    return (
      <div className="min-h-screen bg-plumbago flex items-center justify-center text-silver">
        <div className="text-center space-y-3">
          <Sparkles className="w-10 h-10 mx-auto animate-spin" />
          <p className="font-serif-display text-xl text-silver-light">Verificando Invitación Especial...</p>
        </div>
      </div>
    );
  }

  // 2. MODO ADMINISTRADOR (PANTALLA COMPLETA)
  if (isAdminOpen) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminPanel
          isOpen={true}
          onClose={() => {
            window.location.hash = '';
            window.location.search = '';
            setIsAdminOpen(false);
          }}
          onEventUpdated={loadData}
        />
      </div>
    );
  }

  // 3. PANTALLA "ACCESO DENEGADO" (NUEVO)
  if (isValidLink === false) {
    return (
      <div className="min-h-screen bg-plumbago flex flex-col items-center justify-center text-silver-light p-6">
        <div className="bg-night p-8 rounded-sm shadow-xl border border-plumbago max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-silver-dark mx-auto mb-4 opacity-50" />
          <h1 className="font-serif text-2xl mb-3 text-silver-light">Acceso Reservado</h1>
          <p className="text-silver-light text-sm opacity-80 mb-6 leading-relaxed">
            Esta invitación es personal y privada. Parece que ingresaste sin un enlace válido o tu invitación ha expirado.
          </p>
          <p className="text-xs uppercase tracking-widest text-silver-dark font-medium border-t border-plumbago pt-6">
            Por favor, solicita tu enlace por WhatsApp
          </p>
        </div>
      </div>
    );
  }

  // 4. PANTALLA "BASE DE DATOS VACÍA" (Para invitados)
  if (!eventDetails) {
    return (
      <div className="min-h-screen bg-plumbago flex flex-col items-center justify-center text-silver-light p-6">
        <AlertCircle className="w-12 h-12 text-silver mb-4" />
        <h1 className="font-serif text-3xl mb-2 text-center">Invitación no configurada</h1>
        <p className="text-center mb-8 max-w-md text-sm text-silver-dark">
          Los detalles de este evento aún no han sido publicados. Si eres el administrador, ingresa por tu ruta secreta.
        </p>
      </div>
    );
  }

  // 4. MODO INVITACIÓN NORMAL (Para los invitados, si hay datos)
  return (
    <div className="min-h-screen bg-plumbago text-silver-light font-sans-clean relative selection:bg-silver-dark selection:text-silver-light">
      
      {showEnvelope && (
        <EnvelopeCover
          eventDetails={eventDetails}
          onOpenInvitation={handleOpenInvitation}
        />
      )}

      <AudioPlayer
        audioUrl={eventDetails.background_music_url}
        trackTitle={eventDetails.background_music_title}
        autoPlayTriggered={autoPlayTriggered}
      />

      {/* <header className="sticky top-0 z-30 bg-plumbago/90 backdrop-blur-md border-b border-plumbago-light px-6 sm:px-10 py-4 transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-center">
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-full bg-white border border-silver flex items-center justify-center font-serif text-sm font-light italic text-silver group-hover:scale-105 transition-transform">
              {eventDetails.quinceanera_name?.charAt(0) || 'Nombre Quinceañera'}
            </div>
            <span className="font-sans text-xs uppercase tracking-[0.3em] font-medium text-silver-light">
              {eventDetails.quinceanera_name} • XV Años
            </span>
          </a>
        </div>
      </header> */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center gap-3 px-6 py-2.5 rounded-full bg-night/40 backdrop-blur-md border border-silver/20 shadow-lg shadow-night/10 transition-all duration-300">
        {/* Círculo inicial con la inicial */}
        <div className="w-8 h-8 rounded-full bg-plumbago flex items-center justify-center text-silver-light font-serif text-sm shadow-sm">
          M
        </div>

        {/* Texto del header */}
        <span className="font-sans text-[11px] tracking-[0.25em] uppercase text-silver-light font-medium">
          María José • XV Años
        </span>
      </header>

      <main className="space-y-12 pb-20">
        <section className="relative pt-12 sm:pt-20 pb-12 px-6 text-center max-w-4xl mx-auto overflow-hidden">
          {/* <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-night text-silver-dark px-5 py-2 rounded-full text-[10px] uppercase tracking-[0.4em] font-medium mb-6 border border-plumbago-light"
          >
            <Sparkles className="w-3.5 h-3.5 text-silver" />
            <span>Mis Quince Años</span>
          </motion.div> */}

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-serif text-6xl sm:text-7xl lg:text-8xl plumbago-shimmer title-shadow italic font-light tracking-tight mb-4 leading-tight"
          >
            {eventDetails.quinceanera_name}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-script text-3xl sm:text-4xl mb-8 text-night-soft animate-pulse-soft mt-4"
          >
            {eventDetails.subtitle}
          </motion.p>

          {/* {eventDetails.cover_image_url && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative max-w-2xl mx-auto mb-10 rounded-sm overflow-hidden shadow-xl border border-plumbago-light bg-[#e9e4de]"
            >
              <img
                src={eventDetails.cover_image_url}
                alt={`Mis XV Años - ${eventDetails.quinceanera_name}`}
                referrerPolicy="no-referrer"
                className="w-full h-[350px] sm:h-[450px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-night/70 via-transparent to-transparent flex items-end justify-center p-6 text-white">
                <p className="font-serif text-lg sm:text-xl font-light italic tracking-wider">
                  {new Date(eventDetails.date).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </motion.div>
          )} */}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#rsvp-section"
              className="w-full sm:w-auto golder-shimmer hover:bg-night hover:text-silver text-night font-sans text-[10px] uppercase tracking-[0.2em] px-8 py-4 rounded-sm shadow-md transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4 text-night-soft" />
              <span>Confirmar Asistencia</span>
            </a>
          </div>
        </section>

        <CountdownTimer
          targetDate={eventDetails.date}
          quinceanera_name={eventDetails.quinceanera_name}
        />

        <AnnouncementsSection posts={posts} />
        <EventDetailsSection eventDetails={eventDetails} />
        <PhotoGallery photos={photos} />
        
        <RSVPSection
          activeInvitation={activeInvitation}
          onRSVPSubmitted={loadData}
        />
      </main>

      <footer className="bg-night text-[#f5f2ed] py-14 px-6 text-center border-t border-silver-light">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full border border-silver flex items-center justify-center font-serif text-2xl italic text-silver">
            {eventDetails.quinceanera_name?.charAt(0) || 'Nombre Quinceañera'}
          </div>
          <h4 className="font-serif text-3xl font-light italic text-white">
            {eventDetails.quinceanera_name}
          </h4>
          <p className="font-serif text-base text-[#d4cbbd] italic max-w-lg mx-auto">
            "Gracias por formar parte de los mejores recuerdos de mi vida."
          </p>
          <div className="pt-8 border-t border-silver-light text-center text-xs text-silver-dark font-sans">
            <span className="uppercase tracking-widest text-[10px]">
              © {new Date().getFullYear()} XV Años Digital • {eventDetails.quinceanera_name}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
