import React, { useState } from 'react';
import { Camera, Maximize2, X, Sparkles } from 'lucide-react';
import { GalleryPhoto } from '../types';

interface PhotoGalleryProps {
  photos: GalleryPhoto[];
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos = [] }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [activePhoto, setActivePhoto] = useState<GalleryPhoto | null>(null);

  // Extraemos las categorías de forma segura
  const categories = [
    'Todas', 
    ...Array.from(new Set(photos.map(p => p?.category || 'General').filter(Boolean)))
  ];

  const filteredPhotos = selectedCategory === 'Todas'
    ? photos
    : photos.filter(p => (p?.category || 'General') === selectedCategory);

  return (
    <section className="py-12 px-4 max-w-6xl mx-auto bg-plumbago shadow rounded">
      <div className="text-center mb-10">
        <div className="w-12 h-12 mx-auto rounded-full border border-silver-light flex items-center justify-center text-silver-light mb-3">
          <Camera className="w-6 h-6" />
        </div>

        <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-white font-medium">
          Recuerdos e Imágenes
        </span>

        <h3 className="font-serif text-3xl sm:text-4xl text-white font-light italic mt-1">
          Galería de Fotos
        </h3>

        <p className="font-sans text-xs text-white opacity-70 mt-1">
          Un vistazo a la emoción de esta bella etapa
        </p>

        {/* Category Filter Buttons */}
        {categories.length > 2 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-sm font-sans text-[10px] uppercase tracking-[0.2em] font-medium transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-silver text-white shadow-sm'
                    : 'bg-[#e9e4de] text-silver hover:bg-[#d4cbbd]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Photos Masonry / Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredPhotos.map((photo) => (
          <div
            key={photo?.id}
            onClick={() => setActivePhoto(photo)}
            className="group relative h-72 rounded-sm overflow-hidden bg-[#e9e4de] border border-plumbago-light cursor-pointer shadow-sm hover:shadow-lg transition-all duration-300"
          >
            <img
              src={photo?.url || (photo as any)?.image_url} // Fallback por si en BD se llama image_url
              alt={photo?.caption || 'Foto XV Años'}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain bg-secondary group-hover:scale-105 transition-transform duration-500"
            />
            
            {/* Hover overlay with zoom icon and caption */}
            <div className="absolute inset-0 bg-gradient-to-t from-night/80 via-night/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end text-white">
              <p className="font-serif text-sm font-light italic line-clamp-2">
                {photo?.caption}
              </p>
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-silver font-sans mt-1">
                <Maximize2 className="w-3 h-3" />
                <span>Ampliar foto</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPhotos.length === 0 && (
        <div className="text-center py-12 text-silver-dark font-serif text-base italic">
          No hay fotografías en esta categoría por el momento.
        </div>
      )}

      {/* Lightbox Zoom Modal */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 bg-night/90 backdrop-blur-md p-4 flex items-center justify-center animate-fadeIn">
          <button
            type="button"
            onClick={() => setActivePhoto(null)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full border border-white/20 hover:bg-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="max-w-4xl max-h-[90vh] flex flex-col items-center">
            <img
              src={activePhoto?.url || (activePhoto as any)?.image_url}
              alt={activePhoto?.caption || 'Foto ampliada'}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[75vh] object-contain rounded-sm shadow-2xl border border-white/20"
            />
            {activePhoto?.caption && (
              <p className="mt-4 text-center font-serif text-lg text-[#f5f2ed] italic max-w-xl">
                {activePhoto?.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
