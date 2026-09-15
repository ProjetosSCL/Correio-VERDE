import React from 'react';
import { Mail, Check, Heart, PlusCircle, ArrowLeft, ShieldCheck, Inbox } from 'lucide-react';

interface ConfirmationScreenProps {
  recipientName: string;
  operation: string;
  category?: string;
  onSendAnother: () => void;
  onBackHome: () => void;
  onOpenInbox?: () => void;
  hasCollaborator?: boolean;
}

export const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({
  recipientName,
  operation,
  category,
  onSendAnother,
  onBackHome,
  onOpenInbox,
  hasCollaborator,
}) => {
  return (
    <div className="max-w-xl mx-auto py-6 sm:py-12">
      <div className="rounded-3xl bg-white border border-emerald-200/90 p-6 sm:p-10 shadow-xl shadow-emerald-950/5 text-center space-y-6">
        {/* Envelope with celebration heart and checkmark */}
        <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28">
          <div className="absolute inset-0 rounded-full bg-[#00A868]/15 blur-xl animate-pulse" />
          <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-[#00A868] to-[#007D4C] flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
            <Mail className="w-12 h-12 text-white" />
            <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md border-2 border-[#00A868]">
              <Check className="w-5 h-5 text-[#008F58] stroke-[3]" />
            </div>
            <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center shadow-md">
              <Heart className="w-4 h-4 text-amber-950 fill-amber-950" />
            </div>
          </div>
        </div>

        {/* Titles */}
        <div className="space-y-2">
          <h2 className="font-['Outfit',sans-serif] text-3xl sm:text-4xl font-extrabold text-[#08301D]">
            Mensagem enviada! 💚
          </h2>
          <p className="text-lg sm:text-xl font-bold text-[#008F58]">
            Seu carinho já está no Correio Verde.
          </p>
        </div>

        {/* Delivery detail summary (NO sender info!) */}
        <div className="p-4 rounded-2xl bg-[#F4F9F5] border border-emerald-300 text-xs sm:text-sm text-emerald-900 space-y-1">
          <p>
            Destinada a <strong className="text-[#08301D]">{recipientName}</strong> ({operation})
          </p>
          {category && (
            <p className="text-xs text-emerald-700">
              Categoria: <span className="font-semibold text-emerald-900">{category}</span>
            </p>
          )}
        </div>

        {/* Additional thoughtful text */}
        <p className="text-sm sm:text-base text-emerald-800 leading-relaxed max-w-md mx-auto italic">
          "Às vezes, algumas palavras são tudo o que alguém precisa para lembrar que não está sozinho(a)."
        </p>

        {/* Anonymity seal */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00A868]" />
          <span>Remetente mantido em segredo absoluto</span>
        </div>

        {/* Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            id="btn-send-another-message"
            onClick={onSendAnother}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#00A868] hover:bg-[#008F58] active:scale-[0.98] shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>Enviar outra mensagem</span>
          </button>

          {hasCollaborator && onOpenInbox && (
            <button
              onClick={onOpenInbox}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-emerald-900 bg-white hover:bg-emerald-50 border border-emerald-300 shadow-xs transition-colors cursor-pointer"
            >
              <Inbox className="w-4 h-4 text-[#00A868]" />
              <span>Ver Minha Caixa Postal</span>
            </button>
          )}

          <button
            id="btn-back-to-correio"
            onClick={onBackHome}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-emerald-800 hover:text-emerald-950 bg-white hover:bg-emerald-50 border border-emerald-200 shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao início</span>
          </button>
        </div>
      </div>
    </div>
  );
};
