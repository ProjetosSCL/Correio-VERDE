import React from 'react';
import {
  Send,
  Mail,
  Inbox,
  User,
  ShieldCheck,
  Bell,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { CollaboratorProfile, CollaboratorInboxSummary, InAppNotification } from '../types';
import { YellowRibbon } from './YellowRibbon';

interface CollaboratorHomeScreenProps {
  collaborator: CollaboratorProfile;
  summary: CollaboratorInboxSummary;
  notifications: InAppNotification[];
  onNavigateToSend: () => void;
  onNavigateToInbox: () => void;
  onOpenProfile: () => void;
  onDismissNotification?: () => void;
}

export const CollaboratorHomeScreen: React.FC<CollaboratorHomeScreenProps> = ({
  collaborator,
  summary,
  notifications,
  onNavigateToSend,
  onNavigateToInbox,
  onOpenProfile,
}) => {
  const hasUnread = summary.unreadMessages > 0;
  const unreadNotifications = notifications.filter((n) => !n.read_at);

  return (
    <div className="py-6 sm:py-10 max-w-2xl mx-auto space-y-6 sm:space-y-8">
      {/* Greeting Header with Yellow Ribbon */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2.5">
          <h1 className="font-['Outfit',sans-serif] text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#08301D] tracking-tight">
            Olá, {collaborator.first_name}!
          </h1>
          <YellowRibbon className="w-14 h-7 sm:w-16 sm:h-8 drop-shadow-sm" />
        </div>
        <p className="text-base sm:text-lg text-[#008F58] font-bold">
          "Ninguém joga em alto nível sozinho(a)."
        </p>
      </div>

      {/* In-app notification alert banner if there are new messages */}
      {unreadNotifications.length > 0 && (
        <div
          onClick={onNavigateToInbox}
          className="p-4 rounded-2xl bg-[#F4F9F5] border-2 border-[#00A868] text-emerald-950 cursor-pointer hover:border-[#008F58] transition-all shadow-md flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00A868] text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#08301D] group-hover:text-[#008F58] transition-colors">
                Você recebeu uma nova mensagem no Correio Verde! 💚
              </p>
              <p className="text-xs text-emerald-700">
                Clique aqui para abrir sua caixa postal e ler agora mesmo.
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#00A868] group-hover:translate-x-1 transition-transform shrink-0" />
        </div>
      )}

      {/* Mailbox Status Card */}
      <div className="rounded-3xl bg-white border border-emerald-200/90 p-6 sm:p-7 shadow-xl shadow-emerald-950/5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#08301D]">
            <Mail className="w-4 h-4 text-[#00A868]" />
            <span>Sua Caixa Postal Pessoal</span>
          </div>

          <button
            onClick={onOpenProfile}
            className="inline-flex items-center gap-1.5 text-xs text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-[#00A868]" />
            <span>Meu Perfil</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-4 rounded-2xl bg-[#F8FAF7] border border-emerald-200 space-y-1 shadow-xs">
            <span className="text-xs text-emerald-700">Mensagens recebidas</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#08301D] font-['Outfit',sans-serif]">
                {summary.totalMessages}
              </span>
              <span className="text-xs text-emerald-600">
                {summary.totalMessages === 1 ? 'mensagem no total' : 'mensagens no total'}
              </span>
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border transition-all shadow-xs ${
              hasUnread
                ? 'bg-emerald-50 border-2 border-[#00A868]'
                : 'bg-[#F8FAF7] border-emerald-200'
            }`}
          >
            <span className="text-xs text-emerald-700">Novas mensagens</span>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl font-extrabold font-['Outfit',sans-serif] ${
                  hasUnread ? 'text-[#008F58]' : 'text-emerald-700'
                }`}
              >
                {summary.unreadMessages}
              </span>
              <span className="text-xs text-emerald-600">
                {summary.unreadMessages === 1 ? 'não lida' : 'não lidas'}
              </span>
            </div>
          </div>
        </div>

        {summary.totalMessages > 0 && (
          <p className="text-xs text-emerald-800 text-center pt-1">
            Você recebeu {summary.totalMessages} {summary.totalMessages === 1 ? 'mensagem' : 'mensagens'}.
            {summary.unreadMessages > 0 ? ` Você tem ${summary.unreadMessages} ${summary.unreadMessages === 1 ? 'mensagem nova' : 'mensagens novas'}.` : ' Todas as mensagens estão lidas.'}
          </p>
        )}
      </div>

      {/* Main Action Cards (Two primary paths: Send or View Inbox) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {/* Action 1: Enviar Mensagem */}
        <div
          onClick={onNavigateToSend}
          className="group relative rounded-3xl bg-white border border-emerald-200/90 p-6 sm:p-7 shadow-xl shadow-emerald-950/5 hover:border-[#00A868] hover:shadow-2xl hover:shadow-emerald-600/10 transition-all cursor-pointer flex flex-col justify-between space-y-6"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#00A868] group-hover:scale-105 group-hover:bg-[#00A868] group-hover:text-white transition-all shadow-xs">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-['Outfit',sans-serif] text-xl font-bold text-[#08301D] group-hover:text-[#008F58] transition-colors">
                Enviar mensagem
              </h2>
              <p className="text-xs sm:text-sm text-emerald-800/80 pt-1 leading-relaxed">
                Reconheça alguém do SCL com uma mensagem anônima.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#00A868] group-hover:bg-[#008F58] transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <span>Enviar mensagem</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action 2: Minha Caixa Postal */}
        <div
          onClick={onNavigateToInbox}
          className="group relative rounded-3xl bg-white border border-emerald-200/90 p-6 sm:p-7 shadow-xl shadow-emerald-950/5 hover:border-[#00A868] hover:shadow-2xl hover:shadow-emerald-600/10 transition-all cursor-pointer flex flex-col justify-between space-y-6"
        >
          <div className="space-y-3">
            <div className="relative w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#00A868] group-hover:scale-105 group-hover:bg-[#00A868] group-hover:text-white transition-all shadow-xs">
              <Inbox className="w-6 h-6" />
              {summary.unreadMessages > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-extrabold flex items-center justify-center shadow-xs">
                  {summary.unreadMessages}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-['Outfit',sans-serif] text-xl font-bold text-[#08301D] group-hover:text-[#008F58] transition-colors">
                  Minha caixa postal
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-emerald-800/80 pt-1 leading-relaxed">
                Veja as mensagens que outras pessoas deixaram para você.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 group-hover:bg-emerald-100 transition-all shadow-xs cursor-pointer"
          >
            <span>Ver mensagens recebidas</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#00A868]" />
          </button>
        </div>
      </div>

      {/* Campaign Philosophy & Privacy Guarantee */}
      <div className="rounded-2xl bg-[#F8FAF7] border border-emerald-200 p-5 text-center space-y-1.5 shadow-xs">
        <p className="text-xs font-bold text-[#008F58] font-['Outfit',sans-serif]">
          "Ninguém joga em alto nível sozinho(a)."
        </p>
        <p className="text-[11px] text-emerald-700 max-w-md mx-auto leading-relaxed">
          <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-[#00A868]" />
          Todas as mensagens enviadas e recebidas no Correio Verde são 100% anônimas. O destinatário jamais tem acesso à identidade do remetente.
        </p>
      </div>
    </div>
  );
};
