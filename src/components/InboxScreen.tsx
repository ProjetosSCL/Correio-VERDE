import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Inbox,
  Mail,
  MailOpen,
  ArrowLeft,
  Calendar,
  Tag,
  Trash2,
  CheckCircle2,
  Send,
  Heart,
  Eye,
  X,
  ShieldCheck,
  Film,
  Smile,
  Sparkles,
  MessageCircleHeart,
  Check,
} from 'lucide-react';
import { InboxMessage, CollaboratorProfile, getColorTheme } from '../types';
import { YellowRibbon } from './YellowRibbon';
import { ThankYouModal } from './ThankYouModal';

const REACTION_CHOICES = ['❤️', '🙏', '💛', '👏', '🎉', '😊', '🚀', '💪'];

interface InboxScreenProps {
  token?: string;
  collaborator?: CollaboratorProfile;
  messages?: InboxMessage[];
  isLoading?: boolean;
  onBack?: () => void;
  onBackToHome?: () => void;
  onNavigateToSent?: () => void;
  onNavigateToSend?: () => void;
  onSendReply?: (recipientId: string) => void;
  onToggleRead?: (messageId: string, currentReadStatus: boolean) => Promise<void>;
  onArchiveMessage?: (messageId: string) => Promise<void>;
}

export const InboxScreen: React.FC<InboxScreenProps> = ({
  token,
  collaborator,
  messages: propMessages,
  isLoading: propIsLoading,
  onBack,
  onBackToHome,
  onNavigateToSent,
  onNavigateToSend,
  onSendReply,
  onToggleRead,
  onArchiveMessage,
}) => {
  const [internalMessages, setInternalMessages] = useState<InboxMessage[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  const [thankYouModalMessage, setThankYouModalMessage] = useState<InboxMessage | null>(null);
  const [thankSuccessToast, setThankSuccessToast] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // If token is provided and propMessages is not, fetch from /api/collaborator/inbox
  const fetchInbox = useCallback(async () => {
    if (!token) return;
    setInternalLoading(true);
    try {
      const res = await fetch('/api/collaborator/inbox', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInternalMessages(Array.isArray(data.messages) ? data.messages : []);
      }
    } catch (err) {
      console.error('Error fetching inbox:', err);
    } finally {
      setInternalLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!propMessages && token) {
      fetchInbox();
    }
  }, [propMessages, token, fetchInbox]);

  // Guaranteed safe messages array - NEVER undefined
  const allMessages = useMemo(() => {
    if (Array.isArray(propMessages)) return propMessages;
    if (Array.isArray(internalMessages)) return internalMessages;
    return [];
  }, [propMessages, internalMessages]);

  const isLoading = propIsLoading !== undefined ? propIsLoading : internalLoading;

  const filteredMessages = useMemo(() => {
    return allMessages.filter((m) => {
      if (filter === 'unread') return !m.read_at;
      if (filter === 'read') return !!m.read_at;
      return true;
    });
  }, [allMessages, filter]);

  const unreadCount = useMemo(() => {
    return allMessages.filter((m) => !m.read_at).length;
  }, [allMessages]);

  const handleOpenMessage = async (msg: InboxMessage) => {
    setSelectedMessage(msg);
    if (!msg.read_at) {
      if (onToggleRead) {
        await onToggleRead(msg.id, false);
      } else if (token) {
        try {
          await fetch(`/api/collaborator/messages/${msg.id}/read`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ isRead: true }),
          });
          setInternalMessages((prev) =>
            prev.map((m) =>
              m.id === msg.id ? { ...m, read_at: new Date().toISOString() } : m
            )
          );
        } catch (err) {
          console.error('Error marking as read:', err);
        }
      }
    }
  };

  const handleToggleReadStatus = async (e: React.MouseEvent, msg: InboxMessage) => {
    e.stopPropagation();
    setActionInProgress(msg.id);
    const newStatus = !msg.read_at;
    try {
      if (onToggleRead) {
        await onToggleRead(msg.id, !!msg.read_at);
      } else if (token) {
        await fetch(`/api/collaborator/messages/${msg.id}/read`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isRead: newStatus }),
        });
        setInternalMessages((prev) =>
          prev.map((m) =>
            m.id === msg.id
              ? { ...m, read_at: newStatus ? new Date().toISOString() : null }
              : m
          )
        );
      }
      if (selectedMessage && selectedMessage.id === msg.id) {
        setSelectedMessage({
          ...selectedMessage,
          read_at: newStatus ? new Date().toISOString() : null,
        });
      }
    } finally {
      setActionInProgress(null);
    }
  };

  const handleArchive = async (e: React.MouseEvent, msgId: string) => {
    e.stopPropagation();
    if (!window.confirm('Deseja arquivar esta mensagem da sua caixa postal?')) {
      return;
    }
    setActionInProgress(msgId);
    try {
      if (onArchiveMessage) {
        await onArchiveMessage(msgId);
      } else if (token) {
        await fetch(`/api/collaborator/messages/${msgId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        setInternalMessages((prev) => prev.filter((m) => m.id !== msgId));
      }
      if (selectedMessage && selectedMessage.id === msgId) {
        setSelectedMessage(null);
      }
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReactToMessage = async (msgId: string, reaction: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/collaborator/messages/${msgId}/react`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reaction }),
      });
      if (res.ok) {
        const json = await res.json();
        const updatedReaction = json.reaction;
        setInternalMessages((prev) =>
          prev.map((m) => {
            if (m.id === msgId) {
              const current = m.recipient_reaction;
              return {
                ...m,
                recipient_reaction: current === updatedReaction ? null : updatedReaction,
              };
            }
            return m;
          })
        );
        if (selectedMessage && selectedMessage.id === msgId) {
          setSelectedMessage((prev) =>
            prev
              ? {
                  ...prev,
                  recipient_reaction:
                    prev.recipient_reaction === updatedReaction ? null : updatedReaction,
                }
              : null
          );
        }
      }
    } catch (err) {
      console.error('Error reacting to message:', err);
    }
  };

  const handleSendThankYou = async (msgId: string, note: string) => {
    if (!token) return;
    const res = await fetch(`/api/collaborator/messages/${msgId}/thank`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ note }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Erro ao enviar agradecimento.');
    }

    setInternalMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              thank_you_note: json.thank_you_note,
              thank_you_at: new Date().toISOString(),
            }
          : m
      )
    );
    if (selectedMessage && selectedMessage.id === msgId) {
      setSelectedMessage((prev) =>
        prev
          ? {
              ...prev,
              thank_you_note: json.thank_you_note,
              thank_you_at: new Date().toISOString(),
            }
          : null
      );
    }

    setThankSuccessToast('Agradecimento enviado com sucesso! 💚');
    setTimeout(() => setThankSuccessToast(null), 4000);
  };

  const formatDate = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recentemente';
    }
  };

  return (
    <div className="py-6 sm:py-10 max-w-3xl mx-auto space-y-6">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={onBack || onBackToHome}
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 hover:text-emerald-950 px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao início</span>
        </button>

        <div className="flex items-center gap-2">
          {onNavigateToSent && (
            <button
              onClick={onNavigateToSent}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 transition-all cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5 text-[#00A868]" />
              <span className="hidden sm:inline">Mensagens enviadas</span>
              <span className="sm:hidden">Enviadas</span>
            </button>
          )}

          <button
            onClick={onNavigateToSend || (() => onSendReply?.(''))}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#00A868] hover:bg-[#008F58] px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer active:scale-[0.98]"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Enviar mensagem</span>
          </button>
        </div>
      </div>

      {/* Title Section with Yellow Ribbon */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <h1 className="font-['Outfit',sans-serif] text-3xl sm:text-4xl font-extrabold text-[#08301D] tracking-tight">
            Minha Caixa Postal
          </h1>
          <YellowRibbon className="w-14 h-7 sm:w-16 sm:h-8" />
        </div>
        <p className="text-sm sm:text-base text-[#008F58] font-bold">
          "Ninguém joga em alto nível sozinho(a)."
        </p>
        <p className="text-xs sm:text-sm text-emerald-800/80">
          Palavras de reconhecimento e carinho que chegaram até você.
        </p>
      </div>

      {/* Filter Tabs & Counter */}
      {allMessages.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-white border border-emerald-200 shadow-xs text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-[#00A868] text-white shadow-xs'
                  : 'text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50'
              }`}
            >
              Todas ({allMessages.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                filter === 'unread'
                  ? 'bg-[#00A868] text-white shadow-xs'
                  : 'text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50'
              }`}
            >
              <span>Não lidas</span>
              {unreadCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    filter === 'unread'
                      ? 'bg-amber-400 text-amber-950'
                      : 'bg-amber-400 text-amber-950'
                  }`}
                >
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                filter === 'read'
                  ? 'bg-[#00A868] text-white shadow-xs'
                  : 'text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50'
              }`}
            >
              Lidas ({allMessages.length - unreadCount})
            </button>
          </div>

          <div className="text-[11px] text-emerald-700 pr-2 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00A868]" />
            <span>Remetente 100% anônimo</span>
          </div>
        </div>
      )}

      {/* Messages List / Empty State */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#00A868] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-emerald-800">Carregando suas mensagens com carinho...</p>
        </div>
      ) : filteredMessages.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl bg-white border border-emerald-200 p-8 sm:p-12 text-center space-y-5 shadow-xl shadow-emerald-950/5">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-[#00A868] shadow-xs">
            <Inbox className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="font-['Outfit',sans-serif] text-xl font-bold text-[#08301D]">
              Ainda não chegou nenhuma mensagem por aqui.
            </h3>
            <p className="text-xs sm:text-sm text-emerald-800/80 leading-relaxed">
              Mas lembre: você também faz parte do que torna o SCL especial.
            </p>
          </div>

          <div className="pt-3">
            <button
              onClick={onNavigateToSend}
              className="inline-flex items-center gap-2 py-3 px-6 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#00A868] hover:bg-[#008F58] transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Enviar uma mensagem</span>
            </button>
          </div>
        </div>
      ) : (
        /* Messages Cards */
        <div className="space-y-3">
          {filteredMessages.map((msg) => {
            const isUnread = !msg.read_at;
            const theme = getColorTheme(msg.color_theme);

            return (
              <div
                key={msg.id}
                onClick={() => handleOpenMessage(msg)}
                className={`group relative rounded-2xl p-5 sm:p-6 transition-all cursor-pointer border ${theme.bgClass} ${
                  isUnread
                    ? `border-2 ${theme.borderClass} shadow-md`
                    : 'border-emerald-200/90 hover:border-emerald-300 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-black/5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status Badge */}
                    {isUnread ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#00A868] text-white text-[10px] font-extrabold uppercase tracking-wide shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping mr-0.5" />
                        Nova
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/80 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-[#00A868]" />
                        Lida
                      </span>
                    )}

                    {/* Category Pill */}
                    {msg.category && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/90 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                        <Tag className="w-3 h-3 text-[#00A868]" />
                        {msg.category}
                      </span>
                    )}

                    {/* Reaction Emoji Badge from sender */}
                    {msg.reaction && (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/90 border border-amber-300/80 text-sm shadow-2xs"
                        title="Reação enviada pelo colega"
                      >
                        <span>{msg.reaction}</span>
                      </span>
                    )}

                    {/* GIF attached indicator */}
                    {msg.gif_url && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold shadow-2xs">
                        <Film className="w-3 h-3 text-[#00A868]" />
                        <span>GIF anexo</span>
                      </span>
                    )}

                    {/* Recipient Reaction badge if reacted */}
                    {msg.recipient_reaction && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 border border-emerald-300 text-xs font-semibold text-emerald-900 shadow-2xs"
                        title="Sua reação a esta mensagem"
                      >
                        <span>Você:</span>
                        <span className="text-sm">{msg.recipient_reaction}</span>
                      </span>
                    )}

                    {/* Thank you note badge if thanked */}
                    {msg.thank_you_note && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-semibold">
                        <Heart className="w-3 h-3 text-amber-600 fill-amber-600" />
                        <span>Agradecida</span>
                      </span>
                    )}
                  </div>

                  {/* Date Received */}
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{formatDate(msg.created_at)}</span>
                  </div>
                </div>

                {/* Message Preview Text and GIF Thumbnail */}
                <div className="py-3 flex items-start gap-4">
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

                {/* Card Actions Footer */}
                <div className="flex items-center justify-between pt-2 text-xs">
                  <span className="text-[#008F58] group-hover:underline text-[11px] font-bold flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    Ler mensagem completa
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      title={isUnread ? 'Marcar como lida' : 'Marcar como não lida'}
                      onClick={(e) => handleToggleReadStatus(e, msg)}
                      disabled={actionInProgress === msg.id}
                      className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-950 hover:bg-emerald-50 transition-colors cursor-pointer"
                    >
                      {isUnread ? (
                        <MailOpen className="w-4 h-4 text-[#00A868]" />
                      ) : (
                        <Mail className="w-4 h-4 text-emerald-600" />
                      )}
                    </button>

                    <button
                      type="button"
                      title="Arquivar mensagem"
                      onClick={(e) => handleArchive(e, msg.id)}
                      disabled={actionInProgress === msg.id}
                      className="p-1.5 rounded-lg text-emerald-600 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reading Modal */}
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
                  <MailOpen className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-['Outfit',sans-serif] text-lg font-bold text-[#08301D]">
                    Mensagem do Correio Verde
                  </h3>
                  <p className="text-[11px] text-emerald-700">
                    Enviada com carinho e de forma 100% anônima por alguém do Stone SCL.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap pt-1">
                {selectedMessage.category && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-semibold">
                    <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                    {selectedMessage.category}
                  </span>
                )}
                {selectedMessage.reaction && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold shadow-xs">
                    <span className="text-base">{selectedMessage.reaction}</span>
                    <span>Reação enviada</span>
                  </span>
                )}
              </div>
            </div>

            {/* Message Body in Envelope Card Style */}
            {(() => {
              const modalTheme = getColorTheme(selectedMessage.color_theme);
              return (
                <div className={`p-6 sm:p-8 rounded-2xl border-2 shadow-inner space-y-4 ${modalTheme.bgClass} ${modalTheme.borderClass}`}>
                  <p className={`font-['Outfit',sans-serif] text-lg sm:text-xl font-medium leading-relaxed whitespace-pre-wrap ${modalTheme.textClass}`}>
                    "{selectedMessage.message}"
                  </p>

                  {/* Attached GIF / Image */}
                  {selectedMessage.gif_url && (
                    <div className="pt-2 max-h-72 rounded-2xl overflow-hidden bg-black/5 flex items-center justify-center border border-black/10 p-1">
                      <img
                        src={selectedMessage.gif_url}
                        alt="GIF ou imagem anexa"
                        referrerPolicy="no-referrer"
                        className="max-h-68 max-w-full rounded-xl object-contain shadow-xs"
                      />
                    </div>
                  )}

                  <div className="pt-3 border-t border-black/10 flex items-center justify-between text-xs text-emerald-800/80">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                      Recebida em {formatDate(selectedMessage.created_at)}
                    </span>
                    <span className="text-[#008F58] font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Remetente anônimo
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Recipient Reaction Bar */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-[#00A868]" />
                  Reagir à mensagem:
                </span>
                {selectedMessage.recipient_reaction && (
                  <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3 text-[#00A868]" />
                    <span>Sua reação: {selectedMessage.recipient_reaction}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {REACTION_CHOICES.map((emoji) => {
                  const isSelected = selectedMessage.recipient_reaction === emoji;
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleReactToMessage(selectedMessage.id, emoji)}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-lg sm:text-xl flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white border-2 border-[#00A868] shadow-sm scale-110 ring-2 ring-emerald-300/50'
                          : 'bg-white/80 hover:bg-white border border-emerald-200 hover:scale-105 shadow-2xs'
                      }`}
                      title={`Reagir com ${emoji}`}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Thank You Note Section */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
              {selectedMessage.thank_you_note ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      Seu agradecimento registrado:
                    </span>
                    <button
                      type="button"
                      onClick={() => setThankYouModalMessage(selectedMessage)}
                      className="text-xs text-amber-800 hover:text-amber-950 font-semibold underline cursor-pointer"
                    >
                      Editar retorno
                    </button>
                  </div>
                  <p className="text-xs text-amber-900 italic bg-white/85 p-2.5 rounded-xl border border-amber-200/80">
                    "{selectedMessage.thank_you_note}"
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                  <div>
                    <p className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Gostou do recado? Envie um agradecimento!
                    </p>
                    <p className="text-[11px] text-amber-800/80">
                      O colega receberá sua mensagem de gratidão no Correio Verde.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setThankYouModalMessage(selectedMessage)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-xs shrink-0 cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 fill-white text-white" />
                    <span>Agradecer</span>
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={(e) => handleArchive(e, selectedMessage.id)}
                className="inline-flex items-center gap-1.5 text-xs text-red-700 hover:text-red-900 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors border border-red-200 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Arquivar mensagem</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleToggleReadStatus(e, selectedMessage)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-white hover:bg-emerald-50 border border-emerald-300 cursor-pointer"
                >
                  {selectedMessage.read_at ? 'Marcar como não lida' : 'Marcar como lida'}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#00A868] hover:bg-[#008F58] transition-all cursor-pointer shadow-xs"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thank You Note Modal */}
      {thankYouModalMessage && (
        <ThankYouModal
          isOpen={!!thankYouModalMessage}
          onClose={() => setThankYouModalMessage(null)}
          messageId={thankYouModalMessage.id}
          initialNote={thankYouModalMessage.thank_you_note}
          onSendThankYou={handleSendThankYou}
        />
      )}

      {/* Success Toast */}
      {thankSuccessToast && (
        <div className="fixed bottom-6 right-6 z-70 bg-[#00A868] text-white px-5 py-3 rounded-2xl shadow-xl border border-emerald-400 flex items-center gap-2 text-xs font-bold animate-bounce">
          <Heart className="w-4 h-4 fill-white text-white" />
          <span>{thankSuccessToast}</span>
        </div>
      )}
    </div>
  );
};
