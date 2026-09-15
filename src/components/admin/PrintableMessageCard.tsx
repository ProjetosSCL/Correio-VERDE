import React, { useState } from 'react';
import { X, Printer, Copy, Check, Mail, Heart, Sparkles, MapPin } from 'lucide-react';
import { Message } from '../../types';

interface PrintableMessageCardProps {
  message: Message | null;
  onClose: () => void;
}

export const PrintableMessageCard: React.FC<PrintableMessageCardProps> = ({
  message,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!message) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const text = `📬 Correio Verde — Stone SCL\n"Ninguém joga em alto nível sozinho(a)."\n\nPara: ${message.recipient_name} (${message.operation})\nCategoria: ${message.category || 'Reconhecimento'}\n\n"${message.message}"\n\n✨ 18 de Setembro de 2026`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl my-8 rounded-3xl bg-[#092518] border border-emerald-700/60 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Top Controls (Hidden on Print) */}
        <div className="no-print flex items-center justify-between pb-4 border-b border-emerald-800/60">
          <div>
            <h3 className="font-['Outfit',sans-serif] font-bold text-white text-lg">
              Cartão Digital do Correio Verde
            </h3>
            <p className="text-xs text-emerald-300">
              Pronto para impressão em papel ou envio digital ao colaborador.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-900/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* The Actual Card to Print / Share */}
        <div
          id="printable-card"
          className="print-card-container relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#061d12] via-[#092c1c] to-[#04190e] border-2 border-[#00D084]/40 p-6 sm:p-8 shadow-2xl text-stone-100"
        >
          {/* Subtle top decoration */}
          <div className="flex items-center justify-between pb-4 border-b border-emerald-800/40">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#00D084] flex items-center justify-center text-[#061d12]">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="font-['Outfit',sans-serif] font-extrabold text-white text-base tracking-tight">
                  Correio Verde
                </span>
                <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded bg-emerald-900/80 text-[#00D084] font-bold border border-emerald-700/40">
                  Stone SCL
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold tracking-wider text-amber-300 uppercase">
                18.09.2026
              </span>
            </div>
          </div>

          {/* Theme headline */}
          <div className="py-4 text-center">
            <p className="text-sm sm:text-base font-bold text-[#00D084] font-['Outfit',sans-serif] italic">
              "Ninguém joga em alto nível sozinho(a)."
            </p>
          </div>

          {/* Recipient info block */}
          <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold">
              Mensagem especial para:
            </span>
            <div className="text-lg font-bold text-white flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span>{message.recipient_name}</span>
                {message.reaction && (
                  <span className="text-2xl" title="Reação enviada">
                    {message.reaction}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-emerald-900 text-emerald-200 border border-emerald-700/60 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400" />
                {message.operation}
              </span>
            </div>
            {message.recipient_role && (
              <p className="text-xs text-emerald-300/80">{message.recipient_role}</p>
            )}
          </div>

          {/* Message Content */}
          <div className="my-5 p-4 sm:p-6 rounded-xl bg-[#04160d]/90 border border-emerald-700/30">
            {message.category && (
              <div className="mb-2.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#00D084]/15 text-[#00D084] border border-[#00D084]/30">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  {message.category}
                </span>
              </div>
            )}
            <blockquote className="text-base sm:text-lg text-emerald-50 leading-relaxed italic font-serif">
              "{message.message}"
            </blockquote>

            {message.gif_url && (
              <div className="mt-3 max-h-52 rounded-xl overflow-hidden bg-black/40 flex items-center justify-center p-1 border border-emerald-700/40">
                <img
                  src={message.gif_url}
                  alt="GIF anexo"
                  referrerPolicy="no-referrer"
                  className="max-h-48 max-w-full rounded-lg object-contain"
                />
              </div>
            )}
          </div>

          {/* Card Footer */}
          <div className="pt-2 flex items-center justify-between text-[11px] text-emerald-400/80 border-t border-emerald-800/40">
            <div className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-[#00D084] fill-[#00D084]" />
              <span>Enviado com carinho e reconhecimento anônimo</span>
            </div>
            <span>Stone Sertão, Cerrado e Litoral</span>
          </div>
        </div>

        {/* Action Buttons (Hidden on Print) */}
        <div className="no-print flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            onClick={handleCopy}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-emerald-200 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[#00D084]" />
                <span>Texto copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-emerald-300" />
                <span>Copiar texto</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-[#061d12] bg-[#00D084] hover:bg-[#02de7a] shadow-md shadow-[#00D084]/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#061d12]" />
            <span>Imprimir Cartão</span>
          </button>
        </div>
      </div>
    </div>
  );
};
