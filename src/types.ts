export type StoneOperation =
  | 'Apodi'
  | 'João Câmara'
  | 'Limoeiro do Norte'
  | 'Macau'
  | 'Paracatu'
  | 'Parelhas'
  | 'Patos'
  | 'Trairi';

export const STONE_OPERATIONS: StoneOperation[] = [
  'Apodi',
  'João Câmara',
  'Limoeiro do Norte',
  'Macau',
  'Paracatu',
  'Parelhas',
  'Patos',
  'Trairi',
];

export type MessageCategory =
  | 'Obrigado(a)'
  | 'Reconhecimento'
  | 'Carinho'
  | 'Incentivo'
  | 'Parceria'
  | 'Você faz a diferença';

export const MESSAGE_CATEGORIES: MessageCategory[] = [
  'Obrigado(a)',
  'Reconhecimento',
  'Carinho',
  'Incentivo',
  'Parceria',
  'Você faz a diferença',
];

export const MESSAGE_SUGGESTIONS = [
  'Obrigado por sempre estar disposto(a) a ajudar.',
  'Seu jeito de fazer as coisas inspira quem está por perto.',
  'Você faz parte do que torna o SCL especial.',
  'Que bom poder contar com você nessa jornada.',
  'Seu trabalho faz diferença, mesmo quando nem sempre é dito.',
];

export type MessageStatus = 'pending' | 'delivered' | 'archived';

export const RH_ADMIN_EMAIL = 'aysla.mendes@querostone.com.br';

export function isRHAdmin(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return clean === 'aysla.mendes@querostone.com.br' || clean === 'aysla.mendes@querostone.com';
}

export interface ReactionEmoji {
  emoji: string;
  label: string;
}

export const REACTION_EMOJIS: ReactionEmoji[] = [
  { emoji: '💛', label: 'Setembro Amarelo' },
  { emoji: '💚', label: 'Orgulho Stone' },
  { emoji: '⭐', label: 'Você Brilha' },
  { emoji: '👏', label: 'Parabéns' },
  { emoji: '🚀', label: 'Voando Alto' },
  { emoji: '💪', label: 'Tamo Junto' },
  { emoji: '🙌', label: 'Gratidão' },
  { emoji: '✨', label: 'Inspiração' },
  { emoji: '🤗', label: 'Abraço' },
  { emoji: '☕', label: 'Parceria' },
  { emoji: '🎯', label: 'No Alvo' },
  { emoji: '🔥', label: 'Mandou Bem' },
  { emoji: '🌟', label: 'Show de Bola' },
  { emoji: '💡', label: 'Genial' },
  { emoji: '🏆', label: 'Campeão(ã)' },
  { emoji: '🍀', label: 'Boa Sorte' },
];

export interface MessageColorTheme {
  id: string;
  name: string;
  previewColor: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  accentClass: string;
  ribbonTone: string;
}

export const MESSAGE_COLOR_THEMES: MessageColorTheme[] = [
  {
    id: 'emerald',
    name: 'Verde Stone',
    previewColor: '#00A868',
    bgClass: 'bg-[#F2FBF6]',
    borderClass: 'border-[#00A868]',
    textClass: 'text-[#063820]',
    accentClass: 'bg-[#00A868] text-white',
    ribbonTone: '#00A868',
  },
  {
    id: 'amber',
    name: 'Amarelo Acolhimento',
    previewColor: '#F59E0B',
    bgClass: 'bg-[#FEFCE8]',
    borderClass: 'border-[#F59E0B]',
    textClass: 'text-[#713F12]',
    accentClass: 'bg-[#F59E0B] text-amber-950',
    ribbonTone: '#F59E0B',
  },
  {
    id: 'blue',
    name: 'Azul Confiança',
    previewColor: '#2563EB',
    bgClass: 'bg-[#EFF6FF]',
    borderClass: 'border-[#3B82F6]',
    textClass: 'text-[#1E3A8A]',
    accentClass: 'bg-[#2563EB] text-white',
    ribbonTone: '#2563EB',
  },
  {
    id: 'purple',
    name: 'Lilás Parceria',
    previewColor: '#8B5CF6',
    bgClass: 'bg-[#F5F3FF]',
    borderClass: 'border-[#8B5CF6]',
    textClass: 'text-[#4C1D95]',
    accentClass: 'bg-[#8B5CF6] text-white',
    ribbonTone: '#8B5CF6',
  },
  {
    id: 'rose',
    name: 'Rosa Gratidão',
    previewColor: '#EC4899',
    bgClass: 'bg-[#FDF2F8]',
    borderClass: 'border-[#EC4899]',
    textClass: 'text-[#831843]',
    accentClass: 'bg-[#EC4899] text-white',
    ribbonTone: '#EC4899',
  },
  {
    id: 'coral',
    name: 'Coral Energia',
    previewColor: '#F97316',
    bgClass: 'bg-[#FFF7ED]',
    borderClass: 'border-[#F97316]',
    textClass: 'text-[#7C2D12]',
    accentClass: 'bg-[#F97316] text-white',
    ribbonTone: '#F97316',
  },
  {
    id: 'teal',
    name: 'Turquesa Serenidade',
    previewColor: '#14B8A6',
    bgClass: 'bg-[#F0FDFA]',
    borderClass: 'border-[#14B8A6]',
    textClass: 'text-[#134E4A]',
    accentClass: 'bg-[#14B8A6] text-white',
    ribbonTone: '#14B8A6',
  },
  {
    id: 'mint',
    name: 'Menta Frescor',
    previewColor: '#10B981',
    bgClass: 'bg-[#ECFDF5]',
    borderClass: 'border-[#10B981]',
    textClass: 'text-[#064E3B]',
    accentClass: 'bg-[#10B981] text-white',
    ribbonTone: '#10B981',
  },
  {
    id: 'indigo',
    name: 'Índigo Conexão',
    previewColor: '#6366F1',
    bgClass: 'bg-[#EEF2FF]',
    borderClass: 'border-[#6366F1]',
    textClass: 'text-[#312E81]',
    accentClass: 'bg-[#6366F1] text-white',
    ribbonTone: '#6366F1',
  },
  {
    id: 'gold',
    name: 'Âmbar Solar',
    previewColor: '#D97706',
    bgClass: 'bg-[#FFFBEB]',
    borderClass: 'border-[#D97706]',
    textClass: 'text-[#78350F]',
    accentClass: 'bg-[#D97706] text-amber-950',
    ribbonTone: '#D97706',
  },
  {
    id: 'cyan',
    name: 'Céu de Verão',
    previewColor: '#0284C7',
    bgClass: 'bg-[#F0F9FF]',
    borderClass: 'border-[#0284C7]',
    textClass: 'text-[#0C4A6E]',
    accentClass: 'bg-[#0284C7] text-white',
    ribbonTone: '#0284C7',
  },
  {
    id: 'wine',
    name: 'Framboesa Nobre',
    previewColor: '#BE185D',
    bgClass: 'bg-[#FDF2F8]',
    borderClass: 'border-[#BE185D]',
    textClass: 'text-[#831843]',
    accentClass: 'bg-[#BE185D] text-white',
    ribbonTone: '#BE185D',
  },
];

export interface Collaborator {
  id: string;
  full_name: string;
  email: string;
  operation: string;
  role?: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type Recipient = Collaborator;

export interface PublicRecipient {
  id: string;
  full_name: string;
  email?: string;
  operation: string;
  role?: string;
}

export interface CollaboratorProfile {
  id: string;
  full_name: string;
  first_name: string;
  email: string;
  operation: string;
  role?: string;
  active: boolean;
  is_admin?: boolean;
  unread_count?: number;
  received_count?: number;
}

export interface CollaboratorSession {
  token: string;
  collaborator: CollaboratorProfile;
  admin_token?: string;
}

export interface InboxMessage {
  id: string;
  category?: string;
  message: string;
  reaction?: string;
  color_theme?: string;
  gif_url?: string;
  recipient_reaction?: string | null;
  thank_you_note?: string | null;
  thank_you_at?: string | null;
  created_at: string;
  read_at?: string | null;
  archived_at?: string | null;
  status: MessageStatus;
}

export interface CollaboratorInboxSummary {
  totalMessages: number;
  unreadMessages: number;
}

export interface InAppNotification {
  id: string;
  collaborator_id: string;
  message_id: string;
  text: string;
  read_at?: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id?: string; // stored privately for RH audit/security
  sender_name?: string; // RH audit only
  sender_email?: string; // RH audit only
  recipient_id: string;
  recipient_name: string;
  recipient_email?: string;
  operation: string;
  recipient_role?: string;
  message: string;
  category?: string;
  reaction?: string;
  color_theme?: string;
  gif_url?: string;
  recipient_reaction?: string | null;
  thank_you_note?: string | null;
  thank_you_at?: string | null;
  created_at: string;
  read_at?: string | null;
  archived_at?: string | null;
  deleted_by_recipient?: boolean;
  status: MessageStatus;
}

export interface CreateMessagePayload {
  recipient_id: string;
  message: string;
  category?: string;
  reaction?: string;
  color_theme?: string;
  gif_url?: string;
  confirmedRespectful: boolean;
}

export interface CampaignStats {
  totalMessages: number;
  totalRecipients: number;
  operationsCount: number;
  deliveredMessages: number;
  pendingMessages: number;
  archivedMessages: number;
  byOperation: Record<string, { recipients: number; messages: number }>;
  byCategory: Record<string, number>;
}

export function getColorTheme(id?: string): MessageColorTheme {
  if (!id) return MESSAGE_COLOR_THEMES[0];
  const found = MESSAGE_COLOR_THEMES.find((t) => t.id === id);
  return found || MESSAGE_COLOR_THEMES[0];
}

