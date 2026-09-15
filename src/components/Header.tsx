import React from 'react';
import { Mail, ShieldCheck, ArrowLeft, Inbox, User, LogOut, Settings } from 'lucide-react';
import { CollaboratorProfile, isRHAdmin } from '../types';
import { YellowRibbon } from './YellowRibbon';

interface HeaderProps {
  currentView: string;
  onNavigateHome: () => void;
  onOpenAdmin: () => void;
  isAdminAuthenticated: boolean;
  collaborator?: CollaboratorProfile | null;
  unreadInboxCount?: number;
  onNavigateToInbox?: () => void;
  onOpenProfile?: () => void;
  onLogout?: () => void;
  onNavigateToLogin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigateHome,
  onOpenAdmin,
  isAdminAuthenticated,
  collaborator,
  unreadInboxCount = 0,
  onNavigateToInbox,
  onOpenProfile,
  onLogout,
  onNavigateToLogin,
}) => {
  return (
    <header className="no-print border-b border-emerald-200/80 bg-[#FAFBF9]/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Brand Logo & Title with Yellow Ribbon */}
        <button
          id="btn-header-home"
          onClick={onNavigateHome}
          className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer"
        >
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#00A868] to-[#007D4C] flex items-center justify-center text-white shadow-sm shadow-emerald-700/20 group-hover:scale-105 transition-transform duration-200 shrink-0">
            <Mail className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-['Outfit',sans-serif] font-extrabold text-lg sm:text-xl text-[#08301D] tracking-tight leading-none">
                Correio Verde
              </span>
              <YellowRibbon className="w-8 h-4 sm:w-10 sm:h-5" />
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                Stone SCL
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-emerald-700/80 font-medium">
              Sertão, Cerrado e Litoral
            </p>
          </div>
        </button>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentView === 'admin' ? (
            <button
              id="btn-header-back-app"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 transition-colors cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Correio</span>
            </button>
          ) : collaborator ? (
            /* Logged in collaborator controls */
            <div className="flex items-center gap-2">
              {/* Inbox Shortcut Button */}
              {onNavigateToInbox && (
                <button
                  id="btn-header-inbox"
                  onClick={onNavigateToInbox}
                  className={`relative inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    currentView === 'inbox'
                      ? 'bg-[#00A868] text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                  title="Minha caixa postal"
                >
                  <Inbox className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Caixa Postal</span>
                  {unreadInboxCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-amber-950">
                      {unreadInboxCount}
                    </span>
                  )}
                </button>
              )}

              {/* Profile Pill */}
              {onOpenProfile && (
                <button
                  id="btn-header-profile"
                  onClick={onOpenProfile}
                  className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-900 bg-white hover:bg-emerald-50 border border-emerald-200 shadow-xs transition-all cursor-pointer"
                  title="Ver meu perfil"
                >
                  <div className="w-5 h-5 rounded-full bg-[#00A868]/15 text-[#008F58] flex items-center justify-center font-bold text-[10px]">
                    {collaborator.first_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[80px] sm:max-w-[120px] truncate">
                    {collaborator.first_name}
                  </span>
                </button>
              )}

              {/* RH Button - strictly only for aysla.mendes@querostone.com.br */}
              {isRHAdmin(collaborator.email) && (
                <button
                  id="btn-header-admin"
                  onClick={onOpenAdmin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 hover:from-amber-400 hover:to-amber-500 shadow-sm transition-all cursor-pointer border border-amber-500/40 animate-pulse hover:animate-none"
                  title="Painel de RH Stone SCL - Aysla Mendes"
                >
                  <Settings className="w-3.5 h-3.5 text-amber-900" />
                  <span>Painel RH</span>
                </button>
              )}
            </div>
          ) : (
            /* Logged out state - no RH button visible to public */
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00A868]" />
                <span>100% Anônimo</span>
              </div>

              {onNavigateToLogin && (
                <button
                  id="btn-header-login"
                  onClick={onNavigateToLogin}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#00A868] hover:bg-[#008F58] active:scale-[0.98] shadow-sm transition-all cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Acessar Perfil</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
