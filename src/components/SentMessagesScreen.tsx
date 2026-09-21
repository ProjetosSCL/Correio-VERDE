import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Send,
  Inbox,
  ArrowLeft,
  Calendar,
  Tag,
  Heart,
  Eye,
  X,
  Film,
  Smile,
  Sparkles,
  MapPin,
  CheckCircle2,
  Clock,
  Archive,
  RefreshCw,
  Search,
} from 'lucide-react';
import { SentMessage, CollaboratorProfile, getColorTheme } from '../types';
import { YellowRibbon } from './YellowRibbon';

interface SentMessagesScreenProps {
  token?: string;
  collaborator?: CollaboratorProfile;
  onBack?: () => void;
  onBackToHome?: () => void;
  onNavigateToInbox?: () => void;
  onNavigateToSend?: () => void;
}

export const SentMessagesScreen: React.FC<SentMessagesScreenProps> = ({
  token,
  collaborator,
  onBack,
  onBackToHome,
  onNavigateToInbox,
  onNavigateToSend,
}) => {
  const [messages, setMessages] = useState<SentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<SentMessage | null>(null);
  const [filter, setFilter] = useState<'all' | 'reacted' | 'thanked'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSentMessages = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/collaborator/sent', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data.messages) ? data.messages : []);
      }
    } catch (err) {
      console.error('Error fetching sent messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSentMessages();
  }, [fetchSentMessages]);

  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      if (filter === 'reacted' && !m.recipient_reaction) return false;
      if (filter === 'thanked' && !m.thank_you_note) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = m.recipient_name?.toLowerCase().includes(q);
        const matchesOp = m.operation?.toLowerCase().includes(q);
        const matchesMsg = m.message?.toLowerCase().includes(q);
        const matchesCat = m.category?.toLowerCase().includes(q);
        if (!matchesName && !matchesOp && !matchesMsg && !matchesCat) return false;
      }
      return true;
    });
  }, [messages, filter, searchQuery]);

  const stats = useMemo(() => {
    const total = messages.length;
    const withReaction = messages.filter((m) => !!m.recipient_reaction).length;
    const withThankYou = messages.filter((m) => !!m.thank_you_note).length;
    return { total, withReaction, withThankYou };
  }, [messages]);

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-semibold">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Entregue
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-300 text-[11px] font-medium">
            <Archive className="w-3 h-3 text-stone-500" />
            Arquivada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-medium">
            <Clock className="w-3 h-3 text-amber-600" />
            Na Caixa Postal
          </span>
        );
    }
  };

  return (
    <div id="sent-messages-screen" className="w-full max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="sent-btn-back"
            onClick={onBack || onBackToHome}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-900 bg-white/90 hover:bg-white border border-emerald-200/80 hover:border-emerald-300 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#00A868]" />
            <span>Voltar</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#00A868] text-white flex items-center justify-center shadow-xs">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-['Outfit',sans-serif] text-xl sm:text-2xl font-bold text-[#08301D] tracking-tight">
                Mensagens Enviadas
              </h1>
              <p className="text-xs text-emerald-700">
                Histórico de carinho, gratidão e reconhecimento compartilhado por você.
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher: Caixa Postal / Enviadas */}
        <div className="flex items-center gap-2">
          {onNavigateToInbox && (
            <button
              type="button"
              id="sent-btn-to-inbox"
              onClick={onNavigateToInbox}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-900 bg-emerald-50/90 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer shadow-2xs"
              title="Ir para a Caixa Postal (mensagens recebidas)"
            >
              <Inbox className="w-4 h-4 text-[#00A868]" />
              <span>Ver Caixa Postal</span>
            </button>
          )}

          {onNavigateToSend && (
            <button
              type="button"
              id="sent-btn-to-send"
              onClick={onNavigateToSend}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#00A868] hover:bg-[#008F58] transition-all shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Nova Mensagem</span>
            </button>
          )}

          <button
            type="button"
            id="sent-btn-refresh"
            onClick={fetchSentMessages}
            disabled={isLoading}
            className="p-2 rounded-xl text-emerald-800 hover:text-emerald-950 bg-white hover:bg-emerald-50 border border-emerald-200 transition-all cursor-pointer shadow-2xs"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#00A868]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white/95 border border-emerald-100 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-700">Mensagens Enviadas</p>
            <p className="text-2xl font-extrabold text-[#08301D] font-['Outfit',sans-serif]">
              {stats.total}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#00A868]">
            <Send className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/95 border border-emerald-100 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-700">Reações Recebidas</p>
            <p className="text-2xl font-extrabold text-[#08301D] font-['Outfit',sans-serif]">
              {stats.withReaction}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Smile className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/95 border border-emerald-100 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-700">Agradecimentos Recebidos</p>
            <p className="text-2xl font-extrabold text-[#08301D] font-['Outfit',sans-serif]">
              {stats.withThankYou}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-500">
            <Heart className="w-5 h-5 fill-red-500" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white/90 border border-emerald-100/90 shadow-2xs flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        {/* Filters */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === 'all'
                ? 'bg-[#00A868] text-white shadow-2xs'
                : 'bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100/80 border border-emerald-200/60'
            }`}
          >
            Todas ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setFilter('reacted')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === 'reacted'
                ? 'bg-[#00A868] text-white shadow-2xs'
                : 'bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100/80 border border-emerald-200/60'
            }`}
          >
            Com Reação ({stats.withReaction})
          </button>
          <button
            type="button"
            onClick={() => setFilter('thanked')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === 'thanked'
                ? 'bg-[#00A868] text-white shadow-2xs'
                : 'bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100/80 border border-emerald-200/60'
            }`}
          >
            Com Agradecimento ({stats.withThankYou})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" />
          <input
            type="text"
            placeholder="Buscar por colega ou palavra..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border border-emerald-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#00A868]/40 focus:border-[#00A868] text-emerald-950"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-emerald-600 hover:text-emerald-900"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages List */}
      {isLoading ? (
        <div className="p-12 text-center bg-white/80 rounded-3xl border border-emerald-100 shadow-2xs space-y-3">
          <RefreshCw className="w-8 h-8 text-[#00A868] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#08301D]">Carregando seu histórico de mensagens...</p>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="p-10 sm:p-14 text-center bg-white/95 rounded-3xl border border-emerald-200/80 shadow-2xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#00A868] mx-auto shadow-xs">
            <Send className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="font-['Outfit',sans-serif] text-lg font-bold text-[#08301D]">
              {searchQuery || filter !== 'all'
                ? 'Nenhuma mensagem encontrada para este filtro'
                : 'Você ainda não enviou mensagens'}
            </h3>
            <p className="text-xs text-emerald-700">
              {searchQuery || filter !== 'all'
                ? 'Tente ajustar sua busca ou selecionar outro filtro acima.'
                : 'Aproveite para reconhecer o esforço, acolher ou agradecer alguém especial das operações do Stone SCL!'}
            </p>
          </div>

          {onNavigateToSend && (
            <button
              type="button"
              onClick={onNavigateToSend}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#00A868] hover:bg-[#008F58] transition-all shadow-xs cursor-pointer hover:scale-102"
            >
              <Send className="w-4 h-4" />
              <span>Enviar uma Mensagem</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredMessages.map((msg) => {
            const theme = getColorTheme(msg.color_theme);

            return (
              <div
                key={msg.id}
                onClick={() => setSelectedMessage(msg)}
                className={`relative p-5 sm:p-6 rounded-2xl border-2 transition-all duration-200 hover:shadow-md cursor-pointer group ${theme.bgClass} ${theme.borderClass}`}
              >
                {/* Ribbon Tag */}
                <YellowRibbon customColor={theme.ribbonTone} />

                {/* Card Header: Recipient info, status, date */}
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-['Outfit',sans-serif] text-base sm:text-lg font-bold text-emerald-950">
                        Para: {msg.recipient_name}
                      </span>
                      {msg.operation && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/90 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                          <MapPin className="w-3 h-3 text-[#00A868]" />
                          {msg.operation}
                        </span>
                      )}
                      {msg.recipient_role && (
                        <span className="text-[11px] text-emerald-700/80">
                          ({msg.recipient_role})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                      {msg.category && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/90 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                          <Tag className="w-3 h-3 text-[#00A868]" />
                          {msg.category}
                        </span>
                      )}

                      {/* Status */}
                      {renderStatusBadge(msg.status)}

                      {/* Reaction sent by user */}
                      {msg.reaction && (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/90 border border-amber-300 text-xs shadow-2xs"
                          title="Sua reação enviada"
                        >
                          <span>Sua reação:</span>
                          <span className="text-sm">{msg.reaction}</span>
                        </span>
                      )}

                      {/* GIF badge */}
                      {msg.gif_url && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold shadow-2xs">
                          <Film className="w-3 h-3 text-[#00A868]" />
                          <span>GIF anexo</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{formatDate(msg.created_at)}</span>
                  </div>
                </div>

                {/* Message Body & Thumbnail */}
                <div className="py-2 flex items-start gap-4">
                  <div className="flex-1">
                    <p className={`text-sm sm:text-base font-normal leading-relaxed line-clamp-3 ${theme.textClass}`}>
                      "{msg.message}"
                    </p>
                  </div>

                  {msg.gif_url && (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-black/10 bg-black/5 flex items-center justify-center shadow-xs">
                      <img
                        src={msg.gif_url}
                        alt="Miniatura GIF"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Feedback section: Recipient Reaction or Thank You Note */}
                {(msg.recipient_reaction || msg.thank_you_note) ? (
                  <div className="mt-3 pt-3 border-t border-black/10 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {msg.recipient_reaction && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/95 border border-emerald-300 shadow-2xs text-xs font-bold text-emerald-950 animate-pulse">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>{msg.recipient_name} reagiu com:</span>
                          <span className="text-base">{msg.recipient_reaction}</span>
                        </div>
                      )}

                      {msg.thank_you_note && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100/90 border border-amber-300 text-xs font-bold text-amber-950">
                          <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                          <span>Agradecimento recebido!</span>
                        </div>
                      )}
                    </div>

                    {msg.thank_you_note && (
                      <p className="text-xs text-amber-900 italic bg-white/80 p-2.5 rounded-xl border border-amber-200/80">
                        "{msg.thank_you_note}"
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between text-xs text-emerald-700/80">
                    <span className="text-[11px] italic">Aguardando reação do colega</span>
                    <span className="text-[#008F58] group-hover:underline text-[11px] font-bold flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      Ver detalhes
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reading / Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-xl rounded-3xl bg-white border border-emerald-300 p-6 sm:p-8 shadow-2xl space-y-6">
            <button
              onClick={() => setSelectedMessage(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-emerald-700 hover:text-emerald-950 hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#00A868] shadow-xs">
                  <Send className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-['Outfit',sans-serif] text-lg font-bold text-[#08301D]">
                    Mensagem Enviada
                  </h3>
                  <p className="text-[11px] text-emerald-700">
                    Enviada para <strong className="text-emerald-950">{selectedMessage.recipient_name}</strong> ({selectedMessage.operation})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap pt-1">
                {selectedMessage.category && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-semibold">
                    <Tag className="w-3 h-3 text-[#00A868]" />
                    {selectedMessage.category}
                  </span>
                )}
                {renderStatusBadge(selectedMessage.status)}
                {selectedMessage.reaction && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold shadow-xs">
                    <span>Sua reação:</span>
                    <span className="text-base">{selectedMessage.reaction}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Envelope Card Body */}
            {(() => {
              const modalTheme = getColorTheme(selectedMessage.color_theme);
              return (
                <div className={`p-6 sm:p-8 rounded-2xl border-2 shadow-inner space-y-4 ${modalTheme.bgClass} ${modalTheme.borderClass}`}>
                  <p className={`font-['Outfit',sans-serif] text-lg sm:text-xl font-medium leading-relaxed whitespace-pre-wrap ${modalTheme.textClass}`}>
                    "{selectedMessage.message}"
                  </p>

                  {/* Attached GIF */}
                  {selectedMessage.gif_url && (
                    <div className="pt-2 max-h-72 rounded-2xl overflow-hidden bg-black/5 flex items-center justify-center border border-black/10 p-1">
                      <img
                        src={selectedMessage.gif_url}
                        alt="GIF anexo"
                        referrerPolicy="no-referrer"
                        className="max-h-68 max-w-full rounded-xl object-contain shadow-xs"
                      />
                    </div>
                  )}

                  <div className="pt-3 border-t border-black/10 flex items-center justify-between text-xs text-emerald-800/80">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                      Enviada em {formatDate(selectedMessage.created_at)}
                    </span>
                    <span className="text-[#008F58] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Entregue de forma anônima
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Recipient Reaction Feedback */}
            {selectedMessage.recipient_reaction && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedMessage.recipient_reaction}</span>
                  <div>
                    <p className="text-xs font-bold text-emerald-950">
                      {selectedMessage.recipient_name} reagiu com esse carinho!
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      Sua mensagem tocou o colega.
                    </p>
                  </div>
                </div>
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
              </div>
            )}

            {/* Recipient Thank You Note Feedback */}
            {selectedMessage.thank_you_note && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                    Agradecimento de {selectedMessage.recipient_name}:
                  </span>
                  {selectedMessage.thank_you_at && (
                    <span className="text-[10px] text-amber-800/80">
                      {formatDate(selectedMessage.thank_you_at)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-amber-900 italic bg-white/90 p-3 rounded-xl border border-amber-200">
                  "{selectedMessage.thank_you_note}"
                </p>
              </div>
            )}

            {/* Close action */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-[#00A868] hover:bg-[#008F58] transition-all cursor-pointer shadow-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
