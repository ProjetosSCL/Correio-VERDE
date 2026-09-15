import React from 'react';
import { Mail, MapPin, Briefcase, LogOut, X, ShieldCheck } from 'lucide-react';
import { CollaboratorProfile } from '../types';

interface CollaboratorProfileModalProps {
  isOpen: boolean;
  collaborator: CollaboratorProfile;
  onClose: () => void;
  onLogout: () => void;
}

export const CollaboratorProfileModal: React.FC<CollaboratorProfileModalProps> = ({
  isOpen,
  collaborator,
  onClose,
  onLogout,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-emerald-300 p-6 sm:p-7 shadow-2xl space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-emerald-700 hover:text-emerald-950 hover:bg-emerald-50 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-[#00A868] text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-600/20">
            <span className="font-['Outfit',sans-serif] text-2xl font-black">
              {collaborator.full_name.charAt(0).toUpperCase()}
            </span>
          </div>

          <div>
            <h3 className="font-['Outfit',sans-serif] text-xl font-bold text-[#08301D]">
              {collaborator.full_name}
            </h3>
            <p className="text-xs text-[#008F58] font-bold">
              Colaborador(a) Stone SCL
            </p>
          </div>
        </div>

        {/* Profile Details List */}
        <div className="p-4 rounded-2xl bg-[#F8FAF7] border border-emerald-200 space-y-3 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-emerald-200/80">
            <div className="flex items-center gap-2 text-emerald-800">
              <Mail className="w-4 h-4 text-[#00A868]" />
              <span>E-mail corporativo:</span>
            </div>
            <span className="font-mono text-[#08301D] font-semibold">
              {collaborator.email}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-emerald-200/80">
            <div className="flex items-center gap-2 text-emerald-800">
              <MapPin className="w-4 h-4 text-[#00A868]" />
              <span>Polo / Operação:</span>
            </div>
            <span className="text-[#08301D] font-semibold">
              {collaborator.operation || 'Stone SCL'}
            </span>
          </div>

          {collaborator.role && (
            <div className="flex items-center justify-between py-1 border-b border-emerald-200/80">
              <div className="flex items-center gap-2 text-emerald-800">
                <Briefcase className="w-4 h-4 text-[#00A868]" />
                <span>Cargo ou Função:</span>
              </div>
              <span className="text-emerald-950">
                {collaborator.role}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2 text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-[#00A868]" />
              <span>Privacidade:</span>
            </div>
            <span className="text-[#008F58] font-bold">
              Remetente 100% anônimo
            </span>
          </div>
        </div>

        {/* Informative Note */}
        <p className="text-[11px] text-emerald-800/80 text-center leading-relaxed">
          O Correio Verde mantém suas mensagens estritamente anônimas para qualquer destinatário da rede.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-white hover:bg-emerald-50 border border-emerald-300 cursor-pointer"
          >
            Fechar
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 border border-red-200 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair do perfil</span>
          </button>
        </div>
      </div>
    </div>
  );
};
