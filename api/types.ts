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
  sender_id?: string;
  sender_name?: string;
  sender_email?: string;
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
