import React, { useState } from 'react';
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
} from 'lucide-react';
import { InboxMessage } from '../types';
import { YellowRibbon } from './YellowRibbon';

interface InboxScreenProps {
  messages: InboxMessage[];
  isLoading: boolean;
  onBack: () => void;
  onNavigateToSend: () => void;
  onToggleRead: (messageId: string, currentReadStatus: boolean) => Promise<void>;
  onArchiveMessage: (messageId: string) => Promise<void>;
}

export const InboxScreen: React.FC<InboxScreenProps> = ({
  messages,
  isLoading,
  onBack,
  onNavigateToSend,
  onToggleRead,
  onArchiveMessage,
}) => {
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const filteredMessages = messages.filter((m) => {
    if (filter === 'unread') return !m.read_at;
    if (filter === 'read') return !!m.read_at;
    return true;
  });

  const unreadCount = messages.filter((m) => !m.read_at).length;

  const handleOpenMessage = async (msg: InboxMessage) => {
    setSelectedMessage(msg);
    if (!msg.read_at) {
      await onToggleRead(msg.id, false);
    }
  };

  const handleToggleReadStatus = async (e: React.MouseEvent, msg: InboxMessage) => {
    e.stopPropagation();
    setActionInProgress(msg.id);
    try {
      await onToggleRead(msg.id, !!msg.read_at);
      if (selectedMessage && selectedMessage.id === msg.id) {
        setSelectedMessage({
          ...selectedMessage,
          read_at: msg.read_at ? null : new Date().toISOString(),
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
      await onArchiveMessage(msgId);
      if (selectedMessage && selectedMessage.id === msgId) {
        setSelectedMessage(null);
      }
    } finally {
      setActionInProgress(null);
    }
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
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 hover:text-emerald-950 px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao início</span>
        </button>

        <button
          onClick={onNavigateToSend}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#00A868] hover:bg-[#008F58] px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer active:scale-[0.98]"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Enviar mensagem</span>
        </button>
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
      {messages.length > 0 && (
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
              Todas ({messages.length})
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
              Lidas ({messages.length - unreadCount})
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

            return (
              <div
                key={msg.id}
                onClick={() => handleOpenMessage(msg)}
                className={`group relative rounded-2xl p-5 sm:p-6 transition-all cursor-pointer border ${
                  isUnread
                    ? 'bg-[#F4F9F5] border-2 border-[#00A868] shadow-sm hover:border-[#008F58]'
                    : 'bg-white border-emerald-200/90 hover:border-emerald-300 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status Badge */}
                    {isUnread ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#00A868] text-white text-[10px] font-extrabold uppercase tracking-wide shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping mr-0.5" />
                        Nova
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-[#00A868]" />
                        Lida
                      </span>
                    )}

                    {/* Category Pill */}
                    {msg.category && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                        <Tag className="w-3 h-3 text-[#00A868]" />
                        {msg.category}
                      </span>
                    )}
                  </div>

                  {/* Date Received */}
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{formatDate(msg.created_at)}</span>
                  </div>
                </div>

                {/* Message Preview Text */}
                <div className="py-3">
                  <p className="text-emerald-950 text-sm sm:text-base font-normal leading-relaxed line-clamp-3">
                    "{msg.message}"
                  </p>
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

              {selectedMessage.category && (
                <div className="inline-block pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-semibold">
                    <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                    {selectedMessage.category}
                  </span>
                </div>
              )}
            </div>

            {/* Message Body in Envelope Card Style */}
            <div className="p-6 rounded-2xl bg-[#F8FAF7] border border-emerald-200 shadow-inner space-y-4">
              <p className="font-['Outfit',sans-serif] text-lg sm:text-xl text-[#08301D] font-medium leading-relaxed whitespace-pre-wrap">
                "{selectedMessage.message}"
              </p>

              <div className="pt-3 border-t border-emerald-200/80 flex items-center justify-between text-xs text-emerald-700">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  Recebida em {formatDate(selectedMessage.created_at)}
                </span>
                <span className="text-[#008F58] font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Remetente anônimo
                </span>
              </div>
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
    </div>
  );
};
