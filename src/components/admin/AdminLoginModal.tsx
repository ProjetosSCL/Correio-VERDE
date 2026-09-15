import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, X } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Senha de acesso inválida.');
      }

      onLoginSuccess(data.token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-emerald-300 p-6 sm:p-8 shadow-2xl space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-emerald-700 hover:text-emerald-950 hover:bg-emerald-50 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-amber-500 shadow-xs">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="font-['Outfit',sans-serif] text-2xl font-bold text-[#08301D]">
            Painel do RH
          </h3>
          <p className="text-xs sm:text-sm text-emerald-800/80">
            Acesso reservado à equipe de RH para gestão das mensagens e colaboradores do Correio Verde.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-emerald-900">
              Senha de Acesso:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="input-admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha..."
                autoFocus
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F8FAF7] border border-emerald-300 text-emerald-950 placeholder-emerald-800/40 text-sm focus:outline-none focus:border-[#00A868] focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800">
            <strong>Dica de teste da campanha:</strong> a senha padrão de acesso é <code className="bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-950 font-mono font-bold">correio2026</code>.
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 rounded-xl text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-white hover:bg-emerald-50 border border-emerald-300 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="btn-admin-submit-login"
              type="submit"
              disabled={isLoading || !password}
              className="w-1/2 py-2.5 rounded-xl text-xs font-bold text-white bg-[#00A868] hover:bg-[#008F58] disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
            >
              {isLoading ? 'Verificando...' : 'Acessar Painel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
