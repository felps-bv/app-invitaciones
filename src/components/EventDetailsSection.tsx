import React from 'react';
import { Church, PartyPopper, MapPin, Shirt, Gift, Users, Heart } from 'lucide-react';
import { EventDetails } from '../types';

interface EventDetailsSectionProps {
  eventDetails: EventDetails;
}

export const EventDetailsSection: React.FC<EventDetailsSectionProps> = ({ eventDetails }) => {
  // Opcional: Aunque no se usa en el renderizado actual, protegemos la fecha por si la usas después
  const formattedDate = eventDetails?.date ? new Date(eventDetails.date).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : '';

  return (
    <section className="py-12 px-4 max-w-5xl mx-auto space-y-10">
      {/* Parents & Godparents Honor Card */}
      <div className="bg-night border border-plumbago-light rounded-sm p-8 sm:p-10 text-center shadow-sm relative overflow-hidden">
        <div className="w-12 h-12 mx-auto rounded-full border border-silver flex items-center justify-center mb-4 text-silver">
          <Heart className="w-6 h-6 fill-current text-silver" />
        </div>

        <h3 className="font-serif text-2xl sm:text-3xl text-silver-light font-light italic mb-3">
          Con la Bendición de Mis Padres y Padrinos
        </h3>

        <p className="font-sans text-xs sm:text-sm text-silver-light opacity-80 max-w-2xl mx-auto italic mb-8 leading-relaxed">
          "{eventDetails?.welcomemessage}"
        </p>

        <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-plumbago-light text-center">
          <div>
            <h4 className="font-sans text-[10px] uppercase tracking-[0.2em] text-silver-dark font-medium mb-2">
              Mis Padres
            </h4>
            <p className="font-serif text-lg text-silver-light">
              {eventDetails?.parents_names}
            </p>
          </div>

          <div>
            <h4 className="font-sans text-[10px] uppercase tracking-[0.2em] text-silver-dark font-medium mb-2">
              Mis Padrinos
            </h4>
            <p className="font-serif text-lg text-silver-light">
              {eventDetails?.godparents_names}
            </p>
          </div>
        </div>
      </div>

      {/* Ceremony & Reception Cards */}
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Religious Ceremony Card */}
        <div className="bg-white border border-plumbago-light rounded-sm p-8 shadow-sm flex flex-col justify-between hover:border-silver transition-all duration-300">
          <div>
            <div className="w-12 h-12 rounded-full border border-silver flex items-center justify-center text-silver mb-6">
              <Church className="w-6 h-6" />
            </div>

            <span className="inline-block text-silver-dark font-sans text-[10px] uppercase tracking-[0.2em] font-medium mb-2">
              Ceremonia Religiosa
            </span>

            <h4 className="font-serif text-2xl text-silver-light font-light italic mb-2">
              {eventDetails?.church_name}
            </h4>

            <p className="font-serif text-base text-silver font-normal mb-3 border-l-2 border-silver pl-3 italic">
              {eventDetails?.church_time}
            </p>

            <p className="font-sans text-xs text-silver-light opacity-70 leading-relaxed mb-6">
              {eventDetails?.church_address}
            </p>
          </div>

          <a
            href={eventDetails?.church_map_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 border border-silver-light text-silver-light hover:bg-silver-light hover:text-white font-sans text-[10px] uppercase tracking-[0.2em] py-3 px-6 rounded-sm transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-silver" />
            <span>Ver Ubicación en Mapa</span>
          </a>
        </div>

        {/* Reception Hall Card */}
        <div className="bg-white border border-plumbago-light rounded-sm p-8 shadow-sm flex flex-col justify-between hover:border-silver transition-all duration-300">
          <div>
            <div className="w-12 h-12 rounded-full border border-silver flex items-center justify-center text-silver mb-6">
              <PartyPopper className="w-6 h-6" />
            </div>

            <span className="inline-block text-silver-dark font-sans text-[10px] uppercase tracking-[0.2em] font-medium mb-2">
              Fiesta & Recepción
            </span>

            <h4 className="font-serif text-2xl text-silver-light font-light italic mb-2">
              {eventDetails?.hall_name}
            </h4>

            <p className="font-serif text-base text-silver font-normal mb-3 border-l-2 border-silver pl-3 italic">
              {eventDetails?.hall_time}
            </p>

            <p className="font-sans text-xs text-silver-light opacity-70 leading-relaxed mb-6">
              {eventDetails?.hall_address}
            </p>
          </div>

          <a
            href={eventDetails?.hall_map_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-silver-light text-white hover:bg-night font-sans text-[10px] uppercase tracking-[0.2em] py-3 px-6 rounded-sm transition-colors shadow-sm"
          >
            <MapPin className="w-3.5 h-3.5 text-silver" />
            <span>Ver Ubicación del Salón</span>
          </a>
        </div>

      </div>

      {/* Additional Details Grid: Dress Code & Gift Registry */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Dress Code */}
        <div className="bg-night border border-plumbago-light rounded-sm p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full border border-silver flex items-center justify-center text-silver shrink-0">
            <Shirt className="w-5 h-5" />
          </div>
          <div>
            <h5 className="font-serif text-lg text-silver-light mb-1 italic">
              Código de Vestimenta
            </h5>
            <p className="font-sans text-xs text-silver-light opacity-80">
              {eventDetails?.dress_code}
            </p>
          </div>
        </div>

        {/* Gift Registry / Envelope Rain */}
        <div className="bg-night border border-plumbago-light rounded-sm p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full border border-silver flex items-center justify-center text-silver shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h5 className="font-serif text-lg text-silver-light mb-1 italic">
              Sugerencia de Regalo
            </h5>
            <p className="font-sans text-xs text-silver-light opacity-80">
              {eventDetails?.gift_registry}
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
