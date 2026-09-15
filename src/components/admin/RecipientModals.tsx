import React, { useState } from 'react';
import { X, Upload, Plus, AlertCircle, FileText, CheckCircle2, ListPlus, Users, Mail } from 'lucide-react';
import { Recipient, STONE_OPERATIONS } from '../../types';

interface RecipientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { full_name: string; email?: string; operation: string; role?: string; active: boolean }) => Promise<void>;
  initialData?: Recipient | null;
}

export const RecipientFormModal: React.FC<RecipientFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [fullName, setFullName] = useState(initialData?.full_name || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [operation, setOperation] = useState(initialData?.operation || '');
  const [role, setRole] = useState(initialData?.role || '');
  const [active, setActive] = useState(initialData ? initialData.active : true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Nome completo é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave({
        full_name: fullName.trim(),
        email: email.trim() || undefined,
        operation: operation.trim() || 'Stone SCL',
        role: role.trim() || undefined,
        active,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar colaborador.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl bg-[#092518] border border-emerald-700/60 p-6 sm:p-8 shadow-2xl space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-900/50"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="font-['Outfit',sans-serif] text-xl font-bold text-white">
            {initialData ? 'Editar Colaborador(a)' : 'Novo(a) Colaborador(a)'}
          </h3>
          <p className="text-xs text-emerald-200/80">
            Cadastre os dados do colaborador para acesso individual e recebimento de mensagens.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-emerald-300">
              Nome Completo: *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex: João da Silva"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#05180f] border border-emerald-700/60 text-white placeholder-emerald-600 text-sm focus:outline-none focus:border-[#00D084]"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#00D084]" />
                <span>E-mail corporativo:</span>
              </label>
              <span className="text-[10px] text-emerald-400/80">@querostone.com</span>
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="joao.silva@querostone.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#05180f] border border-emerald-700/60 text-white placeholder-emerald-600 text-sm focus:outline-none focus:border-[#00D084]"
            />
            <p className="text-[10px] text-emerald-400/70">
              Se deixado em branco, será gerado automaticamente a partir do nome.
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-emerald-300">
                Polo / Operação (Opcional):
              </label>
              <span className="text-[11px] text-emerald-400/70">Não obrigatório</span>
            </div>
            <select
              value={operation}
              onChange={(e) => setOperation(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#05180f] border border-emerald-700/60 text-white text-sm focus:outline-none focus:border-[#00D084]"
            >
              <option value="" className="bg-[#05180f] text-emerald-300">
                Geral Stone SCL (Sem polo específico)
              </option>
              {STONE_OPERATIONS.map((op) => (
                <option key={op} value={op} className="bg-[#05180f] text-white">
                  {op}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-emerald-300">
              Cargo ou Função (opcional):
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Ex: Consultor(a) Comercial"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#05180f] border border-emerald-700/60 text-white placeholder-emerald-600 text-sm focus:outline-none focus:border-[#00D084]"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              id="checkbox-active"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 rounded border-emerald-700 text-[#00D084] focus:ring-[#00D084]"
            />
            <label htmlFor="checkbox-active" className="text-xs text-emerald-200 cursor-pointer">
              Ativo para acessar o perfil e receber mensagens
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-950/60 border border-emerald-800/60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold text-[#061d12] bg-[#00D084] hover:bg-[#02de7a] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ListImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportList: (rawText: string, operation?: string) => Promise<{ added: number; totalProcessed: number; errors: string[] }>;
}

export const ListImportModal: React.FC<ListImportModalProps> = ({
  isOpen,
  onClose,
  onImportList,
}) => {
  const [namesText, setNamesText] = useState('');
  const [defaultOperation, setDefaultOperation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ added: number; totalProcessed: number; errors: string[] } | null>(null);

  if (!isOpen) return null;

  const linesCount = namesText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 1).length;

  const handleSubmit = async () => {
    if (!namesText.trim()) return;
    setIsSubmitting(true);
    setResult(null);
    try {
      const res = await onImportList(namesText, defaultOperation || undefined);
      setResult(res);
      if (res.added > 0) {
        setNamesText('');
      }
    } catch (err: any) {
      setResult({
        added: 0,
        totalProcessed: 0,
        errors: [err.message || 'Erro ao processar lista de nomes.'],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#092518] border border-emerald-700/60 p-6 sm:p-8 shadow-2xl space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-900/50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#00D084]/20 border border-[#00D084]/40 flex items-center justify-center shrink-0">
            <ListPlus className="w-5 h-5 text-[#00D084]" />
          </div>
          <div>
            <h3 className="font-['Outfit',sans-serif] text-xl font-bold text-white">
              Colar Lista de Colaboradores (Google Forms)
            </h3>
            <p className="text-xs text-emerald-200/80">
              Cole os nomes um por linha. Os e-mails @querostone.com são gerados automaticamente!
            </p>
          </div>
        </div>

        {/* Tip Box */}
        <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-800/60 text-xs text-emerald-200/90 space-y-1.5">
          <div className="font-semibold text-emerald-100 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#00D084]" />
            <span>Como funciona:</span>
          </div>
          <p className="text-emerald-300/80 text-[11px] leading-relaxed">
            Copie a lista de nomes da sua planilha, WhatsApp ou formulário e cole abaixo. Para cada colaborador, criamos o perfil individual com e-mail corporativo correspondente. Se colar "Nome [Tab] email@querostone.com", o e-mail exato também é aceito.
          </p>
        </div>

        {/* Textarea */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-emerald-300">
              Cole a lista de nomes (um por linha):
            </label>
            <span className="text-[#00D084] font-medium bg-[#00D084]/10 px-2 py-0.5 rounded-full text-[11px]">
              {linesCount} nome{linesCount !== 1 ? 's' : ''} detectado{linesCount !== 1 ? 's' : ''}
            </span>
          </div>
          <textarea
            rows={7}
            value={namesText}
            onChange={(e) => setNamesText(e.target.value)}
            placeholder={`Exemplo:\nAna Clara Bezerra\nBruno Henrique Costa\nCamila Medeiros\nDiego Albuquerque\nEduarda Santos`}
            className="w-full p-3.5 rounded-xl bg-[#05180f] border border-emerald-700/60 text-white placeholder-emerald-600/70 font-sans text-sm focus:outline-none focus:border-[#00D084] focus:ring-1 focus:ring-[#00D084]"
          />
        </div>

        {/* Optional default polo */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-emerald-300 flex items-center justify-between">
            <span>Polo / Operação (Opcional):</span>
            <span className="text-emerald-400/70 text-[11px]">Deixe vazio se não quiser colocar Polo</span>
          </label>
          <select
            value={defaultOperation}
            onChange={(e) => setDefaultOperation(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#05180f] border border-emerald-700/60 text-white text-xs focus:outline-none focus:border-[#00D084]"
          >
            <option value="" className="bg-[#05180f] text-emerald-300">
              Geral Stone SCL (Sem polo específico)
            </option>
            {STONE_OPERATIONS.map((op) => (
              <option key={op} value={op} className="bg-[#05180f] text-white">
                {op}
              </option>
            ))}
          </select>
        </div>

        {/* Success / Error feedback */}
        {result && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-[#00D084] font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {result.added} colaborador{result.added !== 1 ? 'es' : ''} adicionado{result.added !== 1 ? 's' : ''} com sucesso!
              </span>
            </div>
            {result.errors.length > 0 && (
              <div className="text-amber-300 text-[11px] pt-1">
                <strong>Avisos:</strong> {result.errors.join(' | ')}
              </div>
            )}
          </div>
        )}

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-950/60 border border-emerald-800/60"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || linesCount === 0}
            className="px-5 py-2 rounded-xl text-xs font-bold text-[#061d12] bg-[#00D084] hover:bg-[#02de7a] disabled:opacity-50 transition-colors shadow-lg shadow-[#00D084]/20 cursor-pointer"
          >
            {isSubmitting ? 'Adicionando...' : `Adicionar ${linesCount > 0 ? `${linesCount} Colaboradores` : 'Colaboradores'}`}
          </button>
        </div>
      </div>
    </div>
  );
};

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (csvText: string) => Promise<{ added: number; errors: string[] }>;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [csvText, setCsvText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ added: number; errors: string[] } | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCsvText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    if (!csvText.trim()) return;
    setIsSubmitting(true);
    setResult(null);
    try {
      const res = await onImport(csvText);
      setResult(res);
    } catch (err: any) {
      setResult({ added: 0, errors: [err.message || 'Erro ao processar importação'] });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadSample = () => {
    const sample = `full_name,email,operation,role,active\nMaria Silva,maria.silva@querostone.com,Patos,Agente Comercial,true\nCarlos Pereira,carlos.pereira@querostone.com,João Câmara,Líder de Operações,true\nJuliana Lima,juliana.lima@querostone.com,Trairi,Consultora de Vendas,true\nRodrigo Santos,rodrigo.santos@querostone.com,Limoeiro do Norte,Especialista de Rota,true`;
    setCsvText(sample);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg my-8 rounded-3xl bg-[#092518] border border-emerald-700/60 p-6 sm:p-8 shadow-2xl space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-900/50"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="font-['Outfit',sans-serif] text-xl font-bold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#00D084]" />
            <span>Importar Colaboradores via CSV</span>
          </h3>
          <p className="text-xs text-emerald-200/80 pt-1">
            Importe colaboradores em massa com e-mail corporativo para acesso à plataforma.
          </p>
        </div>

        {/* Format guide */}
        <div className="p-3.5 rounded-xl bg-[#061d12] border border-emerald-800/60 text-xs text-emerald-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-emerald-300">Colunas suportadas:</span>
            <button
              type="button"
              onClick={handleLoadSample}
              className="text-[#00D084] underline text-[11px] font-medium cursor-pointer"
            >
              Preencher exemplo
            </button>
          </div>
          <p className="font-mono text-[11px] bg-emerald-950 p-2 rounded text-emerald-100">
            full_name,email,operation,role,active
          </p>
          <p className="text-[11px] text-emerald-400/80">
            Aceita separador por vírgula (,) ou ponto-e-vírgula (;). O cabeçalho é opcional.
          </p>
        </div>

        {/* File upload input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-emerald-300">
            Carregar arquivo (.csv ou .txt):
          </label>
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className="w-full text-xs text-emerald-200 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-950 file:text-[#00D084] file:border file:border-emerald-700/60 hover:file:bg-emerald-900 cursor-pointer"
          />
        </div>

        {/* CSV Textarea */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-emerald-300">
            Ou cole o conteúdo aqui:
          </label>
          <textarea
            rows={5}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="full_name,email,operation,role,active..."
            className="w-full p-3 rounded-xl bg-[#05180f] border border-emerald-700/60 text-white placeholder-emerald-600 font-mono text-xs focus:outline-none focus:border-[#00D084]"
          />
        </div>

        {result && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-[#00D084] font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>{result.added} colaborador(es) importado(s) com sucesso!</span>
            </div>
            {result.errors.length > 0 && (
              <div className="text-amber-300 text-[11px] pt-1">
                <strong>Avisos:</strong> {result.errors.join(' | ')}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-950/60 border border-emerald-800/60"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleImportSubmit}
            disabled={isSubmitting || !csvText.trim()}
            className="px-5 py-2 rounded-xl text-xs font-bold text-[#061d12] bg-[#00D084] hover:bg-[#02de7a] disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isSubmitting ? 'Processando...' : 'Confirmar Importação'}
          </button>
        </div>
      </div>
    </div>
  );
};
