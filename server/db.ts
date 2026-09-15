import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Collaborator,
  Recipient,
  PublicRecipient,
  Message,
  InboxMessage,
  InAppNotification,
  CampaignStats,
  STONE_OPERATIONS,
  MessageStatus,
} from '../src/types';

interface DatabaseSchema {
  recipients: Collaborator[];
  messages: Message[];
  notifications: InAppNotification[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'correio_verde.json');

export function generateEmailFromName(name: string): string {
  const clean = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (clean.length === 0) return `colaborador_${crypto.randomUUID().slice(0, 4)}@querostone.com`;
  if (clean.length === 1) return `${clean[0]}@querostone.com`;
  return `${clean[0]}.${clean[clean.length - 1]}@querostone.com`;
}

export function normalizeEmail(email: string): string {
  let cleaned = email.trim().toLowerCase();
  if (!cleaned.includes('@')) {
    cleaned = `${cleaned}@querostone.com`;
  } else if (cleaned.endsWith('@querostone')) {
    cleaned = `${cleaned}.com`;
  }
  return cleaned;
}

class DBManager {
  private cache: DatabaseSchema | null = null;

  constructor() {
    this.ensureFile();
  }

  private ensureFile() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial: DatabaseSchema = {
        recipients: [],
        messages: [],
        notifications: [],
      };
      this.writeSync(initial);
      this.cache = initial;
    }
  }

  private readSync(): DatabaseSchema {
    if (this.cache) return this.cache;
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.cache = JSON.parse(raw);
        if (this.cache) {
          if (!Array.isArray(this.cache.notifications)) {
            this.cache.notifications = [];
          }
          let touched = false;

          // Always ensure Aysla Mendes (RH Admin) is seeded
          const RH_EMAIL = 'aysla.mendes@querostone.com.br';
          const hasAysla = this.cache.recipients.some(
            (r) => r.email.toLowerCase() === RH_EMAIL || r.email.toLowerCase() === 'aysla.mendes@querostone.com'
          );
          if (!hasAysla) {
            this.cache.recipients.unshift({
              id: 'collab-rh-aysla',
              full_name: 'Aysla Mendes',
              email: RH_EMAIL,
              operation: 'Stone SCL',
              role: 'Recursos Humanos / Gente e Gestão',
              active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            touched = true;
          }

          this.cache.recipients.forEach((r) => {
            if (!r.email) {
              r.email = generateEmailFromName(r.full_name);
              touched = true;
            } else {
              const norm = normalizeEmail(r.email);
              if (norm !== r.email) {
                r.email = norm;
                touched = true;
              }
            }
          });
          if (touched) {
            this.writeSync(this.cache);
          }
          return this.cache;
        }
      }
    } catch (err) {
      console.error('Error reading db file, regenerating defaults:', err);
    }
    const initial: DatabaseSchema = {
      recipients: [],
      messages: [],
      notifications: [],
    };
    this.writeSync(initial);
    this.cache = initial;
    return initial;
  }

  private writeSync(data: DatabaseSchema) {
    this.cache = data;
    try {
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Error writing db file:', err);
      // Fallback direct write
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    }
  }

  // ==================== COLLABORATOR / RECIPIENT OPERATIONS ====================

  public getPublicRecipients(excludeId?: string): PublicRecipient[] {
    const db = this.readSync();
    return db.recipients
      .filter((r) => r.active && (!excludeId || r.id !== excludeId))
      .sort((a, b) => a.full_name.localeCompare(b.full_name, 'pt-BR'))
      .map((r) => ({
        id: r.id,
        full_name: r.full_name,
        email: r.email,
        operation: r.operation,
        role: r.role,
      }));
  }

  public getAllRecipients(): Collaborator[] {
    const db = this.readSync();
    return [...db.recipients].sort((a, b) =>
      a.full_name.localeCompare(b.full_name, 'pt-BR')
    );
  }

  public getRecipientById(id: string): Collaborator | undefined {
    const db = this.readSync();
    return db.recipients.find((r) => r.id === id);
  }

  public findCollaboratorById(id: string): Collaborator | undefined {
    return this.getRecipientById(id);
  }

  public findCollaboratorByEmail(email: string): Collaborator | undefined {
    const db = this.readSync();
    const normalized = normalizeEmail(email);
    return db.recipients.find(
      (r) => normalizeEmail(r.email) === normalized
    );
  }

  public addRecipient(data: {
    full_name: string;
    email?: string;
    operation?: string;
    role?: string;
    active?: boolean;
  }): Collaborator {
    const db = this.readSync();
    const trimmedName = data.full_name.trim();
    const email = data.email && data.email.trim()
      ? normalizeEmail(data.email)
      : generateEmailFromName(trimmedName);

    const newRecipient: Collaborator = {
      id: `rec-${crypto.randomUUID().slice(0, 8)}`,
      full_name: trimmedName,
      email,
      operation: (data.operation || '').trim() || 'Stone SCL',
      role: data.role ? data.role.trim() : undefined,
      active: data.active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.recipients.push(newRecipient);
    this.writeSync(db);
    return newRecipient;
  }

  public updateRecipient(id: string, updates: Partial<Collaborator>): Collaborator | null {
    const db = this.readSync();
    const idx = db.recipients.findIndex((r) => r.id === id);
    if (idx === -1) return null;

    const current = db.recipients[idx];
    const updatedEmail = updates.email ? normalizeEmail(updates.email) : current.email;

    db.recipients[idx] = {
      ...current,
      ...updates,
      email: updatedEmail,
      id, // protect id
      updated_at: new Date().toISOString(),
    };
    this.writeSync(db);
    return db.recipients[idx];
  }

  public deleteRecipient(id: string): boolean {
    const db = this.readSync();
    const prevLen = db.recipients.length;
    db.recipients = db.recipients.filter((r) => r.id !== id);
    if (db.recipients.length !== prevLen) {
      this.writeSync(db);
      return true;
    }
    return false;
  }

  public importRecipientsFromCSV(csvContent: string): { added: number; errors: string[] } {
    const lines = csvContent.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return { added: 0, errors: ['Arquivo CSV vazio'] };

    let addedCount = 0;
    const errors: string[] = [];
    const db = this.readSync();

    // Determine delimiter (comma, semicolon, or tab)
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';

    const header = firstLine.toLowerCase();
    const startIndex =
      header.includes('nome') ||
      header.includes('name') ||
      header.includes('full_name') ||
      header.includes('email')
        ? 1
        : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      const cols = line.split(delimiter).map((c) => c.replace(/^["']|["']$/g, '').trim());

      let name = '';
      let email = '';
      let operation = 'Stone SCL';
      let role = '';
      let active = true;

      if (cols.length >= 2 && cols[1].includes('@')) {
        // Format: full_name, email, operation, role, active
        name = cols[0];
        email = cols[1];
        operation = cols[2] || 'Stone SCL';
        role = cols[3] || '';
        if (cols[4] !== undefined) {
          active = cols[4].toLowerCase() !== 'false' && cols[4] !== '0';
        }
      } else {
        // Fallback format: full_name, operation, role
        name = cols[0];
        operation = cols[1] || 'Stone SCL';
        role = cols[2] || '';
      }

      if (!name || name.length < 2) {
        errors.push(`Linha ${i + 1}: Nome inválido.`);
        continue;
      }

      const finalEmail = email ? normalizeEmail(email) : generateEmailFromName(name);

      db.recipients.push({
        id: `rec-${crypto.randomUUID().slice(0, 8)}`,
        full_name: name,
        email: finalEmail,
        operation: operation || 'Stone SCL',
        role: role || undefined,
        active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      addedCount++;
    }

    if (addedCount > 0) {
      this.writeSync(db);
    }
    return { added: addedCount, errors };
  }

  public importRecipientsFromList(rawText: string, defaultOperation?: string): { added: number; totalProcessed: number; errors: string[] } {
    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return { added: 0, totalProcessed: 0, errors: ['Nenhum nome inserido na lista.'] };

    let addedCount = 0;
    const errors: string[] = [];
    const db = this.readSync();
    const existingNames = new Set(db.recipients.map((r) => r.full_name.toLowerCase()));

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      // remove list prefixes like "1. ", "1 - ", "- ", "* ", "• "
      line = line.replace(/^(\d+[\.\-\)]\s*|[\-\*\•]\s*)/, '').trim();

      let name = line;
      let email = '';
      let operation = (defaultOperation || '').trim() || 'Stone SCL';
      let role: string | undefined = undefined;

      // Also support tab or semicolon or comma if pasted from a spreadsheet
      if (line.includes('\t') || line.includes(';') || (line.includes(',') && line.includes('@'))) {
        const sep = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
        const parts = line.split(sep).map((p) => p.replace(/^["']|["']$/g, '').trim());
        name = parts[0];
        if (parts[1] && parts[1].includes('@')) {
          email = parts[1];
          if (parts[2]) operation = parts[2];
          if (parts[3]) role = parts[3];
        } else {
          if (parts[1]) operation = parts[1];
          if (parts[2]) role = parts[2];
        }
      }

      if (!name || name.length < 2) {
        continue;
      }

      if (existingNames.has(name.toLowerCase())) {
        continue;
      }

      existingNames.add(name.toLowerCase());
      const finalEmail = email ? normalizeEmail(email) : generateEmailFromName(name);

      db.recipients.push({
        id: `rec-${crypto.randomUUID().slice(0, 8)}`,
        full_name: name,
        email: finalEmail,
        operation,
        role: role || undefined,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      addedCount++;
    }

    if (addedCount > 0) {
      this.writeSync(db);
    }
    return { added: addedCount, totalProcessed: lines.length, errors };
  }

  // ==================== COLLABORATOR INBOX & NOTIFICATIONS ====================

  /**
   * Returns messages addressed to the collaborator, STRIPPING any sender information to guarantee 100% anonymity.
   */
  public getCollaboratorInbox(collaboratorId: string): InboxMessage[] {
    const db = this.readSync();
    return db.messages
      .filter((m) => m.recipient_id === collaboratorId && !m.deleted_by_recipient)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((m) => ({
        id: m.id,
        category: m.category,
        message: m.message,
        reaction: m.reaction,
        color_theme: m.color_theme,
        gif_url: m.gif_url,
        recipient_reaction: m.recipient_reaction,
        thank_you_note: m.thank_you_note,
        thank_you_at: m.thank_you_at,
        created_at: m.created_at,
        read_at: m.read_at,
        archived_at: m.archived_at,
        status: m.status,
      }));
  }

  public reactToMessage(collaboratorId: string, messageId: string, reaction: string): boolean {
    const db = this.readSync();
    const msg = db.messages.find(
      (m) => m.id === messageId && m.recipient_id === collaboratorId
    );
    if (!msg) return false;

    msg.recipient_reaction = msg.recipient_reaction === reaction ? null : reaction;
    this.writeSync(db);
    return true;
  }

  public thankMessage(collaboratorId: string, messageId: string, note: string): { success: boolean; thank_you_note: string } {
    const db = this.readSync();
    const msg = db.messages.find(
      (m) => m.id === messageId && m.recipient_id === collaboratorId
    );
    if (!msg) throw new Error('Mensagem não encontrada.');

    const cleanNote = note.trim().slice(0, 300);
    msg.thank_you_note = cleanNote;
    msg.thank_you_at = new Date().toISOString();

    // Notify the sender if recorded anonymously
    if (msg.sender_id && msg.sender_id !== collaboratorId) {
      if (!Array.isArray(db.notifications)) {
        db.notifications = [];
      }
      db.notifications.unshift({
        id: `notif-${Date.now()}-${crypto.randomUUID().slice(0, 4)}`,
        collaborator_id: msg.sender_id,
        message_id: msg.id,
        text: `💛 Seu recado foi lido e o colega enviou um agradecimento: "${cleanNote}"`,
        read_at: null,
        created_at: new Date().toISOString(),
      });
    }

    this.writeSync(db);
    return { success: true, thank_you_note: cleanNote };
  }

  public getCollaboratorSummary(collaboratorId: string): { totalMessages: number; unreadMessages: number } {
    const db = this.readSync();
    const userMessages = db.messages.filter(
      (m) => m.recipient_id === collaboratorId && !m.deleted_by_recipient
    );
    const totalMessages = userMessages.length;
    const unreadMessages = userMessages.filter((m) => !m.read_at).length;
    return { totalMessages, unreadMessages };
  }

  public markMessageRead(collaboratorId: string, messageId: string, isRead: boolean): boolean {
    const db = this.readSync();
    const msg = db.messages.find(
      (m) => m.id === messageId && m.recipient_id === collaboratorId
    );
    if (!msg) return false;

    msg.read_at = isRead ? (msg.read_at || new Date().toISOString()) : null;
    if (isRead && msg.status === 'pending') {
      msg.status = 'delivered';
    }
    this.writeSync(db);
    return true;
  }

  public archiveMessageForRecipient(collaboratorId: string, messageId: string): boolean {
    const db = this.readSync();
    const msg = db.messages.find(
      (m) => m.id === messageId && m.recipient_id === collaboratorId
    );
    if (!msg) return false;

    // Hiding from recipient's view preserves the original message for RH audit
    msg.deleted_by_recipient = true;
    msg.archived_at = new Date().toISOString();
    this.writeSync(db);
    return true;
  }

  public getNotifications(collaboratorId: string): InAppNotification[] {
    const db = this.readSync();
    return (db.notifications || [])
      .filter((n) => n.collaborator_id === collaboratorId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public markNotificationsRead(collaboratorId: string): void {
    const db = this.readSync();
    let touched = false;
    (db.notifications || []).forEach((n) => {
      if (n.collaborator_id === collaboratorId && !n.read_at) {
        n.read_at = new Date().toISOString();
        touched = true;
      }
    });
    if (touched) {
      this.writeSync(db);
    }
  }

  // ==================== MESSAGE CREATION & ADMIN ====================

  public addMessage(payload: {
    sender_id?: string;
    sender_name?: string;
    sender_email?: string;
    recipient_id: string;
    message: string;
    category?: string;
    reaction?: string;
    color_theme?: string;
    gif_url?: string;
  }): Message {
    const db = this.readSync();
    const recipient = db.recipients.find((r) => r.id === payload.recipient_id);
    if (!recipient) {
      throw new Error('Destinatário não encontrado');
    }
    if (!recipient.active) {
      throw new Error('Destinatário inativo no momento');
    }

    if (payload.sender_id && payload.sender_id === recipient.id) {
      throw new Error('Você não pode enviar uma mensagem para si mesmo(a).');
    }

    const newMessage: Message = {
      id: `msg-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`,
      sender_id: payload.sender_id || undefined,
      sender_name: payload.sender_name || undefined,
      sender_email: payload.sender_email || undefined,
      recipient_id: recipient.id,
      recipient_name: recipient.full_name,
      recipient_email: recipient.email,
      operation: recipient.operation,
      recipient_role: recipient.role,
      message: payload.message.trim(),
      category: payload.category || undefined,
      reaction: payload.reaction || undefined,
      color_theme: payload.color_theme || undefined,
      gif_url: payload.gif_url || undefined,
      recipient_reaction: null,
      thank_you_note: null,
      thank_you_at: null,
      created_at: new Date().toISOString(),
      read_at: null,
      archived_at: null,
      deleted_by_recipient: false,
      status: 'pending',
    };

    db.messages.unshift(newMessage);

    // Create an in-app notification for the recipient
    if (!Array.isArray(db.notifications)) {
      db.notifications = [];
    }
    db.notifications.unshift({
      id: `notif-${Date.now()}-${crypto.randomUUID().slice(0, 4)}`,
      collaborator_id: recipient.id,
      message_id: newMessage.id,
      text: 'Você recebeu uma nova mensagem no Correio Verde. 💚',
      read_at: null,
      created_at: new Date().toISOString(),
    });

    this.writeSync(db);
    return newMessage;
  }

  public getMessages(filters?: {
    recipient_id?: string;
    operation?: string;
    category?: string;
    status?: string;
    search?: string;
  }): Message[] {
    const db = this.readSync();
    let list = [...db.messages];

    if (filters?.recipient_id) {
      list = list.filter((m) => m.recipient_id === filters.recipient_id);
    }
    if (filters?.operation && filters.operation !== 'all') {
      list = list.filter((m) => m.operation === filters.operation);
    }
    if (filters?.category && filters.category !== 'all') {
      list = list.filter((m) => m.category === filters.category);
    }
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((m) => m.status === filters.status);
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.recipient_name.toLowerCase().includes(q) ||
          (m.recipient_email && m.recipient_email.toLowerCase().includes(q)) ||
          m.operation.toLowerCase().includes(q) ||
          m.message.toLowerCase().includes(q)
      );
    }

    return list;
  }

  public updateMessageStatus(id: string, status: MessageStatus): Message | null {
    const db = this.readSync();
    const msg = db.messages.find((m) => m.id === id);
    if (!msg) return null;
    msg.status = status;
    this.writeSync(db);
    return msg;
  }

  public deleteMessage(id: string): boolean {
    const db = this.readSync();
    const prev = db.messages.length;
    db.messages = db.messages.filter((m) => m.id !== id);
    if (db.messages.length !== prev) {
      this.writeSync(db);
      return true;
    }
    return false;
  }

  public getStats(): CampaignStats {
    const db = this.readSync();
    const operationsSet = new Set<string>();
    const byOperation: Record<string, { recipients: number; messages: number }> = {};

    STONE_OPERATIONS.forEach((op) => {
      byOperation[op] = { recipients: 0, messages: 0 };
    });

    db.recipients.forEach((r) => {
      operationsSet.add(r.operation);
      if (!byOperation[r.operation]) {
        byOperation[r.operation] = { recipients: 0, messages: 0 };
      }
      byOperation[r.operation].recipients++;
    });

    const byCategory: Record<string, number> = {};
    let delivered = 0;
    let pending = 0;
    let archived = 0;

    db.messages.forEach((m) => {
      if (m.status === 'delivered') delivered++;
      else if (m.status === 'archived') archived++;
      else pending++;

      if (m.operation) {
        if (!byOperation[m.operation]) {
          byOperation[m.operation] = { recipients: 0, messages: 0 };
        }
        byOperation[m.operation].messages++;
      }

      if (m.category) {
        byCategory[m.category] = (byCategory[m.category] || 0) + 1;
      }
    });

    return {
      totalMessages: db.messages.length,
      totalRecipients: db.recipients.length,
      operationsCount: operationsSet.size,
      deliveredMessages: delivered,
      pendingMessages: pending,
      archivedMessages: archived,
      byOperation,
      byCategory,
    };
  }

  public exportMessagesCSV(): string {
    const db = this.readSync();
    const headers = [
      'ID',
      'Destinatário',
      'Email Destinatário',
      'Operação',
      'Cargo',
      'Categoria',
      'Reação Emoji',
      'Tema Cor',
      'Status',
      'Data e Hora',
      'Lida em',
      'Mensagem',
    ];
    const rows = db.messages.map((m) => [
      m.id,
      `"${m.recipient_name.replace(/"/g, '""')}"`,
      `"${(m.recipient_email || '').replace(/"/g, '""')}"`,
      `"${m.operation.replace(/"/g, '""')}"`,
      `"${(m.recipient_role || '').replace(/"/g, '""')}"`,
      `"${(m.category || 'Não informada').replace(/"/g, '""')}"`,
      `"${(m.reaction || '-').replace(/"/g, '""')}"`,
      `"${(m.color_theme || 'emerald').replace(/"/g, '""')}"`,
      m.status === 'delivered' ? 'Entregue' : m.status === 'archived' ? 'Arquivada' : 'Pendente',
      new Date(m.created_at).toLocaleString('pt-BR'),
      m.read_at ? new Date(m.read_at).toLocaleString('pt-BR') : 'Não lida',
      `"${m.message.replace(/"/g, '""')}"`,
    ]);

    return [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  }

  public clearAllData(): void {
    this.writeSync({
      recipients: [],
      messages: [],
      notifications: [],
    });
  }

  public clearMessages(): void {
    const db = this.readSync();
    this.writeSync({
      ...db,
      messages: [],
      notifications: [],
    });
  }

  public clearRecipients(): void {
    const db = this.readSync();
    this.writeSync({
      ...db,
      recipients: [],
      messages: [],
      notifications: [],
    });
  }
}

export const dbManager = new DBManager();
