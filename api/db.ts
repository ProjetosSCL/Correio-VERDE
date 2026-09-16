import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import {
  Collaborator,
  PublicRecipient,
  Message,
  InboxMessage,
  InAppNotification,
  CampaignStats,
  STONE_OPERATIONS,
  MessageStatus,
} from './types';

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

function cleanForFirestore<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined) {
      result[key] = null;
    } else {
      result[key] = val;
    }
  }
  return result;
}

// Singleton Firebase Admin Firestore connection
let firestoreInstance: Firestore | null = null;
let firestoreChecked = false;

export function formatPrivateKey(rawKey: string): string {
  let key = rawKey.trim();
  // Strip surrounding quotes if present
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }

  // Handle base64 encoded private key if someone set it as base64 in environment variables
  if (!key.includes('-----BEGIN') && key.length > 80) {
    try {
      const decoded = Buffer.from(key, 'base64').toString('utf8');
      if (decoded.includes('-----BEGIN')) {
        key = decoded;
      }
    } catch {}
  }

  // Replace literal '\n' characters with actual newlines, and remove carriage returns '\r'
  key = key.replace(/\\n/g, '\n').replace(/\r/g, '').trim();

  // If the PEM header exists on one line with spaces instead of newlines
  if (key.includes('-----BEGIN PRIVATE KEY-----') && !key.includes('\n')) {
    key = key
      .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
      .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');
  }

  return key;
}

export function getFirestoreDb(): Firestore | null {
  if (firestoreChecked) return firestoreInstance;
  firestoreChecked = true;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    try {
      privateKey = formatPrivateKey(privateKey);

      if (!getApps().length) {
        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      }
      firestoreInstance = getFirestore();
      console.log(`[Firebase Firestore] Conectado com sucesso ao projeto: ${projectId}`);

      // Ensure Aysla Mendes (RH Admin) is created in Firestore if not already present
      ensureFirestoreDefaults(firestoreInstance).catch((err) => {
        console.error('[Firebase Firestore] Erro ao sincronizar administrador inicial:', err);
      });
    } catch (err) {
      console.error('[Firebase Firestore] Falha ao inicializar SDK Admin do Firebase:', err);
      firestoreInstance = null;
    }
  } else {
    console.log('[Database] Variáveis do Firebase Admin não detectadas. Utilizando armazenamento local JSON (data/correio_verde.json).');
  }

  return firestoreInstance;
}

async function ensureFirestoreDefaults(db: Firestore): Promise<void> {
  try {
    const ayslaRef = db.collection('recipients').doc('collab-rh-aysla');
    const ayslaDoc = await ayslaRef.get();
    if (!ayslaDoc.exists) {
      const now = new Date().toISOString();
      await ayslaRef.set({
        id: 'collab-rh-aysla',
        full_name: 'Aysla Mendes',
        email: 'aysla.mendes@querostone.com.br',
        operation: 'Stone SCL',
        role: 'Recursos Humanos / Gente e Gestão',
        active: true,
        created_at: now,
        updated_at: now,
      });
      console.log('[Firebase Firestore] Administradora Aysla Mendes (RH) registrada no Firestore.');
    }
  } catch (err) {
    console.error('[Firebase Firestore] Falha ao verificar registro inicial do RH:', err);
  }
}

class DBManager {
  private cache: DatabaseSchema | null = null;

  constructor() {
    this.ensureLocalFile();
  }

  // ==================== LOCAL FILE BACKUP UTILS ====================
  private ensureLocalFile() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (!fs.existsSync(DB_FILE)) {
        const initial: DatabaseSchema = {
          recipients: [
            {
              id: 'collab-rh-aysla',
              full_name: 'Aysla Mendes',
              email: 'aysla.mendes@querostone.com.br',
              operation: 'Stone SCL',
              role: 'Recursos Humanos / Gente e Gestão',
              active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          messages: [],
          notifications: [],
        };
        this.writeLocalSync(initial);
        this.cache = initial;
      }
    } catch (err) {
      // In read-only or serverless filesystem, keep in memory
      this.cache = {
        recipients: [
          {
            id: 'collab-rh-aysla',
            full_name: 'Aysla Mendes',
            email: 'aysla.mendes@querostone.com.br',
            operation: 'Stone SCL',
            role: 'Recursos Humanos / Gente e Gestão',
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        messages: [],
        notifications: [],
      };
    }
  }

  private readLocalSync(): DatabaseSchema {
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
            this.writeLocalSync(this.cache);
          }
          return this.cache;
        }
      }
    } catch (err) {
      console.error('Error reading local db file:', err);
    }
    const initial: DatabaseSchema = {
      recipients: [
        {
          id: 'collab-rh-aysla',
          full_name: 'Aysla Mendes',
          email: 'aysla.mendes@querostone.com.br',
          operation: 'Stone SCL',
          role: 'Recursos Humanos / Gente e Gestão',
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      messages: [],
      notifications: [],
    };
    this.writeLocalSync(initial);
    this.cache = initial;
    return initial;
  }

  private writeLocalSync(data: DatabaseSchema) {
    this.cache = data;
    try {
      if (fs.existsSync(DATA_DIR)) {
        const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
        fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
        fs.renameSync(tempPath, DB_FILE);
      }
    } catch (err) {
      // In serverless read-only contexts, memory cache holds the temporary state
    }
  }

  // ==================== COLLABORATOR / RECIPIENT OPERATIONS ====================

  public async getPublicRecipients(excludeId?: string): Promise<PublicRecipient[]> {
    const firestore = getFirestoreDb();
    if (firestore) {
      const snap = await firestore.collection('recipients').where('active', '==', true).get();
      return snap.docs
        .map((d) => d.data() as Collaborator)
        .filter((r) => !excludeId || r.id !== excludeId)
        .sort((a, b) => a.full_name.localeCompare(b.full_name, 'pt-BR'))
        .map((r) => ({
          id: r.id,
          full_name: r.full_name,
          email: r.email,
          operation: r.operation,
          role: r.role,
        }));
    }

    const db = this.readLocalSync();
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

  public async getAllRecipients(): Promise<Collaborator[]> {
    const firestore = getFirestoreDb();
    if (firestore) {
      const snap = await firestore.collection('recipients').get();
      return snap.docs
        .map((d) => d.data() as Collaborator)
        .sort((a, b) => a.full_name.localeCompare(b.full_name, 'pt-BR'));
    }

    const db = this.readLocalSync();
    return [...db.recipients].sort((a, b) => a.full_name.localeCompare(b.full_name, 'pt-BR'));
  }

  public async getRecipientById(id: string): Promise<Collaborator | undefined> {
    const firestore = getFirestoreDb();
    if (firestore) {
      const doc = await firestore.collection('recipients').doc(id).get();
      if (!doc.exists) return undefined;
      return doc.data() as Collaborator;
    }

    const db = this.readLocalSync();
    return db.recipients.find((r) => r.id === id);
  }

  public async findCollaboratorById(id: string): Promise<Collaborator | undefined> {
    return this.getRecipientById(id);
  }

  public async findCollaboratorByEmail(email: string): Promise<Collaborator | undefined> {
    const normalized = normalizeEmail(email);
    const firestore = getFirestoreDb();
    if (firestore) {
      const snap = await firestore.collection('recipients').get();
      return snap.docs
        .map((d) => d.data() as Collaborator)
        .find((r) => normalizeEmail(r.email) === normalized);
    }

    const db = this.readLocalSync();
    return db.recipients.find((r) => normalizeEmail(r.email) === normalized);
  }

  public async addRecipient(data: {
    full_name: string;
    email?: string;
    operation?: string;
    role?: string;
    active?: boolean;
  }): Promise<Collaborator> {
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

    const firestore = getFirestoreDb();
    if (firestore) {
      await firestore.collection('recipients').doc(newRecipient.id).set(cleanForFirestore(newRecipient));
      return newRecipient;
    }

    const db = this.readLocalSync();
    db.recipients.push(newRecipient);
    this.writeLocalSync(db);
    return newRecipient;
  }

  public async updateRecipient(id: string, updates: Partial<Collaborator>): Promise<Collaborator | null> {
    const firestore = getFirestoreDb();
    if (firestore) {
      const docRef = firestore.collection('recipients').doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return null;
      const current = doc.data() as Collaborator;
      const updatedEmail = updates.email ? normalizeEmail(updates.email) : current.email;
      const updated: Collaborator = {
        ...current,
        ...updates,
        email: updatedEmail,
        id,
        updated_at: new Date().toISOString(),
      };
      await docRef.set(cleanForFirestore(updated));
      return updated;
    }

    const db = this.readLocalSync();
    const idx = db.recipients.findIndex((r) => r.id === id);
    if (idx === -1) return null;

    const current = db.recipients[idx];
    const updatedEmail = updates.email ? normalizeEmail(updates.email) : current.email;

    db.recipients[idx] = {
      ...current,
      ...updates,
      email: updatedEmail,
      id,
      updated_at: new Date().toISOString(),
    };
    this.writeLocalSync(db);
    return db.recipients[idx];
  }

  public async deleteRecipient(id: string): Promise<boolean> {
    const firestore = getFirestoreDb();
    if (firestore) {
      const docRef = firestore.collection('recipients').doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return false;
      await docRef.delete();
      return true;
    }

    const db = this.readLocalSync();
    const prevLen = db.recipients.length;
    db.recipients = db.recipients.filter((r) => r.id !== id);
    if (db.recipients.length !== prevLen) {
      this.writeLocalSync(db);
      return true;
    }
    return false;
  }

  public async importRecipientsFromCSV(csvContent: string): Promise<{ added: number; errors: string[] }> {
    const lines = csvContent.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return { added: 0, errors: ['Arquivo CSV vazio'] };

    let addedCount = 0;
    const errors: string[] = [];
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

    const newRecipients: Collaborator[] = [];

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      const cols = line.split(delimiter).map((c) => c.replace(/^["']|["']$/g, '').trim());

      let name = '';
      let email = '';
      let operation = 'Stone SCL';
      let role = '';
      let active = true;

      if (cols.length >= 2 && cols[1].includes('@')) {
        name = cols[0];
        email = cols[1];
        operation = cols[2] || 'Stone SCL';
        role = cols[3] || '';
        if (cols[4] !== undefined) {
          active = cols[4].toLowerCase() !== 'false' && cols[4] !== '0';
        }
      } else {
        name = cols[0];
        operation = cols[1] || 'Stone SCL';
        role = cols[2] || '';
      }

      if (!name || name.length < 2) {
        errors.push(`Linha ${i + 1}: Nome inválido.`);
        continue;
      }

      const finalEmail = email ? normalizeEmail(email) : generateEmailFromName(name);

      newRecipients.push({
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

    if (newRecipients.length > 0) {
      const firestore = getFirestoreDb();
      if (firestore) {
        // Firestore batches support up to 500 operations
        for (let i = 0; i < newRecipients.length; i += 400) {
          const chunk = newRecipients.slice(i, i + 400);
          const batch = firestore.batch();
          for (const rec of chunk) {
            batch.set(firestore.collection('recipients').doc(rec.id), cleanForFirestore(rec));
          }
          await batch.commit();
        }
      } else {
        const db = this.readLocalSync();
        db.recipients.push(...newRecipients);
        this.writeLocalSync(db);
      }
    }

    return { added: addedCount, errors };
  }

  public async importRecipientsFromList(
    rawText: string,
    defaultOperation?: string
  ): Promise<{ added: number; totalProcessed: number; errors: string[] }> {
    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return { added: 0, totalProcessed: 0, errors: ['Nenhum nome inserido na lista.'] };

    let addedCount = 0;
    const errors: string[] = [];
    const allRecipients = await this.getAllRecipients();
    const existingNames = new Set(allRecipients.map((r) => r.full_name.toLowerCase()));
    const toInsert: Collaborator[] = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      line = line.replace(/^(\d+[\.\-\)]\s*|[\-\*\•]\s*)/, '').trim();

      let name = line;
      let email = '';
      let operation = (defaultOperation || '').trim() || 'Stone SCL';
      let role: string | undefined = undefined;

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

      toInsert.push({
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

    if (toInsert.length > 0) {
      const firestore = getFirestoreDb();
      if (firestore) {
        for (let i = 0; i < toInsert.length; i += 400) {
          const chunk = toInsert.slice(i, i + 400);
          const batch = firestore.batch();
          for (const rec of chunk) {
            batch.set(firestore.collection('recipients').doc(rec.id), cleanForFirestore(rec));
          }
          await batch.commit();
        }
      } else {
        const db = this.readLocalSync();
        db.recipients.push(...toInsert);
        this.writeLocalSync(db);
      }
    }

    return { added: addedCount, totalProcessed: lines.length, errors };
  }

  // ==================== COLLABORATOR INBOX & NOTIFICATIONS ====================

  public async getCollaboratorInbox(collaboratorId: string): Promise<InboxMessage[]> {
    const firestore = getFirestoreDb();
    if (firestore) {
      const snap = await firestore
        .collection('messages')
        .where('recipient_id', '==', collaboratorId)
        .get();

      return snap.docs
        .map((d) => d.data() as Message)
        .filter((m) => !m.deleted_by_recipient)
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

    const db = this.readLocalSync();
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

  public async reactToMessage(collaboratorId: string, messageId: string, reaction: string): Promise<boolean> {
    const firestore = getFirestoreDb();
    if (firestore) {
      const docRef = firestore.collection('messages').doc(messageId);
      const doc = await docRef.get();
      if (!doc.exists) return false;
      const msg = doc.data() as Message;
      if (msg.recipient_id !== collaboratorId) return false;

      const newReaction = msg.recipient_reaction === reaction ? null : reaction;
      await docRef.update({ recipient_reaction: newReaction });
      return true;
    }

    const db = this.readLocalSync();
    const msg = db.messages.find((m) => m.id === messageId && m.recipient_id === collaboratorId);
    if (!msg) return false;

    msg.recipient_reaction = msg.recipient_reaction === reaction ? null : reaction;
    this.writeLocalSync(db);
    return true;
  }

  public async thankMessage(
    collaboratorId: string,
    messageId: string,
    note: string
  ): Promise<{ success: boolean; thank_you_note: string }> {
    const cleanNote = note.trim().slice(0, 300);
    const now = new Date().toISOString();

    const firestore = getFirestoreDb();
    if (firestore) {
      const docRef = firestore.collection('messages').doc(messageId);
      const doc = await docRef.get();
      if (!doc.exists) throw new Error('Mensagem não encontrada.');
      const msg = doc.data() as Message;
      if (msg.recipient_id !== collaboratorId) throw new Error('Mensagem não encontrada.');

      await docRef.update({
        thank_you_note: cleanNote,
        thank_you_at: now,
      });

      if (msg.sender_id && msg.sender_id !== collaboratorId) {
        const notifId = `notif-${Date.now()}-${crypto.randomUUID().slice(0, 4)}`;
        await firestore.collection('notifications').doc(notifId).set({
          id: notifId,
          collaborator_id: msg.sender_id,
          message_id: msg.id,
          text: `💛 Seu recado foi lido e o colega enviou um agradecimento: "${cleanNote}"`,
          read_at: null,
          created_at: now,
        });
      }

      return { success: true, thank_you_note: cleanNote };
    }

    const db = this.readLocalSync();
    const msg = db.messages.find((m) => m.id === messageId && m.recipient_id === collaboratorId);
    if (!msg) throw new Error('Mensagem não encontrada.');

    msg.thank_you_note = cleanNote;
    msg.thank_you_at = now;

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
        created_at: now,
      });
    }

    this.writeLocalSync(db);
    return { success: true, thank_you_note: cleanNote };
  }

  public async getCollaboratorSummary(collaboratorId: string): Promise<{ totalMessages: number; unreadMessages: number }> {
    const firestore = getFirestoreDb();
    if (firestore) {
      const snap = await firestore
        .collection('messages')
        .where('recipient_id', '==', collaboratorId)
        .get();

      const userMessages = snap.docs
        .map((d) => d.data() as Message)
        .filter((m) => !m.deleted_by_recipient);

      const totalMessages = userMessages.length;
      const unreadMessages = userMessages.filter((m) => !m.read_at).length;
      return { totalMessages, unreadMessages };
    }

    const db = this.readLocalSync();
    const userMessages = db.messages.filter(
      (m) => m.recipient_id === collaboratorId && !m.deleted_by_recipient
    );
    const totalMessages = userMessages.length;
    const unreadMessages = userMessages.filter((m) => !m.read_at).length;
    return { totalMessages, unreadMessages };
  }

  public async markMessageRead(collaboratorId: string, messageId: string, isRead: boolean): Promise<boolean> {
    const firestore = getFirestoreDb();
    if (firestore) {
      const docRef = firestore.collection('messages').doc(messageId);
      const doc = await docRef.get();
      if (!doc.exists) return false;
      const msg = doc.data() as Message;
      if (msg.recipient_id !== collaboratorId) return false;

      const updates: any = {
        read_at: isRead ? (msg.read_at || new Date().toISOString()) : null,
      };
      if (isRead && msg.status === 'pending') {
        updates.status = 'delivered';
      }
      await docRef.update(updates);
      return true;
    }

    const db = this.readLocalSync();
    const msg = db.messages.find((m) => m.id === messageId && m.recipient_id === collaboratorId);
    if (!msg) return false;

    msg.read_at = isRead ? (msg.read_at || new Date().toISOString()) : null;
    if (isRead && msg.status === 'pending') {
      msg.status = 'delivered';
    }
    this.writeLocalSync(db);
    return true;
  }

  public async archiveMessageForRecipient(collaboratorId: string, messageId: string): Promise<boolean> {
    const firestore = getFirestoreDb();
    if (firestore) {
      const docRef = firestore.collection('messages').doc(messageId);
      const doc = await docRef.get();
      if (!doc.exists) return false;
      const msg = doc.data() as Message;
      if (msg.recipient_id !== collaboratorId) return false;

      await docRef.update({
        deleted_by_recipient: true,
        archived_at: new Date().toISOString(),
      });
      return true;
    }

    const db = this.readLocalSync();
    const msg = db.messages.find((m) => m.id === messageId && m.recipient_id === collaboratorId);
    if (!msg) return false;

    msg.deleted_by_recipient = true;
    msg.archived_at = new Date().toISOString();
    this.writeLocalSync(db);
    return true;
  }

  public async getNotifications(collaboratorId: string): Promise<InAppNotification[]> {
    const firestore = getFirestoreDb();
    if (firestore) {
      const snap = await firestore
        .collection('notifications')
        .where('collaborator_id', '==', collaboratorId)
        .get();

      return snap.docs
        .map((d) => d.data() as InAppNotification)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    const db = this.readLocalSync();
    return (db.notifications || [])
      .filter((n) => n.collaborator_id === collaboratorId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public async markNotificationsRead(collaboratorId: string): Promise<void> {
    const firestore = getFirestoreDb();
    if (firestore) {
      const snap = await firestore
        .collection('notifications')
        .where('collaborator_id', '==', collaboratorId)
        .get();

      const batch = firestore.batch();
      const now = new Date().toISOString();
      let count = 0;
      snap.docs.forEach((d) => {
        const notif = d.data() as InAppNotification;
        if (!notif.read_at) {
          batch.update(d.ref, { read_at: now });
          count++;
        }
      });
      if (count > 0) {
        await batch.commit();
      }
      return;
    }

    const db = this.readLocalSync();
    let touched = false;
    (db.notifications || []).forEach((n) => {
      if (n.collaborator_id === collaboratorId && !n.read_at) {
        n.read_at = new Date().toISOString();
        touched = true;
      }
    });
    if (touched) {
      this.writeLocalSync(db);
    }
  }

  // ==================== MESSAGE CREATION & ADMIN ====================

  public async addMessage(payload: {
    sender_id?: string;
    sender_name?: string;
    sender_email?: string;
    recipient_id: string;
    message: string;
    category?: string;
    reaction?: string;
    color_theme?: string;
    gif_url?: string;
  }): Promise<Message> {
    const recipient = await this.getRecipientById(payload.recipient_id);
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

    const firestore = getFirestoreDb();
    if (firestore) {
      await firestore.collection('messages').doc(newMessage.id).set(cleanForFirestore(newMessage));

      const notifId = `notif-${Date.now()}-${crypto.randomUUID().slice(0, 4)}`;
      await firestore.collection('notifications').doc(notifId).set({
        id: notifId,
        collaborator_id: recipient.id,
        message_id: newMessage.id,
        text: 'Você recebeu uma nova mensagem no Correio Verde. 💚',
        read_at: null,
        created_at: new Date().toISOString(),
      });

      return newMessage;
    }

    const db = this.readLocalSync();
    db.messages.unshift(newMessage);

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

    this.writeLocalSync(db);
    return newMessage;
  }

  public async getMessages(filters?: {
    recipient_id?: string;
    operation?: string;
    category?: string;
    status?: string;
    search?: string;
  }): Promise<Message[]> {
    let list: Message[] = [];
    const firestore = getFirestoreDb();
    if (firestore) {
      const snap = await firestore.collection('messages').get();
      list = snap.docs.map((d) => d.data() as Message);
    } else {
      const db = this.readLocalSync();
      list = [...db.messages];
    }

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

    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public async updateMessageStatus(id: string, status: MessageStatus): Promise<Message | null> {
    const firestore = getFirestoreDb();
    if (firestore) {
      const docRef = firestore.collection('messages').doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return null;
      await docRef.update({ status });
      const current = doc.data() as Message;
      current.status = status;
      return current;
    }

    const db = this.readLocalSync();
    const msg = db.messages.find((m) => m.id === id);
    if (!msg) return null;
    msg.status = status;
    this.writeLocalSync(db);
    return msg;
  }

  public async deleteMessage(id: string): Promise<boolean> {
    const firestore = getFirestoreDb();
    if (firestore) {
      const docRef = firestore.collection('messages').doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return false;
      await docRef.delete();
      return true;
    }

    const db = this.readLocalSync();
    const prev = db.messages.length;
    db.messages = db.messages.filter((m) => m.id !== id);
    if (db.messages.length !== prev) {
      this.writeLocalSync(db);
      return true;
    }
    return false;
  }

  public async getStats(): Promise<CampaignStats> {
    let recipients: Collaborator[] = [];
    let messages: Message[] = [];

    const firestore = getFirestoreDb();
    if (firestore) {
      const [rSnap, mSnap] = await Promise.all([
        firestore.collection('recipients').get(),
        firestore.collection('messages').get(),
      ]);
      recipients = rSnap.docs.map((d) => d.data() as Collaborator);
      messages = mSnap.docs.map((d) => d.data() as Message);
    } else {
      const db = this.readLocalSync();
      recipients = db.recipients;
      messages = db.messages;
    }

    const operationsSet = new Set<string>();
    const byOperation: Record<string, { recipients: number; messages: number }> = {};

    STONE_OPERATIONS.forEach((op) => {
      byOperation[op] = { recipients: 0, messages: 0 };
    });

    recipients.forEach((r) => {
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

    messages.forEach((m) => {
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
      totalMessages: messages.length,
      totalRecipients: recipients.length,
      operationsCount: operationsSet.size,
      deliveredMessages: delivered,
      pendingMessages: pending,
      archivedMessages: archived,
      byOperation,
      byCategory,
    };
  }

  public async exportMessagesCSV(): Promise<string> {
    let messages: Message[] = [];
    const firestore = getFirestoreDb();
    if (firestore) {
      const snap = await firestore.collection('messages').get();
      messages = snap.docs.map((d) => d.data() as Message);
    } else {
      const db = this.readLocalSync();
      messages = db.messages;
    }

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
    const rows = messages.map((m) => [
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

  public async clearAllData(): Promise<void> {
    const firestore = getFirestoreDb();
    if (firestore) {
      const collections = ['recipients', 'messages', 'notifications'];
      for (const col of collections) {
        const snap = await firestore.collection(col).get();
        const batch = firestore.batch();
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
      return;
    }

    this.writeLocalSync({
      recipients: [],
      messages: [],
      notifications: [],
    });
  }

  public async clearMessages(): Promise<void> {
    const firestore = getFirestoreDb();
    if (firestore) {
      const collections = ['messages', 'notifications'];
      for (const col of collections) {
        const snap = await firestore.collection(col).get();
        const batch = firestore.batch();
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
      return;
    }

    const db = this.readLocalSync();
    this.writeLocalSync({
      ...db,
      messages: [],
      notifications: [],
    });
  }

  public async clearRecipients(): Promise<void> {
    const firestore = getFirestoreDb();
    if (firestore) {
      const snap = await firestore.collection('recipients').get();
      const batch = firestore.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      return;
    }

    const db = this.readLocalSync();
    this.writeLocalSync({
      ...db,
      recipients: [],
      messages: [],
      notifications: [],
    });
  }
}

export const dbManager = new DBManager();
