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
  unread_count?: number;
  received_count?: number;
}

export interface CollaboratorSession {
  token: string;
  collaborator: CollaboratorProfile;
}

export interface InboxMessage {
  id: string;
  category?: string;
  message: string;
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
