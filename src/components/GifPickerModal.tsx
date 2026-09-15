import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  X,
  Sparkles,
  Link as LinkIcon,
  Upload,
  Check,
  Image as ImageIcon,
  Film,
} from 'lucide-react';
import { CURATED_GIFS, GIF_CATEGORIES, GifItem } from '../data/gifs';

interface GifPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGif: (url: string) => void;
  currentGifUrl?: string;
}

export const GifPickerModal: React.FC<GifPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectGif,
  currentGifUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'gifs' | 'url' | 'upload'>('gifs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customUrl, setCustomUrl] = useState('');
  const [customPreviewError, setCustomPreviewError] = useState(false);
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter GIFs by query and category
  const filteredGifs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return CURATED_GIFS.filter((gif) => {
      const matchesCat = selectedCategory === 'all' || gif.category === selectedCategory;
      if (!q) return matchesCat;

      const matchesSearch =
        gif.title.toLowerCase().includes(q) ||
        gif.category.toLowerCase().includes(q) ||
        gif.tags.some((t) => t.toLowerCase().includes(q));

      return matchesCat && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const handleSelect = (url: string) => {
    onSelectGif(url);
    onClose();
  };

  const handleApplyCustomUrl = () => {
    const trimmed = customUrl.trim();
    if (!trimmed) return;
    handleSelect(trimmed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem ou GIF válido.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('O tamanho da imagem não pode ultrapassar 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setUploadedDataUrl(result);
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-emerald-300 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#00A868] to-[#08301D] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
              <Film className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-['Outfit',sans-serif] text-base sm:text-lg font-bold">
                Adicionar GIF ou Imagem
              </h2>
              <p className="text-[11px] text-emerald-100/90">
                Como no WhatsApp: pesquise por tema, cole um link ou envie uma imagem
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-emerald-100 bg-emerald-50/50 p-2 gap-1.5 text-xs font-semibold text-emerald-900">
          <button
            type="button"
            onClick={() => setActiveTab('gifs')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'gifs'
                ? 'bg-white text-[#008F58] shadow-xs border border-emerald-200 font-bold'
                : 'text-emerald-700 hover:bg-white/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Buscar GIFs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'url'
                ? 'bg-white text-[#008F58] shadow-xs border border-emerald-200 font-bold'
                : 'text-emerald-700 hover:bg-white/60'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Colar Link (URL)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-[#008F58] shadow-xs border border-emerald-200 font-bold'
                : 'text-emerald-700 hover:bg-white/60'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Enviar Imagem</span>
          </button>
        </div>

        {/* TAB 1: Searchable GIFs Catalog (WhatsApp style) */}
        {activeTab === 'gifs' && (
          <div className="p-4 sm:p-5 flex-1 flex flex-col overflow-hidden space-y-3">
            {/* WhatsApp-Style Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar GIFs... (ex: obrigado, parabéns, tamo junto, palmas, café)"
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00A868] focus:border-transparent text-xs sm:text-sm text-emerald-950 transition-all placeholder:text-emerald-800/50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-emerald-600 hover:text-emerald-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none text-xs">
              {GIF_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all cursor-pointer text-xs shrink-0 ${
                      isSelected
                        ? 'bg-[#00A868] text-white shadow-xs font-bold'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* GIFs Masonry Grid */}
            <div className="flex-1 overflow-y-auto pr-1">
              {filteredGifs.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <p className="text-sm font-semibold text-emerald-900">
                    Nenhum GIF encontrado para "{searchQuery}".
                  </p>
                  <p className="text-xs text-emerald-700">
                    Tente outras palavras como "obrigado", "parabéns", "festa" ou cole um link na aba "Colar Link".
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {filteredGifs.map((gif) => {
                    const isCurrent = currentGifUrl === gif.url;
                    return (
                      <button
                        key={gif.id}
                        type="button"
                        onClick={() => handleSelect(gif.url)}
                        className={`group relative rounded-2xl overflow-hidden border-2 bg-emerald-950/5 text-left transition-all hover:scale-[1.02] cursor-pointer shadow-xs aspect-video flex flex-col justify-end ${
                          isCurrent
                            ? 'border-[#00A868] ring-3 ring-emerald-400/40 shadow-md'
                            : 'border-emerald-200 hover:border-[#00A868]'
                        }`}
                      >
                        <img
                          src={gif.url}
                          alt={gif.title}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="absolute inset-0 w-full h-full object-cover group-hover:opacity-95 transition-opacity"
                        />
                        <div className="relative p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
                          <p className="text-[11px] font-semibold truncate drop-shadow-xs">
                            {gif.title}
                          </p>
                        </div>
                        {isCurrent && (
                          <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#00A868] text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Direct URL Input */}
        {activeTab === 'url' && (
          <div className="p-5 sm:p-6 space-y-4 flex-1 overflow-y-auto">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-emerald-950">
                Cole o link direto do GIF ou Imagem:
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => {
                    setCustomUrl(e.target.value);
                    setCustomPreviewError(false);
                  }}
                  placeholder="https://media.giphy.com/.../giphy.gif"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-emerald-300 text-xs sm:text-sm text-emerald-950 focus:outline-none focus:ring-2 focus:ring-[#00A868]"
                />
              </div>
              <p className="text-[11px] text-emerald-800/80">
                Suporta links diretos do Giphy, Tenor, Imgur ou qualquer URL de imagem terminada em .gif, .png, .jpg ou .webp.
              </p>
            </div>

            {/* URL Live Preview */}
            {customUrl.trim() && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-center">
                <span className="text-xs font-bold text-emerald-900 block">Prévia da imagem:</span>
                {!customPreviewError ? (
                  <div className="max-h-56 rounded-xl overflow-hidden flex items-center justify-center bg-black/5 mx-auto">
                    <img
                      src={customUrl.trim()}
                      alt="Prévia"
                      onError={() => setCustomPreviewError(true)}
                      className="max-h-52 max-w-full object-contain rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <p className="text-xs text-red-600 font-medium py-4">
                    Não foi possível carregar a imagem deste link. Verifique a URL e tente novamente.
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleApplyCustomUrl}
                  disabled={customPreviewError}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#00A868] hover:bg-[#008F58] transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Usar este GIF / Imagem</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: File Upload */}
        {activeTab === 'upload' && (
          <div className="p-5 sm:p-6 space-y-4 flex-1 overflow-y-auto">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-emerald-300 hover:border-[#00A868] rounded-3xl p-8 sm:p-10 text-center space-y-3 cursor-pointer bg-emerald-50/40 hover:bg-emerald-50 transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#00A868] flex items-center justify-center mx-auto shadow-xs">
                <ImageIcon className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-emerald-950">
                  Clique para selecionar uma imagem ou GIF do seu dispositivo
                </p>
                <p className="text-xs text-emerald-800/80">
                  Formatos suportados: GIF animado, PNG, JPG, WebP (até 5MB)
                </p>
              </div>
            </div>

            {uploadedDataUrl && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <span className="text-xs font-bold text-emerald-900 block">Prévia da imagem carregada:</span>
                <div className="max-h-56 rounded-xl overflow-hidden flex items-center justify-center bg-black/5 mx-auto">
                  <img
                    src={uploadedDataUrl}
                    alt="Upload prévia"
                    className="max-h-52 max-w-full object-contain rounded-lg"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSelect(uploadedDataUrl)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#00A868] hover:bg-[#008F58] transition-all cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirmar e usar imagem</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal Bottom Bar */}
        <div className="p-3.5 sm:p-4 bg-emerald-50/80 border-t border-emerald-200 flex items-center justify-between text-xs">
          {currentGifUrl ? (
            <button
              type="button"
              onClick={() => {
                onSelectGif('');
                onClose();
              }}
              className="text-red-700 hover:text-red-900 font-semibold cursor-pointer underline"
            >
              Remover GIF/Imagem atual
            </button>
          ) : (
            <span className="text-emerald-700 text-[11px]">
              Selecione qualquer GIF para alegrar seu recado!
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-emerald-900 bg-white border border-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
