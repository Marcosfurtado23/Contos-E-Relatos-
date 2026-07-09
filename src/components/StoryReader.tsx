import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Heart, BookOpen, MessageSquare, Flame, 
  ChevronRight, AlignLeft, Sparkles, Type, Plus, Minus,
  Send, User, Calendar, Eye, Shield
} from 'lucide-react';
import { doc, updateDoc, arrayUnion, increment, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Story, Comment } from '../types';

interface StoryReaderProps {
  storyId: string;
  onClose: () => void;
}

export default function StoryReader({ storyId, onClose }: StoryReaderProps) {
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [fontSize, setFontSize] = useState<number>(18);
  const [fontFamily, setFontFamily] = useState<'font-serif' | 'font-sans'>('font-serif');
  const [theme, setTheme] = useState<'dark' | 'sepia' | 'light'>('dark');
  const [newCommentAuthor, setNewCommentAuthor] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Fetch individual story details and increment reads
  useEffect(() => {
    async function loadStory() {
      try {
        setLoading(true);
        const storyRef = doc(db, 'stories', storyId);
        const snap = await getDoc(storyRef);
        
        if (snap.exists()) {
          const data = { ...snap.data(), id: snap.id } as Story;
          setStory(data);
          
          try {
            // Increment reads in firestore
            await updateDoc(storyRef, {
              reads: increment(1)
            });
          } catch (writeErr) {
            if (writeErr instanceof Error && (writeErr.message.toLowerCase().includes('permission') || writeErr.message.toLowerCase().includes('insufficient'))) {
              handleFirestoreError(writeErr, OperationType.UPDATE, `stories/${storyId}`);
            }
            throw writeErr;
          }
          
          // Update local state to reflect read increment
          setStory(prev => prev ? { ...prev, reads: prev.reads + 1 } : null);
        }
      } catch (err) {
        console.error("Erro ao carregar história:", err);
        if (err instanceof Error && (err.message.toLowerCase().includes('permission') || err.message.toLowerCase().includes('insufficient'))) {
          handleFirestoreError(err, OperationType.GET, `stories/${storyId}`);
        }
      } finally {
        setLoading(false);
      }
    }

    loadStory();
    setLiked(localStorage.getItem(`liked_${storyId}`) === 'true');
  }, [storyId]);

  // Handle scroll progress tracking
  useEffect(() => {
    const handleScroll = () => {
      const element = document.getElementById('story-reader-content');
      if (element) {
        const totalHeight = element.scrollHeight - element.clientHeight;
        if (totalHeight > 0) {
          const progress = (element.scrollTop / totalHeight) * 100;
          setScrollProgress(progress);
        }
      }
    };

    const element = document.getElementById('story-reader-content');
    if (element) {
      element.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (element) {
        element.removeEventListener('scroll', handleScroll);
      }
    };
  }, [loading]);

  const handleLike = async () => {
    if (!story || !story.id) return;
    
    const storyRef = doc(db, 'stories', story.id);
    const newLikedState = !liked;
    
    try {
      setLiked(newLikedState);
      if (newLikedState) {
        localStorage.setItem(`liked_${story.id}`, 'true');
        setStory(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
        await updateDoc(storyRef, { likes: increment(1) });
      } else {
        localStorage.removeItem(`liked_${story.id}`);
        setStory(prev => prev ? { ...prev, likes: Math.max(0, prev.likes - 1) } : null);
        await updateDoc(storyRef, { likes: increment(-1) });
      }
    } catch (err) {
      console.error("Erro ao atualizar curtida:", err);
      if (err instanceof Error && (err.message.toLowerCase().includes('permission') || err.message.toLowerCase().includes('insufficient'))) {
        handleFirestoreError(err, OperationType.UPDATE, `stories/${story.id}`);
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!story || !story.id || !newCommentText.trim()) return;

    const authorName = newCommentAuthor.trim() || 'Leitor Anônimo';
    const commentData: Comment = {
      id: Math.random().toString(36).substring(2, 9),
      author: authorName,
      text: newCommentText.trim(),
      createdAt: new Date().toISOString()
    };

    try {
      setSubmittingComment(true);
      const storyRef = doc(db, 'stories', story.id);
      
      // Update locally first for snappy response
      setStory(prev => prev ? {
        ...prev,
        comments: [commentData, ...prev.comments]
      } : null);

      await updateDoc(storyRef, {
        comments: arrayUnion(commentData)
      });

      setNewCommentText('');
      setNewCommentAuthor('');
    } catch (err) {
      console.error("Erro ao adicionar comentário:", err);
      if (err instanceof Error && (err.message.toLowerCase().includes('permission') || err.message.toLowerCase().includes('insufficient'))) {
        handleFirestoreError(err, OperationType.UPDATE, `stories/${story.id}`);
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  // Genre aesthetic configurations
  const getGenreAesthetics = (genre?: string) => {
    switch (genre) {
      case 'terror':
        return {
          bannerGlow: 'rgba(239, 68, 68, 0.15)',
          ambientClass: 'from-red-950/30 via-neutral-950 to-neutral-950',
          badgeBg: 'bg-red-500/15 border-red-500/30 text-red-400',
          accentText: 'text-red-500 font-display',
          icon: <Flame className="w-5 h-5 text-red-500 animate-pulse" />,
          titleStyle: 'font-display tracking-widest text-red-100',
          quoteBorder: 'border-red-600',
        };
      case 'romance':
        return {
          bannerGlow: 'rgba(244, 63, 94, 0.15)',
          ambientClass: 'from-rose-950/25 via-neutral-950 to-neutral-950',
          badgeBg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
          accentText: 'text-rose-400',
          icon: <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />,
          titleStyle: 'font-serif italic text-rose-100',
          quoteBorder: 'border-rose-500',
        };
      case 'ficcao':
        return {
          bannerGlow: 'rgba(6, 182, 212, 0.15)',
          ambientClass: 'from-cyan-950/20 via-slate-950 to-slate-950',
          badgeBg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
          accentText: 'text-cyan-400 font-mono',
          icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
          titleStyle: 'font-sans tracking-tight text-cyan-100 font-extrabold',
          quoteBorder: 'border-cyan-500',
        };
      case 'fantasia':
        return {
          bannerGlow: 'rgba(168, 85, 247, 0.15)',
          ambientClass: 'from-purple-950/25 via-neutral-950 to-neutral-950',
          badgeBg: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
          accentText: 'text-purple-400',
          icon: <Sparkles className="w-5 h-5 text-purple-400 animate-spin-slow" />,
          titleStyle: 'font-serif tracking-wide text-purple-100',
          quoteBorder: 'border-purple-500',
        };
      case 'drama':
        return {
          bannerGlow: 'rgba(245, 158, 11, 0.15)',
          ambientClass: 'from-amber-950/20 via-neutral-950 to-neutral-950',
          badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
          accentText: 'text-amber-400',
          icon: <BookOpen className="w-5 h-5 text-amber-400" />,
          titleStyle: 'font-serif text-amber-100',
          quoteBorder: 'border-amber-500',
        };
      case 'crime':
        return {
          bannerGlow: 'rgba(16, 185, 129, 0.15)',
          ambientClass: 'from-emerald-950/20 via-neutral-950 to-neutral-950',
          badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
          accentText: 'text-emerald-400 font-mono',
          icon: <Shield className="w-5 h-5 text-emerald-400" />,
          titleStyle: 'font-sans tracking-tight text-emerald-100 font-extrabold',
          quoteBorder: 'border-emerald-500',
        };
      default:
        return {
          bannerGlow: 'rgba(100, 116, 139, 0.15)',
          ambientClass: 'from-neutral-900 via-neutral-950 to-neutral-950',
          badgeBg: 'bg-neutral-500/15 border-neutral-500/30 text-neutral-400',
          accentText: 'text-neutral-400',
          icon: <BookOpen className="w-5 h-5 text-neutral-400" />,
          titleStyle: 'font-sans text-neutral-100',
          quoteBorder: 'border-neutral-500',
        };
    }
  };

  const aesthetics = getGenreAesthetics(story?.genre);

  // Theme styling overrides
  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return {
          bg: 'bg-neutral-50 text-neutral-900 border-neutral-200',
          card: 'bg-white border-neutral-200',
          input: 'bg-neutral-100 border-neutral-300 text-neutral-900 focus:bg-white',
          subtitle: 'text-neutral-600',
          body: 'text-neutral-800',
          nav: 'bg-white/90 border-neutral-200/80 backdrop-blur-md',
          scrollbar: 'scrollbar-light',
          commentBg: 'bg-neutral-100 border border-neutral-200',
          commentText: 'text-neutral-700',
          commentAuthor: 'text-neutral-900',
          commentDate: 'text-neutral-500'
        };
      case 'sepia':
        return {
          bg: 'bg-[#f4ecd8] text-[#433422] border-[#e4d4b8]',
          card: 'bg-[#fcf8f0] border-[#e8dcc4]',
          input: 'bg-[#ebe0c8] border-[#dfceaf] text-[#433422] focus:bg-[#fcf8f0]',
          subtitle: 'text-[#6a5438]',
          body: 'text-[#2f2214]',
          nav: 'bg-[#f4ecd8]/90 border-[#e4d4b8]/80 backdrop-blur-md',
          scrollbar: 'scrollbar-sepia',
          commentBg: 'bg-[#ebe1ca] border border-[#dfd2b5]',
          commentText: 'text-[#4e3c28]',
          commentAuthor: 'text-[#2a1e12]',
          commentDate: 'text-[#7e6b52]'
        };
      case 'dark':
      default:
        return {
          bg: 'bg-neutral-950 text-neutral-200 border-neutral-800',
          card: 'bg-neutral-900/40 border-neutral-800/80',
          input: 'bg-neutral-950/60 border-neutral-800 text-neutral-100 focus:bg-neutral-900/60',
          subtitle: 'text-neutral-400',
          body: 'text-neutral-300',
          nav: 'bg-neutral-950/90 border-neutral-800/80 backdrop-blur-md',
          scrollbar: 'scrollbar-dark',
          commentBg: 'bg-neutral-900/60 border border-neutral-800/60',
          commentText: 'text-neutral-300',
          commentAuthor: 'text-neutral-100',
          commentDate: 'text-neutral-500'
        };
    }
  };

  const themeStyle = getThemeClasses();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-black overflow-hidden"
    >
      {/* Immersive genre background glow in dark mode */}
      {theme === 'dark' && (
        <div 
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] rounded-full blur-[160px] pointer-events-none opacity-30 transition-all duration-1000 bg-gradient-to-b ${aesthetics.ambientClass}`}
        />
      )}

      {/* Top Navbar */}
      <div className={`relative z-10 flex items-center justify-between px-6 py-4 border-b transition-colors duration-300 ${themeStyle.nav}`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            id="btn-close-reader"
            className="p-2 rounded-full hover:bg-neutral-500/10 transition-colors"
            title="Voltar ao início"
          >
            <X className="w-5 h-5" />
          </button>
          {!loading && story && (
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border uppercase tracking-wider ${aesthetics.badgeBg}`}>
                {story.genre === 'ficcao' ? 'Ficção' : story.genre}
              </span>
              <span className={`hidden sm:inline text-xs ${themeStyle.subtitle}`}>|</span>
              <span className={`hidden sm:inline text-xs truncate max-w-[200px] ${themeStyle.subtitle}`}>
                {story.title}
              </span>
            </div>
          )}
        </div>

        {/* Reader Customization Panel */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Font switcher */}
          <button 
            id="btn-toggle-font"
            onClick={() => setFontFamily(prev => prev === 'font-serif' ? 'font-sans' : 'font-serif')}
            className={`p-2 rounded-lg border transition-all text-xs flex items-center gap-1.5 ${
              theme === 'dark' ? 'border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900 text-neutral-300' : 
              theme === 'sepia' ? 'border-[#dfceaf] hover:border-[#cfbfa3] hover:bg-[#ebe0c8] text-[#433422]' :
              'border-neutral-300 hover:border-neutral-400 hover:bg-neutral-100 text-neutral-700'
            }`}
            title="Mudar fonte"
          >
            <Type className="w-3.5 h-3.5" />
            <span className="font-medium">{fontFamily === 'font-serif' ? 'Serif' : 'Sans'}</span>
          </button>

          {/* Font Size adjustments */}
          <div className={`flex items-center rounded-lg border ${
            theme === 'dark' ? 'border-neutral-800' : 
            theme === 'sepia' ? 'border-[#dfceaf]' : 'border-neutral-300'
          }`}>
            <button 
              id="btn-font-decrease"
              onClick={() => setFontSize(prev => Math.max(14, prev - 1))}
              disabled={fontSize <= 14}
              className="p-2 hover:bg-neutral-500/10 transition-colors disabled:opacity-40"
              title="Diminuir texto"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-xs font-mono font-bold">{fontSize}px</span>
            <button 
              id="btn-font-increase"
              onClick={() => setFontSize(prev => Math.min(28, prev + 1))}
              disabled={fontSize >= 28}
              className="p-2 hover:bg-neutral-500/10 transition-colors disabled:opacity-40"
              title="Aumentar texto"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Theme switcher */}
          <div className="flex items-center gap-1">
            {(['dark', 'sepia', 'light'] as const).map((t) => (
              <button
                key={t}
                id={`btn-theme-${t}`}
                onClick={() => setTheme(t)}
                className={`w-7 h-7 rounded-full border transition-all relative flex items-center justify-center ${
                  t === 'dark' ? 'bg-neutral-950 border-neutral-800' :
                  t === 'sepia' ? 'bg-[#f4ecd8] border-[#dfceaf]' : 'bg-white border-neutral-300'
                } ${theme === t ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-black scale-110 z-10' : 'hover:scale-105'}`}
                title={`Tema ${t}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Reading Scroll Progress bar */}
      <div className="w-full h-1 bg-neutral-900/40 relative z-10">
        <motion.div 
          className={`h-full bg-indigo-500`}
          style={{ width: `${scrollProgress}%` }}
          transition={{ ease: 'easeOut', duration: 0.1 }}
        />
      </div>

      {/* Main Scroller */}
      <div 
        id="story-reader-content"
        className={`flex-1 overflow-y-auto px-6 py-12 transition-colors duration-300 relative z-10 ${themeStyle.bg}`}
      >
        {loading ? (
          <div className="max-w-2xl mx-auto flex flex-col items-center justify-center h-96 gap-4">
            <div className="w-10 h-10 border-4 border-t-indigo-500 border-indigo-200/20 rounded-full animate-spin" />
            <p className="text-sm font-medium opacity-70">Iluminando as palavras...</p>
          </div>
        ) : !story ? (
          <div className="max-w-2xl mx-auto text-center py-20">
            <h2 className="text-xl font-bold mb-2">História não encontrada</h2>
            <p className="text-sm opacity-60 mb-6">Talvez ela tenha sido apagada ou perdida no tempo.</p>
            <button 
              onClick={onClose}
              id="btn-error-close"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Voltar ao Início
            </button>
          </div>
        ) : (
          <article className="max-w-2xl mx-auto">
            {/* Header section */}
            <div className="mb-10 text-center pb-8 border-b border-neutral-500/10">
              <div className="flex justify-center mb-4">
                <span className={`inline-flex items-center justify-center p-3 rounded-full ${aesthetics.badgeBg} border`}>
                  {aesthetics.icon}
                </span>
              </div>
              <h1 className={`text-3xl md:text-5xl font-bold mb-4 leading-tight transition-all ${aesthetics.titleStyle}`}>
                {story.title}
              </h1>
              
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-medium mt-4 opacity-70">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Por <strong className={aesthetics.accentText}>{story.author}</strong></span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(story.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{story.reads} leituras</span>
                </div>
              </div>

              {/* Synopsis Box */}
              <div className={`mt-6 p-4 rounded-xl italic border-l-4 border bg-neutral-500/5 ${aesthetics.quoteBorder} ${
                theme === 'dark' ? 'border-neutral-800' : 
                theme === 'sepia' ? 'border-[#e4d4b8]' : 'border-neutral-200'
              }`}>
                <p className={`text-sm text-left leading-relaxed ${themeStyle.subtitle}`}>
                  "{story.synopsis}"
                </p>
              </div>
            </div>

            {/* Main story body paragraphs */}
            <div 
              className={`leading-relaxed tracking-wide space-y-6 md:space-y-8 select-text transition-all ${fontFamily}`}
              style={{ fontSize: `${fontSize}px` }}
            >
              {story.content.split('\n\n').map((paragraph, index) => {
                if (!paragraph.trim()) return null;
                // Check if paragraph is actually a dialogue or quote to add style
                const isDialogue = paragraph.trim().startsWith('—') || paragraph.trim().startsWith('-');
                return (
                  <p 
                    key={index} 
                    id={`p-${index}`}
                    className={`text-justify transition-all duration-300 ${
                      isDialogue ? 'pl-4 border-l border-indigo-500/20 italic' : ''
                    } ${themeStyle.body}`}
                  >
                    {paragraph}
                  </p>
                );
              })}
            </div>

            {/* Immersive End of story mark */}
            <div className="my-16 flex flex-col items-center justify-center gap-2">
              <div className="w-24 h-[1px] bg-indigo-500/30" />
              <p className="text-xs tracking-widest uppercase font-mono opacity-50">Fim do Relato</p>
              <div className="w-6 h-[1px] bg-indigo-500/30" />
            </div>

            {/* Interaction Footer (Likes & Share) */}
            <div className={`p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border ${themeStyle.card}`}>
              <div className="text-center sm:text-left">
                <h4 className="text-sm font-semibold mb-1">Gostou deste relato?</h4>
                <p className={`text-xs ${themeStyle.subtitle}`}>Mostre seu apoio ao autor deixando uma curtida.</p>
              </div>
              
              <button
                id="btn-like-story"
                onClick={handleLike}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-full font-semibold text-sm transition-all shadow-md ${
                  liked 
                    ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-rose-600/10 scale-105' 
                    : theme === 'dark' 
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700' 
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300'
                }`}
              >
                <Heart className={`w-5 h-5 transition-transform ${liked ? 'fill-current scale-110' : 'group-hover:scale-110'}`} />
                <span>{story.likes} {story.likes === 1 ? 'Curtida' : 'Curtidas'}</span>
              </button>
            </div>

            {/* Comments Section */}
            <div className="mt-12 pt-8 border-t border-neutral-500/10">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold">Discussão ({story.comments.length})</h3>
              </div>

              {/* Comment submission form */}
              <form onSubmit={handleAddComment} className="mb-8 flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1 relative">
                    <User className="absolute left-3 top-3.5 w-4 h-4 opacity-40" />
                    <input 
                      type="text" 
                      id="input-comment-author"
                      placeholder="Seu nome"
                      value={newCommentAuthor}
                      onChange={(e) => setNewCommentAuthor(e.target.value)}
                      maxLength={30}
                      className={`w-full pl-9 pr-4 py-3 text-sm rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors ${themeStyle.input}`}
                    />
                  </div>
                  <div className="sm:col-span-2 relative">
                    <input 
                      type="text" 
                      id="input-comment-text"
                      placeholder="Escreva um comentário reflexivo sobre a história..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      required
                      maxLength={300}
                      className={`w-full pl-4 pr-12 py-3 text-sm rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors ${themeStyle.input}`}
                    />
                    <button 
                      type="submit"
                      id="btn-submit-comment"
                      disabled={submittingComment || !newCommentText.trim()}
                      className="absolute right-2 top-2 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-40 transition-colors"
                      title="Enviar comentário"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </form>

              {/* Comments list */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {story.comments.length === 0 ? (
                  <p className="text-center py-6 text-sm opacity-50 italic">Nenhum comentário ainda. Seja o primeiro a refletir sobre esta história!</p>
                ) : (
                  story.comments.map((comment) => (
                    <motion.div 
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-xl ${themeStyle.commentBg}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <strong className={`text-xs font-bold ${themeStyle.commentAuthor}`}>
                          {comment.author}
                        </strong>
                        <span className={`text-[10px] ${themeStyle.commentDate}`}>
                          {new Date(comment.createdAt).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed ${themeStyle.commentText}`}>
                        {comment.text}
                      </p>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </article>
        )}
      </div>
    </motion.div>
  );
}
