import React, { useState, useEffect, useMemo } from 'react';
import {
  Inbox,
  Send,
  Users,
  CheckCircle2,
  Clock,
  Archive,
  Download,
  Plus,
  Upload,
  Search,
  Filter,
  Trash2,
  Printer,
  Edit2,
  RefreshCw,
  LogOut,
  MapPin,
  Tag,
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  ChevronDown,
  ListPlus,
  Check,
} from 'lucide-react';
import {
  Message,
  Recipient,
  CampaignStats,
  STONE_OPERATIONS,
  MESSAGE_CATEGORIES,
  MessageStatus,
} from '../../types';
import { PrintableMessageCard } from './PrintableMessageCard';
import { RecipientFormModal, CsvImportModal, ListImportModal } from './RecipientModals';

interface AdminDashboardProps {
  adminToken: string;
  onLogout: () => void;
  onNavigateHome: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminToken,
  onLogout,
  onNavigateHome,
}) => {
  const [activeTab, setActiveTab] = useState<'delivery' | 'messages' | 'recipients'>('delivery');

  // Data states
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Filters for messages
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [operationFilter, setOperationFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [recipientFilter, setRecipientFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Recipients filter
  const [recipientSearch, setRecipientSearch] = useState('');
  const [recipientOpFilter, setRecipientOpFilter] = useState('all');

  // Dropdown-based Collaborator Manager State (RH request)
  const [selectedDropdownRecId, setSelectedDropdownRecId] = useState<string>('new');
  const [dropdownName, setDropdownName] = useState('');
  const [dropdownEmail, setDropdownEmail] = useState('');
  const [dropdownOperation, setDropdownOperation] = useState('Stone SCL');
  const [dropdownRole, setDropdownRole] = useState('');
  const [dropdownActive, setDropdownActive] = useState(true);
  const [isSavingDropdown, setIsSavingDropdown] = useState(false);

  // Modals
  const [printCardMessage, setPrintCardMessage] = useState<Message | null>(null);
  const [isAddRecipientOpen, setIsAddRecipientOpen] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<Recipient | null>(null);
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);
  const [isListImportOpen, setIsListImportOpen] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${adminToken}` };

      const [statsRes, messagesRes, recipientsRes] = await Promise.all([
        fetch('/api/admin/dashboard', { headers }),
        fetch('/api/admin/messages', { headers }),
        fetch('/api/admin/recipients', { headers }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (messagesRes.ok) {
        const data = await messagesRes.json();
        setMessages(data.messages || []);
      }
      if (recipientsRes.ok) {
        const data = await recipientsRes.json();
        setRecipients(data.recipients || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [adminToken]);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Update status (pending, delivered, archived)
  const handleUpdateStatus = async (id: string, newStatus: MessageStatus) => {
    try {
      const res = await fetch(`/api/admin/messages/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
        );
        showNotice(
          newStatus === 'delivered'
            ? 'Mensagem marcada como entregue!'
            : newStatus === 'archived'
            ? 'Mensagem arquivada.'
            : 'Status alterado para pendente.'
        );
        fetchData(); // refresh counters
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Delete message
  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm('Tem certeza de que deseja remover esta mensagem? Esta ação é definitiva.')) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        showNotice('Mensagem removida com sucesso.');
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    window.location.href = `/api/admin/messages/export?token=${encodeURIComponent(adminToken)}`;
  };

  // Recipient save (add or edit)
  const handleSaveRecipient = async (data: {
    full_name: string;
    email?: string;
    operation: string;
    role?: string;
    active: boolean;
  }) => {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    };

    if (editingRecipient) {
      const res = await fetch(`/api/admin/recipients/${editingRecipient.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Falha ao atualizar colaborador.');
      showNotice('Colaborador atualizado com sucesso!');
    } else {
      const res = await fetch('/api/admin/recipients', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Falha ao adicionar colaborador.');
      showNotice('Novo colaborador cadastrado!');
    }
    fetchData();
  };

  // Toggle recipient active status
  const handleToggleRecipientActive = async (recipient: Recipient) => {
    try {
      const res = await fetch(`/api/admin/recipients/${recipient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ active: !recipient.active }),
      });
      if (res.ok) {
        setRecipients((prev) =>
          prev.map((r) => (r.id === recipient.id ? { ...r, active: !r.active } : r))
        );
        showNotice(`Colaborador ${!recipient.active ? 'ativado' : 'desativado'}.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete recipient
  const handleDeleteRecipient = async (id: string, name: string) => {
    if (!window.confirm(`Deseja realmente excluir "${name}" da lista de colaboradores?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/recipients/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        setRecipients((prev) => prev.filter((r) => r.id !== id));
        showNotice('Colaborador removido da lista.');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sort recipients for the dropdown alphabetically
  const sortedRecipientsForDropdown = useMemo(() => {
    return [...(recipients || [])].sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '', 'pt-BR'));
  }, [recipients]);

  const handleSelectDropdownRec = (id: string) => {
    setSelectedDropdownRecId(id);
    if (id === 'new') {
      setDropdownName('');
      setDropdownEmail('');
      setDropdownOperation('Stone SCL');
      setDropdownRole('');
      setDropdownActive(true);
    } else {
      const found = recipients.find((r) => r.id === id);
      if (found) {
        setDropdownName(found.full_name);
        setDropdownEmail(found.email || '');
        setDropdownOperation(found.operation || 'Stone SCL');
        setDropdownRole(found.role || '');
        setDropdownActive(found.active);
      }
    }
  };

  const handleSaveDropdownCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dropdownName.trim()) {
      showNotice('O nome do colaborador é obrigatório.');
      return;
    }
    if (!dropdownEmail.trim()) {
      showNotice('O e-mail do colaborador é obrigatório para o login restrito.');
      return;
    }
    setIsSavingDropdown(true);
    try {
      if (selectedDropdownRecId === 'new') {
        const res = await fetch('/api/admin/recipients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            full_name: dropdownName.trim(),
            email: dropdownEmail.trim(),
            operation: dropdownOperation.trim() || 'Stone SCL',
            role: dropdownRole.trim() || undefined,
            active: dropdownActive,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar colaborador.');
        showNotice(`Colaborador(a) "${dropdownName}" cadastrado(a) com sucesso!`);
        if (data.recipient?.id) {
          setSelectedDropdownRecId(data.recipient.id);
        }
      } else {
        const res = await fetch(`/api/admin/recipients/${selectedDropdownRecId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            full_name: dropdownName.trim(),
            email: dropdownEmail.trim(),
            operation: dropdownOperation.trim() || 'Stone SCL',
            role: dropdownRole.trim() || undefined,
            active: dropdownActive,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao atualizar dados.');
        showNotice(`Colaborador(a) "${dropdownName}" atualizado(a) com sucesso!`);
      }
      fetchData();
    } catch (err: any) {
      showNotice(err.message || 'Erro ao salvar colaborador.');
    } finally {
      setIsSavingDropdown(false);
    }
  };

  const handleDeleteDropdownCollaborator = async () => {
    if (selectedDropdownRecId === 'new') return;
    if (!window.confirm(`Deseja realmente remover "${dropdownName}" do sistema?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/recipients/${selectedDropdownRecId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error('Erro ao excluir colaborador.');
      showNotice(`Colaborador(a) removido(a) com sucesso.`);
      handleSelectDropdownRec('new');
      fetchData();
    } catch (err: any) {
      showNotice(err.message || 'Erro ao excluir.');
    }
  };

  // Import CSV handler
  const handleImportCsv = async (csvText: string) => {
    const res = await fetch('/api/admin/recipients/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ csv: csvText }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro na importação.');
    fetchData();
    return data;
  };

  // Import raw list handler (Google Forms style)
  const handleImportList = async (rawText: string, operation?: string) => {
    const res = await fetch('/api/admin/recipients/import-list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ rawText, operation }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro na importação da lista.');
    showNotice(`${data.added} colaboradores adicionados à lista suspensa com sucesso!`);
    fetchData();
    return data;
  };

  // Clear all platform data (wipe simulation / test records)
  const handleClearAllData = async () => {
    if (
      !window.confirm(
        'Tem certeza de que deseja zerar a plataforma? Todas as mensagens e destinatários atuais serão apagados para que você possa inserir os dados oficiais.'
      )
    ) {
      return;
    }
    try {
      const res = await fetch('/api/admin/clear-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ target: 'all' }),
      });
      if (res.ok) {
        showNotice('Plataforma totalmente zerada com sucesso!');
        fetchData();
      }
    } catch (err) {
      console.error('Error clearing data:', err);
    }
  };

  // Filtered messages
  const filteredMessages = useMemo(() => {
    return (messages || []).filter((m) => {
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      const matchesOp = operationFilter === 'all' || m.operation === operationFilter;
      const matchesCat = categoryFilter === 'all' || m.category === categoryFilter;
      const matchesRec = recipientFilter === 'all' || m.recipient_id === recipientFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.recipient_name.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q) ||
        m.operation.toLowerCase().includes(q);

      return matchesStatus && matchesOp && matchesCat && matchesRec && matchesSearch;
    });
  }, [messages, statusFilter, operationFilter, categoryFilter, recipientFilter, searchQuery]);

  // Delivery queue (pending messages prioritized)
  const deliveryQueue = useMemo(() => {
    return (messages || []).filter((m) => m.status === 'pending');
  }, [messages]);

  // Filtered recipients
  const filteredRecipients = useMemo(() => {
    return (recipients || []).filter((r) => {
      const matchesOp = recipientOpFilter === 'all' || r.operation === recipientOpFilter;
      const q = recipientSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.full_name.toLowerCase().includes(q) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        r.operation.toLowerCase().includes(q) ||
        (r.role && r.role.toLowerCase().includes(q));

      return matchesOp && matchesSearch;
    });
  }, [recipients, recipientOpFilter, recipientSearch]);

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-8 space-y-8">
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-900/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-['Outfit',sans-serif] font-extrabold text-2xl sm:text-3xl text-white">
              Painel de Gestão do RH
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#00D084]/20 text-[#00D084] border border-[#00D084]/40">
              Correio Verde 2026
            </span>
          </div>
          <p className="text-xs sm:text-sm text-emerald-300/80">
            Acompanhe entregas, modere mensagens e gerencie a lista de colaboradores das operações SCL.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            title="Atualizar dados"
            className="p-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleClearAllData}
            title="Zerar mensagens e destinatários para início com dados oficiais"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:text-amber-100 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/50 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Zerar Plataforma</span>
          </button>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-300 hover:text-white bg-red-950/40 hover:bg-red-900/50 border border-red-800/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair do RH</span>
          </button>
        </div>
      </div>

      {/* Action Toast Notification */}
      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-900/90 border border-[#00D084] text-white text-xs font-semibold flex items-center justify-between shadow-lg shadow-emerald-950/50 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00D084]" />
            <span>{actionNotice}</span>
          </div>
        </div>
      )}

      {/* Campaign Indicators / Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="rounded-2xl bg-[#092518] border border-emerald-800/50 p-4 space-y-1">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-medium">Total de Mensagens</span>
            <Inbox className="w-4 h-4 text-[#00D084]" />
          </div>
          <div className="text-2xl font-black text-white font-['Outfit',sans-serif]">
            {stats?.totalMessages ?? messages.length}
          </div>
          <div className="text-[11px] text-emerald-400/80">Recebidas no Correio</div>
        </div>

        <div className="rounded-2xl bg-[#092518] border border-emerald-800/50 p-4 space-y-1">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-medium">Fila Pendente</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 font-['Outfit',sans-serif]">
            {stats?.pendingMessages ?? deliveryQueue.length}
          </div>
          <div className="text-[11px] text-amber-400/80">Aguardando entrega</div>
        </div>

        <div className="rounded-2xl bg-[#092518] border border-emerald-800/50 p-4 space-y-1">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-medium">Entregues</span>
            <CheckCircle2 className="w-4 h-4 text-[#00D084]" />
          </div>
          <div className="text-2xl font-black text-[#00D084] font-['Outfit',sans-serif]">
            {stats?.deliveredMessages ?? 0}
          </div>
          <div className="text-[11px] text-emerald-400/80">Já repassadas</div>
        </div>

        <div className="rounded-2xl bg-[#092518] border border-emerald-800/50 p-4 space-y-1">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-medium">Colaboradores</span>
            <Users className="w-4 h-4 text-emerald-300" />
          </div>
          <div className="text-2xl font-black text-white font-['Outfit',sans-serif]">
            {stats?.totalRecipients ?? recipients.length}
          </div>
          <div className="text-[11px] text-emerald-400/80">Cadastrados no SCL</div>
        </div>

        <div className="rounded-2xl bg-[#092518] border border-emerald-800/50 p-4 space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-medium">Operações / Polos</span>
            <MapPin className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 font-['Outfit',sans-serif]">
            {stats?.operationsCount ?? 0}
          </div>
          <div className="text-[11px] text-emerald-400/80">Sertão, Cerrado e Litoral</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b border-emerald-800/60 pb-1">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <button
            id="tab-btn-delivery"
            onClick={() => setActiveTab('delivery')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
              activeTab === 'delivery'
                ? 'bg-[#00D084] text-[#061d12] shadow-sm'
                : 'text-emerald-300 hover:text-white hover:bg-emerald-950/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Fila de Entrega</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'delivery'
                  ? 'bg-[#061d12] text-[#00D084]'
                  : 'bg-emerald-950 text-amber-300 border border-emerald-800'
              }`}
            >
              {deliveryQueue.length}
            </span>
          </button>

          <button
            id="tab-btn-messages"
            onClick={() => setActiveTab('messages')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
              activeTab === 'messages'
                ? 'bg-[#00D084] text-[#061d12] shadow-sm'
                : 'text-emerald-300 hover:text-white hover:bg-emerald-950/60'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Todas as Mensagens</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'messages'
                  ? 'bg-[#061d12] text-[#00D084]'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {messages.length}
            </span>
          </button>

          <button
            id="tab-btn-recipients"
            onClick={() => setActiveTab('recipients')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
              activeTab === 'recipients'
                ? 'bg-[#00D084] text-[#061d12] shadow-sm'
                : 'text-emerald-300 hover:text-white hover:bg-emerald-950/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Colaboradores (Lista Suspensa)</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'recipients'
                  ? 'bg-[#061d12] text-[#00D084]'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {recipients.length}
            </span>
          </button>
        </div>

        {activeTab === 'messages' && (
          <button
            onClick={handleExportCsv}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-200 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 transition-colors"
          >
            <Download className="w-4 h-4 text-[#00D084]" />
            <span>Exportar CSV</span>
          </button>
        )}
      </div>

      {/* ==================== TAB 1: WORKFLOW DE ENTREGA ==================== */}
      {activeTab === 'delivery' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#092518] border border-emerald-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-['Outfit',sans-serif] font-bold text-white text-base">
                Fluxo de Entrega do RH
              </h3>
              <p className="text-xs text-emerald-300">
                Visualize as mensagens pendentes, imprima ou envie o cartão ao colaborador e marque como entregue.
              </p>
            </div>
            <div className="text-xs text-emerald-400 font-medium">
              {deliveryQueue.length} mensagens aguardando entrega
            </div>
          </div>

          {deliveryQueue.length === 0 ? (
            <div className="text-center py-16 rounded-3xl bg-[#092518] border border-emerald-800/40 p-6 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center mx-auto text-[#00D084]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-['Outfit',sans-serif] text-lg font-bold text-white">
                Todas as mensagens foram entregues!
              </h4>
              <p className="text-xs text-emerald-300 max-w-sm mx-auto">
                Não há mensagens pendentes no momento. Novas mensagens aparecerão aqui automaticamente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deliveryQueue.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-[#092518] border border-emerald-800/60 p-5 space-y-4 shadow-lg hover:border-emerald-700 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header info */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold">
                          Destinatário:
                        </span>
                        <h4 className="font-bold text-white text-base leading-tight">
                          {item.recipient_name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-emerald-300/80 pt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-400" />
                            <span>{item.operation}</span>
                          </span>
                          {item.recipient_role && <span>• {item.recipient_role}</span>}
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        Pendente
                      </span>
                    </div>

                    {item.category && (
                      <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-900/60 text-emerald-200 border border-emerald-700/50">
                        {item.category}
                      </span>
                    )}

                    {/* Message body */}
                    <blockquote className="p-3.5 rounded-xl bg-[#05180f] border border-emerald-900/60 text-sm text-emerald-100 italic leading-relaxed font-serif">
                      "{item.message}"
                    </blockquote>

                    <div className="text-[11px] text-emerald-400/70">
                      Recebida em: {new Date(item.created_at).toLocaleString('pt-BR')}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-emerald-900/60 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setPrintCardMessage(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-200 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ver / Imprimir Cartão</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(item.id, 'delivered')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#061d12] bg-[#00D084] hover:bg-[#02de7a] transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Marcar como entregue</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 2: TODAS AS MENSAGENS ==================== */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="rounded-2xl bg-[#092518] border border-emerald-800/40 p-4 space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-emerald-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por colaborador ou texto..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#05180f] border border-emerald-700/60 text-xs text-white placeholder-emerald-600 focus:outline-none focus:border-[#00D084]"
                />
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#05180f] border border-emerald-700/60 text-xs text-white focus:outline-none focus:border-[#00D084]"
              >
                <option value="all">Todos os Status</option>
                <option value="pending">Pendentes</option>
                <option value="delivered">Entregues</option>
                <option value="archived">Arquivadas</option>
              </select>

              {/* Operation filter */}
              <select
                value={operationFilter}
                onChange={(e) => setOperationFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#05180f] border border-emerald-700/60 text-xs text-white focus:outline-none focus:border-[#00D084]"
              >
                <option value="all">Todas as Operações</option>
                {STONE_OPERATIONS.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>

              {/* Category filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#05180f] border border-emerald-700/60 text-xs text-white focus:outline-none focus:border-[#00D084]"
              >
                <option value="all">Todas as Categorias</option>
                {MESSAGE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between text-xs text-emerald-300/80 pt-1">
              <span>{filteredMessages.length} mensagem(ns) encontrada(s)</span>
              <button
                onClick={handleExportCsv}
                className="sm:hidden text-xs text-[#00D084] underline"
              >
                Baixar CSV
              </button>
            </div>
          </div>

          {/* Messages list */}
          {filteredMessages.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-[#092518] border border-emerald-800/40 p-6 text-emerald-300">
              Nenhuma mensagem encontrada para os filtros selecionados.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="rounded-2xl bg-[#092518] border border-emerald-800/50 p-4 sm:p-5 space-y-3 shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm sm:text-base">
                          Para: {msg.recipient_name}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-200 border border-emerald-800 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-amber-400" />
                          {msg.operation}
                        </span>
                        {msg.category && (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                            {msg.category}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-emerald-400/70">
                        {new Date(msg.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    {/* Status badge */}
                    <span
                      className={`self-start sm:self-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        msg.status === 'delivered'
                          ? 'bg-[#00D084]/20 text-[#00D084] border border-[#00D084]/40'
                          : msg.status === 'archived'
                          ? 'bg-stone-800 text-stone-300 border border-stone-700'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {msg.status === 'delivered'
                        ? 'Entregue'
                        : msg.status === 'archived'
                        ? 'Arquivada'
                        : 'Pendente'}
                    </span>
                  </div>

                  <blockquote className="p-3.5 rounded-xl bg-[#05180f] border border-emerald-900/60 text-xs sm:text-sm text-emerald-100 italic leading-relaxed">
                    "{msg.message}"
                  </blockquote>

                  {/* Message Action Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-900/50 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPrintCardMessage(msg)}
                        className="inline-flex items-center gap-1 text-emerald-300 hover:text-white underline"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Imprimir Cartão</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {msg.status !== 'delivered' && (
                        <button
                          onClick={() => handleUpdateStatus(msg.id, 'delivered')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-950 text-[#00D084] border border-emerald-700/50 hover:bg-emerald-900"
                        >
                          Marcar como Entregue
                        </button>
                      )}
                      {msg.status !== 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(msg.id, 'pending')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-950 text-amber-300 border border-emerald-700/50 hover:bg-emerald-900"
                        >
                          Tornar Pendente
                        </button>
                      )}
                      {msg.status !== 'archived' && (
                        <button
                          onClick={() => handleUpdateStatus(msg.id, 'archived')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-700/50 hover:bg-emerald-900"
                        >
                          Arquivar
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="p-1 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors"
                        title="Remover mensagem inadequada"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 3: GESTÃO DE DESTINATÁRIOS ==================== */}
      {activeTab === 'recipients' && (
        <div className="space-y-5">
          {/* =========================================================
              GESTOR DE COLABORADORES POR LISTA SUSPENSA (NOME & E-MAIL)
             ========================================================= */}
          <div className="rounded-3xl bg-[#092518] border-2 border-emerald-500/80 p-5 sm:p-7 space-y-4 shadow-xl shadow-black/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-800/60 pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-['Outfit',sans-serif] font-black text-white text-lg sm:text-xl flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#00D084]" />
                    <span>Cadastro & Edição por Lista Suspensa</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-[#00D084]/20 text-[#00D084] border border-[#00D084]/40">
                    Acesso Restrito RH
                  </span>
                </div>
                <p className="text-xs text-emerald-300/85 pt-1">
                  Selecione qualquer colaborador na lista suspensa para editar ou escolha "Cadastrar Novo" para adicionar nome e e-mail corporativo.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-dropdown-new-collab"
                  onClick={() => handleSelectDropdownRec('new')}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#061d12] bg-[#00D084] hover:bg-[#02de7a] transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Novo</span>
                </button>
              </div>
            </div>

            {/* The Dropdown selector */}
            <div className="space-y-1.5">
              <label
                htmlFor="rh-collaborator-dropdown-select"
                className="text-xs font-bold text-emerald-200 flex items-center justify-between"
              >
                <span>Lista suspensa de colaboradores ({recipients.length} cadastrados):</span>
                <span className="text-[11px] text-emerald-400 font-normal">
                  {selectedDropdownRecId === 'new' ? 'Modo: Novo Cadastro' : 'Modo: Editando Colaborador'}
                </span>
              </label>
              <select
                id="rh-collaborator-dropdown-select"
                value={selectedDropdownRecId}
                onChange={(e) => handleSelectDropdownRec(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-[#05180f] border-2 border-emerald-500/80 text-white text-sm font-medium focus:outline-none focus:border-[#00D084] focus:ring-2 focus:ring-[#00D084]/20 shadow-xs cursor-pointer"
              >
                <option value="new">➕ [Cadastrar Novo Colaborador — Adicionar Nome e E-mail]</option>
                {sortedRecipientsForDropdown.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.full_name} • {r.email || 'Sem e-mail'} • {r.operation} {r.role ? `(${r.role})` : ''} {!r.active ? '⛔ [Inativo]' : '✅'}
                  </option>
                ))}
              </select>
            </div>

            {/* Inline Form */}
            <form onSubmit={handleSaveDropdownCollaborator} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {/* Nome Completo */}
                <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                  <label className="text-xs font-semibold text-emerald-300">
                    Nome Completo *
                  </label>
                  <input
                    id="input-dropdown-name"
                    type="text"
                    required
                    placeholder="Ex: Maria Souza"
                    value={dropdownName}
                    onChange={(e) => setDropdownName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#05180f] border border-emerald-700 text-sm text-white placeholder-emerald-700 focus:outline-none focus:border-[#00D084]"
                  />
                </div>

                {/* Email Corporativo */}
                <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                  <label className="text-xs font-semibold text-emerald-300">
                    E-mail Corporativo (@querostone.com.br) *
                  </label>
                  <input
                    id="input-dropdown-email"
                    type="email"
                    required
                    placeholder="maria.souza@querostone.com.br"
                    value={dropdownEmail}
                    onChange={(e) => setDropdownEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#05180f] border border-emerald-700 text-sm text-white placeholder-emerald-700 focus:outline-none focus:border-[#00D084]"
                  />
                </div>

                {/* Operação / Polo */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-emerald-300">
                    Operação / Polo SCL *
                  </label>
                  <input
                    id="input-dropdown-op"
                    type="text"
                    required
                    list="rh-operations-datalist"
                    placeholder="Ex: Polo Juazeiro do Norte"
                    value={dropdownOperation}
                    onChange={(e) => setDropdownOperation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#05180f] border border-emerald-700 text-sm text-white placeholder-emerald-700 focus:outline-none focus:border-[#00D084]"
                  />
                  <datalist id="rh-operations-datalist">
                    {STONE_OPERATIONS.map((op) => (
                      <option key={op} value={op} />
                    ))}
                  </datalist>
                </div>

                {/* Cargo / Função (Opcional) */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-emerald-300">
                    Cargo / Função (Opcional)
                  </label>
                  <input
                    id="input-dropdown-role"
                    type="text"
                    placeholder="Ex: Agente Stone, Consultor(a)..."
                    value={dropdownRole}
                    onChange={(e) => setDropdownRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#05180f] border border-emerald-700 text-sm text-white placeholder-emerald-700 focus:outline-none focus:border-[#00D084]"
                  />
                </div>

                {/* Status Ativo */}
                <div className="space-y-1 flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#05180f] border border-emerald-700 text-xs text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={dropdownActive}
                      onChange={(e) => setDropdownActive(e.target.checked)}
                      className="w-4 h-4 accent-[#00D084]"
                    />
                    <span>Ativo (aparece no Correio Verde)</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-800/40">
                <div className="text-xs text-emerald-400">
                  {selectedDropdownRecId === 'new' ? (
                    <span>Preencha os campos para cadastrar um novo colaborador</span>
                  ) : (
                    <span>Alterando dados do colaborador selecionado</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {selectedDropdownRecId !== 'new' && (
                    <button
                      type="button"
                      id="btn-dropdown-delete-collab"
                      onClick={handleDeleteDropdownCollaborator}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-red-300 hover:text-white bg-red-950/60 hover:bg-red-900 border border-red-800 transition-colors cursor-pointer"
                    >
                      Excluir
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSelectDropdownRec('new')}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 transition-colors cursor-pointer"
                  >
                    Limpar
                  </button>

                  <button
                    type="submit"
                    id="btn-dropdown-save-collab"
                    disabled={isSavingDropdown}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-[#061d12] bg-[#00D084] hover:bg-[#02de7a] transition-all cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isSavingDropdown ? (
                      <div className="w-3.5 h-3.5 border-2 border-[#061d12] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {selectedDropdownRecId === 'new'
                        ? 'Salvar Novo Colaborador'
                        : 'Atualizar Dados do Colaborador'}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Existing Management Card Header */}
          <div className="rounded-2xl bg-[#092518] border border-emerald-800/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-['Outfit',sans-serif] font-bold text-white text-base">
                Tabela Geral de Colaboradores (Destinatários)
              </h3>
              <p className="text-xs text-emerald-300">
                Visualize todos os colaboradores, filtre por polo ou importe listas em massa.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsListImportOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#061d12] bg-[#00D084] hover:bg-[#02de7a] transition-colors cursor-pointer shadow-md shadow-[#00D084]/20"
                title="Adicionar colaboradores colando lista simples de nomes, como no Google Forms (sem necessidade de polo)"
              >
                <ListPlus className="w-4 h-4" />
                <span>Colar Lista (Google Forms)</span>
              </button>

              <button
                onClick={() => setIsCsvImportOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-200 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 transition-colors"
              >
                <Upload className="w-4 h-4 text-[#00D084]" />
                <span>Importar CSV</span>
              </button>

              <button
                onClick={() => {
                  setEditingRecipient(null);
                  setIsAddRecipientOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-200 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Novo(a) Individual</span>
              </button>
            </div>
          </div>

          {/* Search & Operation Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-emerald-400" />
              <input
                type="text"
                value={recipientSearch}
                onChange={(e) => setRecipientSearch(e.target.value)}
                placeholder="Buscar por nome, polo ou cargo..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#05180f] border border-emerald-700/60 text-xs text-white placeholder-emerald-600 focus:outline-none focus:border-[#00D084]"
              />
            </div>

            <select
              value={recipientOpFilter}
              onChange={(e) => setRecipientOpFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#05180f] border border-emerald-700/60 text-xs text-white focus:outline-none focus:border-[#00D084]"
            >
              <option value="all">Todas as Operações ({recipients.length})</option>
              {STONE_OPERATIONS.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </div>

          {/* Recipients Table */}
          <div className="rounded-2xl bg-[#092518] border border-emerald-800/50 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#061d12] text-emerald-300 font-semibold border-b border-emerald-800/60">
                  <tr>
                    <th className="px-4 py-3">Nome do Colaborador</th>
                    <th className="px-4 py-3">E-mail corporativo</th>
                    <th className="px-4 py-3">Operação / Polo</th>
                    <th className="px-4 py-3">Cargo / Função</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/40 text-emerald-100">
                  {filteredRecipients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="max-w-md mx-auto space-y-2">
                          <Users className="w-8 h-8 text-emerald-400 mx-auto opacity-70" />
                          <p className="text-sm font-semibold text-white">
                            {recipients.length === 0
                              ? 'Nenhum colaborador cadastrado ainda'
                              : 'Nenhum colaborador encontrado com esse filtro'}
                          </p>
                          <p className="text-xs text-emerald-300/80">
                            {recipients.length === 0
                              ? 'A plataforma está pronta. Adicione os colaboradores usando o botão "Colar Lista (Google Forms)", cadastrando individualmente ou por CSV.'
                              : 'Tente alterar os termos de busca ou selecionar outra operação.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRecipients.map((rec) => (
                      <tr key={rec.id} className="hover:bg-emerald-950/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-white">
                          {rec.full_name}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-emerald-300/90">
                          {rec.email || '—'}
                        </td>
                        <td className="px-4 py-3">
                          {rec.operation && rec.operation !== 'Stone SCL' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-300">
                              <MapPin className="w-3 h-3 text-amber-400" />
                              {rec.operation}
                            </span>
                          ) : (
                            <span className="text-emerald-400/60 text-[11px]">
                              Geral SCL
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-emerald-300/80">
                          {rec.role || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleRecipientActive(rec)}
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${
                              rec.active
                                ? 'bg-[#00D084]/20 text-[#00D084] border-[#00D084]/40'
                                : 'bg-stone-800 text-stone-400 border-stone-700'
                            }`}
                          >
                            {rec.active ? 'Ativo' : 'Inativo'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingRecipient(rec);
                                setIsAddRecipientOpen(true);
                              }}
                              className="p-1 rounded text-emerald-300 hover:text-white hover:bg-emerald-900"
                              title="Editar colaborador"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRecipient(rec.id, rec.full_name)}
                              className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-950/40"
                              title="Excluir da lista"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Printable Card Modal */}
      {printCardMessage && (
        <PrintableMessageCard
          message={printCardMessage}
          onClose={() => setPrintCardMessage(null)}
        />
      )}

      {/* Recipient Add/Edit Modal */}
      <RecipientFormModal
        isOpen={isAddRecipientOpen}
        initialData={editingRecipient}
        onClose={() => {
          setIsAddRecipientOpen(false);
          setEditingRecipient(null);
        }}
        onSave={handleSaveRecipient}
      />

      {/* List Import Modal (Google Forms style) */}
      <ListImportModal
        isOpen={isListImportOpen}
        onClose={() => setIsListImportOpen(false)}
        onImportList={handleImportList}
      />

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isCsvImportOpen}
        onClose={() => setIsCsvImportOpen(false)}
        onImport={handleImportCsv}
      />
    </div>
  );
};
