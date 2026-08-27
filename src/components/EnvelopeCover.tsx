import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Music, Heart, MailOpen } from 'lucide-react';
import { EventDetails } from '../types';

interface EnvelopeCoverProps {
  eventDetails: EventDetails;
  onOpenInvitation: () => void;
}

export const EnvelopeCover: React.FC<EnvelopeCoverProps> = ({
  eventDetails,
  onOpenInvitation,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenClick = () => {
    setIsOpen(true);
    setTimeout(() => {
      onOpenInvitation();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-silver-light/60 backdrop-blur-md p-4 overflow-hidden">
      {/* mode="wait" asegura que la primera animación termine antes de iniciar la segunda */}
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.div
            key="envelope-container"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="relative w-full max-w-lg mx-auto"
          >
            {/* Envelope Outer Card */}
            <div className="relative bg-secondary shadow-2xl p-8 sm:p-12 text-center flex flex-col items-center border border-plumbago transform -rotate-1 rounded-sm">
              
              {/* Wax Seal */}
              <div className="absolute -top-8 w-16 h-16 bg-silver rounded-full border-4 border-plumbago shadow-md flex items-center justify-center text-gold text-2xl font-serif italic">
                {eventDetails?.quinceanera_name?.charAt(0) || 'V'}
              </div>

              <div className="border border-plumbago w-full py-8 sm:py-10 px-6 flex flex-col items-center justify-center">
                <span className="text-xs uppercase tracking-[0.4em] text-night font-medium mb-3">
                  Mis Quince Años
                </span>

                <h2 className="text-3xl sm:text-4xl font-light mb-6 italic font-serif text-night">
                  Estás invitado
                </h2>

                <p className="text-xs font-sans text-night opacity-70 mb-8 max-w-xs">
                  Te invito a celebrar conmigo una noche mágica llena de sueños y alegría.
                </p>

                {/* Opening Trigger */}
                <button
                  type="button"
                  onClick={handleOpenClick}
                  className="px-8 py-3.5 border border-silver-light text-silver-light text-[11px] uppercase tracking-[0.3em] font-medium bg-night hover:bg-plumbago hover:text-white transition-colors rounded-sm flex items-center gap-2 cursor-pointer"
                >
                  <MailOpen className="w-4 h-4 text-silver" />
                  <span>Abrir Invitación</span>
                </button>
              </div>

            </div>
          </motion.div>
        ) : (
          <motion.div
            key="opening-animation"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            // absolute inset-0 garantiza el centrado perfecto independientemente del contenedor padre
            className="absolute inset-0 flex flex-col items-center justify-center text-center text-white"
          >
            <div className="w-20 h-20 rounded-full bg-silver/20 border border-silver flex items-center justify-center mb-4 animate-ping">
              <Heart className="w-10 h-10 text-silver fill-current" />
            </div>
            <p className="font-serif text-2xl tracking-widest text-white italic font-light z-10">
              Abriendo invitación...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
