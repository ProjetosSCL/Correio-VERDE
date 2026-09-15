import React, { useState, useMemo } from 'react';
import { Search, ArrowLeft, ArrowRight, UserCheck, Check, MapPin, Briefcase, X, AlertCircle, Users, ChevronDown } from 'lucide-react';
import { PublicRecipient, STONE_OPERATIONS } from '../types';

interface RecipientSelectScreenProps {
  recipients: PublicRecipient[];
  selectedRecipient: PublicRecipient | null;
  onSelectRecipient: (recipient: PublicRecipient) => void;
  onContinue: () => void;
  onBack: () => void;
  isLoading?: boolean;
  currentCollaboratorId?: string;
}

export const RecipientSelectScreen: React.FC<RecipientSelectScreenProps> = ({
  recipients,
  selectedRecipient,
  onSelectRecipient,
  onContinue,
  onBack,
  isLoading = false,
  currentCollaboratorId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOperation, setSelectedOperation] = useState<string>('all');

  // Filter out self if logged in
  const availableRecipients = useMemo(() => {
    return recipients.filter((r) => !currentCollaboratorId || r.id !== currentCollaboratorId);
  }, [recipients, currentCollaboratorId]);

  // Check if operations are varied
  const hasMultipleOperations = useMemo(() => {
    const ops = new Set(
      availableRecipients
        .map((r) => r.operation)
        .filter((op) => op && op.trim() !== '' && op !== 'Stone SCL')
    );
    return ops.size > 1;
  }, [availableRecipients]);

  // Alphabetically sorted recipients for dropdown list
  const sortedRecipients = useMemo(() => {
    return [...availableRecipients].sort((a, b) => a.full_name.localeCompare(b.full_name, 'pt-BR'));
  }, [availableRecipients]);

  const filteredRecipients = useMemo(() => {
    return availableRecipients
      .filter((r) => {
        const matchesOp =
          selectedOperation === 'all' ||
          r.operation.toLowerCase() === selectedOperation.toLowerCase();

        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !q ||
          r.full_name.toLowerCase().includes(q) ||
          r.operation.toLowerCase().includes(q) ||
          (r.role && r.role.toLowerCase().includes(q));

        return matchesOp && matchesQuery;
      })
      .sort((a, b) => a.full_name.localeCompare(b.full_name, 'pt-BR'));
  }, [availableRecipients, searchQuery, selectedOperation]);

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-8 space-y-8">
      {/* Header / Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          id="btn-recipient-back"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para o início</span>
        </button>

        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800">
          Passo 1 de 2
        </span>
      </div>

      {/* Main card */}
      <div className="rounded-3xl bg-white border border-emerald-200/90 p-6 sm:p-8 shadow-xl shadow-emerald-950/5 space-y-6">
        <div className="space-y-2">
          <h2 className="font-['Outfit',sans-serif] text-2xl sm:text-3xl font-extrabold text-[#08301D]">
            Para quem é essa mensagem?
          </h2>
          <p className="text-sm sm:text-base text-emerald-800/80">
            Selecione o colega do Stone SCL que você deseja reconhecer ou agradecer.
          </p>
        </div>

        {/* Dropdown Select Mode */}
        {availableRecipients.length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <label
                htmlFor="recipient-dropdown-select"
                className="text-xs sm:text-sm font-bold text-[#08301D] flex items-center gap-2"
              >
                <ChevronDown className="w-4 h-4 text-[#00A868]" />
                <span>Escolha na Lista Suspensa:</span>
              </label>
              <span className="text-[11px] font-semibold text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-xs">
                {availableRecipients.length} colaboradores
              </span>
            </div>

            <div className="relative">
              <select
                id="recipient-dropdown-select"
                value={selectedRecipient?.id || ''}
                onChange={(e) => {
                  const found = availableRecipients.find((r) => r.id === e.target.value);
                  if (found) {
                    onSelectRecipient(found);
                    setSearchQuery('');
                  }
                }}
                className="w-full px-4 py-3.5 rounded-xl bg-white border border-emerald-300 text-emerald-950 font-medium text-sm sm:text-base focus:outline-none focus:border-[#00A868] focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer shadow-xs"
              >
                <option value="" className="text-emerald-700">
                  -- Toque ou clique aqui para abrir a lista suspensa --
                </option>
                {sortedRecipients.map((r) => (
                  <option key={r.id} value={r.id} className="text-emerald-950 py-2">
                    {r.full_name}
                    {r.operation && r.operation !== 'Stone SCL' ? ` (${r.operation})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-emerald-700/80">
              Dica: Abra a lista e role ou digite a inicial do nome do seu colega.
            </p>
          </div>
        )}

        {/* Divider / Search Alternative */}
        {availableRecipients.length > 0 && (
          <div className="flex items-center gap-3 py-1">
            <div className="h-px bg-emerald-200 flex-1" />
            <span className="text-xs text-emerald-700 font-medium">ou busque digitando o nome</span>
            <div className="h-px bg-emerald-200 flex-1" />
          </div>
        )}

        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
            <Search className="w-5 h-5" />
          </div>
          <input
            id="input-search-recipient"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Digite o nome do colega..."
            className="w-full pl-11 pr-10 py-3.5 rounded-xl bg-[#F8FAF7] border border-emerald-300 text-emerald-950 placeholder-emerald-800/40 text-base focus:outline-none focus:border-[#00A868] focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-emerald-600 hover:text-emerald-950"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Operation Filter Pills */}
        {hasMultipleOperations && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-emerald-800">
              <span>Filtrar por polo / operação:</span>
              <span className="font-medium">{filteredRecipients.length} pessoas encontradas</span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto py-1">
              <button
                type="button"
                onClick={() => setSelectedOperation('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  selectedOperation === 'all'
                    ? 'bg-[#00A868] text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                Todas as Operações
              </button>
              {STONE_OPERATIONS.map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => setSelectedOperation(op)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    selectedOperation === op
                      ? 'bg-[#00A868] text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recipients List */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="text-center py-10 text-emerald-800">
              <div className="animate-spin w-8 h-8 border-2 border-[#00A868] border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm">Carregando lista de colegas do SCL...</p>
            </div>
          ) : recipients.length === 0 ? (
            <div className="text-center py-10 rounded-2xl bg-emerald-50/50 border border-dashed border-emerald-300 p-6 space-y-2">
              <Users className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-sm font-semibold text-[#08301D]">Nenhum colaborador cadastrado ainda</p>
              <p className="text-xs text-emerald-800/80 max-w-sm mx-auto">
                A plataforma está pronta. Você pode adicionar a lista de colaboradores no Painel do RH colando os nomes de uma vez só!
              </p>
            </div>
          ) : filteredRecipients.length === 0 ? (
            <div className="text-center py-10 rounded-2xl bg-emerald-50/50 border border-dashed border-emerald-300 p-6 space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="text-sm font-semibold text-[#08301D]">Nenhum colega encontrado com esse critério</p>
              <p className="text-xs text-emerald-700">
                Tente buscar por outro termo ou selecione diretamente na lista suspensa acima.
              </p>
            </div>
          ) : (
            filteredRecipients.map((recipient) => {
              const isSelected = selectedRecipient?.id === recipient.id;
              const showOperation = recipient.operation && recipient.operation !== 'Stone SCL';
              return (
                <div
                  key={recipient.id}
                  id={`recipient-item-${recipient.id}`}
                  onClick={() => onSelectRecipient(recipient)}
                  className={`group flex items-center justify-between p-3.5 rounded-xl cursor-pointer border transition-all duration-150 ${
                    isSelected
                      ? 'bg-emerald-50 border-2 border-[#00A868] shadow-sm'
                      : 'bg-white border-emerald-200/80 hover:bg-emerald-50/60 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                        isSelected
                          ? 'bg-[#00A868] text-white'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {recipient.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-emerald-950 text-sm">
                        {recipient.full_name}
                      </div>
                      {(showOperation || recipient.role) && (
                        <div className="flex items-center gap-2 text-xs text-emerald-700">
                          {showOperation && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-amber-500" />
                              <span>{recipient.operation}</span>
                            </span>
                          )}
                          {showOperation && recipient.role && <span>•</span>}
                          {recipient.role && (
                            <span className="flex items-center gap-1 text-emerald-800">
                              <Briefcase className="w-3 h-3" />
                              <span>{recipient.role}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pl-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                        isSelected
                          ? 'bg-[#00A868] border-[#00A868] text-white'
                          : 'border-emerald-300 group-hover:border-emerald-500'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected confirmation banner */}
        {selectedRecipient && (
          <div className="p-4 rounded-xl bg-[#F4F9F5] border border-emerald-300 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#00A868] flex items-center justify-center text-white shadow-xs">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-emerald-700 font-medium">Destinatário selecionado:</p>
                <p className="text-sm font-bold text-[#08301D]">
                  Essa mensagem vai para <span className="text-[#008F58]">{selectedRecipient.full_name}</span>
                  {selectedRecipient.operation && selectedRecipient.operation !== 'Stone SCL' ? ` (${selectedRecipient.operation})` : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-emerald-200">
          <button
            id="btn-recipient-cancel"
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-emerald-800 hover:text-emerald-950 bg-white hover:bg-emerald-50 border border-emerald-300 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            id="btn-recipient-continue"
            type="button"
            onClick={onContinue}
            disabled={!selectedRecipient}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm font-bold transition-all ${
              selectedRecipient
                ? 'bg-[#00A868] text-white hover:bg-[#008F58] active:scale-[0.98] shadow-md shadow-emerald-600/20 cursor-pointer'
                : 'bg-emerald-100 text-emerald-400 border border-emerald-200 cursor-not-allowed'
            }`}
          >
            <span>Continuar para a mensagem</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
