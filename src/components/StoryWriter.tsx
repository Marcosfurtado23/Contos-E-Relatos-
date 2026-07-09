import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, PenTool, BookOpen, Send, RefreshCw, 
  Eye, AlertTriangle, Keyboard
} from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Genre, Story } from '../types';

interface StoryWriterProps {
  onClose: () => void;
  onPublishSuccess: () => void;
}

export default function StoryWriter({ onClose, onPublishSuccess }: StoryWriterProps) {
  // Form States
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState<Genre>('terror');
  const [synopsis, setSynopsis] = useState('');
  const [content, setContent] = useState('');
  
  // App States
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Character & word counters
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !synopsis.trim() || !content.trim()) {
      setError('Por favor, preencha todos os campos obrigatórios (Título, Sinopse e História).');
      return;
    }

    try {
      setSubmitting(true);

      const newStoryData = {
        title: title.trim(),
        author: author.trim() || 'Escritor Anônimo',
        genre,
        synopsis: synopsis.trim(),
        content: content.trim(),
        createdAt: new Date().toISOString(),
        likes: 0,
        reads: 0,
        comments: []
      };

      await addDoc(collection(db, 'stories'), newStoryData);
      
      // Success feedback
      onPublishSuccess();
    } catch (err: any) {
      console.error("Erro ao salvar no Firestore:", err);
      if (err instanceof Error && (err.message.toLowerCase().includes('permission') || err.message.toLowerCase().includes('insufficient'))) {
        handleFirestoreError(err, OperationType.CREATE, 'stories');
      }
      setError('Erro ao enviar a história para o banco de dados. Verifique sua conexão.');
    } finally {
      setSubmitting(false);
    }
  };

  // Genre aesthetic descriptors
  const getGenreColor = (g: Genre) => {
    switch (g) {
      case 'terror': return 'focus:ring-red-500 border-red-950/20 text-red-400';
      case 'romance': return 'focus:ring-rose-500 border-rose-950/20 text-rose-400';
      case 'ficcao': return 'focus:ring-cyan-500 border-cyan-950/20 text-cyan-400';
      case 'fantasia': return 'focus:ring-purple-500 border-purple-950/20 text-purple-400';
      case 'drama': return 'focus:ring-amber-500 border-amber-950/20 text-amber-400';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-3xl h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
        
        {/* Banner/Header */}
        <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
              <PenTool className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-100">Estúdio de Criação</h2>
              <p className="text-xs text-neutral-400 hidden sm:block">Compartilhe seus contos e relatos com o mundo</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            id="btn-close-writer"
            className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-neutral-400 hover:text-neutral-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content workspace */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-400 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold">Opa, algo deu errado!</h4>
                <p className="mt-0.5 opacity-90">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Genre Selector */}
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2.5">
                Qual é o gênero do relato?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                {(['terror', 'romance', 'ficcao', 'fantasia', 'drama', 'crime'] as Genre[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    id={`btn-genre-select-${g}`}
                    onClick={() => setGenre(g)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all duration-300 ${
                      genre === g 
                        ? g === 'terror' ? 'bg-red-950/40 border-red-500/50 text-red-400 shadow-md shadow-red-950/20'
                          : g === 'romance' ? 'bg-rose-950/40 border-rose-500/50 text-rose-400 shadow-md shadow-rose-950/20'
                          : g === 'ficcao' ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-400 shadow-md shadow-cyan-950/20'
                          : g === 'fantasia' ? 'bg-purple-950/40 border-purple-500/50 text-purple-400 shadow-md shadow-purple-950/20'
                          : g === 'drama' ? 'bg-amber-950/40 border-amber-500/50 text-amber-400 shadow-md shadow-amber-950/20'
                          : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400 shadow-md shadow-emerald-950/20'
                        : 'bg-neutral-950/40 border-neutral-800 hover:border-neutral-700 text-neutral-400'
                    }`}
                  >
                    {g === 'ficcao' ? 'Ficção' : g}
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Author Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Título do Conto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="input-write-title"
                  placeholder="Ex: O Corvo de Prata"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={100}
                  className="w-full bg-neutral-950/40 border border-neutral-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Nome do Autor ou Pseudônimo
                </label>
                <input
                  type="text"
                  id="input-write-author"
                  placeholder="Ex: Edgar Allan (Deixe vazio para Anônimo)"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  maxLength={50}
                  className="w-full bg-neutral-950/40 border border-neutral-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Synopsis Input */}
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5 flex justify-between">
                <span>Sinopse / Gancho de Leitura <span className="text-red-500">*</span></span>
                <span className="text-[10px] font-normal text-neutral-500 lowercase">breve descrição para chamar atenção</span>
              </label>
              <textarea
                id="textarea-write-synopsis"
                placeholder="Ex: Em uma vila envolta em segredos antigos, uma tecelã descobre que suas tapeçarias podem prever as próximas mortes... até que ela vê a si mesma."
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                required
                maxLength={250}
                rows={2}
                className="w-full bg-neutral-950/40 border border-neutral-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Story Content Editor */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Sua História / Relato <span className="text-red-500">*</span>
                </label>
                
                {/* Tab switches */}
                <div className="flex rounded-lg bg-neutral-950 p-0.5 border border-neutral-800 text-xs">
                  <button
                    type="button"
                    id="tab-edit-write"
                    onClick={() => setActiveTab('write')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${activeTab === 'write' ? 'bg-indigo-600 text-white font-medium' : 'text-neutral-400 hover:text-neutral-200'}`}
                  >
                    Escrever
                  </button>
                  <button
                    type="button"
                    id="tab-edit-preview"
                    onClick={() => setActiveTab('preview')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${activeTab === 'preview' ? 'bg-indigo-600 text-white font-medium' : 'text-neutral-400 hover:text-neutral-200'}`}
                  >
                    Visualizar
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'write' ? (
                  <motion.div
                    key="write-panel"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <textarea
                      id="textarea-write-content"
                      placeholder="Escreva livremente aqui. Use parágrafos duplos (uma linha em branco) para separar os parágrafos de forma elegante..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                      rows={10}
                      className="w-full bg-neutral-950/40 border border-neutral-800 focus:border-indigo-500 rounded-2xl px-4 py-4 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none transition-all resize-y min-h-[220px] font-sans"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="preview-panel"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full bg-neutral-950/20 border border-neutral-800 rounded-2xl px-5 py-5 text-sm text-neutral-300 min-h-[220px] max-h-[350px] overflow-y-auto whitespace-pre-wrap font-serif leading-relaxed"
                  >
                    {content.trim() ? (
                      content.split('\n\n').map((para, i) => (
                        <p key={i} className="mb-4 text-justify">{para}</p>
                      ))
                    ) : (
                      <p className="text-center py-12 text-neutral-600 italic">Escreva algo na aba "Escrever" para pré-visualizar aqui.</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Editor indicators */}
              <div className="flex justify-between items-center mt-2 px-1 text-[11px] text-neutral-500 font-mono">
                <div className="flex gap-4">
                  <span>{wordCount} palavras</span>
                  <span>{charCount} caracteres</span>
                </div>
                <div className="flex items-center gap-1">
                  <Keyboard className="w-3.5 h-3.5 opacity-60" />
                  <span>Dica: Use duas quebras de linha para novos parágrafos</span>
                </div>
              </div>
            </div>

            {/* Publish Actions */}
            <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3">
              <button
                type="button"
                id="btn-cancel-publish"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-neutral-800 hover:bg-neutral-800 hover:text-neutral-200 text-sm font-semibold transition-colors text-neutral-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="btn-submit-publish"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/10 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Publicando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Publicar Relato</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </motion.div>
  );
}
