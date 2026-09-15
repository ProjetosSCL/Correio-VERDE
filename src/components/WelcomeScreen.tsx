import React from 'react';
import { Mail, ArrowRight, Shield, User, Inbox } from 'lucide-react';
import { CollaboratorProfile } from '../types';
import { YellowRibbon } from './YellowRibbon';

interface WelcomeScreenProps {
  onStartMessage: () => void;
  onOpenLogin?: () => void;
  collaborator?: CollaboratorProfile | null;
  onOpenInbox?: () => void;
  totalMessagesCount?: number;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartMessage,
  onOpenLogin,
  collaborator,
  onOpenInbox,
}) => {
  return (
    <div className="py-6 sm:py-12 max-w-4xl mx-auto">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-white border border-emerald-200/90 p-8 sm:p-12 lg:p-16 shadow-xl shadow-emerald-950/5 text-center space-y-8">
        {/* Subtle decorative green & yellow light glows */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-[#00A868]/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-amber-400/5 blur-3xl pointer-events-none" />

        {/* Title Lockup: Correio Verde + Fitilho do Setembro Amarelo */}
        <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <h1 className="font-['Outfit',sans-serif] text-4xl sm:text-5xl lg:text-6xl font-black text-[#08301D] tracking-tight leading-none">
              Correio Verde
            </h1>
            <YellowRibbon className="w-16 h-8 sm:w-24 sm:h-11 drop-shadow-md" />
          </div>

          <p className="text-xl sm:text-2xl font-bold text-[#008F58] font-['Outfit',sans-serif]">
            "Ninguém joga em alto nível sozinho(a)."
          </p>

          <p className="text-base sm:text-lg text-emerald-900/85 leading-relaxed pt-2">
            Tem alguém no Stone SCL que fez seu dia melhor, te ajudou numa rota, te ensinou alguma coisa
            ou esteve ali ao seu lado? Envie uma mensagem de carinho e reconhecimento com 100% de sigilo do remetente.
          </p>
        </div>

        {/* If collaborator is already logged in, friendly quick-access banner */}
        {collaborator && (
          <div className="relative z-10 max-w-md mx-auto p-4 rounded-2xl bg-[#F4F9F5] border border-emerald-300 flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00A868] text-white font-black flex items-center justify-center text-sm shadow-xs">
                {collaborator.first_name.charAt(0)}
              </div>
              <div>
                <p className="text-xs text-emerald-700 font-medium">Conectado(a) como:</p>
                <p className="text-sm font-bold text-[#08301D]">
                  {collaborator.full_name}{' '}
                  <span className="text-xs font-normal text-emerald-700/80">({collaborator.email})</span>
                </p>
              </div>
            </div>
            {onOpenInbox && (
              <button
                onClick={onOpenInbox}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-[#00A868] hover:bg-[#008F58] transition-colors cursor-pointer shadow-xs"
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>Ver Mensagens</span>
              </button>
            )}
          </div>
        )}

        {/* Action Buttons: Enviar uma mensagem & Acessar meu perfil */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            id="btn-hero-send-message"
            onClick={onStartMessage}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold text-white bg-[#00A868] hover:bg-[#008F58] active:scale-[0.98] shadow-lg shadow-emerald-600/25 transition-all duration-200 cursor-pointer"
          >
            <Mail className="w-5 h-5 text-white" />
            <span>Enviar uma mensagem</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>

          {!collaborator && onOpenLogin ? (
            <button
              id="btn-hero-login"
              onClick={onOpenLogin}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl text-sm font-bold text-[#08301D] bg-white hover:bg-emerald-50 border-2 border-emerald-600/70 hover:border-emerald-700 active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-xs"
            >
              <User className="w-4 h-4 text-[#008F58]" />
              <span>Acessar Meu Perfil</span>
            </button>
          ) : collaborator && onOpenInbox ? (
            <button
              id="btn-hero-view-profile"
              onClick={onOpenInbox}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl text-sm font-bold text-[#08301D] bg-white hover:bg-emerald-50 border-2 border-emerald-600/70 hover:border-emerald-700 active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-xs"
            >
              <Inbox className="w-4 h-4 text-[#008F58]" />
              <span>Acessar Meu Perfil</span>
            </button>
          ) : null}
        </div>

        {/* Anonymity guarantee reassurance */}
        <div className="relative z-10 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
          <Shield className="w-4 h-4 text-[#00A868] shrink-0" />
          <span>O destinatário lê no perfil individual dele, com garantia de sigilo absoluto do remetente.</span>
        </div>
      </section>
    </div>
  );
};
