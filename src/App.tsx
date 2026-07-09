import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Plus, Flame, Sparkles, Heart, BookOpen, 
  MessageSquare, SlidersHorizontal, Eye, ChevronRight,
  TrendingUp, CheckCircle, Bell, ArrowRight,
  Clapperboard, Tv, User, Play, Film, Calendar, Shield, Trash2, X
} from 'lucide-react';
import { collection, getDocs, query, orderBy, addDoc, doc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { STARTER_STORIES } from './lib/starterStories';
import { Story, Genre } from './types';
import StoryReader from './components/StoryReader';
import StoryWriter from './components/StoryWriter';
import AdminDashboard from './components/AdminDashboard';

const horrorBanner = '/src/assets/images/horror_banner_header_1783610372425.jpg';

export default function App() {
  // Routing State
  const [isAdminRoute, setIsAdminRoute] = useState(false);

  // Background Video states with fallback mechanisms
  const [videoSource, setVideoSource] = useState('https://videotourl.com/videos/1783618865377-6e6b9359-de45-4807-9f71-4e756d0d2351.mp4');
  const [useVideo, setUseVideo] = useState(true);

  // Real-time subscription to header banner configuration in Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'banner'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.videoUrl !== undefined && data.videoUrl.trim() !== '') {
            setVideoSource(data.videoUrl);
          }
          if (data.useVideo !== undefined) {
            setUseVideo(data.useVideo);
          }
        }
      },
      (error) => {
        console.error("Erro ao carregar as configurações do banner:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleVideoError = () => {
    // If custom/current video fails to load, try loading the beautiful, high-performance dark ambient swirling smoke loop
    if (videoSource !== 'https://assets.mixkit.co/videos/preview/mixkit-black-and-gray-smoke-swirling-background-50616-large.mp4') {
      setVideoSource('https://assets.mixkit.co/videos/preview/mixkit-black-and-gray-smoke-swirling-background-50616-large.mp4');
    } else {
      // If the CDN is also unreachable or fails, fall back to the gorgeous static horror banner image
      setUseVideo(false);
    }
  };

  // Database stories list
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  // Bottom Navigation tabs state
  const [activeTab, setActiveTab] = useState<'contos' | 'notificacoes'>('contos');
  const [adminCommand, setAdminCommand] = useState('');
  const [notificationCount, setNotificationCount] = useState(3);
  const [selectedTrailerUrl, setSelectedTrailerUrl] = useState<string | null>(null);
  const [selectedTrailerTitle, setSelectedTrailerTitle] = useState<string>('');

  // Track stories read by the visitor
  const [readStoryIds, setReadStoryIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('read_story_ids') || '[]');
    } catch {
      return [];
    }
  });

  // Track comment counts for read stories to find new ones
  const [lastCommentCounts, setLastCommentCounts] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem('last_comment_counts') || '{}');
    } catch {
      return {};
    }
  });

  // Notifications state focusing strictly on comments on read stories and new book releases
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'Novo Lançamento!',
      message: "O autor Marcos Furtado acabou de publicar um novo relato de terror: 'O Sussurro do Pinhal Escuro'. Venha ler!",
      time: 'Há 10 min',
      unread: true,
      category: 'terror'
    },
    {
      id: 'notif-2',
      title: 'Novo Comentário em Relato Lido',
      message: "Alguém comentou no conto 'A Criatura da Névoa' (que você leu): 'Essa atmosfera sombria me prendeu do início ao fim!'",
      time: 'Há 2 horas',
      unread: true,
      category: 'romance'
    },
    {
      id: 'notif-3',
      title: 'Novo Comentário em Relato Lido',
      message: "Alguém comentou no conto 'O Último Farol da Galáxia' (que você leu): 'Uma ficção científica maravilhosa e arrepiante!'",
      time: 'Há 1 dia',
      unread: true,
      category: 'ficcao'
    }
  ]);

  // Movies list
  const movies = [
    {
      id: 'mov-1',
      title: 'Invocação do Mal',
      year: '2013',
      duration: '1h 52m',
      rating: '4.8',
      synopsis: 'Os renomados demonologistas Ed e Lorraine Warren investigam uma presença sombria e aterrorizante em uma fazenda isolada.',
      image: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&q=80&w=800',
      trailerUrl: 'https://www.youtube.com/embed/HkxYgZshZRU', // Conjuring trailer
    },
    {
      id: 'mov-2',
      title: 'Hereditário',
      year: '2018',
      duration: '2h 07m',
      rating: '4.9',
      synopsis: 'Após a morte da avó patriarca, segredos assustadores de sua linhagem ancestral começam a atormentar a família Graham.',
      image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800',
      trailerUrl: 'https://www.youtube.com/embed/V6wWKNij_1M', // Hereditary trailer
    },
    {
      id: 'mov-3',
      title: 'O Iluminado',
      year: '1980',
      duration: '2h 26m',
      rating: '4.7',
      synopsis: 'Um escritor aceita o emprego como zelador de inverno num hotel isolado, onde forças sobrenaturais corroem sua sanidade.',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800',
      trailerUrl: 'https://www.youtube.com/embed/S014oGgGoD8', // Shining trailer
    },
    {
      id: 'mov-4',
      title: 'Um Lugar Silencioso',
      year: '2018',
      duration: '1h 30m',
      rating: '4.6',
      synopsis: 'Uma família tenta sobreviver em silêncio absoluto para evitar serem caçados por terríveis criaturas cegas guiadas pelo som.',
      image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=800',
      trailerUrl: 'https://www.youtube.com/embed/YPY7J-gSFNo', // A Quiet Place trailer
    }
  ];

  // Series list
  const series = [
    {
      id: 'ser-1',
      title: 'A Maldição da Residência Hill',
      seasons: '1 Temporada',
      episodes: '10 Episódios',
      rating: '4.9',
      synopsis: 'Irmãos que cresceram em uma das casas mal-assombradas mais famosas do país lidam com os fantasmas de seu passado traumático.',
      image: 'https://images.unsplash.com/photo-1505635552518-3448ff116af3?auto=format&fit=crop&q=80&w=800',
      trailerUrl: 'https://www.youtube.com/embed/G9OzG53VwF4', // Haunting of Hill House
    },
    {
      id: 'ser-2',
      title: 'Missa da Meia-Noite',
      seasons: '1 Temporada',
      episodes: '7 Episódios',
      rating: '4.8',
      synopsis: 'A chegada de um jovem e carismático padre traz milagres misteriosos e presságios assustadores para uma pequena ilha isolada.',
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800',
      trailerUrl: 'https://www.youtube.com/embed/y-XIRcjf3l4', // Midnight Mass
    },
    {
      id: 'ser-3',
      title: 'Stranger Things',
      seasons: '4 Temporadas',
      episodes: '34 Episódios',
      rating: '4.7',
      synopsis: 'O desaparecimento de um garoto revela uma conspiração governamental secreta, experimentos sinistros e uma garota com poderes telecinéticos.',
      image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=800',
      trailerUrl: 'https://www.youtube.com/embed/b9EkMc79ZSU', // Stranger Things
    },
    {
      id: 'ser-4',
      title: 'Love, Death & Robots',
      seasons: '3 Volumes',
      episodes: '35 Episódios',
      rating: '4.6',
      synopsis: 'Uma antologia animada repleta de criaturas assustadoras, surpresas bizarras, humor ácido e terror futurista.',
      image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=800',
      trailerUrl: 'https://www.youtube.com/embed/wUFwunMKa4A', // Love Death Robots
    }
  ];

  // Filter & Search states
  const [selectedGenre, setSelectedGenre] = useState<Genre | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interactive modal states
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [showWriter, setShowWriter] = useState(false);
  const [notification, setNotification] = useState<{
    text: string;
    type: 'success' | 'info';
  } | null>(null);

  // Route path check for /adm at the end of domain
  useEffect(() => {
    const checkPath = () => {
      const isAdm = window.location.pathname === '/adm' || 
                    window.location.pathname.endsWith('/adm') || 
                    window.location.hash === '#/adm' ||
                    window.location.hash === '#adm';
      setIsAdminRoute(isAdm);
    };
    checkPath();
    window.addEventListener('popstate', checkPath);
    window.addEventListener('hashchange', checkPath);
    return () => {
      window.removeEventListener('popstate', checkPath);
      window.removeEventListener('hashchange', checkPath);
    };
  }, []);

  const navigateHome = () => {
    window.history.pushState({}, '', '/');
    window.location.hash = '';
    setIsAdminRoute(false);
    fetchStories();
  };

  // Load and seed stories from Firestore
  const fetchStories = async () => {
    try {
      setLoading(true);
      const storiesRef = collection(db, 'stories');
      const q = query(storiesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      let fetchedStories: Story[] = [];
      querySnapshot.forEach((doc) => {
        fetchedStories.push({ ...doc.data(), id: doc.id } as Story);
      });

      // If database is brand new and completely empty, auto-seed with our starter stories!
      if (fetchedStories.length === 0) {
        console.log("Banco de dados vazio. Semeando histórias iniciais...");
        try {
          const seedPromises = STARTER_STORIES.map(story => addDoc(storiesRef, story));
          await Promise.all(seedPromises);
        } catch (seedErr) {
          if (seedErr instanceof Error && (seedErr.message.toLowerCase().includes('permission') || seedErr.message.toLowerCase().includes('insufficient'))) {
            handleFirestoreError(seedErr, OperationType.CREATE, 'stories');
          }
          throw seedErr;
        }
        
        // Re-fetch now that we seeded
        const newSnapshot = await getDocs(q);
        fetchedStories = [];
        newSnapshot.forEach((doc) => {
          fetchedStories.push({ ...doc.data(), id: doc.id } as Story);
        });
      }

      setStories(fetchedStories);
    } catch (err) {
      console.error("Erro ao carregar do Firestore:", err);
      if (err instanceof Error && (err.message.toLowerCase().includes('permission') || err.message.toLowerCase().includes('insufficient'))) {
        handleFirestoreError(err, OperationType.LIST, 'stories');
      }
      // Fallback to local starter stories if firestore connectivity is down
      setStories(STARTER_STORIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  // Update readStoryIds whenever visitor opens a story to read
  useEffect(() => {
    if (selectedStoryId) {
      setReadStoryIds(prev => {
        if (prev.includes(selectedStoryId)) return prev;
        const next = [...prev, selectedStoryId];
        localStorage.setItem('read_story_ids', JSON.stringify(next));
        return next;
      });
    }
  }, [selectedStoryId]);

  // Monitor stories list for new book launches and comments on read stories
  useEffect(() => {
    if (stories.length === 0) return;

    // 1. Detect new story releases
    let knownStoryIds: string[] = [];
    try {
      knownStoryIds = JSON.parse(localStorage.getItem('known_story_ids') || '[]');
    } catch {
      knownStoryIds = [];
    }

    if (knownStoryIds.length > 0) {
      const newStories = stories.filter(s => s.id && !knownStoryIds.includes(s.id));
      if (newStories.length > 0) {
        newStories.forEach(newStory => {
          const newNotif = {
            id: `notif-release-${Date.now()}-${newStory.id}`,
            title: 'Novo Lançamento!',
            message: `O autor ${newStory.author} acabou de lançar um novo relato: '${newStory.title}'. Venha ler!`,
            time: 'Agora',
            unread: true,
            category: newStory.genre
          };
          setNotifications(prev => [newNotif, ...prev]);
          setNotificationCount(c => c + 1);
          showToast(`Novo relato lançado: "${newStory.title}"`, 'info');
        });
      }
    }
    // Update known story IDs
    const currentStoryIds = stories.map(s => s.id).filter(Boolean) as string[];
    localStorage.setItem('known_story_ids', JSON.stringify(currentStoryIds));

    // 2. Detect new comments on stories that the visitor has read
    const updatedCommentCounts: Record<string, number> = {};
    let addedCommentNotif = false;

    stories.forEach(story => {
      if (!story.id) return;
      const currentCount = story.comments?.length || 0;
      updatedCommentCounts[story.id] = currentCount;

      if (readStoryIds.includes(story.id)) {
        const lastCount = lastCommentCounts[story.id];
        if (lastCount !== undefined && currentCount > lastCount) {
          // A new comment was posted! Grab the latest comment
          const latestComment = story.comments[story.comments.length - 1] || story.comments[0];
          if (latestComment) {
            const commentSnippet = latestComment.text.length > 60 ? `${latestComment.text.substring(0, 57)}...` : latestComment.text;
            
            const newNotif = {
              id: `notif-comment-${Date.now()}-${story.id}`,
              title: 'Novo Comentário em Relato Lido',
              message: `Alguém comentou no conto '${story.title}' que você leu: "${commentSnippet}"`,
              time: 'Agora',
              unread: true,
              category: story.genre
            };
            setNotifications(prev => [newNotif, ...prev]);
            setNotificationCount(c => c + 1);
            addedCommentNotif = true;
          }
        }
      }
    });

    // Update comment counts
    localStorage.setItem('last_comment_counts', JSON.stringify(updatedCommentCounts));
    setLastCommentCounts(updatedCommentCounts);

    if (addedCommentNotif) {
      showToast('Novo comentário em um conto que você leu!', 'info');
    }
  }, [stories, readStoryIds]);

  // Show a visual toast notification
  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Filter stories based on query and genre selection
  const filteredStories = stories.filter(story => {
    const matchesGenre = selectedGenre === 'all' || story.genre === selectedGenre;
    const matchesQuery = 
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.synopsis.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGenre && matchesQuery;
  });

  // Find featured story (or fallback to first story)
  const featuredStory = stories.find(s => s.isFeatured) || stories[0];

  // Helper for genre badges
  const getGenreBadge = (genre: Genre) => {
    switch (genre) {
      case 'terror':
        return <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-red-500/10 border border-red-500/20 text-red-400 uppercase tracking-widest">Terror</span>;
      case 'romance':
        return <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400 uppercase tracking-widest">Romance</span>;
      case 'ficcao':
        return <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 uppercase tracking-widest">Ficção</span>;
      case 'fantasia':
        return <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-purple-500/10 border border-purple-500/20 text-purple-400 uppercase tracking-widest">Fantasia</span>;
      case 'drama':
        return <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase tracking-widest">Drama</span>;
      case 'crime':
        return <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-widest">Crime</span>;
    }
  };

  const getGenreThemeColor = (genre: Genre) => {
    switch (genre) {
      case 'terror': return 'hover:border-red-500/40 shadow-red-500/2';
      case 'romance': return 'hover:border-rose-500/40 shadow-rose-500/2';
      case 'ficcao': return 'hover:border-cyan-500/40 shadow-cyan-500/2';
      case 'fantasia': return 'hover:border-purple-500/40 shadow-purple-500/2';
      case 'drama': return 'hover:border-amber-500/40 shadow-amber-500/2';
      case 'crime': return 'hover:border-emerald-500/40 shadow-emerald-500/2';
    }
  };

  if (isAdminRoute) {
    return <AdminDashboard onBackToSite={navigateHome} />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 selection:bg-indigo-500 selection:text-white font-sans overflow-x-hidden pb-24 md:pb-12">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-neutral-900 border border-indigo-500/30 shadow-xl shadow-black/60 text-sm font-medium"
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <Bell className="w-4 h-4 text-indigo-400 animate-bounce" />
            )}
            <span className="text-neutral-100">{notification.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Responsive Sticky Top Header Bar */}
      <header className="sticky top-0 z-40 w-full bg-neutral-950/90 backdrop-blur-xl border-b border-neutral-900/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div 
            onClick={() => setActiveTab('contos')} 
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-8 h-8 rounded-lg bg-red-950/80 border border-red-500/30 flex items-center justify-center text-red-500 shadow-md group-hover:bg-red-900/50 transition-colors">
              <Flame className="w-4 h-4 fill-current animate-pulse text-red-500" />
            </div>
            <span className="font-display font-black tracking-widest text-sm sm:text-base text-neutral-100 group-hover:text-red-400 transition-colors">
              TINTA & TERROR
            </span>
          </div>

          {/* Desktop Navigation Links (Only on computers!) */}
          <nav className="hidden md:flex items-center gap-1.5 bg-neutral-900/40 p-1 border border-neutral-800/40 rounded-xl">
            <button
              onClick={() => setActiveTab('contos')}
              className={`flex items-center gap-2 py-1.5 px-4 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'contos'
                  ? 'bg-neutral-800 text-indigo-400 shadow-md border border-neutral-700/50'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/30'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Contos</span>
            </button>

            <button
              onClick={() => setActiveTab('notificacoes')}
              className={`flex items-center gap-2 py-1.5 px-4 rounded-lg text-xs font-semibold transition-all relative cursor-pointer ${
                activeTab === 'notificacoes'
                  ? 'bg-neutral-800 text-indigo-400 shadow-md border border-neutral-700/50'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/30'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notificações</span>
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold px-1 min-w-[15px] h-[15px] rounded-full flex items-center justify-center border border-neutral-900 animate-pulse">
                  {notificationCount}
                </span>
              )}
            </button>
          </nav>

          {/* Actions Bar */}
          <div className="flex items-center gap-2.5">
            {/* Quick Write Story Button */}
            <button
              onClick={() => setShowWriter(true)}
              className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-950/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Escrever Conto</span>
            </button>

            {/* Mobile quick shortcut to notifications tab */}
            <div className="md:hidden">
              <button 
                onClick={() => setActiveTab('notificacoes')}
                className="relative p-2.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-xl text-neutral-300 transition-all cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center border border-neutral-950 animate-pulse">
                    {notificationCount}
                  </span>
                )}
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* 1. CONTOS TAB VIEW */}
      {activeTab === 'contos' && (
        <>
          {/* Spooky Header Horror Banner Section */}
          <header className="relative w-full aspect-video max-h-[500px] overflow-hidden flex items-end">
            {/* Real Spooky Background (Video or Image) with parallax overlay */}
            <div className="absolute inset-0 z-0">
              {useVideo ? (
                <video
                  key={videoSource}
                  autoPlay
                  loop
                  muted
                  playsInline
                  onError={handleVideoError}
                  className="w-full h-full object-cover scale-105 filter brightness-[0.45] contrast-[1.1]"
                >
                  <source src={videoSource} type="video/mp4" />
                </video>
              ) : (
                <img 
                  src={horrorBanner} 
                  alt="Terror Banner" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover scale-105 filter brightness-[0.45] contrast-[1.1]"
                />
              )}
              {/* Gradients blending top, sides, and bottom perfectly */}
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-black/60" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neutral-950/10 to-neutral-950" />
              <div className="absolute inset-0 bg-radial-gradient-overlay pointer-events-none" />
            </div>

            {/* Ambient floating fog lines for high mood */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-neutral-950 to-transparent pointer-events-none z-1" />

            {/* Brand Banner Contents */}
            <div className="w-full max-w-7xl mx-auto px-6 pb-8 md:pb-12 relative z-10">
              <div className="max-w-2xl">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="flex items-center gap-2 mb-2"
                >
                  <span className="h-[1px] w-8 bg-red-500" />
                  <span className="text-xs uppercase tracking-[0.25em] text-red-500 font-bold font-mono">Antologia Literária Sombria</span>
                </motion.div>

                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.15 }}
                  className="text-4xl md:text-6xl font-display font-extrabold tracking-widest text-neutral-100 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
                >
                  TINTA & TERROR
                </motion.h1>

                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="text-xs md:text-sm text-neutral-300 mt-2.5 max-w-lg leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] font-serif italic"
                >
                  "Onde as sombras tomam forma, o romance transborda em tragédia e a ficção esculpe novos universos. Ouse ler. Atreva-se a escrever."
                </motion.p>
              </div>
            </div>
          </header>

          {/* Middle Interactive Control Section */}
          <section className="relative z-20 max-w-7xl mx-auto px-6 -mt-4">
            {/* Navigation & Utilities Glass Bar */}
            <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800/80 rounded-2xl md:rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl shadow-black/40">
              
              {/* Genre Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                <button
                  id="btn-genre-all"
                  onClick={() => setSelectedGenre('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                    selectedGenre === 'all' 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
                  }`}
                >
                  Todos os Contos
                </button>
                {(['terror', 'romance', 'ficcao', 'fantasia', 'drama', 'crime'] as Genre[]).map((g) => (
                  <button
                    key={g}
                    id={`btn-genre-tab-${g}`}
                    onClick={() => setSelectedGenre(g)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold capitalize transition-all duration-300 ${
                      selectedGenre === g 
                        ? g === 'terror' ? 'bg-red-500/15 border border-red-500/30 text-red-400 shadow-sm shadow-red-950/20'
                          : g === 'romance' ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400 shadow-sm shadow-rose-950/20'
                          : g === 'ficcao' ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-sm shadow-cyan-950/20'
                          : g === 'fantasia' ? 'bg-purple-500/15 border border-purple-500/30 text-purple-400 shadow-sm shadow-purple-950/20'
                          : g === 'drama' ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-sm shadow-amber-950/20'
                          : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-950/20'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
                    }`}
                  >
                    {g === 'ficcao' ? 'Ficção' : g}
                  </button>
                ))}
              </div>

              {/* Search bar */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-64">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    id="input-search-stories"
                    placeholder="Pesquisar conto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-2.5 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none transition-all"
                  />
                </div>
              </div>

            </div>
          </section>

          {/* Main Content Area */}
          <main className="max-w-7xl mx-auto px-6 mt-12">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-12 h-12 border-4 border-t-indigo-500 border-indigo-200/20 rounded-full animate-spin" />
                <p className="text-sm font-medium text-neutral-400">Invocando contos da fogueira...</p>
              </div>
            ) : (
              <div className="space-y-12">
                
                {/* Featured Story Spotlight */}
                {selectedGenre === 'all' && searchQuery === '' && featuredStory && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Conto em Destaque</h3>
                    </div>

                    <div 
                      id="featured-story-banner"
                      onClick={() => setSelectedStoryId(featuredStory.id || '')}
                      className="group relative overflow-hidden bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-10 cursor-pointer flex flex-col md:flex-row items-center gap-8 transition-all duration-300 hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/5"
                    >
                      <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-red-500/10 transition-all duration-500" />

                      <div className="w-full md:w-1/3 aspect-[4/3] md:aspect-square bg-neutral-950 rounded-2xl relative overflow-hidden shrink-0 border border-neutral-800">
                        <img 
                          src={horrorBanner} 
                          alt="Mini featured illustration" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-75"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
                        <div className="absolute bottom-4 left-4">
                          {getGenreBadge(featuredStory.genre)}
                        </div>
                      </div>

                      <div className="flex-1 space-y-4 text-left">
                        <div>
                          <h4 className="text-xs text-neutral-500 font-mono">Por <strong className="text-neutral-300">{featuredStory.author}</strong></h4>
                          <h2 className="text-2xl md:text-4xl font-bold font-serif tracking-tight text-neutral-100 group-hover:text-indigo-400 transition-colors mt-1.5">
                            {featuredStory.title}
                          </h2>
                        </div>

                        <p className="text-sm text-neutral-400 leading-relaxed font-serif max-w-xl">
                          "{featuredStory.synopsis}"
                        </p>

                        <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-mono text-neutral-500">
                          <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {featuredStory.reads} Leituras</span>
                          <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-rose-500/80" /> {featuredStory.likes} Curtidas</span>
                          <span className="flex items-center gap-1.5"><MessageSquare className="w-4 h-4" /> {featuredStory.comments.length} Comentários</span>
                        </div>

                        <div className="pt-2 flex items-center gap-1 text-xs font-bold text-indigo-400 group-hover:text-indigo-300">
                          <span>Iniciar Leitura Imersiva</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stories Grid */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                        {selectedGenre === 'all' ? 'Últimos Relatos Publicados' : `Relatos de ${selectedGenre}`} ({filteredStories.length})
                      </h3>
                    </div>
                  </div>

                  {filteredStories.length === 0 ? (
                    <div className="bg-neutral-900/40 border border-neutral-800 rounded-3xl p-16 text-center">
                      <p className="text-base text-neutral-400 italic font-serif">"As sombras silenciaram... Nenhum conto condiz com sua busca."</p>
                      <p className="text-xs text-neutral-500 mt-2">Aguarde os próximos sussurros criados pelo autor Marcos Furtado.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredStories.map((story) => (
                        <motion.div
                          layout
                          key={story.id}
                          id={`story-card-${story.id}`}
                          onClick={() => setSelectedStoryId(story.id || '')}
                          className={`group relative overflow-hidden bg-neutral-900 border border-neutral-800/80 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-xl border-l-4 border-l-neutral-700/40 ${getGenreThemeColor(story.genre)}`}
                        >
                          <div className="flex justify-between items-center mb-4">
                            {getGenreBadge(story.genre)}
                            <span className="text-[10px] text-neutral-500 font-mono">
                              {new Date(story.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>

                          <div className="mb-3.5">
                            <h2 className="text-lg font-bold text-neutral-100 font-serif leading-snug group-hover:text-indigo-400 transition-colors line-clamp-1">
                              {story.title}
                            </h2>
                            <span className="text-xs text-neutral-400 font-medium">Por <strong className="text-neutral-300">{story.author}</strong></span>
                          </div>

                          <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed mb-5 italic font-serif">
                            "{story.synopsis}"
                          </p>

                          <div className="flex items-center justify-between pt-4 border-t border-neutral-800/60 text-[11px] font-mono text-neutral-500 mt-auto">
                            <div className="flex gap-3.5">
                              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {story.reads}</span>
                              <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {story.likes}</span>
                              <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {story.comments.length}</span>
                            </div>
                            <span className="text-indigo-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5 font-bold">
                              Ler <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </main>
        </>
      )}





      {/* 4. NOTIFICAÇÕES TAB VIEW */}
      {activeTab === 'notificacoes' && (
        <div className="max-w-3xl mx-auto px-6 mt-12 text-left">
          <div className="flex items-center justify-between gap-4 border-b border-neutral-900 pb-5 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neutral-100 tracking-tight">Sussurros da Fogueira</h1>
                <p className="text-xs text-neutral-400">Seus avisos, interações e atualizações do abismo.</p>
              </div>
            </div>

            {notificationCount > 0 && (
              <button 
                onClick={() => {
                  setNotificationCount(0);
                  setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
                  showToast('Todas as notificações foram marcadas como lidas!', 'success');
                }}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-xs font-bold text-indigo-400 hover:text-indigo-300 rounded-xl border border-neutral-800 transition-all cursor-pointer"
              >
                Marcar lidas
              </button>
            )}
          </div>

          <div className="space-y-4">
            {notifications.map((item) => (
              <div 
                key={item.id}
                className={`p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 ${
                  item.unread 
                    ? 'bg-indigo-950/20 border-indigo-500/30' 
                    : 'bg-neutral-900/40 border-neutral-800'
                }`}
              >
                <div className={`p-2.5 rounded-xl mt-1 ${
                  item.category === 'terror' ? 'bg-red-500/10 text-red-400'
                    : item.category === 'romance' ? 'bg-rose-500/10 text-rose-400'
                    : 'bg-cyan-500/10 text-cyan-400'
                }`}>
                  {item.category === 'terror' ? <Flame className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-sm font-bold text-neutral-100">{item.title}</h3>
                    <span className="text-[10px] text-neutral-500 font-mono shrink-0">{item.time}</span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed font-serif">
                    {item.message}
                  </p>
                  
                  {item.unread && (
                    <div className="pt-2">
                      <button 
                        onClick={() => {
                          setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, unread: false } : n));
                          setNotificationCount(c => Math.max(0, c - 1));
                          showToast('Sussurro assimilado!', 'success');
                        }}
                        className="text-[10px] text-indigo-400 font-bold hover:underline cursor-pointer"
                      >
                        Marcar como lido
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {notifications.length === 0 && (
              <div className="bg-neutral-900/40 border border-neutral-800 rounded-3xl p-16 text-center">
                <p className="text-base text-neutral-400 italic font-serif">"O silêncio absoluto reina... Nenhuma notificação."</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subtle Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 mt-8 pb-32 md:pb-12 pt-8 border-t border-neutral-900/40 text-center text-xs text-neutral-600">
        <span>&copy; {new Date().getFullYear()} Tinta & Terror. Todos os direitos reservados ao autor Marcos Furtado.</span>
      </footer>

      {/* Floating Bottom Navigation Bar (matches original image perfectly!) */}
      <div className="fixed bottom-4 left-4 right-4 z-40 max-w-xs mx-auto md:hidden">
        <div className="bg-neutral-900/90 backdrop-blur-xl border border-neutral-800/80 rounded-2xl shadow-2xl py-2 px-3 flex justify-around items-center">
          
          {/* Contos Tab */}
          <button
            onClick={() => setActiveTab('contos')}
            className={`flex flex-col items-center gap-1.5 py-1.5 px-3.5 rounded-xl transition-all duration-300 cursor-pointer ${
              activeTab === 'contos' 
                ? 'text-indigo-400 font-bold scale-105' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] tracking-wider font-semibold">Contos</span>
          </button>

          {/* Notificações Tab */}
          <button
            onClick={() => setActiveTab('notificacoes')}
            className={`flex flex-col items-center gap-1.5 py-1.5 px-3.5 rounded-xl transition-all duration-300 relative cursor-pointer ${
              activeTab === 'notificacoes' 
                ? 'text-indigo-400 font-bold scale-105' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-2.5 bg-red-600 text-white text-[9px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center border border-neutral-900 animate-pulse">
                {notificationCount}
              </span>
            )}
            <span className="text-[10px] tracking-wider font-semibold">Notificações</span>
          </button>

        </div>
      </div>

      {/* Cinematic Youtube Trailer Modal */}
      <AnimatePresence>
        {selectedTrailerUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-md flex items-center justify-center p-4 md:p-10"
          >
            <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedTrailerUrl(null)} />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-neutral-900 border border-neutral-800/80 rounded-3xl overflow-hidden w-full max-w-4xl shadow-2xl relative z-10 flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <Play className="w-5 h-5 text-indigo-400" />
                  <span className="text-sm font-bold text-neutral-100">Trailer: {selectedTrailerTitle}</span>
                </div>
                <button 
                  onClick={() => setSelectedTrailerUrl(null)}
                  className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* YouTube Responsive Embed */}
              <div className="relative w-full aspect-video bg-black">
                <iframe 
                  src={selectedTrailerUrl} 
                  title={`Trailer de ${selectedTrailerTitle}`}
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>

              <div className="p-4 bg-neutral-950/80 text-center text-[10px] text-neutral-500 font-mono">
                * Toque fora do modal ou clique no "X" para fechar a projeção.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sliding Immersive Reader modal */}
      <AnimatePresence>
        {selectedStoryId && (
          <StoryReader 
            storyId={selectedStoryId} 
            onClose={() => {
              setSelectedStoryId(null);
              fetchStories(); // reload list metrics
            }} 
          />
        )}
      </AnimatePresence>

      {/* Sliding Writer's Studio modal */}
      <AnimatePresence>
        {showWriter && (
          <StoryWriter 
            onClose={() => setShowWriter(false)} 
            onPublishSuccess={() => {
              setShowWriter(false);
              showToast('Seu relato foi publicado com sucesso na fogueira!', 'success');
              fetchStories(); // reload stories list
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
