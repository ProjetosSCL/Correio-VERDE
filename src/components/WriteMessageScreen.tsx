import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Send,
  ShieldCheck,
  MapPin,
  CheckSquare,
  Square,
  AlertCircle,
  Tag,
  Lightbulb,
  Sparkles,
  Palette,
  Smile,
  Check,
  User,
  Search,
  X,
  Film,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import {
  PublicRecipient,
  MESSAGE_CATEGORIES,
  MESSAGE_SUGGESTIONS,
  MESSAGE_COLOR_THEMES,
  REACTION_EMOJIS,
  getColorTheme,
  MessageColorTheme,
} from '../types';
import { YellowRibbon } from './YellowRibbon';
import { GifPickerModal } from './GifPickerModal';

interface WriteMessageScreenProps {
  recipients?: PublicRecipient[];
  selectedRecipient?: PublicRecipient | null;
  recipient?: PublicRecipient | null;
  onSelectRecipient?: (recipient: PublicRecipient | null) => void;
  onChangeRecipient?: () => void;
  onSendMessage: (data: {
    recipient_id: string;
    message: string;
    category?: string;
    reaction?: string;
    color_theme?: string;
    gif_url?: string;
    confirmedRespectful: boolean;
  }) => Promise<void>;
  onBack: () => void;
  isSubmitting?: boolean;
  currentCollaboratorId?: string;
}

export const WriteMessageScreen: React.FC<WriteMessageScreenProps> = ({
  recipients: propRecipients,
  selectedRecipient: propSelectedRecipient,
  recipient: legacyRecipient,
  onSelectRecipient,
  onChangeRecipient,
  onSendMessage,
  onBack,
  isSubmitting = false,
  currentCollaboratorId,
}) => {
  const [internalRecipient, setInternalRecipient] = useState<PublicRecipient | null>(
    propSelectedRecipient || legacyRecipient || null
  );

  const currentRecipient = propSelectedRecipient !== undefined ? propSelectedRecipient : (legacyRecipient || internalRecipient);

  const [message, setMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedReaction, setSelectedReaction] = useState<string>('💛');
  const [selectedColorThemeId, setSelectedColorThemeId] = useState<string>('green');
  const [selectedGifUrl, setSelectedGifUrl] = useState<string>('');
  const [isGifModalOpen, setIsGifModalOpen] = useState<boolean>(false);
  const [confirmedRespectful, setConfirmedRespectful] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipientSearch, setRecipientSearch] = useState('');

  const safeRecipients = useMemo(() => {
    if (Array.isArray(propRecipients) && propRecipients.length > 0) return propRecipients;
    if (currentRecipient) return [currentRecipient];
    return [];
  }, [propRecipients, currentRecipient]);

  // Filter out the logged in sender (cannot send to themselves)
  const availableRecipients = useMemo(() => {
    return safeRecipients
      .filter((r) => !currentCollaboratorId || r.id !== currentCollaboratorId)
      .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '', 'pt-BR'));
  }, [safeRecipients, currentCollaboratorId]);

  // Filter dropdown if user types in search box
  const filteredRecipients = useMemo(() => {
    if (!recipientSearch.trim()) return availableRecipients;
    const q = recipientSearch.toLowerCase().trim();
    return availableRecipients.filter(
      (r) =>
        (r.full_name && r.full_name.toLowerCase().includes(q)) ||
        (r.operation && r.operation.toLowerCase().includes(q)) ||
        (r.role && r.role.toLowerCase().includes(q))
    );
  }, [availableRecipients, recipientSearch]);

  const activeTheme: MessageColorTheme = useMemo(() => {
    return getColorTheme(selectedColorThemeId);
  }, [selectedColorThemeId]);

  const characterCount = message.length;
  const minLength = 10;
  const maxLength = 500;
  const isTooShort = characterCount > 0 && characterCount < minLength;
  const isTooLong = characterCount > maxLength;
  const isValidLength = characterCount >= minLength && characterCount <= maxLength;

  const handleSuggestionClick = (suggestion: string) => {
    if (!message) {
      setMessage(suggestion);
    } else {
      setMessage((prev) => {
        const trimmed = prev.trim();
        return trimmed ? `${trimmed} ${suggestion}` : suggestion;
      });
    }
    setError(null);
  };

  const handleSelectDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      setInternalRecipient(null);
      if (onSelectRecipient) onSelectRecipient(null);
    } else {
      const found = availableRecipients.find((r) => r.id === val);
      if (found) {
        setInternalRecipient(found);
        if (onSelectRecipient) onSelectRecipient(found);
      }
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentRecipient) {
      setError('Por favor, selecione quem receberá a mensagem na lista suspensa.');
      return;
    }

    if (!message.trim()) {
      setError('Por favor, escreva uma mensagem antes de enviar.');
      return;
    }

    if (message.trim().length < minLength) {
      setError(`A mensagem precisa ter no mínimo ${minLength} caracteres.`);
      return;
    }

    if (message.trim().length > maxLength) {
      setError(`A mensagem não pode ultrapassar ${maxLength} caracteres.`);
      return;
    }

    if (!confirmedRespectful) {
      setError('Por favor, confirme que a mensagem é respeitosa marcando o termo abaixo.');
      return;
    }

    try {
      await onSendMessage({
        recipient_id: currentRecipient.id,
        message: message.trim(),
        category: selectedCategory || undefined,
        reaction: selectedReaction || undefined,
        color_theme: selectedColorThemeId,
        gif_url: selectedGifUrl || undefined,
        confirmedRespectful: true,
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar a mensagem. Tente novamente.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          id="btn-message-back"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-800 hover:text-emerald-950 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para o início</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Correio Verde</span>
          </span>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-emerald-200/90 p-6 sm:p-8 shadow-xl shadow-emerald-950/5 space-y-7">
        {/* Title & Introduction */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-['Outfit',sans-serif] text-2xl sm:text-3xl font-extrabold text-[#08301D]">
              Enviar uma mensagem
            </h2>
            <YellowRibbon className="w-10 h-5" />
          </div>
          <p className="text-xs sm:text-sm text-emerald-800/80 leading-relaxed">
            Selecione o(a) colaborador(a) na lista suspensa, escreva seu recado de apoio ou reconhecimento,
            adicione uma reação e escolha a cor do seu cartão com carinho!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">
          {/* ============================================================
              1. DROPDOWN LIST OF COLLABORATORS (LISTA SUSPENSA)
             ============================================================ */}
          <div className="p-5 rounded-2xl bg-[#F4F9F5] border-2 border-emerald-300 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label
                htmlFor="recipient-select-dropdown"
                className="text-xs sm:text-sm font-bold text-[#08301D] flex items-center gap-2"
              >
                <User className="w-4 h-4 text-[#00A868]" />
                <span>1. Para quem é essa mensagem? (Lista suspensa de colaboradores) *</span>
              </label>
              <span className="text-[11px] text-emerald-700 font-medium">
                {availableRecipients.length} colaboradores disponíveis
              </span>
            </div>

            {/* Quick Search Helper */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-emerald-600/70" />
              <input
                type="text"
                value={recipientSearch}
                onChange={(e) => setRecipientSearch(e.target.value)}
                placeholder="Filtrar por nome ou polo antes de abrir a lista..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-emerald-300 text-xs text-emerald-950 placeholder-emerald-700/50 focus:outline-none focus:border-[#00A868] focus:ring-2 focus:ring-emerald-500/20"
              />
              {recipientSearch && (
                <button
                  type="button"
                  onClick={() => setRecipientSearch('')}
                  className="absolute right-2.5 top-2.5 text-emerald-600 hover:text-emerald-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* The Main Dropdown */}
            <div className="relative">
              <select
                id="recipient-select-dropdown"
                required
                value={currentRecipient?.id || ''}
                onChange={handleSelectDropdownChange}
                className="w-full p-3.5 rounded-xl bg-white border-2 border-emerald-400 text-emerald-950 text-sm font-medium focus:outline-none focus:border-[#008F58] focus:ring-2 focus:ring-emerald-500/20 shadow-xs cursor-pointer"
              >
                <option value="">
                  {availableRecipients.length === 0
                    ? 'Nenhum colaborador cadastrado ainda'
                    : '▼ Selecione o colaborador na lista suspensa...'}
                </option>
                {filteredRecipients.map((rec) => (
                  <option key={rec.id} value={rec.id}>
                    {rec.full_name} • {rec.operation || 'Stone SCL'} {rec.role ? `(${rec.role})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Recipient Details Card */}
            {currentRecipient ? (
              <div className="p-3.5 rounded-xl bg-white border border-emerald-200 flex items-center justify-between gap-3 shadow-2xs animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00A868] to-[#007D4C] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {currentRecipient.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#08301D] flex items-center gap-2">
                      <span>{currentRecipient.full_name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-amber-500" />
                        {currentRecipient.operation}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700">
                      {currentRecipient.role ? `${currentRecipient.role} • ` : ''}
                      {currentRecipient.email ? currentRecipient.email : 'Colaborador Stone SCL'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setInternalRecipient(null);
                    if (onSelectRecipient) onSelectRecipient(null);
                    if (onChangeRecipient) onChangeRecipient();
                  }}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-950 underline px-2 py-1 cursor-pointer"
                >
                  Alterar
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-emerald-800/80 italic">
                * Escolha o nome da pessoa na lista suspensa acima para poder enviar sua mensagem anônima.
              </p>
            )}
          </div>

          {/* ============================================================
              2. MESSAGE TEXTAREA
             ============================================================ */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="message-textarea"
                className="text-xs sm:text-sm font-bold text-[#08301D] flex items-center gap-1.5"
              >
                <span>2. Escreva sua mensagem anônima: *</span>
              </label>
              <span
                className={`font-mono text-xs ${
                  isTooLong
                    ? 'text-red-600 font-bold'
                    : isTooShort
                    ? 'text-amber-600'
                    : 'text-emerald-700'
                }`}
              >
                {characterCount} / {maxLength} caracteres
              </span>
            </div>

            {/* Suggestions Quick Buttons */}
            <div className="space-y-2 p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#08301D]">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>Ideias rápidas de mensagens (clique para usar):</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {MESSAGE_SUGGESTIONS.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSuggestionClick(sug)}
                    className="text-left text-xs px-2.5 py-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-900 hover:border-[#00A868] hover:bg-emerald-50 transition-colors cursor-pointer shadow-2xs"
                  >
                    "{sug}"
                  </button>
                ))}
              </div>
            </div>

            <textarea
              id="message-textarea"
              rows={5}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Escreva algo que você gostaria que essa pessoa soubesse. Pode ser um agradecimento, uma palavra de incentivo ou um carinho..."
              className="w-full p-4 rounded-2xl bg-[#F8FAF7] border border-emerald-300 text-emerald-950 placeholder-emerald-800/40 text-base leading-relaxed focus:outline-none focus:border-[#00A868] focus:ring-2 focus:ring-emerald-500/20 resize-y transition-all shadow-xs"
            />

            {isTooShort && (
              <p className="text-xs text-amber-600">
                Faltam {minLength - characterCount} caracteres para o mínimo de {minLength}.
              </p>
            )}
            {isTooLong && (
              <p className="text-xs text-red-600">
                Sua mensagem excedeu o limite máximo em {characterCount - maxLength} caracteres.
              </p>
            )}
          </div>

          {/* Optional Category Pills */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-emerald-900">
              <span className="font-bold flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#00A868]" />
                Categoria da mensagem (opcional):
              </span>
              {selectedCategory && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('')}
                  className="text-emerald-700 hover:text-emerald-950 underline text-[11px] cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {MESSAGE_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(isSelected ? '' : cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#00A868] text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ============================================================
              3. FRUFRU 1: "DESEJA ADICIONAR UMA REAÇÃO?" (LISTA DE EMOJIS)
             ============================================================ */}
          <div className="p-5 rounded-2xl bg-amber-50/50 border-2 border-amber-200/80 space-y-3.5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-200/80 text-amber-900 flex items-center justify-center font-bold text-sm">
                  <Smile className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-amber-950">
                    3. Deseja adicionar uma reação?
                  </h3>
                  <p className="text-[11px] text-amber-900/80">
                    Escolha um emoji especial que será entregue junto ao seu cartão!
                  </p>
                </div>
              </div>

              {selectedReaction && (
                <button
                  type="button"
                  onClick={() => setSelectedReaction('')}
                  className="text-amber-800 hover:text-amber-950 underline text-xs self-start sm:self-auto cursor-pointer"
                >
                  Remover reação
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
              {REACTION_EMOJIS.map((item) => {
                const isSelected = selectedReaction === item.emoji;
                return (
                  <button
                    key={item.emoji}
                    type="button"
                    onClick={() => setSelectedReaction(isSelected ? '' : item.emoji)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-amber-300 border-amber-500 shadow-sm scale-105 ring-2 ring-amber-400/40'
                        : 'bg-white border-amber-200 hover:border-amber-400 hover:bg-amber-100/50'
                    }`}
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform">
                      {item.emoji}
                    </span>
                    <span className="text-[11px] font-semibold text-amber-950 truncate">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ============================================================
              4. FRUFRU 2: PERSONALIZAR A MENSAGEM POR COR (VASTA CARTELA)
             ============================================================ */}
          <div className="p-5 rounded-2xl bg-emerald-50/50 border-2 border-emerald-200/80 space-y-3.5 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-200/80 text-emerald-900 flex items-center justify-center font-bold text-sm">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#08301D]">
                  4. Personalize a cor do seu cartão
                </h3>
                <p className="text-[11px] text-emerald-800/80">
                  Vasta cartela colorida com tons alegres e acolhedores:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
              {MESSAGE_COLOR_THEMES.map((theme) => {
                const isSelected = selectedColorThemeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setSelectedColorThemeId(theme.id)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-2 border-[#00A868] bg-white shadow-md ring-2 ring-emerald-400/30'
                        : 'border-emerald-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center shadow-2xs"
                      style={{ backgroundColor: theme.previewColor }}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white drop-shadow-xs" />}
                    </span>
                    <span className="text-xs font-semibold text-emerald-950 truncate">
                      {theme.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ============================================================
              5. ADICIONAR GIF OU IMAGEM (ESTILO WHATSAPP)
             ============================================================ */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-2">
                <Film className="w-4 h-4 text-[#00A868]" />
                <span>5. Adicionar GIF ou Imagem:</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Estilo WhatsApp
                </span>
              </label>

              {selectedGifUrl && (
                <button
                  type="button"
                  onClick={() => setSelectedGifUrl('')}
                  className="text-xs text-red-600 hover:text-red-800 font-semibold cursor-pointer underline flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remover GIF</span>
                </button>
              )}
            </div>

            {!selectedGifUrl ? (
              <button
                type="button"
                onClick={() => setIsGifModalOpen(true)}
                className="w-full p-4 sm:p-5 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-[#00A868] bg-emerald-50/40 hover:bg-emerald-50 transition-all text-left flex items-center justify-between gap-4 cursor-pointer group shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white border border-emerald-200 text-[#00A868] flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                    <Film className="w-5 h-5 text-[#00A868]" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                      <span>Clique para pesquisar GIFs ou enviar imagem</span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    </p>
                    <p className="text-[11px] text-emerald-700/90">
                      Pesquise temas como parabéns, obrigado, aplausos, equipe, café, ou envie do aparelho.
                    </p>
                  </div>
                </div>

                <span className="px-3.5 py-2 rounded-xl bg-[#00A868] text-white text-xs font-bold shrink-0 shadow-xs group-hover:bg-[#008F58] transition-colors flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5" />
                  <span>Buscar GIF</span>
                </span>
              </button>
            ) : (
              <div className="p-3.5 sm:p-4 rounded-2xl border border-emerald-300 bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[#00A868]" />
                    GIF / Imagem anexada:
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsGifModalOpen(true)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition-colors cursor-pointer"
                    >
                      Trocar GIF
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedGifUrl('')}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors cursor-pointer"
                    >
                      Remover
                    </button>
                  </div>
                </div>

                <div className="max-h-56 rounded-xl overflow-hidden bg-black/5 flex items-center justify-center border border-emerald-100 p-2">
                  <img
                    src={selectedGifUrl}
                    alt="GIF selecionado"
                    referrerPolicy="no-referrer"
                    className="max-h-52 max-w-full object-contain rounded-lg shadow-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ============================================================
              6. LIVE CARD PREVIEW (PRÉ-VISUALIZAÇÃO DO CARTÃO EM TEMPO REAL)
             ============================================================ */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#00A868]" />
                Pré-visualização do cartão em tempo real:
              </span>
              <span className="text-[11px] text-emerald-700">
                Tema: <strong>{activeTheme.name}</strong>
              </span>
            </div>

            <div
              className={`p-6 sm:p-7 rounded-3xl border-2 transition-all shadow-md relative overflow-hidden ${activeTheme.bgClass} ${activeTheme.borderClass}`}
            >
              {/* Header inside preview */}
              <div className="flex items-center justify-between pb-3 border-b border-black/10">
                <div className="flex items-center gap-2">
                  <YellowRibbon className="w-7 h-4" />
                  <span className="text-xs font-extrabold uppercase tracking-wider font-['Outfit',sans-serif] opacity-90">
                    Correio Verde • Stone SCL
                  </span>
                </div>

                {selectedCategory && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${activeTheme.accentClass}`}
                  >
                    {selectedCategory}
                  </span>
                )}
              </div>

              {/* Recipient & Reaction Banner */}
              <div className="py-4 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[11px] uppercase tracking-wider font-bold opacity-75">
                    Entregar para:
                  </span>
                  <div className={`text-base sm:text-lg font-extrabold ${activeTheme.textClass}`}>
                    {currentRecipient ? currentRecipient.full_name : '[Selecione na lista suspensa]'}
                  </div>
                  {currentRecipient && (
                    <span className="text-xs opacity-80">
                      {currentRecipient.operation} {currentRecipient.role ? `• ${currentRecipient.role}` : ''}
                    </span>
                  )}
                </div>

                {/* Floating Reaction Badge */}
                {selectedReaction && (
                  <div className="w-12 h-12 rounded-2xl bg-white/90 border border-black/10 shadow-md flex items-center justify-center text-2xl animate-bounce">
                    {selectedReaction}
                  </div>
                )}
              </div>

              {/* Message text */}
              <div className="py-3">
                <p className={`text-sm sm:text-base italic leading-relaxed whitespace-pre-wrap ${activeTheme.textClass}`}>
                  {message.trim() ? `"${message.trim()}"` : '"Sua mensagem especial aparecerá aqui..."'}
                </p>
              </div>

              {/* Attached GIF preview if selected */}
              {selectedGifUrl && (
                <div className="my-2 max-h-56 rounded-2xl overflow-hidden bg-black/5 flex items-center justify-center border border-black/10 p-1">
                  <img
                    src={selectedGifUrl}
                    alt="GIF animado anexo"
                    referrerPolicy="no-referrer"
                    className="max-h-52 max-w-full rounded-xl object-contain shadow-xs"
                  />
                </div>
              )}

              {/* Footer preview */}
              <div className="pt-3 border-t border-black/10 flex items-center justify-between text-[11px] opacity-80 font-medium">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Remetente 100% anônimo
                </span>
                <span>Setembro Amarelo 💛</span>
              </div>
            </div>
          </div>

          {/* ============================================================
              6. CONFIRMATION & SUBMIT
             ============================================================ */}
          <div
            id="checkbox-respectful-container"
            onClick={() => setConfirmedRespectful(!confirmedRespectful)}
            className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-colors ${
              confirmedRespectful
                ? 'bg-emerald-50 border-emerald-400'
                : 'bg-[#FAFCFA] border-emerald-200 hover:border-emerald-300'
            }`}
          >
            <div className="mt-0.5 text-[#00A868]">
              {confirmedRespectful ? (
                <CheckSquare className="w-5 h-5 text-[#00A868]" />
              ) : (
                <Square className="w-5 h-5 text-emerald-300" />
              )}
            </div>
            <label className="text-xs sm:text-sm text-emerald-900 cursor-pointer select-none leading-snug">
              Confirmo que esta mensagem é respeitosa e foi escrita com a intenção de reconhecer, agradecer ou acolher alguém no Stone SCL.
            </label>
          </div>

          {/* Anonymity notice */}
          <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-[#00A868] shrink-0" />
            <span>
              <strong>Garantia de sigilo absoluto:</strong> O destinatário nunca saberá quem enviou. Ele receberá apenas as suas palavras e o carinho do cartão.
            </span>
          </div>

          {/* Error notice if validation fails */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              id="btn-message-cancel"
              type="button"
              onClick={onBack}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-3 rounded-xl text-sm font-semibold text-emerald-800 hover:text-emerald-950 bg-white hover:bg-emerald-50 border border-emerald-300 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              id="btn-message-submit"
              type="submit"
              disabled={isSubmitting || !currentRecipient || !isValidLength || !confirmedRespectful}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-bold transition-all ${
                currentRecipient && isValidLength && confirmedRespectful && !isSubmitting
                  ? 'bg-[#00A868] text-white hover:bg-[#008F58] active:scale-[0.98] shadow-md shadow-emerald-600/20 cursor-pointer'
                  : 'bg-emerald-100 text-emerald-400 border border-emerald-200 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Enviando mensagem...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-white" />
                  <span>Enviar mensagem anônima</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* WhatsApp-Style GIF & Image Picker Modal */}
      <GifPickerModal
        isOpen={isGifModalOpen}
        onClose={() => setIsGifModalOpen(false)}
        onSelectGif={(url) => setSelectedGifUrl(url)}
        currentGifUrl={selectedGifUrl}
      />
    </div>
  );
};
