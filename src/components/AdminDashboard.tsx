import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, Plus, Trash2, Edit3, Save, BookOpen, Eye, Heart, 
  MessageSquare, ArrowLeft, User, RefreshCw, X, Calendar, Send, Sparkles, Check,
  Video, Image
} from 'lucide-react';
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc, addDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Story, Comment, Genre } from '../types';

interface AdminDashboardProps {
  onBackToSite: () => void;
}

export default function AdminDashboard({ onBackToSite }: AdminDashboardProps) {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [authError, setAuthError] = useState('');

  // Stories management
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  
  // Custom states for editing story metrics, content & comments
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editGenre, setEditGenre] = useState<Genre>('terror');
  const [editSynopsis, setEditSynopsis] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editReads, setEditReads] = useState<number>(0);
  const [editLikes, setEditLikes] = useState<number>(0);
  const [editingComments, setEditingComments] = useState<Comment[]>([]);
  
  // New custom comment inputs
  const [newCommentAuthor, setNewCommentAuthor] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  
  // New story creation
  const [showCreator, setShowCreator] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('Marcos Furtado');
  const [newGenre, setNewGenre] = useState<Genre>('terror');
  const [newSynopsis, setNewSynopsis] = useState('');
  const [newContent, setNewContent] = useState('');
  const [initialReads, setInitialReads] = useState(0);
  const [initialLikes, setInitialLikes] = useState(0);
  const [creatorError, setCreatorError] = useState('');
  const [submittingStory, setSubmittingStory] = useState(false);

  // Saving states
  const [savingMetrics, setSavingMetrics] = useState(false);

  // Banner config states
  const [bannerVideoUrl, setBannerVideoUrl] = useState('https://videotourl.com/videos/1783618865377-6e6b9359-de45-4807-9f71-4e756d0d2351.mp4');
  const [bannerUseVideo, setBannerUseVideo] = useState(true);
  const [savingBanner, setSavingBanner] = useState(false);
  const [saveBannerSuccess, setSaveBannerSuccess] = useState(false);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const isAuth = localStorage.getItem('tinta_terror_admin_auth');
    if (isAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch stories and banner config once authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminStories();
      fetchBannerConfig();
    }
  }, [isAuthenticated]);

  const fetchBannerConfig = async () => {
    try {
      const bannerRef = doc(db, 'settings', 'banner');
      const docSnap = await getDoc(bannerRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.videoUrl !== undefined) setBannerVideoUrl(data.videoUrl);
        if (data.useVideo !== undefined) setBannerUseVideo(data.useVideo);
      }
    } catch (err) {
      console.error('Error fetching banner configuration:', err);
    }
  };

  const handleSaveBannerConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingBanner(true);
      setSaveBannerSuccess(false);
      const bannerRef = doc(db, 'settings', 'banner');
      await setDoc(bannerRef, {
        videoUrl: bannerVideoUrl.trim(),
        useVideo: bannerUseVideo
      });
      setSaveBannerSuccess(true);
      setTimeout(() => setSaveBannerSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving banner configuration:', err);
      alert('Erro ao salvar as configurações do banner.');
    } finally {
      setSavingBanner(false);
    }
  };

  const fetchAdminStories = async () => {
    try {
      setLoading(true);
      const storiesRef = collection(db, 'stories');
      const q = query(storiesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const fetched: Story[] = [];
      querySnapshot.forEach((doc) => {
        fetched.push({ ...doc.data(), id: doc.id } as Story);
      });
      setStories(fetched);
    } catch (err) {
      console.error('Error fetching admin stories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    // Accepts simple "marcos", "1920", or "marcos192024"
    const trimmedPin = adminPin.trim().toLowerCase();
    if (trimmedPin === 'marcos' || trimmedPin === '1920' || trimmedPin === 'marcos192024') {
      setIsAuthenticated(true);
      localStorage.setItem('tinta_terror_admin_auth', 'true');
    } else {
      setAuthError('Chave de acesso incorreta. Tente novamente.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('tinta_terror_admin_auth');
    onBackToSite();
  };

  // Open modal to edit metrics and comments
  const handleOpenEditModal = (story: Story) => {
    setActiveStory(story);
    setEditReads(story.reads || 0);
    setEditLikes(story.likes || 0);
    setEditingComments(story.comments ? [...story.comments] : []);
    setEditTitle(story.title || '');
    setEditAuthor(story.author || 'Marcos Furtado');
    setEditGenre(story.genre || 'terror');
    setEditSynopsis(story.synopsis || '');
    setEditContent(story.content || '');
    setNewCommentAuthor('');
    setNewCommentText('');
  };

  // Add custom comment to local list
  const handleAddCustomComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentAuthor.trim() || !newCommentText.trim()) return;

    const newComment: Comment = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      author: newCommentAuthor.trim(),
      text: newCommentText.trim(),
      createdAt: new Date().toISOString()
    };

    setEditingComments(prev => [newComment, ...prev]);
    setNewCommentAuthor('');
    setNewCommentText('');
  };

  // Remove comment from local list
  const handleRemoveComment = (commentId: string) => {
    setEditingComments(prev => prev.filter(c => c.id !== commentId));
  };

  // Save edited story metrics & comments to Firestore
  const handleSaveMetrics = async () => {
    if (!activeStory || !activeStory.id) return;
    try {
      setSavingMetrics(true);
      const storyRef = doc(db, 'stories', activeStory.id);
      
      await updateDoc(storyRef, {
        title: editTitle.trim(),
        author: editAuthor.trim() || 'Marcos Furtado',
        genre: editGenre,
        synopsis: editSynopsis.trim(),
        content: editContent.trim(),
        reads: Number(editReads),
        likes: Number(editLikes),
        comments: editingComments
      });

      // Update local state list
      setStories(prev => prev.map(s => {
        if (s.id === activeStory.id) {
          return {
            ...s,
            title: editTitle.trim(),
            author: editAuthor.trim() || 'Marcos Furtado',
            genre: editGenre,
            synopsis: editSynopsis.trim(),
            content: editContent.trim(),
            reads: Number(editReads),
            likes: Number(editLikes),
            comments: editingComments
          };
        }
        return s;
      }));

      setActiveStory(null);
    } catch (err) {
      console.error('Error updating story:', err);
      alert('Erro ao salvar as alterações no banco de dados.');
    } finally {
      setSavingMetrics(false);
    }
  };

  // Delete story
  const handleDeleteStory = async (storyId: string, title: string) => {
    if (!window.confirm(`Tem certeza que deseja deletar permanentemente o conto "${title}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'stories', storyId));
      setStories(prev => prev.filter(s => s.id !== storyId));
    } catch (err) {
      console.error('Error deleting story:', err);
      alert('Erro ao remover o conto.');
    }
  };

  // Create new story
  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatorError('');

    if (!newTitle.trim() || !newSynopsis.trim() || !newContent.trim()) {
      setCreatorError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setSubmittingStory(true);
      const storiesRef = collection(db, 'stories');
      
      const newStory: Omit<Story, 'id'> = {
        title: newTitle.trim(),
        author: newAuthor.trim() || 'Marcos Furtado',
        genre: newGenre,
        synopsis: newSynopsis.trim(),
        content: newContent.trim(),
        createdAt: new Date().toISOString(),
        reads: Number(initialReads) || 0,
        likes: Number(initialLikes) || 0,
        comments: []
      };

      await addDoc(storiesRef, newStory);

      // Reset fields
      setNewTitle('');
      setNewAuthor('Marcos Furtado');
      setNewGenre('terror');
      setNewSynopsis('');
      setNewContent('');
      setInitialReads(0);
      setInitialLikes(0);
      setShowCreator(false);
      
      // Reload stories
      fetchAdminStories();
    } catch (err) {
      console.error('Error creating story:', err);
      setCreatorError('Ocorreu um erro ao salvar o conto no banco de dados.');
    } finally {
      setSubmittingStory(false);
    }
  };

  // Statistics summaries
  const totalReads = stories.reduce((sum, s) => sum + (s.reads || 0), 0);
  const totalLikes = stories.reduce((sum, s) => sum + (s.likes || 0), 0);
  const totalComments = stories.reduce((sum, s) => sum + (s.comments?.length || 0), 0);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Accent light decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col items-center text-center mb-8">
            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 mb-4 border border-indigo-500/20">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-100 tracking-tight">Estúdio de Tinta & Terror</h1>
            <p className="text-xs text-neutral-400 mt-1.5">Área administrativa protegida do autor Marcos Furtado</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Chave de Acesso do Administrador
              </label>
              <input
                type="password"
                placeholder="Insira seu PIN ou nome do Administrador"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none transition-colors"
                required
                autoFocus
              />
              <span className="text-[10px] text-neutral-500 mt-1.5 block">Dica para Marcos Furtado: Use seu nome ou PIN para entrar.</span>
            </div>

            {authError && (
              <p className="text-xs text-red-400 font-medium text-center bg-red-500/10 py-2.5 rounded-xl border border-red-500/25">
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Entrar no Painel</span>
            </button>
          </form>

          <button
            onClick={onBackToSite}
            className="w-full mt-5 py-2.5 bg-transparent border border-neutral-800 hover:bg-neutral-800/50 text-neutral-400 hover:text-neutral-200 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para o Site</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans pb-20">
      {/* Admin Navbar */}
      <nav className="border-b border-neutral-900 bg-neutral-900/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 bg-red-500/15 border border-red-500/30 text-red-400 rounded-md font-mono uppercase font-bold">ADM</span>
            <span className="text-sm font-semibold text-neutral-100">Painel de Controle — Marcos Furtado</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onBackToSite}
              className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver Site Público</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-semibold rounded-lg transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        {/* Quick Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-4 right-4 text-indigo-500/20"><BookOpen className="w-8 h-8" /></div>
            <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold font-mono">Total de Obras</span>
            <h3 className="text-2xl font-extrabold text-neutral-100 mt-2">{stories.length}</h3>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-4 right-4 text-indigo-500/20"><Eye className="w-8 h-8" /></div>
            <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold font-mono">Leituras (Views)</span>
            <h3 className="text-2xl font-extrabold text-neutral-100 mt-2">{totalReads}</h3>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-4 right-4 text-rose-500/20"><Heart className="w-8 h-8" /></div>
            <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold font-mono">Curtidas</span>
            <h3 className="text-2xl font-extrabold text-neutral-100 mt-2">{totalLikes}</h3>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-4 right-4 text-indigo-500/20"><MessageSquare className="w-8 h-8" /></div>
            <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold font-mono">Comentários</span>
            <h3 className="text-2xl font-extrabold text-neutral-100 mt-2">{totalComments}</h3>
          </div>
        </div>

        {/* Banner Media Configurator Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-100">Banner de Cabeçalho (Proporção 16:9)</h3>
                <p className="text-xs text-neutral-400">Marcos Furtado, personalize o vídeo de fundo ou alterne para a imagem estática de terror.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveBannerConfig} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2 bg-neutral-950 px-3 py-2 rounded-xl border border-neutral-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setBannerUseVideo(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    bannerUseVideo 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'bg-transparent text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Vídeo Ativo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBannerUseVideo(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    !bannerUseVideo 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'bg-transparent text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  <Image className="w-3.5 h-3.5" />
                  <span>Imagem Original</span>
                </button>
              </div>

              {bannerUseVideo && (
                <div className="flex-1 w-full">
                  <input
                    type="url"
                    placeholder="Insira o link direto do vídeo (.mp4 ou .webm)"
                    value={bannerVideoUrl}
                    onChange={(e) => setBannerVideoUrl(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-neutral-100 placeholder-neutral-600 focus:outline-none"
                    required={bannerUseVideo}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={savingBanner}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/10 shrink-0 flex items-center gap-1.5 w-full sm:w-auto justify-center"
              >
                {savingBanner ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : saveBannerSuccess ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{savingBanner ? 'Salvando...' : saveBannerSuccess ? 'Salvo!' : 'Salvar Banner'}</span>
              </button>
            </div>

            {bannerUseVideo && (
              <p className="text-[10px] text-neutral-500 font-mono leading-relaxed">
                * Dica: Cole qualquer link de vídeo público (.mp4 ou .webm). Atualmente configurado com o seu vídeo de zumbis misteriosos.
              </p>
            )}
          </form>
        </div>

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-neutral-100">Gerenciar Seus Contos</h2>
            <p className="text-xs text-neutral-400 mt-1">Crie, delete ou altere métricas e comentários personalizados de suas histórias.</p>
          </div>
          <button
            onClick={() => setShowCreator(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Escrever Novo Conto</span>
          </button>
        </div>

        {/* Stories Management List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-t-indigo-500 border-indigo-200/20 rounded-full animate-spin" />
            <p className="text-xs text-neutral-400 font-mono">Carregando manuscritos...</p>
          </div>
        ) : stories.length === 0 ? (
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-16 text-center">
            <p className="text-sm text-neutral-400 italic">"Você ainda não possui nenhum conto publicado sob sua autoria."</p>
            <button
              onClick={() => setShowCreator(true)}
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Escrever Primeiro Relato</span>
            </button>
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-900/80 text-neutral-400 uppercase font-bold tracking-wider">
                    <th className="p-4">Título</th>
                    <th className="p-4">Gênero</th>
                    <th className="p-4 text-center">Views (Leituras)</th>
                    <th className="p-4 text-center">Curtidas</th>
                    <th className="p-4 text-center">Comentários</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {stories.map((story) => (
                    <tr key={story.id} className="hover:bg-neutral-800/20 transition-colors">
                      <td className="p-4 font-semibold text-neutral-100">
                        {story.title}
                        <span className="block text-[10px] text-neutral-500 font-normal mt-0.5">Por {story.author} • {new Date(story.createdAt).toLocaleDateString('pt-BR')}</span>
                      </td>
                      <td className="p-4 capitalize">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          story.genre === 'terror' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          story.genre === 'romance' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          story.genre === 'ficcao' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                          story.genre === 'fantasia' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                          story.genre === 'drama' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {story.genre === 'ficcao' ? 'Ficção' : story.genre}
                        </span>
                      </td>
                      <td className="p-4 text-center font-mono text-neutral-300 font-semibold">{story.reads}</td>
                      <td className="p-4 text-center font-mono text-rose-400/90 font-semibold">{story.likes}</td>
                      <td className="p-4 text-center font-mono text-neutral-300">{story.comments?.length || 0}</td>
                      <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditModal(story)}
                          className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 rounded-md text-indigo-400 font-semibold transition-colors inline-flex items-center gap-1"
                          title="Editar Métricas e Comentários"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Métricas</span>
                        </button>
                        <button
                          onClick={() => handleDeleteStory(story.id || '', story.title)}
                          className="p-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-md text-red-400 font-semibold transition-colors inline-flex items-center"
                          title="Remover Conto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Story metrics & custom comments editor */}
      <AnimatePresence>
        {activeStory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-neutral-100 text-sm">Editar Obra, Métricas & Comentários</h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Conto: <strong className="text-neutral-300">{activeStory.title}</strong></p>
                </div>
                <button onClick={() => setActiveStory(null)} className="text-neutral-400 hover:text-neutral-200">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Story Fields Editor */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Conteúdo do Conto</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Título do Conto</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Autor</label>
                      <input
                        type="text"
                        value={editAuthor}
                        onChange={(e) => setEditAuthor(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Gênero</label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {(['terror', 'romance', 'ficcao', 'fantasia', 'drama', 'crime'] as Genre[]).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setEditGenre(g)}
                          className={`py-1.5 px-2.5 rounded-lg border text-[10px] font-semibold capitalize transition-all duration-200 ${
                            editGenre === g 
                              ? g === 'terror' ? 'bg-red-950/40 border-red-500/50 text-red-400'
                                : g === 'romance' ? 'bg-rose-950/40 border-rose-500/50 text-rose-400'
                                : g === 'ficcao' ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-400'
                                : g === 'fantasia' ? 'bg-purple-950/40 border-purple-500/50 text-purple-400'
                                : g === 'drama' ? 'bg-amber-950/40 border-amber-500/50 text-amber-400'
                                : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400'
                              : 'bg-neutral-950/40 border-neutral-800 hover:border-neutral-700 text-neutral-400'
                          }`}
                        >
                          {g === 'ficcao' ? 'Ficção' : g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Sinopse</label>
                    <textarea
                      value={editSynopsis}
                      onChange={(e) => setEditSynopsis(e.target.value)}
                      rows={2}
                      className="w-full bg-neutral-950 border border-neutral-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-neutral-100 focus:outline-none resize-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Conteúdo da História</label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={6}
                      className="w-full bg-neutral-950 border border-neutral-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-neutral-100 focus:outline-none resize-none font-sans"
                      required
                    />
                  </div>
                </div>

                {/* Visualizations & Likes Inputs */}
                <div className="border-t border-neutral-800/80 pt-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3">Métricas de Alcance</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] text-neutral-500 font-mono uppercase mb-1.5">Visualizações (Views)</label>
                      <input
                        type="number"
                        min="0"
                        value={editReads}
                        onChange={(e) => setEditReads(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-neutral-100 font-mono focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-neutral-500 font-mono uppercase mb-1.5">Curtidas (Likes)</label>
                      <input
                        type="number"
                        min="0"
                        value={editLikes}
                        onChange={(e) => setEditLikes(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-neutral-100 font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Inject Personalized Comment Form */}
                <div className="border-t border-neutral-800/80 pt-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">Injetar Comentário Personalizado</h4>
                  <form onSubmit={handleAddCustomComment} className="bg-neutral-950/40 p-4 border border-neutral-800 rounded-xl space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-[10px] text-neutral-500 font-mono uppercase mb-1">Nome do Autor do Comentário</label>
                        <input
                          type="text"
                          placeholder="Ex: Clarice Literária"
                          value={newCommentAuthor}
                          onChange={(e) => setNewCommentAuthor(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-500 font-mono uppercase mb-1">Texto do Comentário</label>
                        <textarea
                          placeholder="Ex: Que conto incrível e assustador, me arrepiei do início ao fim!"
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          rows={2}
                          className="w-full bg-neutral-950 border border-neutral-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none resize-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!newCommentAuthor.trim() || !newCommentText.trim()}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar Comentário</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Existing & Custom Comments list */}
                <div className="border-t border-neutral-800/80 pt-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center justify-between">
                    <span>Comentários ({editingComments.length})</span>
                    <span className="text-[10px] font-normal text-neutral-500 lowercase font-mono">Moderação de relatos</span>
                  </h4>

                  {editingComments.length === 0 ? (
                    <p className="text-xs text-neutral-500 italic text-center py-4 bg-neutral-950/20 rounded-xl border border-neutral-800/40">Nenhum comentário adicionado ainda.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                      {editingComments.map((comment) => (
                        <div key={comment.id} className="flex items-start justify-between bg-neutral-950/30 p-3 rounded-xl border border-neutral-800/40 text-xs">
                          <div className="space-y-1 pr-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-neutral-200">{comment.author}</span>
                              <span className="text-[10px] text-neutral-500 font-mono">{new Date(comment.createdAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <p className="text-neutral-400 leading-relaxed">{comment.text}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveComment(comment.id)}
                            className="p-1 hover:bg-red-500/10 text-neutral-500 hover:text-red-400 rounded transition-colors shrink-0"
                            title="Remover Comentário"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Save footer */}
              <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900/50 flex justify-end gap-3">
                <button
                  onClick={() => setActiveStory(null)}
                  className="px-4 py-2 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveMetrics}
                  disabled={savingMetrics}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/10"
                >
                  {savingMetrics ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Write New Story by Marcos Furtado */}
      <AnimatePresence>
        {showCreator && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-100 text-sm">Escrever Novo Conto (Autor: Marcos Furtado)</h3>
                    <p className="text-[11px] text-neutral-400">Todas as publicações são de autoria exclusiva de Marcos Furtado</p>
                  </div>
                </div>
                <button onClick={() => setShowCreator(false)} className="text-neutral-400 hover:text-neutral-200">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateStory} className="flex-1 overflow-y-auto p-6 space-y-5 flex flex-col">
                {creatorError && (
                  <p className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold">{creatorError}</p>
                )}

                {/* Genre Select */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Gênero Literário</label>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    {(['terror', 'romance', 'ficcao', 'fantasia', 'drama', 'crime'] as Genre[]).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setNewGenre(g)}
                        className={`py-2 px-3 rounded-xl border text-[11px] font-semibold capitalize transition-all duration-200 ${
                          newGenre === g 
                            ? g === 'terror' ? 'bg-red-950/40 border-red-500/50 text-red-400'
                              : g === 'romance' ? 'bg-rose-950/40 border-rose-500/50 text-rose-400'
                              : g === 'ficcao' ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-400'
                              : g === 'fantasia' ? 'bg-purple-950/40 border-purple-500/50 text-purple-400'
                              : g === 'drama' ? 'bg-amber-950/40 border-amber-500/50 text-amber-400'
                              : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400'
                            : 'bg-neutral-950/40 border-neutral-800 hover:border-neutral-700 text-neutral-400'
                        }`}
                      >
                        {g === 'ficcao' ? 'Ficção' : g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Title */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Título do Conto *</label>
                    <input
                      type="text"
                      placeholder="Ex: O Reflexo do Labirinto"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-neutral-950/40 border border-neutral-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 focus:outline-none"
                      required
                    />
                  </div>
                  {/* Author Editable */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 font-mono">Autor do Conto</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Marcos Furtado"
                        value={newAuthor}
                        onChange={(e) => setNewAuthor(e.target.value)}
                        className="w-full bg-neutral-950/40 border border-neutral-800 focus:border-indigo-500 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-neutral-100 focus:outline-none"
                      />
                      <User className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-3.5" />
                    </div>
                  </div>
                </div>

                {/* Synopsis */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Sinopse do Conto *</label>
                  <textarea
                    placeholder="Escreva um gancho curto para prender a atenção do leitor..."
                    value={newSynopsis}
                    onChange={(e) => setNewSynopsis(e.target.value)}
                    rows={2}
                    maxLength={250}
                    className="w-full bg-neutral-950/40 border border-neutral-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 focus:outline-none resize-none"
                    required
                  />
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col">
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Conteúdo da História *</label>
                  <textarea
                    placeholder="Escreva a história completa aqui. Dica: Duas linhas em branco criam belos parágrafos."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full flex-1 min-h-[180px] bg-neutral-950/40 border border-neutral-800 focus:border-indigo-500 rounded-xl px-3.5 py-3 text-xs text-neutral-100 focus:outline-none resize-none"
                    required
                  />
                </div>

                {/* Initial Stats Booster */}
                <div className="bg-neutral-950/20 border border-neutral-800 rounded-2xl p-4">
                  <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1 mb-2">
                    <Sparkles className="w-3.5 h-3.5" /> Impulsionar Métricas Iniciais
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-neutral-500 font-mono uppercase mb-1">Visualizações Iniciais</label>
                      <input
                        type="number"
                        min="0"
                        value={initialReads}
                        onChange={(e) => setInitialReads(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-indigo-500 rounded-lg px-3.5 py-1.5 text-xs text-neutral-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-500 font-mono uppercase mb-1">Curtidas Iniciais</label>
                      <input
                        type="number"
                        min="0"
                        value={initialLikes}
                        onChange={(e) => setInitialLikes(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-indigo-500 rounded-lg px-3.5 py-1.5 text-xs text-neutral-100 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3 mt-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowCreator(false)}
                    className="px-5 py-2.5 border border-neutral-800 hover:bg-neutral-800 hover:text-neutral-200 rounded-xl text-xs font-semibold text-neutral-400 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingStory}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/10"
                  >
                    {submittingStory ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Publicar Relato</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
