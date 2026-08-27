import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Mail, User, CheckCircle2, AlertCircle, RefreshCw, Send, Sparkles, Heart } from 'lucide-react';
import { RSVPRecord } from '../types';
import { confirmGuestRSVP } from '../lib/supabase';

interface RSVPSectionProps {
  activeInvitation?: RSVPRecord | null;
  onRSVPSubmitted?: () => void;
}

// NUEVO: Interfaz local para controlar los inputs de la lista dinámica
export interface AttendeeInput {
  nombre: string;
  es_titular: boolean;
  asistira: boolean;
}

export const RSVPSection: React.FC<RSVPSectionProps> = ({ activeInvitation, onRSVPSubmitted }) => {
  // Form states
  const [email, setEmail] = useState(activeInvitation?.email || '');
  const [message, setMessage] = useState(activeInvitation?.mensaje || '');
  
  // NUEVO: Estado principal que manejará todos los lugares (Titular + Acompañantes)
  const [attendees, setAttendees] = useState<AttendeeInput[]>([]);

  // Workflow states: 'form' | 'success'
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [confirmedRSVP, setConfirmedRSVP] = useState<RSVPRecord | null>(null);

  // Status & loading indicators
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Generar los campos dinámicos al cargar la invitación
  useEffect(() => {
    if (activeInvitation) {
      setEmail(activeInvitation.email || '');
      setMessage(activeInvitation.mensaje || '');
      
      // Armar el arreglo: 1 Titular + N Acompañantes
      const numAcompanantes = activeInvitation.acompanantes || 0;
      const initialAttendees: AttendeeInput[] = [
        // El titular toma el nombre que el admin registró
        { nombre: activeInvitation.nombre || '', es_titular: true, asistira: true }
      ];

      // Los acompañantes empiezan con el nombre vacío
      for (let i = 0; i < numAcompanantes; i++) {
        initialAttendees.push({ nombre: '', es_titular: false, asistira: true });
      }
      
      setAttendees(initialAttendees);
    }
  }, [activeInvitation]);

  // NUEVO: Manejador para actualizar un campo específico de un asistente
  const handleAttendeeChange = (index: number, field: keyof AttendeeInput, value: string | boolean) => {
    const newAttendees = [...attendees];
    newAttendees[index] = { ...newAttendees[index], [field]: value };
    setAttendees(newAttendees);
  };

  const handleConfirmRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validación: Si alguien tiene marcado "asistirá", debe tener un nombre escrito
    const missingNames = attendees.some(a => a.asistira && !a.nombre.trim());
    if (missingNames) {
      setErrorMsg('Por favor asegúrate de escribir el nombre de todas las personas que asistirán.');
      return;
    }

    setLoading(true);

    try {
      let rsvpResult: RSVPRecord;

      if (activeInvitation) {
        const identifier = activeInvitation.id;
        
        // El estatus general del enlace será "true" si al menos una persona asiste
        const alguienAsiste = attendees.some(a => a.asistira);

        // Pasamos todo el bloque de datos a supabase.ts
        rsvpResult = await confirmGuestRSVP(identifier, {
          email: email.trim().toLowerCase(),
          mensaje: message.trim(),
          confirmado: alguienAsiste,
          attendeesList: attendees // Mandamos el arreglo completo a la base de datos
        });
      } else {
        throw new Error("No se encontró la invitación activa.");
      }

      setConfirmedRSVP(rsvpResult);
      setStep('success');

      if (onRSVPSubmitted) onRSVPSubmitted();

      // Confeti solo si hay al menos un asistente
      if (attendees.some(a => a.asistira)) {
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
      setEmail('');
      setMessage('');
    }
    // Reiniciamos los checkboxes a true pero mantenemos los nombres
    setAttendees(attendees.map(a => ({ ...a, asistira: true })));
    setErrorMsg('');
    setStep('form');
  };

  return (
    <section id="rsvp-section" className="py-12 px-4 max-w-3xl mx-auto scroll-mt-20">
      <div className="bg-night border border-plumbago-light rounded-sm p-8 sm:p-12 shadow-sm relative overflow-hidden">
        
        {/* Banner if personalized link loaded */}
        {activeInvitation && (
          <div className="mb-8 p-4 bg-secondary border border-silver rounded-sm flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-silver-dark shrink-0 mt-0.5" />
            <div>
              <p className="font-serif text-lg text-night font-light italic">
                ¡Bienvenid@, {activeInvitation.nombre}!
              </p>
              <p className="font-sans text-xs text-night opacity-80 mt-0.5">
                Esta es tu invitación personal. Por favor confirma tu asistencia y la de tus acompañantes a continuación.
              </p>
            </div>
          </div>
        )}

        {/* Decorative Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto rounded-full border border-silver flex items-center justify-center text-silver mb-3">
            <Mail className="w-6 h-6" />
          </div>

          <span className="font-sans text-[18px] uppercase tracking-[0.3em] text-silver-dark font-medium">
            Confirma tu Asistencia
          </span>

          <h3 className="font-serif text-3xl sm:text-4xl text-silver-light font-light italic mt-1">
            RSVP
          </h3>

          <p className="font-sans text-xs text-silver-light opacity-70 mt-1">
            Nos llenaría de alegría contar con su presencia en este día tan especial
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
            
            {/* NUEVO: Lista dinámica de Titular y Acompañantes */}
            <div className="pt-2">
              <div className="flex justify-between items-end mb-3">
                <label className="text-[12px] uppercase tracking-wider block opacity-90 text-silver-light">
                  Pases Asignados ({attendees.length}) <span className="text-silver">*</span>
                </label>
                <span className="text-[10px] text-silver-dark uppercase tracking-wider">
                  Marca quiénes asistirán
                </span>
              </div>
              
              <div className="space-y-3 bg-white p-4 border border-plumbago rounded-sm">
                {attendees.map((attendee, index) => (
                  <div key={index} className="flex items-center gap-3 pb-3 border-b border-[#faf9f7] last:border-0 last:pb-0">
                    
                    {/* Checkbox de asistencia */}
                    <label className="flex-shrink-0 cursor-pointer relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={attendee.asistira}
                        onChange={(e) => handleAttendeeChange(index, 'asistira', e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="w-6 h-6 border-2 border-plumbago-light rounded-sm peer-checked:bg-silver peer-checked:border-silver transition-all flex items-center justify-center">
                        {attendee.asistira && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                    </label>

                    {/* Input de Nombre */}
                    <div className="relative flex-1">
                      <User className="w-4 h-4 absolute left-0 top-1/2 -translate-y-1/2 text-silver-dark ml-2" />
                      <input
                        type="text"
                        required={attendee.asistira} // Solo es obligatorio si marcó que sí asiste
                        readOnly={attendee.es_titular && Boolean(activeInvitation?.nombre)}
                        placeholder={attendee.es_titular ? "Nombre del titular" : `Nombre del acompañante ${index}`}
                        value={attendee.nombre}
                        onChange={(e) => handleAttendeeChange(index, 'nombre', e.target.value)}
                        className={`w-full pl-7 bg-secondary border-b border-plumbago-light py-2 text-sm text-night focus:outline-none focus:border-silver transition-all ${
                          attendee.es_titular && activeInvitation?.nombre ? 'opacity-80 cursor-not-allowed font-medium' : ''
                        } ${!attendee.asistira ? 'opacity-40 line-through' : ''}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Field: Correo Electrónico */}
            <div>
              <label htmlFor="rsvp-email-input" className="text-[12px] uppercase tracking-wider mb-1 block opacity-90 text-silver-light">
                Correo Electrónico (Opcional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-0 top-1/2 -translate-y-1/2 text-silver-dark ml-2" />
                <input
                  id="rsvp-email-input"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-7 bg-secondary border-b border-plumbago-light py-2 text-sm text-night focus:outline-none focus:border-silver transition-all"
                />
              </div>
            </div>

            {/* Field: Mensaje de felicitación opcional */}
            <div className="pt-2">
              <label htmlFor="rsvp-message-input" className="text-[12px] uppercase tracking-wider mb-1 block opacity-90 text-silver-light">
                Mensaje o Felicitación para la Quinceañera (Opcional)
              </label>
              <textarea
                id="rsvp-message-input"
                rows={2}
                placeholder="Escribe un mensaje cariñoso..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-secondary border-b border-plumbago-light py-2 text-sm text-night focus:outline-none focus:border-silver resize-none px-2"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full bg-silver-light text-white text-[18px] uppercase tracking-[0.2em] py-4 rounded-sm hover:bg-night transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-silver" />
                  <span>Guardando Confirmación...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-silver" />
                  <span>Confirmar Asistencia</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: SUCCESS SCREEN MODIFICADO */}
        {step === 'success' && (
          <div className="bg-white p-8 border border-plumbago rounded-lg shadow-sm text-center space-y-6">
            <div className="w-12 h-12 mx-auto rounded-full border border-silver flex items-center justify-center text-silver mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h4 className="font-serif text-2xl text-silver-light italic font-light mb-1">
                {confirmedRSVP?.confirmado 
                  ? '¡Confirmación Registrada!' 
                  : 'Gracias por avisarnos'}
              </h4>
              <p className="font-sans text-xs text-silver-dark uppercase tracking-wider font-medium">
                Tu respuesta ha sido guardada en la lista oficial
              </p>
            </div>

            <div className="bg-night p-5 border border-plumbago-light rounded-sm text-left max-w-sm mx-auto space-y-2 text-xs text-silver-light">
              <div className="flex justify-between border-b border-plumbago-light pb-2">
                <span className="opacity-90">Familia / Titular:</span>
                <span className="font-serif font-bold text-silver-light">{activeInvitation?.nombre}</span>
              </div>
              <div className="flex justify-between border-b border-plumbago-light pb-2">
                <span className="opacity-90">Estado general:</span>
                <span className="font-semibold text-silver">
                  {confirmedRSVP?.confirmado ? 'Asistirán' : 'No asistirán'}
                </span>
              </div>
              
              {/* Desglose de los asistentes confirmados */}
              {confirmedRSVP?.confirmado && (
                <div className="border-b border-plumbago-light pb-2 pt-1">
                  <span className="opacity-90 block mb-1">Lugares Confirmados:</span>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {attendees.filter(a => a.asistira).map((a, i) => (
                      <li key={i} className="font-medium text-silver-light">{a.nombre}</li>
                    ))}
                  </ul>
                </div>
              )}

              {confirmedRSVP?.mensaje && (
                <div className="flex justify-between pt-1">
                  <span className="opacity-90">Mensaje:</span>
                  <span className="font-mono text-[11px] truncate max-w-[180px]">{confirmedRSVP?.mensaje}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleResetForm}
              className="inline-flex items-center gap-2 border border-silver-light text-silver-light font-sans text-[18px] uppercase tracking-[0.2em] py-3 px-6 rounded-sm hover:bg-silver-light hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-silver" />
              <span>Modificar mi respuesta</span>
            </button>
          </div>
        )}

      </div>
    </section>
  );
};