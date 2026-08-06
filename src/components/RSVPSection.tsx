import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Mail, User, CheckCircle2, AlertCircle, RefreshCw, Send, Sparkles, Heart } from 'lucide-react';
import { RSVPRecord } from '../types';
import { confirmGuestRSVP, createInvitationLink } from '../lib/supabase';

interface RSVPSectionProps {
  activeInvitation?: RSVPRecord | null;
  onRSVPSubmitted?: () => void;
}

export const RSVPSection: React.FC<RSVPSectionProps> = ({ activeInvitation, onRSVPSubmitted }) => {
  // Form state
  const [name, setName] = useState(activeInvitation?.nombre || '');
  const [email, setEmail] = useState(activeInvitation?.email || '');
  const [attending, setAttending] = useState<'Asistiré' | 'No podré asistir'>('Asistiré');
  const [companionsCount, setCompanionsCount] = useState<number>(activeInvitation?.acompanantes || 0);
  const [message, setMessage] = useState(activeInvitation?.mensaje || '');

  // Workflow states: 'form' | 'success'
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [confirmedRSVP, setConfirmedRSVP] = useState<RSVPRecord | null>(null);

  // Status & loading indicators
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Synchronize when activeInvitation loads o cambia
  useEffect(() => {
    if (activeInvitation) {
      setName(activeInvitation?.nombre || '');
      setEmail(activeInvitation?.email || '');
      
      if (activeInvitation?.attending && activeInvitation?.attending !== 'Pendiente') {
        setAttending(activeInvitation.attending as 'Asistiré' | 'No podré asistir');
      }

      if (activeInvitation?.mensaje) {
        setMessage(activeInvitation.mensaje);
      }
    }
  }, [activeInvitation]);

  const handleConfirmRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Por favor ingresa tu nombre completo o de familia.');
      return;
    }

    setLoading(true);

    try {
      let rsvpResult: RSVPRecord;

      if (activeInvitation) {
        // Confirmar link de invitación existente (protegemos la lectura del ID o token)
        const identifier = activeInvitation?.id || activeInvitation?.token;
        if (!identifier) throw new Error("No se encontró el identificador de la invitación.");

        rsvpResult = await confirmGuestRSVP(identifier, {
          email: email.trim().toLowerCase(),
          attending,
          mensaje: message.trim()
        });
      }

      setConfirmedRSVP(rsvpResult);
      setStep('success');

      if (onRSVPSubmitted) {
        onRSVPSubmitted();
      }

      // Celebración con confeti
      if (attending === 'Asistiré') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#d4af37', '#b5a48b', '#ffffff', '#3d3d3d']
        });
      }
    } catch (err) {
      console.error('Error confirming RSVP:', err);
      setErrorMsg('Ocurrió un error al guardar tu respuesta. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    if (!activeInvitation) {
      setName('');
      setEmail('');
      setMessage('');
    }
    setAttending('Asistiré');
    setErrorMsg('');
    setStep('form');
  };

  return (
    <section id="rsvp-section" className="py-12 px-4 max-w-3xl mx-auto scroll-mt-20">
      <div className="bg-[#faf9f7] border border-[#d4cbbd] rounded-sm p-8 sm:p-12 shadow-sm relative overflow-hidden">
        
        {/* Banner if personalized link loaded */}
        {activeInvitation && (
          <div className="mb-8 p-4 bg-[#e9e4de] border border-[#d4af37] rounded-sm flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
            <div>
              <p className="font-serif text-lg text-[#1a1a1a] font-light italic">
                ¡Bienvenida, {activeInvitation?.nombre}!
              </p>
              <p className="font-sans text-xs text-[#3d3d3d] opacity-80 mt-0.5">
                Esta es tu invitación personal. Por favor confirma tu asistencia a continuación.
              </p>
            </div>
          </div>
        )}

        {/* Decorative Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto rounded-full border border-[#d4af37] flex items-center justify-center text-[#d4af37] mb-3">
            <Mail className="w-6 h-6" />
          </div>

          <span className="font-sans text-[18px] uppercase tracking-[0.3em] text-[#b5a48b] font-medium">
            Confirma tu Asistencia
          </span>

          <h3 className="font-serif text-3xl sm:text-4xl text-[#1a1a1a] font-light italic mt-1">
            RSVP
          </h3>

          <p className="font-sans text-xs text-[#3d3d3d] opacity-70 mt-1">
            Nos llenaría de alegría contar con tu presencia en este día tan especial
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-sm bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: FORM STATE */}
        {step === 'form' && (
          <form onSubmit={handleConfirmRSVP} className="space-y-6 font-sans">
            
            {/* Field 1: Nombre Completo o de Familia */}
            <div>
              <label htmlFor="rsvp-name-input" className="text-[18px] uppercase tracking-wider mb-1 block opacity-90 text-[#3d3d3d]">
                Nombre de la Familia / Invitado <span className="text-[#d4af37]">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-0 top-1/2 -translate-y-1/2 text-[#b5a48b]" />
                <input
                  id="rsvp-name-input"
                  type="text"
                  required
                  readOnly={Boolean(activeInvitation?.nombre)}
                  placeholder="Ej. Familia García o Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full pl-7 bg-transparent border-b border-[#d4cbbd] py-2 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#d4af37] transition-all ${
                    activeInvitation?.nombre ? 'opacity-80 cursor-not-allowed font-medium' : ''
                  }`}
                />
              </div>
            </div>

            {/* Field 2: Correo Electrónico */}
            <div>
              <label htmlFor="rsvp-email-input" className="text-[18px] uppercase tracking-wider mb-1 block opacity-90 text-[#3d3d3d]">
                Correo Electrónico (Opcional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-0 top-1/2 -translate-y-1/2 text-[#b5a48b]" />
                <input
                  id="rsvp-email-input"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-7 bg-transparent border-b border-[#d4cbbd] py-2 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#d4af37] transition-all"
                />
              </div>
            </div>

            {/* Field 3: Radio Option ("Asistiré" / "No podré asistir") */}
            <div className="pt-2">
              <label className="text-[18px] uppercase tracking-wider mb-3 block opacity-90 text-[#3d3d3d]">
                ¿Asistirás? <span className="text-[#d4af37]">*</span>
              </label>
              <div className="flex gap-6">
                
                {/* Option 1: Asistiré */}
                <label className="flex items-center text-sm cursor-pointer text-[#1a1a1a]">
                  <div
                    onClick={() => setAttending('Asistiré')}
                    className={`w-4 h-4 rounded-full border mr-2 flex items-center justify-center ${
                      attending === 'Asistiré' ? 'border-[#d4af37]' : 'border-[#d4cbbd]'
                    }`}
                  >
                    {attending === 'Asistiré' && (
                      <div className="w-2 h-2 rounded-full bg-[#d4af37]" />
                    )}
                  </div>
                  <span>Asistiré con gusto</span>
                </label>

                {/* Option 2: No podré asistir */}
                <label className="flex items-center text-sm cursor-pointer opacity-70 text-[#3d3d3d]">
                  <div
                    onClick={() => setAttending('No podré asistir')}
                    className={`w-4 h-4 rounded-full border mr-2 flex items-center justify-center ${
                      attending === 'No podré asistir' ? 'border-[#d4af37]' : 'border-[#d4cbbd]'
                    }`}
                  >
                    {attending === 'No podré asistir' && (
                      <div className="w-2 h-2 rounded-full bg-[#d4af37]" />
                    )}
                  </div>
                  <span>No podré asistir</span>
                </label>

              </div>
            </div>

            {/* Field 5: Mensaje de felicitación opcional */}
            <div className="pt-2">
              <label htmlFor="rsvp-message-input" className="text-[18px] uppercase tracking-wider mb-1 block opacity-90 text-[#3d3d3d]">
                Mensaje o Felicitación para la Quinceañera (Opcional)
              </label>
              <textarea
                id="rsvp-message-input"
                rows={2}
                placeholder="Escribe un mensaje cariñoso..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-transparent border-b border-[#d4cbbd] py-2 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#d4af37] resize-none"
              />
            </div>

            <div className="pt-2">
              <label className="block text-sm text-[#3d3d3d] mb-1 font-medium">
                Pases asignados
              </label>
              <input
                type="text"
                disabled
                value={`${1 + activeInvitation.acompanantes} persona(s)`}
                className="w-full p-3 border border-[#e9e4de] rounded bg-[#f5f2ed] text-[#8a8a8a] cursor-not-allowed opacity-80"
              />
              <p className="text-xs text-[#8a8a8a] mt-1">
                Esta invitación es válida para este número de personas.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full bg-[#3d3d3d] text-white text-[18px] uppercase tracking-[0.2em] py-4 rounded-sm hover:bg-[#1a1a1a] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#d4af37]" />
                  <span>Guardando Confirmación...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-[#d4af37]" />
                  <span>Confirmar Asistencia</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: SUCCESS SCREEN */}
        {step === 'success' && (
          <div className="bg-white p-8 border border-[#e9e4de] rounded-lg shadow-sm text-center space-y-6">
            <div className="w-12 h-12 mx-auto rounded-full border border-[#d4af37] flex items-center justify-center text-[#d4af37] mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h4 className="font-serif text-2xl text-[#1a1a1a] italic font-light mb-1">
                {confirmedRSVP?.attending === 'Asistiré'
                  ? '¡Confirmación Registrada!'
                  : 'Gracias por avisarnos'}
              </h4>
              <p className="font-sans text-xs text-[#b5a48b] uppercase tracking-wider font-medium">
                Tu respuesta ha sido guardada en la lista oficial
              </p>
            </div>

            <div className="bg-[#faf9f7] p-5 border border-[#d4cbbd] rounded-sm text-left max-w-sm mx-auto space-y-2 text-xs text-[#3d3d3d]">
              <div className="flex justify-between border-b border-[#d4cbbd] pb-2">
                <span className="opacity-90">Invitado:</span>
                <span className="font-serif font-bold text-[#1a1a1a]">{confirmedRSVP?.nombre}</span>
              </div>
              <div className="flex justify-between border-b border-[#d4cbbd] pb-2">
                <span className="opacity-90">Estado:</span>
                <span className="font-semibold text-[#d4af37]">
                  {confirmedRSVP?.confirmado ? 'Confirmado' : confirmedRSVP?.attending}
                </span>
              </div>
              {confirmedRSVP?.attending === 'Asistiré' && (
                <div className="flex justify-between border-b border-[#d4cbbd] pb-2">
                  <span className="opacity-90">Acompañantes:</span>
                  <span className="font-bold">{confirmedRSVP?.acompanantes} persona(s)</span>
                </div>
              )}
              {confirmedRSVP?.email && (
                <div className="flex justify-between border-b border-[#d4cbbd] pb-2">
                  <span className="opacity-90">Correo:</span>
                  <span className="font-mono text-[11px] truncate max-w-[180px]">{confirmedRSVP?.email}</span>
                </div>
              )}
              {confirmedRSVP?.message && (
                <div className="flex justify-between border-b border-[#d4cbbd] pb-2">
                  <span className="opacity-90">Mensaje:</span>
                  <span className="font-mono text-[11px] truncate max-w-[180px]">{confirmedRSVP?.message}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleResetForm}
              className="inline-flex items-center gap-2 border border-[#3d3d3d] text-[#3d3d3d] font-sans text-[18px] uppercase tracking-[0.2em] py-3 px-6 rounded-sm hover:bg-[#3d3d3d] hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Modificar mi respuesta</span>
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
