import React, { useState } from 'react';
import { Share2, Copy, Check, QrCode, MessageCircle, X } from 'lucide-react';

interface ShareModalProps {
  quinceanera_name: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  quinceanera_name,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = window.location.href;

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const whatsappText = encodeURIComponent(
    `✨ ¡Estás cordialmente invitado a la fiesta de XV Años de ${quinceanera_name}! ✨\n\nConfirma tu asistencia y mira la ubicación e información en el siguiente enlace:\n${shareUrl}`
  );

  const whatsappUrl = `https://api.whatsapp.com/send?text=${whatsappText}`;

  return (
    <div className="fixed inset-0 z-50 bg-night/60 backdrop-blur-sm p-4 flex items-center justify-center animate-fadeIn">
      <div className="bg-night border border-plumbago-light rounded-sm p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center">
        
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-silver-dark hover:text-silver-light transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 mx-auto rounded-full border border-silver flex items-center justify-center text-silver mb-3">
          <Share2 className="w-6 h-6" />
        </div>

        <h3 className="font-serif text-2xl text-silver-light font-light italic mb-1">
          Compartir Invitación
        </h3>

        <p className="font-sans text-xs text-silver-light opacity-70 mb-6">
          Envía el enlace a tus familiares y amigos fácilmente
        </p>

        {/* WhatsApp Share Button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full mb-3 py-3.5 px-6 rounded-sm bg-[#25D366] hover:bg-[#20ba5a] text-white font-sans font-medium text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Compartir por WhatsApp</span>
        </a>

        {/* Copy Link Input */}
        <div className="mt-4 flex items-center gap-2 bg-white border border-plumbago-light rounded-sm p-2 pl-3">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="w-full text-xs font-sans text-silver-light focus:outline-none bg-transparent truncate"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 bg-silver-light hover:bg-night text-white font-sans text-[10px] uppercase tracking-wider font-medium px-4 py-2 rounded-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-silver" />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-silver" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>

        {/* QR Code Quick Display */}
        <div className="mt-6 pt-4 border-t border-plumbago-light flex flex-col items-center">
          <p className="text-[10px] font-sans uppercase tracking-[0.2em] text-silver-dark font-medium mb-2">
            Código QR de la Invitación
          </p>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}`}
            alt="Código QR de Invitación"
            className="w-28 h-28 p-1.5 bg-white border border-plumbago-light rounded-sm shadow-sm"
          />
        </div>

      </div>
    </div>
  );
};
