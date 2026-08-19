import React, { useState, useEffect } from 'react';
import { 
  Lock, Key, Music, Upload, Image as ImageIcon, Users, Settings, 
  Trash2, Edit2, Plus, Download, CheckCircle, Search, Save, MessageSquare, 
  X, RefreshCw, Volume2, Sparkles, Database, Link as LinkIcon, Copy, 
  Check, Share2, MessageCircle, LogOut
} from 'lucide-react';
import { EventDetails, RSVPRecord, GalleryPhoto, AdminPost, AudioTrack } from '../types';
// IMPORTANTE: Asegúrate de exportar 'supabase' desde tu archivo lib/supabase.ts
import { 
  supabase,
  fetchEventDetails, updateEventDetails, 
  fetchRSVPs, deleteRSVP, createInvitationLink, updateRSVPAdmin,
  fetchGalleryPhotos, addGalleryPhoto, deleteGalleryPhoto, 
  fetchAdminPosts, createAdminPost, deleteAdminPost, 
  fetchAudioTracks, addAudioTrack, selectMainAudioTrack, deleteAudioTrack,
  uploadFileToSupabaseStorage
} from '../lib/supabase';

interface AdminPanelProps {
  isOpen: boolean; // Aunque ya no es modal, lo mantenemos por la interfaz
  onClose: () => void;
  onEventUpdated: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onClose,
  onEventUpdated,
}) => {
  // --- 1. ESTADOS DE AUTENTICACIÓN REAL ---
  const [email, setEmail] = useState(''); // Añadimos el email para Supabase Auth
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // --- 2. ESTADOS DE NAVEGACIÓN Y DATOS ---
  const [activeTab, setActiveTab] = useState<'rsvps' | 'music' | 'gallery' | 'event' | 'posts'>('rsvps');
  
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [rsvps, setRsvps] = useState<RSVPRecord[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const [newFamilyName, setNewFamilyName] = useState('');
  const [newCompanionsCount, setNewCompanionsCount] = useState(0);
  const [newFamilyEmail, setNewFamilyEmail] = useState('');
  const [createdLink, setCreatedLink] = useState<RSVPRecord | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // Controla cuál registro está en modo "edición"
  const [editingId, setEditingId] = useState(null);

  // Guarda temporalmente los datos mientras se escriben
  const [editFormData, setEditFormData] = useState({ 
    nombre: '', 
    email: '', 
    acompanantes: 0
  });

  const [rsvpSearch, setRsvpSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Estados de formularios (puedes pegarlos tal cual tenías)
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioTitle, setAudioTitle] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoCategory, setPhotoCategory] = useState('Sesión Principal');
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postImageFile, setPostImageFile] = useState<File | null>(null);

  // --- 3. LÓGICA DE SUPABASE AUTH ---
  useEffect(() => {
    // Revisar si ya hay una sesión activa al cargar la página
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
      }
      setIsCheckingAuth(false);
    });
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadAllAdminData();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (data.session) setIsAuthenticated(true);
    } catch (err: any) {
      setAuthError('Correo o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    onClose(); // Nos regresa a la vista de invitado
  };

  // --- 4. FUNCIONES DE CARGA Y GUARDADO ---
  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [details, rsvpList, photoList, postList, audioList] = await Promise.all([
        fetchEventDetails(),
        fetchRSVPs(),
        fetchGalleryPhotos(),
        fetchAdminPosts(),
        fetchAudioTracks()
      ]);
      
      setEventDetails(details);
      setRsvps(rsvpList);
      setPhotos(photoList);
      setPosts(postList);
      setAudioTracks(audioList);
    } catch (error) {
      console.error("Error cargando datos del admin:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEventDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDetails) return;

    setLoading(true);
    setStatusMsg('');

    try {
      if (coverFile) {
        const newCoverUrl = await uploadFileToSupabaseStorage(coverFile);

        if (newCoverUrl) {
          setEventDetails({...eventDetails, cover_image_url: newCoverUrl})
        }
      }

      const success = await updateEventDetails(eventDetails);
      if (success) {
        setStatusMsg('Detalles del evento guardados correctamente.');
        onEventUpdated();
        setTimeout(() => setStatusMsg(''), 3000);
      } else {
        setStatusMsg('Error al guardar los detalles.');
      }
    } catch (error) {
      setStatusMsg('Error inesperado al guardar.');
    } finally {
      setLoading(false);
      setCoverFile(null);
      setCoverPreview(null);
    }
  };

  // --- FUNCIONES DE INVITADOS (RSVPs) ---
  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyName.trim()) return;

    setLoading(true);
    setStatusMsg('');
    try {
      const newInvitation = await createInvitationLink(newFamilyName, newCompanionsCount, newFamilyEmail);
      if (newInvitation) {
        // Actualizamos la lista local inmediatamente
        setRsvps([newInvitation, ...rsvps]);
        setCreatedLink(newInvitation);
        setNewFamilyName('');
        setNewCompanionsCount('');
        setNewFamilyEmail('');
        setStatusMsg('Enlace generado exitosamente.');
        setTimeout(() => setStatusMsg(''), 3000);
      } else {
        setStatusMsg('Error al crear el enlace.');
      }
    } catch (error) {
      console.error('Error:', error);
      setStatusMsg('Hubo un problema de red.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (rsvp: any) => {
    setEditingId(rsvp.id);
    setEditFormData({
      nombre: rsvp.nombre,
      email: rsvp.email || '',
      acompanantes: rsvp.acompanantes || 0
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: string) => {
    const success = await updateRSVPAdmin(id, editFormData);
    if (success) {
      setRsvps(rsvps.map(r => r.id === id ? { ...r, ...editFormData } : r));
      setStatusMsg('Registro actualizado con éxito.');
      setTimeout(() => setStatusMsg(''), 3000);
      setEditingId(null);
    } else {
      alert('Error al guardar los cambios.');
    }
  };

  const handleCopyLink = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLinkId(id);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (err) {
      console.error('Error al copiar al portapapeles', err);
    }
  };

  const handleDeleteRSVP = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este invitado y su enlace?')) return;
    
    const success = await deleteRSVP(id);
    if (success) {
      setRsvps(rsvps.filter(r => r.id !== id));
    } else {
      alert('Hubo un error al intentar eliminar el registro.');
    }
  };

  // --- FUNCIONES DE GALERÍA ---
  const handleUploadPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFile) {
      setStatusMsg('Por favor selecciona una imagen primero.');
      return;
    }

    setLoading(true);
    setStatusMsg('Subiendo imagen al servidor...');
    
    try {
      // 1. Subir la imagen a Storage (bucket 'xv_media')
      const uploadedUrl = await uploadFileToSupabaseStorage(photoFile, 'xv_media');
      
      if (uploadedUrl) {
        setStatusMsg('Imagen subida. Guardando detalles...');
        // 2. Guardar el registro en la base de datos
        const newPhoto = await addGalleryPhoto({
          url: uploadedUrl,
          caption: photoCaption,
          category: photoCategory
        });

        if (newPhoto) {
          setPhotos([newPhoto, ...photos]);
          setPhotoFile(null);
          setPhotoCaption('');
          setPhotoCategory('Sesión Principal');
          setStatusMsg('¡Foto agregada a la galería con éxito!');
          setTimeout(() => setStatusMsg(''), 3000);
        } else {
          setStatusMsg('Error al guardar los detalles de la foto.');
        }
      } else {
        setStatusMsg('Error al subir el archivo de imagen.');
      }
    } catch (error) {
      console.error('Error:', error);
      setStatusMsg('Hubo un problema de red.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhoto = async (id: string, imageUrl: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta foto de la galería?')) return;
    
    // Nota: Esto solo borra el registro de la BD. 
    // Para borrar físicamente el archivo del Storage requiere otra llamada a Supabase, 
    // pero por ahora borrar el registro es suficiente para que no salga en la app.
    const success = await deleteGalleryPhoto(id, imageUrl);
    if (success) {
      setPhotos(photos.filter(p => p.id !== id));
    } else {
      alert('Hubo un error al intentar eliminar la foto.');
    }
  };

  // --- FUNCIONES DE MÚSICA ---
  const handleUploadAudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) {
      setStatusMsg('Por favor selecciona un archivo de audio (.mp3, .wav).');
      return;
    }

    setLoading(true);
    setStatusMsg('Subiendo pista de audio (esto puede tomar unos segundos)...');
    
    try {
      // Si no hay canciones en la lista, la primera se vuelve la principal automáticamente
      const isFirstTrack = audioTracks.length === 0;
      const newTrack = await addAudioTrack(audioFile, audioTitle, isFirstTrack);
      
      if (newTrack) {
        if (isFirstTrack) {
          setAudioTracks([newTrack]);
        } else {
          setAudioTracks([newTrack, ...audioTracks]);
        }
        setAudioFile(null);
        setAudioTitle('');
        setStatusMsg('¡Audio subido correctamente!');
        setTimeout(() => setStatusMsg(''), 3000);
      } else {
        setStatusMsg('Error al subir el archivo de audio.');
      }
    } catch (error) {
      console.error('Error:', error);
      setStatusMsg('Hubo un problema de red al subir.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMainAudio = async (track: AudioTrack) => {
    setLoading(true);
    setStatusMsg('Actualizando canción principal...');
    try {
      const success = await selectMainAudioTrack(track);
      if (success) {
        // Actualizar la lista localmente apagando las demás y encendiendo esta
        // Nota: usamos una validación doble (is_main o isMain) dependiendo de cómo quedó tu types.ts
        setAudioTracks(audioTracks.map(t => ({
          ...t,
          is_main: t.id === track.id,
          isMain: t.id === track.id 
        })));
        
        onEventUpdated(); // Le avisa a la App que hay nueva música
        setStatusMsg('Música principal actualizada con éxito.');
        setTimeout(() => setStatusMsg(''), 3000);
      }
    } catch (error) {
      setStatusMsg('Error al cambiar la pista principal.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAudioTrack = async (id: string, trackUrl: string, isCurrentMain: boolean) => {
    if (isCurrentMain) {
      alert('⚠️ No puedes eliminar la canción principal. Por favor, selecciona otra canción como principal antes de borrar esta.');
      return;
    }
    
    if (!window.confirm('¿Seguro que deseas eliminar esta pista de audio?')) return;
    
    const success = await deleteAudioTrack(id, trackUrl);
    if (success) {
      setAudioTracks(audioTracks.filter(t => t.id !== id));
    } else {
      alert('Hubo un error al intentar eliminar el audio.');
    }
  };

  // --- FUNCIONES DE ANUNCIOS (POSTS) ---
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) {
      setStatusMsg('Por favor completa el título y el contenido.');
      return;
    }

    setLoading(true);
    setStatusMsg('Publicando anuncio...');
    
    try {
      let image_url: string | undefined = undefined;

      // Si hay imagen adjunta, la subimos a Storage primero
      if (postImageFile) {
        const uploaded = await uploadFileToSupabaseStorage(postImageFile, 'xv_media');
        if (uploaded) {
          image_url = uploaded;
        }
      }

      const newPost = await createAdminPost({
        title: postTitle.trim(),
        content: postContent.trim(),
        image_url: image_url
      });

      if (newPost) {
        setPosts([newPost, ...posts]);
        setPostTitle('');
        setPostContent('');
        setPostImageFile(null);
        setStatusMsg('¡Anuncio publicado con éxito!');
        setTimeout(() => setStatusMsg(''), 3000);
      } else {
        setStatusMsg('Error al guardar el anuncio.');
      }
    } catch (error) {
      console.error('Error:', error);
      setStatusMsg('Hubo un problema de red.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (id: string, imageUrl: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este anuncio?')) return;
    
    const success = await deleteAdminPost(id, imageUrl);
    if (success) {
      setPosts(posts.filter(p => p.id !== id));
    } else {
      alert('Hubo un error al intentar eliminar el anuncio.');
    }
  };

  // --- 5. MÉTRICAS (Tal cual las tenías) ---
  const totalRSVPs = rsvps.length;
  const attendingRSVPs = rsvps.filter(r => r.confirmado === true || r.attending === 'Asistiré');
  const totalGuestsCount = attendingRSVPs.reduce((sum, r) => sum + 1 + (r.acompanantes || 0), 0);
  const notAttendingCount = rsvps.filter(r => r.confirmado === false || r.attending === 'No podré asistir').length;
  const pendingCount = rsvps.filter(r => r.confirmado === null && (r.attending === 'Pendiente' || !r.attending)).length;

  const filteredRSVPs = rsvps.filter(r => 
    (r.nombre || '').toLowerCase().includes(rsvpSearch.toLowerCase()) || 
    (r.email || '').toLowerCase().includes(rsvpSearch.toLowerCase())
  );

  // --- 6. RENDERIZADO CONDICIONAL ---
  if (isCheckingAuth) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando panel...</div>;
  }

  // PANTALLA DE LOGIN A PANTALLA COMPLETA
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f5f2ed] flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-xl border border-[#d4cbbd]">
          <div className="flex justify-center mb-6">
            <Lock className="w-12 h-12 text-[#d4af37]" />
          </div>
          <h2 className="text-2xl font-serif text-center text-[#3d3d3d] mb-6">Acceso Administrativo</h2>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#d4af37] focus:border-[#d4af37]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#d4af37] focus:border-[#d4af37]"
                required
              />
            </div>
            
            {authError && <p className="text-red-500 text-sm text-center">{authError}</p>}
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#3d3d3d] text-white py-3 rounded hover:bg-[#1a1a1a] transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Iniciar Sesión'}
            </button>
          </form>
          
          <button onClick={onClose} className="w-full text-center text-sm text-gray-500 mt-4 hover:text-gray-800">
            Volver a la invitación
          </button>
        </div>
      </div>
    );
  }

  // PANEL DE CONTROL PRINCIPAL A PANTALLA COMPLETA
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* SIDEBAR NAVEGACIÓN */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 p-4 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-8 px-2 py-4 border-b">
          <Settings className="w-6 h-6 text-[#d4af37]" />
          <h1 className="font-serif text-xl text-[#3d3d3d]">Panel XV Años</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <button onClick={() => setActiveTab('rsvps')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'rsvps' ? 'bg-[#f5f2ed] text-[#d4af37] font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Users className="w-5 h-5" /> Invitados
          </button>
          <button onClick={() => setActiveTab('event')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'event' ? 'bg-[#f5f2ed] text-[#d4af37] font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Sparkles className="w-5 h-5" /> Detalles del Evento
          </button>
          <button onClick={() => setActiveTab('gallery')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'gallery' ? 'bg-[#f5f2ed] text-[#d4af37] font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
            <ImageIcon className="w-5 h-5" /> Galería de Fotos
          </button>
          <button onClick={() => setActiveTab('music')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'music' ? 'bg-[#f5f2ed] text-[#d4af37] font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Music className="w-5 h-5" /> Música
          </button>
          <button onClick={() => setActiveTab('posts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'posts' ? 'bg-[#f5f2ed] text-[#d4af37] font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
            <MessageSquare className="w-5 h-5" /> Anuncios
          </button>
        </nav>

        <div className="pt-4 border-t border-gray-200 mt-auto">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="w-5 h-5" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        
        {/* PESTAÑA INVITADOS */}
        {activeTab === 'rsvps' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
              <h2 className="text-2xl font-serif text-[#3d3d3d]">Gestión de Invitados</h2>
              
              {/* Barra de Búsqueda */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar familia..."
                  value={rsvpSearch}
                  onChange={(e) => setRsvpSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:ring-[#d4af37] focus:border-[#d4af37]"
                />
              </div>
            </div>

            {/* Tarjetas de Métricas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <span className="text-3xl font-serif text-[#3d3d3d]">{totalRSVPs}</span>
                <span className="text-xs text-gray-500 uppercase tracking-wider mt-1">Total Enlaces</span>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100 flex flex-col items-center text-center">
                <span className="text-3xl font-serif text-green-600">{totalGuestsCount}</span>
                <span className="text-xs text-green-700/70 uppercase tracking-wider mt-1">Personas Asistirán</span>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-yellow-100 flex flex-col items-center text-center">
                <span className="text-3xl font-serif text-yellow-600">{pendingCount}</span>
                <span className="text-xs text-yellow-700/70 uppercase tracking-wider mt-1">Pendientes</span>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-red-100 flex flex-col items-center text-center">
                <span className="text-3xl font-serif text-red-600">{notAttendingCount}</span>
                <span className="text-xs text-red-700/70 uppercase tracking-wider mt-1">No Asistirán</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Columna Izquierda: Formulario Crear Enlace */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <LinkIcon className="w-5 h-5 text-[#d4af37]" /> Nuevo Enlace
                  </h3>

                  <form onSubmit={handleCreateLink} className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Nombre (Ej: Familia López)</label>
                      <input 
                        type="text" 
                        value={newFamilyName}
                        onChange={(e) => setNewFamilyName(e.target.value)}
                        placeholder="Familia / Invitado"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#d4af37] focus:border-[#d4af37] text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Acompañantes</label>
                      <input 
                        type="number" 
                        min="0"
                        value={newCompanionsCount} 
                        onChange={(e) => setNewCompanionsCount(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#d4af37] focus:border-[#d4af37] text-sm"
                        title="Número de acompañantes"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Email (Opcional)</label>
                      <input 
                        type="email" 
                        value={newFamilyEmail}
                        onChange={(e) => setNewFamilyEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#d4af37] focus:border-[#d4af37] text-sm"
                      />
                    </div>
                    
                    <button 
                      type="submit" 
                      disabled={loading || !newFamilyName.trim()}
                      className="w-full bg-[#3d3d3d] hover:bg-[#1a1a1a] text-white py-2 rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Generar Enlace
                    </button>
                    {statusMsg && (
                      <p className={`text-xs text-center mt-2 ${statusMsg.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
                        {statusMsg}
                      </p>
                    )}
                  </form>
                </div>
              </div>

              {/* Columna Derecha: Lista de Invitados */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[500px]">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                  <h3 className="font-medium text-gray-800">Lista de Enlaces</h3>
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                    {filteredRSVPs.length} registros
                  </span>
                </div>
                
                <div className="overflow-y-auto flex-1 p-0">
                  {filteredRSVPs.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>No hay invitados registrados.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {filteredRSVPs.map((rsvp) => (
                        <li key={rsvp.id} className="p-4 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        {editingId === rsvp.id ? (
                          <div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <input 
                                  type="text" 
                                  value={editFormData.nombre} 
                                  onChange={(e) => setEditFormData({...editFormData, nombre: e.target.value})}
                                  className="w-full border border-[#d4cbbd] p-1.5 rounded focus:outline-none focus:border-[#d4af37]"
                                  placeholder="Nombre"
                                />
                                <input 
                                  type="email" 
                                  value={editFormData.email} 
                                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                                  className="w-full border border-[#d4cbbd] p-1.5 rounded focus:outline-none focus:border-[#d4af37]"
                                  placeholder="Correo (opcional)"
                                />
                                <input 
                                  type="number" 
                                  min="0"
                                  value={editFormData.acompanantes} 
                                  onChange={(e) => setEditFormData({...editFormData, acompanantes: Number(e.target.value)})}
                                  className="w-16 border border-[#d4cbbd] p-1.5 rounded focus:outline-none focus:border-[#d4af37]"
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                              <button 
                                onClick={() => handleSaveEdit(rsvp.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Editar invitado"
                              >
                                Guardar
                              </button>
                              <button 
                                onClick={handleCancelEdit}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Cancelar Edición"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900">{rsvp.nombre},</span>
                                <span className="font-medium text-gray-900">{rsvp.acompanantes} acompañantes</span>
                                {/* BADGES DE STATUS */}
                                {rsvp.confirmado === true && (
                                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-medium">
                                    <CheckCircle className="w-3 h-3" /> Asistirá (+{rsvp.acompanantes})
                                  </span>
                                )}
                                {rsvp.confirmado === false && (
                                  <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-medium">
                                    <X className="w-3 h-3" /> No Asistirá
                                  </span>
                                )}
                                {rsvp.confirmado === null && (
                                  <span className="inline-flex items-center bg-yellow-100 text-yellow-700 text-[10px] px-2 py-0.5 rounded-full font-medium">
                                    Pendiente
                                  </span>
                                )}
                              </div>

                              {rsvp.mensaje && (
                                <p className="text-sm text-gray-600 flex items-start gap-1 mt-2 bg-gray-50 p-2 rounded border border-gray-100 italic">
                                  <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
                                  "{rsvp.mensaje}"
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                              <button
                                onClick={() => handleCopyLink(rsvp.URLinvitacion, rsvp.id)}
                                className="p-2 text-gray-500 hover:text-[#d4af37] hover:bg-[#faf9f7] rounded transition-colors tooltip relative group"
                                title="Copiar Enlace Mágico"
                              >
                                {copiedLinkId === rsvp.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                              </button>
                              <a 
                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`¡Hola! Te comparto tu invitación digital: ${window.location.origin}/?invitation=${rsvp.token}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Enviar por WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => handleStartEdit(rsvp)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Editar invitado"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteRSVP(rsvp.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Eliminar invitado"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA EVENTO */}
        {activeTab === 'event' && eventDetails && (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif text-[#3d3d3d] border-b pb-2">Detalles del Evento</h2>
            <form onSubmit={handleSaveEventDetails} className="space-y-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              {/* Sección Principal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Quinceañera</label>
                  <input
                    type="text"
                    value={eventDetails.quinceanera_name}
                    onChange={(e) => setEventDetails({...eventDetails, quinceanera_name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#d4af37] focus:border-[#d4af37]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo / Frase Corta</label>
                  <input
                    type="text"
                    value={eventDetails.subtitle}
                    onChange={(e) => setEventDetails({...eventDetails, subtitle: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#d4af37] focus:border-[#d4af37]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora del Evento</label>
                  <input
                    type="datetime-local"
                    value={eventDetails.date}
                    onChange={(e) => setEventDetails({...eventDetails, date: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#d4af37] focus:border-[#d4af37]"
                    required
                  />
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Sección Ceremonia Religiosa */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#d4af37]" /> Ceremonia Religiosa
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Iglesia</label>
                    <input
                      type="text"
                      value={eventDetails.church_name}
                      onChange={(e) => setEventDetails({...eventDetails, church_name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#d4af37] focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de la Iglesia</label>
                    <input
                      type="text"
                      value={eventDetails.church_address}
                      onChange={(e) => setEventDetails({...eventDetails, church_address: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#d4af37] focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora (Ej: 17:00 HRS)</label>
                    <input
                      type="text"
                      value={eventDetails.church_time}
                      onChange={(e) => setEventDetails({...eventDetails, church_time: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#d4af37] focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link de Google Maps (Iglesia)</label>
                    <input
                      type="url"
                      value={eventDetails.church_map_url}
                      onChange={(e) => setEventDetails({...eventDetails, church_map_url: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#d4af37] focus:border-[#d4af37]"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Sección Recepción */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#d4af37]" /> Recepción / Salón
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Salón</label>
                    <input
                      type="text"
                      value={eventDetails.hall_name}
                      onChange={(e) => setEventDetails({...eventDetails, hall_name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#d4af37] focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección del Salón</label>
                    <input
                      type="text"
                      value={eventDetails.hall_address}
                      onChange={(e) => setEventDetails({...eventDetails, hall_address: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#d4af37] focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora (Ej: 19:00 HRS)</label>
                    <input
                      type="text"
                      value={eventDetails.hall_time}
                      onChange={(e) => setEventDetails({...eventDetails, hall_time: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#d4af37] focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link de Google Maps (Salón)</label>
                    <input
                      type="url"
                      value={eventDetails.hall_map_url}
                      onChange={(e) => setEventDetails({...eventDetails, hall_map_url: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#d4af37] focus:border-[#d4af37]"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Información Adicional */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#d4af37]" /> Información Adicional
                </h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje de Bienvenida</label>
                    <textarea
                      value={eventDetails.welcomemessage}
                      onChange={(e) => setEventDetails({...eventDetails, welcomemessage: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#d4af37] focus:border-[#d4af37]"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Padres</label>
                      <input
                        type="text"
                        value={eventDetails.parents_names}
                        onChange={(e) => setEventDetails({...eventDetails, parents_names: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#d4af37] focus:border-[#d4af37]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Padrinos</label>
                      <input
                        type="text"
                        value={eventDetails.godparents_names}
                        onChange={(e) => setEventDetails({...eventDetails, godparents_names: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#d4af37] focus:border-[#d4af37]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Código de Vestimenta</label>
                      <input
                        type="text"
                        value={eventDetails.dress_code}
                        onChange={(e) => setEventDetails({...eventDetails, dress_code: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#d4af37] focus:border-[#d4af37]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mesa de Regalos / Sobres</label>
                      <input
                        type="text"
                        value={eventDetails.gift_registry}
                        onChange={(e) => setEventDetails({...eventDetails, gift_registry: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#d4af37] focus:border-[#d4af37]"
                      />
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium text-gray-800">Imagen de Portada</h3>
                      </div>
                      <div className="w-full">
                        <div className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50 aspect-square">
                          <img 
                            src={coverPreview || eventDetails.cover_image_url} 
                            alt="Foto de portada" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">Archivo de Imagen</label>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setCoverFile(file);
                                setCoverPreview(URL.createObjectURL(file));
                              }
                            }}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-[#f5f2ed] file:text-[#3d3d3d] hover:file:bg-[#d4cbbd] transition-colors"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón Guardar y Status */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <p className={`text-sm ${statusMsg.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
                  {statusMsg}
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#3d3d3d] hover:bg-[#1a1a1a] text-white px-6 py-2 rounded flex items-center gap-2 transition-colors disabled:opacity-70"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PESTAÑA GALERÍA */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif text-[#3d3d3d] border-b pb-2 flex items-center gap-2">
              <ImageIcon className="w-6 h-6 text-[#d4af37]" /> Galería de Fotos
            </h2>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Formulario de Subida */}
              <div className="xl:col-span-1">
                <form onSubmit={handleUploadPhoto} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4 sticky top-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Agregar Nueva Foto</h3>
                  
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Archivo de Imagen</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setPhotoFile(e.target.files[0]);
                        }
                      }}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-[#f5f2ed] file:text-[#3d3d3d] hover:file:bg-[#d4cbbd] transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Categoría</label>
                    <select 
                      value={photoCategory}
                      onChange={(e) => setPhotoCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#d4af37] focus:border-[#d4af37] text-sm"
                    >
                      <option value="Sesión Principal">Sesión Principal</option>
                      <option value="Detalles">Detalles (Vestido, Flores...)</option>
                      <option value="Familiar">Familia y Amigos</option>
                      <option value="Momentos">Momentos Especiales</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Pie de Foto (Opcional)</label>
                    <input 
                      type="text" 
                      value={photoCaption}
                      onChange={(e) => setPhotoCaption(e.target.value)}
                      placeholder="Ej: Preparativos antes de la iglesia..."
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#d4af37] focus:border-[#d4af37] text-sm"
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={loading || !photoFile}
                    className="w-full bg-[#3d3d3d] hover:bg-[#1a1a1a] text-white py-2 rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Subir a la Galería
                  </button>

                  {statusMsg && (
                    <p className={`text-xs text-center mt-2 ${statusMsg.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
                      {statusMsg}
                    </p>
                  )}
                </form>
              </div>

              {/* Grid de Fotos Existentes */}
              <div className="xl:col-span-2">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-gray-800">Fotos Publicadas ({photos.length})</h3>
                  </div>

                  {photos.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                      <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>Aún no has subido fotos a la galería.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {photos.map((photo) => (
                        <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50 aspect-square">
                          <img 
                            src={photo.url} 
                            alt={photo.caption || 'Foto de galería'} 
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Overlay on hover */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 text-white">
                            <div className="text-xs">
                              <span className="bg-[#d4af37] px-2 py-0.5 rounded-full">{photo.category}</span>
                            </div>
                            
                            <div>
                              {photo.caption && <p className="text-sm line-clamp-2 mb-2">{photo.caption}</p>}
                              <button
                                onClick={() => handleDeletePhoto(photo.id, photo.url)}
                                className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full transition-colors self-start"
                                title="Eliminar Foto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          </div>
        )}

        {/* PESTAÑA MÚSICA */}
        {activeTab === 'music' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif text-[#3d3d3d] border-b pb-2 flex items-center gap-2">
              <Music className="w-6 h-6 text-[#d4af37]" /> Música de Fondo
            </h2>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Columna Izquierda: Formulario de Subida */}
              <div className="xl:col-span-1">
                <form onSubmit={handleUploadAudio} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4 sticky top-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Subir Nueva Pista</h3>
                  
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Archivo de Audio (MP3, WAV)</label>
                    <input 
                      type="file" 
                      accept="audio/mp3,audio/wav,audio/mpeg"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setAudioFile(e.target.files[0]);
                          // Auto-completar título si está vacío
                          if (!audioTitle) {
                            setAudioTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
                          }
                        }
                      }}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-[#f5f2ed] file:text-[#3d3d3d] hover:file:bg-[#d4cbbd] transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Título de la Canción</label>
                    <input 
                      type="text" 
                      value={audioTitle}
                      onChange={(e) => setAudioTitle(e.target.value)}
                      placeholder="Ej: Vals de las Mariposas"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#d4af37] focus:border-[#d4af37] text-sm"
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={loading || !audioFile}
                    className="w-full bg-[#3d3d3d] hover:bg-[#1a1a1a] text-white py-2 rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Subir Audio
                  </button>

                  {statusMsg && (
                    <p className={`text-xs text-center mt-2 ${statusMsg.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
                      {statusMsg}
                    </p>
                  )}
                </form>
              </div>

              {/* Columna Derecha: Lista de Pistas */}
              <div className="xl:col-span-2 space-y-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Pistas Disponibles</h3>
                  
                  {audioTracks.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                      <Volume2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>No has subido ninguna pista de audio.</p>
                      <p className="text-sm mt-1">La invitación se reproducirá en silencio.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {audioTracks.map((track) => {
                        // Verificamos ambas propiedades por si el snake_case o camelCase está activo
                        const isMainTrack = track.is_main || track.isMain; 

                        return (
                          <div 
                            key={track.id} 
                            className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                              isMainTrack ? 'bg-[#faf9f7] border-[#d4af37]' : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-full ${isMainTrack ? 'bg-[#d4af37]/20 text-[#d4af37]' : 'bg-gray-100 text-gray-400'}`}>
                                <Music className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className={`font-medium ${isMainTrack ? 'text-[#3d3d3d]' : 'text-gray-700'}`}>
                                  {track.title || 'Pista sin título'}
                                </h4>
                                {isMainTrack && (
                                  <span className="text-xs font-medium text-[#d4af37] flex items-center gap-1 mt-1">
                                    <CheckCircle className="w-3 h-3" /> Reproducción Activa
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {!isMainTrack && (
                                <button
                                  onClick={() => handleSelectMainAudio(track)}
                                  className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                                >
                                  Usar como principal
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteAudioTrack(track.id, track.url, !!isMainTrack)}
                                disabled={isMainTrack}
                                className={`p-2 rounded transition-colors ${
                                  isMainTrack 
                                    ? 'text-gray-300 cursor-not-allowed' 
                                    : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                }`}
                                title={isMainTrack ? 'No puedes eliminar la pista activa' : 'Eliminar pista'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          </div>
        )}

        {/* PESTAÑA ANUNCIOS */}
        {activeTab === 'posts' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif text-[#3d3d3d] border-b pb-2 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-[#d4af37]" /> Anuncios y Mensajes
            </h2>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Formulario de Creación */}
              <div className="xl:col-span-1">
                <form onSubmit={handleCreatePost} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4 sticky top-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Nuevo Anuncio</h3>
                  
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Título del Aviso</label>
                    <input 
                      type="text" 
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      placeholder="Ej: Aviso importante sobre el itinerario"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#d4af37] focus:border-[#d4af37] text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Contenido del Mensaje</label>
                    <textarea 
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      rows={4}
                      placeholder="Escribe aquí los detalles para tus invitados..."
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#d4af37] focus:border-[#d4af37] text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Imagen Ilustrativa (Opcional)</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setPostImageFile(e.target.files[0]);
                        }
                      }}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-[#f5f2ed] file:text-[#3d3d3d] hover:file:bg-[#d4cbbd] transition-colors"
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={loading || !postTitle.trim() || !postContent.trim()}
                    className="w-full bg-[#3d3d3d] hover:bg-[#1a1a1a] text-white py-2 rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Publicar Anuncio
                  </button>

                  {statusMsg && (
                    <p className={`text-xs text-center mt-2 ${statusMsg.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
                      {statusMsg}
                    </p>
                  )}
                </form>
              </div>

              {/* Lista de Anuncios Existentes */}
              <div className="xl:col-span-2">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Anuncios Publicados ({posts.length})</h3>

                  {posts.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>No hay anuncios publicados todavía.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {posts.map((post) => {
                        // Verificamos ambas opciones (image_url o image_url) por seguridad de tipos
                        const image_url = post.image_url || post.image_url;

                        return (
                          <div key={post.id} className="p-4 rounded-lg border border-gray-200 bg-white flex flex-col sm:flex-row gap-4 items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-serif text-lg text-[#3d3d3d]">{post.title}</h4>
                                <span className="text-[10px] text-gray-400">
                                  {new Date(post.created_at || Date.now()).toLocaleDateString('es-ES', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">{post.content}</p>
                              
                              {image_url && (
                                <div className="mt-3 max-w-xs rounded overflow-hidden border border-gray-100">
                                  <img src={image_url} alt={post.title} className="w-full h-32 object-cover" />
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => handleDeletePost(post.id, post.image_url)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors self-end sm:self-start"
                              title="Eliminar Anuncio"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
