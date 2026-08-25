import React from 'react';
import { Bell, Sparkles, Calendar } from 'lucide-react';
import { AdminPost } from '../types';

interface AnnouncementsSectionProps {
  posts: AdminPost[];
}

export const AnnouncementsSection: React.FC<AnnouncementsSectionProps> = ({ posts }) => {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="py-12 px-4 max-w-4xl mx-auto">
      <div className="bg-night border border-plumbago-light rounded-sm p-6 sm:p-10 shadow-sm">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full border border-silver flex items-center justify-center text-silver">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-2xl text-silver-light italic font-light">
              Avisos e Información Importante
            </h3>
            <p className="font-sans text-xs text-silver-light opacity-70">
              Publicaciones importantes para los invitados
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white border border-plumbago-light rounded-sm p-5 shadow-sm hover:border-silver transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-serif text-lg font-light italic text-silver-light">
                  {post.title}
                </h4>
                <div className="flex items-center gap-1 text-[10px] font-sans text-silver-dark uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5 text-silver" />
                  <span>{new Date(post.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>

              <p className="font-sans text-xs text-silver-light opacity-80 leading-relaxed mb-3">
                {post.content}
              </p>

              {post.image_url && (
                <div className="mt-3 rounded-sm overflow-hidden border border-plumbago-light max-h-72">
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
