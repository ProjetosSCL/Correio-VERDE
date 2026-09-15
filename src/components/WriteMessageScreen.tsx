import React, { useState } from 'react';
import {
  ArrowLeft,
  Send,
  ShieldCheck,
  MapPin,
  CheckSquare,
  Square,
  AlertCircle,
  Tag,
  Lightbulb,
} from 'lucide-react';
import {
  PublicRecipient,
  MESSAGE_CATEGORIES,
  MESSAGE_SUGGESTIONS,
} from '../types';

interface WriteMessageScreenProps {
  recipient: PublicRecipient;
  onSendMessage: (data: {
    recipient_id: string;
    message: string;
    category?: string;
    confirmedRespectful: boolean;
  }) => Promise<void>;
  onChangeRecipient: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export const WriteMessageScreen: React.FC<WriteMessageScreenProps> = ({
  recipient,
  onSendMessage,
  onChangeRecipient,
  onBack,
  isSubmitting = false,
}) => {
  const [message, setMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [confirmedRespectful, setConfirmedRespectful] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const characterCount = message.length;
  const minLength = 10;
  const maxLength = 500;
  const isTooShort = characterCount > 0 && characterCount < minLength;
  const isTooLong = characterCount > maxLength;
  const isValidLength = characterCount >= minLength && characterCount <= maxLength;

  const handleSuggestionClick = (suggestion: string) => {
    if (!message) {
      setMessage(suggestion);
    } else {
      setMessage((prev) => {
        const trimmed = prev.trim();
        return trimmed ? `${trimmed} ${suggestion}` : suggestion;
      });
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!recipient) {
      setError('Por favor, selecione um destinatário.');
      return;
    }

    if (!message.trim()) {
      setError('Por favor, escreva uma mensagem antes de enviar.');
      return;
    }

    if (message.trim().length < minLength) {
      setError(`A mensagem precisa ter no mínimo ${minLength} caracteres.`);
      return;
    }

    if (message.trim().length > maxLength) {
      setError(`A mensagem não pode ultrapassar ${maxLength} caracteres.`);
      return;
    }

    if (!confirmedRespectful) {
      setError('Por favor, confirme que a mensagem é respeitosa marcando o termo abaixo.');
      return;
    }

    try {
      await onSendMessage({
        recipient_id: recipient.id,
        message: message.trim(),
        category: selectedCategory || undefined,
        confirmedRespectful: true,
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar a mensagem. Tente novamente.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-8 space-y-8">
      {/* Breadcrumb / Top Bar */}
      <div className="flex items-center justify-between">
        <button
          id="btn-message-back"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para escolha de destinatário</span>
        </button>

        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800">
          Passo 2 de 2
        </span>
      </div>

      <div className="rounded-3xl bg-white border border-emerald-200/90 p-6 sm:p-8 shadow-xl shadow-emerald-950/5 space-y-6">
        {/* Title & Subtitle */}
        <div className="space-y-2">
          <h2 className="font-['Outfit',sans-serif] text-2xl sm:text-3xl font-extrabold text-[#08301D]">
            Uma mensagem pode mudar o dia de alguém.
          </h2>
          <p className="text-sm sm:text-base text-emerald-800/80 leading-relaxed">
            Escreva algo que você gostaria que essa pessoa soubesse. Pode ser um agradecimento, uma palavra de carinho, um reconhecimento ou simplesmente um lembrete de que ela não está sozinha.
          </p>
        </div>

        {/* Selected Recipient Card */}
        <div className="p-4 rounded-2xl bg-[#F4F9F5] border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00A868] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {recipient.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-xs text-emerald-700 font-medium">Esta mensagem será entregue para:</div>
              <div className="text-base font-bold text-[#08301D] flex items-center gap-2">
                <span>{recipient.full_name}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-amber-500" />
                  {recipient.operation}
                </span>
              </div>
              {recipient.role && (
                <div className="text-xs text-emerald-700">{recipient.role}</div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onChangeRecipient}
            className="text-xs font-bold text-[#008F58] hover:underline self-start sm:self-center cursor-pointer"
          >
            Trocar destinatário
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Optional Category Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-emerald-900">
              <span className="font-bold flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#00A868]" />
                Categoria (opcional):
              </span>
              {selectedCategory && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('')}
                  className="text-emerald-700 hover:text-emerald-950 underline text-[11px] cursor-pointer"
                >
                  Limpar seleção
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {MESSAGE_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() =>
                      setSelectedCategory(isSelected ? '' : cat)
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#00A868] text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Suggestions Accordion */}
          <div className="space-y-2 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#08301D]">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Precisa de inspiração? Clique em uma sugestão para usar:</span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {MESSAGE_SUGGESTIONS.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSuggestionClick(sug)}
                  className="text-left text-xs px-2.5 py-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-900 hover:border-[#00A868] hover:bg-emerald-50 transition-colors cursor-pointer shadow-xs"
                >
                  "{sug}"
                </button>
              ))}
            </div>
          </div>

          {/* Large Message Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="message-textarea" className="font-bold text-emerald-900">
                Sua mensagem anônima:
              </label>
              <span
                className={`font-mono text-xs ${
                  isTooLong
                    ? 'text-red-600 font-bold'
                    : isTooShort
                    ? 'text-amber-600'
                    : 'text-emerald-700'
                }`}
              >
                {characterCount} / {maxLength} caracteres
              </span>
            </div>

            <textarea
              id="message-textarea"
              rows={5}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Escreva sua mensagem aqui..."
              className="w-full p-4 rounded-2xl bg-[#F8FAF7] border border-emerald-300 text-emerald-950 placeholder-emerald-800/40 text-base leading-relaxed focus:outline-none focus:border-[#00A868] focus:ring-2 focus:ring-emerald-500/20 resize-y transition-all shadow-xs"
            />

            {isTooShort && (
              <p className="text-xs text-amber-600">
                Faltam {minLength - characterCount} caracteres para o mínimo de {minLength}.
              </p>
            )}
            {isTooLong && (
              <p className="text-xs text-red-600">
                Sua mensagem excedeu o limite máximo em {characterCount - maxLength} caracteres.
              </p>
            )}
          </div>

          {/* Respectful message checkbox */}
          <div
            id="checkbox-respectful-container"
            onClick={() => setConfirmedRespectful(!confirmedRespectful)}
            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
              confirmedRespectful
                ? 'bg-emerald-50 border-emerald-300'
                : 'bg-[#FAFCFA] border-emerald-200 hover:border-emerald-300'
            }`}
          >
            <div className="mt-0.5 text-[#00A868]">
              {confirmedRespectful ? (
                <CheckSquare className="w-5 h-5 text-[#00A868]" />
              ) : (
                <Square className="w-5 h-5 text-emerald-300" />
              )}
            </div>
            <label className="text-xs sm:text-sm text-emerald-900 cursor-pointer select-none leading-snug">
              Confirmo que esta mensagem é respeitosa e foi escrita com a intenção de reconhecer ou acolher alguém.
            </label>
          </div>

          {/* Anonymity reassurance banner */}
          <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-[#00A868] shrink-0" />
            <span>
              <strong>Lembrete de sigilo:</strong> Seu nome, e-mail e qualquer identificador pessoal <u>não</u> são salvos nem exibidos. O destinatário recebe apenas o carinho das suas palavras.
            </span>
          </div>

          {/* Error notice if validation fails */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              id="btn-message-cancel"
              type="button"
              onClick={onBack}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-emerald-800 hover:text-emerald-950 bg-white hover:bg-emerald-50 border border-emerald-300 transition-colors cursor-pointer"
            >
              Voltar
            </button>

            <button
              id="btn-message-submit"
              type="submit"
              disabled={isSubmitting || !isValidLength || !confirmedRespectful}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-bold transition-all ${
                isValidLength && confirmedRespectful && !isSubmitting
                  ? 'bg-[#00A868] text-white hover:bg-[#008F58] active:scale-[0.98] shadow-md shadow-emerald-600/20 cursor-pointer'
                  : 'bg-emerald-100 text-emerald-400 border border-emerald-200 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Enviando mensagem...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-white" />
                  <span>Enviar mensagem</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
