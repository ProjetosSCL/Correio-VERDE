import React, { useState } from 'react';
import { Heart, Sparkles, X, Send, Smile, Check } from 'lucide-react';

interface ThankYouModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string;
  initialNote?: string | null;
  onSendThankYou: (messageId: string, note: string) => Promise<void>;
}

const QUICK_THANKS = [
  'Muito obrigado pelas palavras e pelo carinho! 💚',
  'Fiquei muito feliz em ler isso, você fez o meu dia! ✨',
  'Tamo junto! É um prazer enorme trabalhar com você! 🤝',
  'Gratidão pelo reconhecimento, isso me motiva muito! 🚀',
  'Valeu demais pelo apoio de sempre! 🌟',
  'Que recado especial! Conte comigo para o que precisar! ☀️',
];

export const ThankYouModal: React.FC<ThankYouModalProps> = ({
  isOpen,
  onClose,
  messageId,
  initialNote,
  onSendThankYou,
}) => {
  const [note, setNote] = useState(initialNote || QUICK_THANKS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = note.trim();
    if (!trimmed) {
      setError('Por favor, escreva ou escolha uma mensagem de agradecimento.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSendThankYou(messageId, trimmed);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar agradecimento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-emerald-300 shadow-2xl p-6 sm:p-7 space-y-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-emerald-700 hover:text-emerald-950 hover:bg-emerald-50 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shadow-xs">
            <Heart className="w-6 h-6 fill-amber-500 text-amber-500 animate-pulse" />
          </div>
          <div>
            <h3 className="font-['Outfit',sans-serif] text-lg sm:text-xl font-bold text-[#08301D]">
              Agradecer a Mensagem
            </h3>
            <p className="text-xs text-emerald-800/80">
              Envie um retorno de carinho para quem lembrou de você!
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Quick Options */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Escolha uma mensagem rápida:
          </span>
          <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto pr-1 text-xs">
            {QUICK_THANKS.map((quick, idx) => {
              const isSelected = note === quick;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNote(quick)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-100 border-[#00A868] text-[#08301D] font-bold shadow-xs'
                      : 'bg-emerald-50/60 border-emerald-200 text-emerald-900 hover:bg-emerald-100/60'
                  }`}
                >
                  <span className="truncate">{quick}</span>
                  {isSelected && <Check className="w-4 h-4 text-[#00A868] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-emerald-950 flex items-center gap-1">
              <Smile className="w-3.5 h-3.5 text-emerald-600" />
              Ou personalize seu agradecimento:
            </label>
            <textarea
              rows={3}
              value={note}
              maxLength={300}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Escreva seu agradecimento sincero..."
              className="w-full p-3 rounded-xl border border-emerald-300 text-xs sm:text-sm text-emerald-950 focus:outline-none focus:ring-2 focus:ring-[#00A868]"
            />
            <div className="flex justify-between text-[11px] text-emerald-700">
              <span>Máximo 300 caracteres</span>
              <span>{note.length}/300</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-emerald-900 hover:bg-emerald-50 border border-emerald-300 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !note.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#00A868] hover:bg-[#008F58] transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Enviando...' : 'Enviar Agradecimento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
