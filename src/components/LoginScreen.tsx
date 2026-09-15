import React, { useState } from 'react';
import { Mail, ArrowRight, ShieldCheck, Lock, AlertCircle } from 'lucide-react';
import { CollaboratorSession } from '../types';
import { YellowRibbon } from './YellowRibbon';

interface LoginScreenProps {
  onLoginSuccess: (session: CollaboratorSession) => void;
  onOpenAdmin: () => void;
  onCancel?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onOpenAdmin,
  onCancel,
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Por favor, digite seu e-mail corporativo.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/collaborator/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível autenticar seu e-mail corporativo.');
      }

      onLoginSuccess({
        token: data.token,
        collaborator: data.collaborator,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao realizar login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-6 sm:py-12 max-w-lg mx-auto space-y-8">
      {/* Brand Header with Yellow Ribbon */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <h1 className="font-['Outfit',sans-serif] text-3xl sm:text-4xl font-extrabold text-[#08301D] tracking-tight">
            Correio Verde
          </h1>
          <YellowRibbon className="w-14 h-7 sm:w-16 sm:h-8 drop-shadow-sm" />
        </div>
        <p className="text-lg font-bold text-[#008F58] font-['Outfit',sans-serif]">
          "Ninguém joga em alto nível sozinho(a)."
        </p>
      </div>

      {/* Login Card */}
      <div className="rounded-3xl bg-white border border-emerald-200/90 p-6 sm:p-8 shadow-xl shadow-emerald-950/5 space-y-6">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition-colors cursor-pointer"
          >
            ← Voltar para o início
          </button>
        )}

        <div className="space-y-1 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-[#00A868] mb-3 shadow-xs">
            <Mail className="w-6 h-6" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#08301D]">
            Acesse seu perfil @querostone
          </h2>
          <p className="text-xs text-emerald-800/80">
            Acesso individual e confidencial para colaboradores cadastrados no Stone SCL.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="input-corporate-email" className="text-xs font-semibold text-emerald-900">
              E-mail corporativo
            </label>
            <div className="relative">
              <input
                id="input-corporate-email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="seunome@querostone.com"
                className="w-full px-4 py-3.5 rounded-xl bg-[#F8FAF7] border border-emerald-300 text-emerald-950 placeholder-emerald-800/40 text-sm focus:outline-none focus:border-[#00A868] focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
            <p className="text-[11px] text-emerald-700/80">
              Utilize o mesmo e-mail corporativo cadastrado na Stone.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-red-900">Acesso não localizado:</span>
                <p className="text-[11px] text-red-700 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          <button
            id="btn-login-submit"
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-bold text-white bg-[#00A868] hover:bg-[#008F58] active:scale-[0.98] shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Entrando...</span>
              </div>
            ) : (
              <>
                <span>Acessar Meu Perfil</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </>
            )}
          </button>
        </form>

        {/* Short privacy message */}
        <div className="pt-4 border-t border-emerald-100 text-center space-y-2">
          <p className="text-xs text-emerald-900 font-medium flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#00A868] shrink-0" />
            <span>Suas mensagens são anônimas. O acesso à plataforma é individual.</span>
          </p>
          <p className="text-[11px] text-emerald-800/80 leading-relaxed">
            Quem recebe sua mensagem nunca saberá quem a enviou. O Correio Verde é um espaço seguro de carinho e reconhecimento.
          </p>
        </div>
      </div>
    </div>
  );
};
