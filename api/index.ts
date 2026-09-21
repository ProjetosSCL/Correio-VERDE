import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';


// ==================== TYPES ====================

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

export interface SentMessage {
  id: string;
  recipient_name: string;
  recipient_role?: string;
  operation: string;
  category?: string;
  message: string;
  reaction?: string;
  color_theme?: string;
  gif_url?: string;
  recipient_reaction?: string | null;
  thank_you_note?: string | null;
  thank_you_at?: string | null;
  created_at: string;
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


// ==================== DATABASE & STORAGE ====================



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

  // If the user pasted the entire service account JSON into the private key field
  if (key.startsWith('{')) {
    try {
      const parsed = JSON.parse(key);
      if (parsed.private_key) {
        key = String(parsed.private_key).trim();
      }
    } catch {}
  }

  // Strip surrounding quotes if present
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }

  // Handle base64 encoded private key
  if (!key.includes('-----BEGIN') && key.length > 200) {
    try {
      const decoded = Buffer.from(key, 'base64').toString('utf8');
      if (decoded.includes('-----BEGIN') || decoded.trim().startsWith('{')) {
        return formatPrivateKey(decoded);
      }
    } catch {}
  }

  // Replace literal '\n' characters with actual newlines, and remove carriage returns '\r'
  key = key.replace(/\\n/g, '\n').replace(/\r/g, '').trim();

  // If newlines were converted to spaces or if PEM lines need reconstruction
  if (key.includes('BEGIN') && key.includes('END')) {
    const match = key.match(/-----\s*BEGIN [A-Z ]+-----(.*?)-----\s*END [A-Z ]+-----/s);
    if (match) {
      const headerMatch = key.match(/(-----\s*BEGIN [A-Z ]+-----)/);
      const footerMatch = key.match(/(-----\s*END [A-Z ]+-----)/);
      const header = headerMatch ? headerMatch[1].replace(/\s+/g, ' ') : '-----BEGIN PRIVATE KEY-----';
      const footer = footerMatch ? footerMatch[1].replace(/\s+/g, ' ') : '-----END PRIVATE KEY-----';
      const cleanBody = match[1].replace(/\s+/g, '');
      const chunks = cleanBody.match(/.{1,64}/g) || [];
      return `${header}\n${chunks.join('\n')}\n${footer}\n`;
    }
  }

  // If missing PEM headers but contains base64 key data (e.g. MIIEv...)
  if (!key.includes('BEGIN')) {
    // If started with 'nMII...' due to a sliced '\n'
    if (key.startsWith('nMII')) {
      key = key.slice(1);
    }
    const cleanBody = key.replace(/\s+/g, '');
    if (cleanBody.length > 200) {
      const chunks = cleanBody.match(/.{1,64}/g) || [];
      return `-----BEGIN PRIVATE KEY-----\n${chunks.join('\n')}\n-----END PRIVATE KEY-----\n`;
    }
  }

  return key;
}

export function isValidPrivateKey(key: string): boolean {
  if (!key || key.length < 100) return false;
  try {
    crypto.createPrivateKey(key);
    return true;
  } catch {
    return false;
  }
}

let ensuredDefaults = false;

export function getFirestoreDb(): Firestore {
  if (firestoreInstance) return firestoreInstance;

  let projectId = (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GCP_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    ''
  ).trim();
  let clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').trim();
  let rawPrivateKey = (process.env.FIREBASE_PRIVATE_KEY || '').trim();

  const serviceAccountJson =
    process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (serviceAccountJson && serviceAccountJson.trim().startsWith('{')) {
    try {
      const sa = JSON.parse(serviceAccountJson.trim());
      if (sa.project_id && !projectId) projectId = sa.project_id;
      if (sa.client_email && !clientEmail) clientEmail = sa.client_email;
      if (sa.private_key && !rawPrivateKey) rawPrivateKey = sa.private_key;
    } catch {}
  }

  if (rawPrivateKey.startsWith('{')) {
    try {
      const sa = JSON.parse(rawPrivateKey);
      if (sa.project_id && !projectId) projectId = sa.project_id;
      if (sa.client_email && !clientEmail) clientEmail = sa.client_email;
      if (sa.private_key) rawPrivateKey = sa.private_key;
    } catch {}
  }

  if (!projectId) {
    projectId = 'correioverde-49e0c';
  }

  if (getApps().length > 0) {
    firestoreInstance = getFirestore();
    return firestoreInstance;
  }

  const formattedKey = formatPrivateKey(rawPrivateKey);

  if (clientEmail && formattedKey) {
    try {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: formattedKey,
        }),
      });
      firestoreInstance = getFirestore();
      console.log(`[Firebase Firestore] SDK Admin inicializado com cert() para projeto: ${projectId}`);
      ensureFirestoreDefaults(firestoreInstance).catch((err) => {
        console.warn('[Firebase Firestore] Aviso ao sincronizar administrador inicial:', err?.message || err);
      });
      return firestoreInstance;
    } catch (err: any) {
      console.error('[Firebase Firestore] Erro ao inicializar SDK com cert():', err?.message || err);
      throw new Error(`Falha ao inicializar SDK do Firebase com cert(): ${err?.message || err}`);
    }
  }

  // Only use GCP default credentials if running in GCP Cloud Run environment where ADC is available
  if (process.env.K_SERVICE || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      initializeApp({
        projectId,
      });
      firestoreInstance = getFirestore();
      console.log(`[Firebase Firestore] SDK Admin inicializado com credenciais padrão GCP para projeto: ${projectId}`);
      ensureFirestoreDefaults(firestoreInstance).catch((err) => {
        console.warn('[Firebase Firestore] Aviso ao sincronizar administrador inicial:', err?.message || err);
      });
      return firestoreInstance;
    } catch (err: any) {
      console.error('[Firebase Firestore] Falha crítica ao inicializar SDK Admin do Firebase no GCP:', err?.message || err);
      throw new Error(`Falha ao conectar ao Firestore no projeto "${projectId}": ${err?.message || err}`);
    }
  }

  throw new Error(
    `[Firebase Firestore] Credenciais do Firebase incompletas. Certifique-se de preencher FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY nas variáveis de ambiente da Vercel.`
  );
}

async function ensureFirestoreDefaults(db: Firestore): Promise<void> {
  if (ensuredDefaults) return;
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
    ensuredDefaults = true;
  } catch (err) {
    console.error('[Firebase Firestore] Falha ao verificar registro inicial do RH:', err);
  }
}

class DBManager {
  // ==================== COLLABORATOR / RECIPIENT OPERATIONS ====================

  public async getPublicRecipients(excludeId?: string): Promise<PublicRecipient[]> {
    const firestore = getFirestoreDb();
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

  public async getAllRecipients(): Promise<Collaborator[]> {
    const firestore = getFirestoreDb();
    const snap = await firestore.collection('recipients').get();
    const list = snap.docs.map((d) => d.data() as Collaborator);

    if (list.length === 0) {
      await ensureFirestoreDefaults(firestore);
      const reSnap = await firestore.collection('recipients').get();
      return reSnap.docs
        .map((d) => d.data() as Collaborator)
        .sort((a, b) => a.full_name.localeCompare(b.full_name, 'pt-BR'));
    }

    return list.sort((a, b) => a.full_name.localeCompare(b.full_name, 'pt-BR'));
  }

  public async getRecipientById(id: string): Promise<Collaborator | undefined> {
    const firestore = getFirestoreDb();
    const doc = await firestore.collection('recipients').doc(id).get();
    if (!doc.exists) return undefined;
    return doc.data() as Collaborator;
  }

  public async findCollaboratorById(id: string): Promise<Collaborator | undefined> {
    return this.getRecipientById(id);
  }

  public async findCollaboratorByEmail(email: string): Promise<Collaborator | undefined> {
    const normalized = normalizeEmail(email);
    const firestore = getFirestoreDb();
    const querySnap = await firestore.collection('recipients').where('email', '==', normalized).limit(1).get();
    if (!querySnap.empty) {
      return querySnap.docs[0].data() as Collaborator;
    }
    const snap = await firestore.collection('recipients').get();
    return snap.docs
      .map((d) => d.data() as Collaborator)
      .find((r) => normalizeEmail(r.email) === normalized);
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
    await firestore.collection('recipients').doc(newRecipient.id).set(cleanForFirestore(newRecipient));
    return newRecipient;
  }

  public async updateRecipient(id: string, updates: Partial<Collaborator>): Promise<Collaborator | null> {
    const firestore = getFirestoreDb();
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

  public async deleteRecipient(id: string): Promise<boolean> {
    const firestore = getFirestoreDb();
    const docRef = firestore.collection('recipients').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return false;
    await docRef.delete();
    return true;
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
      for (let i = 0; i < newRecipients.length; i += 400) {
        const chunk = newRecipients.slice(i, i + 400);
        const batch = firestore.batch();
        for (const rec of chunk) {
          batch.set(firestore.collection('recipients').doc(rec.id), cleanForFirestore(rec));
        }
        await batch.commit();
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
      for (let i = 0; i < toInsert.length; i += 400) {
        const chunk = toInsert.slice(i, i + 400);
        const batch = firestore.batch();
        for (const rec of chunk) {
          batch.set(firestore.collection('recipients').doc(rec.id), cleanForFirestore(rec));
        }
        await batch.commit();
      }
    }

    return { added: addedCount, totalProcessed: lines.length, errors };
  }

  // ==================== COLLABORATOR INBOX & NOTIFICATIONS ====================

  public async getCollaboratorInbox(collaboratorId: string): Promise<InboxMessage[]> {
    const firestore = getFirestoreDb();
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

  public async reactToMessage(collaboratorId: string, messageId: string, reaction: string): Promise<boolean> {
    const firestore = getFirestoreDb();
    const docRef = firestore.collection('messages').doc(messageId);
    const doc = await docRef.get();
    if (!doc.exists) return false;
    const msg = doc.data() as Message;
    if (msg.recipient_id !== collaboratorId) return false;

    const newReaction = msg.recipient_reaction === reaction ? null : reaction;
    await docRef.update({ recipient_reaction: newReaction });
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

  public async getSentMessages(collaboratorId: string): Promise<SentMessage[]> {
    const firestore = getFirestoreDb();
    const snap = await firestore
      .collection('messages')
      .where('sender_id', '==', collaboratorId)
      .get();

    return snap.docs
      .map((d) => d.data() as Message)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((m) => ({
        id: m.id,
        recipient_name: m.recipient_name,
        recipient_role: m.recipient_role,
        operation: m.operation,
        category: m.category,
        message: m.message,
        reaction: m.reaction,
        color_theme: m.color_theme,
        gif_url: m.gif_url,
        recipient_reaction: m.recipient_reaction,
        thank_you_note: m.thank_you_note,
        thank_you_at: m.thank_you_at,
        created_at: m.created_at,
        status: m.status,
      }));
  }

  public async getCollaboratorSummary(collaboratorId: string): Promise<{ totalMessages: number; unreadMessages: number; sentMessages: number }> {
    const firestore = getFirestoreDb();
    const snap = await firestore
      .collection('messages')
      .where('recipient_id', '==', collaboratorId)
      .get();

    const userMessages = snap.docs
      .map((d) => d.data() as Message)
      .filter((m) => !m.deleted_by_recipient);

    const totalMessages = userMessages.length;
    const unreadMessages = userMessages.filter((m) => !m.read_at).length;

    const sentSnap = await firestore
      .collection('messages')
      .where('sender_id', '==', collaboratorId)
      .get();
    const sentMessages = sentSnap.size;

    return { totalMessages, unreadMessages, sentMessages };
  }

  public async markMessageRead(collaboratorId: string, messageId: string, isRead: boolean): Promise<boolean> {
    const firestore = getFirestoreDb();
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

  public async archiveMessageForRecipient(collaboratorId: string, messageId: string): Promise<boolean> {
    const firestore = getFirestoreDb();
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

  public async getNotifications(collaboratorId: string): Promise<InAppNotification[]> {
    const firestore = getFirestoreDb();
    const snap = await firestore
      .collection('notifications')
      .where('collaborator_id', '==', collaboratorId)
      .get();

    return snap.docs
      .map((d) => d.data() as InAppNotification)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public async markNotificationsRead(collaboratorId: string): Promise<void> {
    const firestore = getFirestoreDb();
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

  public async getMessages(filters?: {
    recipient_id?: string;
    operation?: string;
    category?: string;
    status?: string;
    search?: string;
  }): Promise<Message[]> {
    const firestore = getFirestoreDb();
    const snap = await firestore.collection('messages').get();
    let list: Message[] = snap.docs.map((d) => d.data() as Message);

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
    const docRef = firestore.collection('messages').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return null;
    await docRef.update({ status });
    const current = doc.data() as Message;
    current.status = status;
    return current;
  }

  public async deleteMessage(id: string): Promise<boolean> {
    const firestore = getFirestoreDb();
    const docRef = firestore.collection('messages').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return false;
    await docRef.delete();
    return true;
  }

  public async getStats(): Promise<CampaignStats> {
    const firestore = getFirestoreDb();
    const [rSnap, mSnap] = await Promise.all([
      firestore.collection('recipients').get(),
      firestore.collection('messages').get(),
    ]);
    const recipients: Collaborator[] = rSnap.docs.map((d) => d.data() as Collaborator);
    const messages: Message[] = mSnap.docs.map((d) => d.data() as Message);

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
    const firestore = getFirestoreDb();
    const snap = await firestore.collection('messages').get();
    const messages = snap.docs.map((d) => d.data() as Message);

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
    const collections = ['recipients', 'messages', 'notifications'];
    for (const col of collections) {
      const snap = await firestore.collection(col).get();
      const batch = firestore.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }

  public async clearMessages(): Promise<void> {
    const firestore = getFirestoreDb();
    const collections = ['messages', 'notifications'];
    for (const col of collections) {
      const snap = await firestore.collection(col).get();
      const batch = firestore.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }

  public async clearRecipients(): Promise<void> {
    const firestore = getFirestoreDb();
    const snap = await firestore.collection('recipients').get();
    const batch = firestore.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

export const dbManager = new DBManager();


// ==================== EXPRESS SERVER & API ROUTES ====================

const app = express();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'correio2026';
const ADMIN_TOKEN = 'token_scl_rh_' + Buffer.from(ADMIN_PASSWORD).toString('base64');
const COLLAB_SECRET = process.env.COLLAB_SECRET || 'stone_scl_correio_verde_2026_collab_secret';

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Helper: Token generation & validation for collaborators
function generateCollabToken(collaboratorId: string): string {
  const hmac = crypto.createHmac('sha256', COLLAB_SECRET).update(collaboratorId).digest('hex').slice(0, 16);
  return `collab_${collaboratorId}_${hmac}`;
}

function verifyCollabToken(token: string): string | null {
  if (!token || !token.startsWith('collab_')) return null;
  const parts = token.split('_');
  if (parts.length < 3) return null;
  const hmac = parts[parts.length - 1];
  const collaboratorId = parts.slice(1, parts.length - 1).join('_');
  const expectedHmac = crypto.createHmac('sha256', COLLAB_SECRET).update(collaboratorId).digest('hex').slice(0, 16);
  if (hmac === expectedHmac) {
    return collaboratorId;
  }
  return null;
}

interface AuthenticatedRequest extends Request {
  collaborator?: Collaborator;
}

// Collaborator authentication middleware
async function requireCollaboratorAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    res.status(401).json({ error: 'Você precisa entrar com seu e-mail querostone para acessar.' });
    return;
  }

  const collaboratorId = verifyCollabToken(token);
  if (!collaboratorId) {
    res.status(401).json({ error: 'Sessão inválida ou expirada. Por favor, entre novamente.' });
    return;
  }

  const collaborator = await dbManager.getRecipientById(collaboratorId);
  if (!collaborator || !collaborator.active) {
    res.status(401).json({ error: 'Colaborador inativo ou não cadastrado no Stone SCL.' });
    return;
  }

  req.collaborator = collaborator;
  next();
}

// Optional collaborator authentication middleware (attaches user if present)
async function optionalCollaboratorAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (token) {
    const collaboratorId = verifyCollabToken(token);
    if (collaboratorId) {
      const collaborator = await dbManager.getRecipientById(collaboratorId);
      if (collaborator && collaborator.active) {
        req.collaborator = collaborator;
      }
    }
  }
  next();
}

// Rate-limiting middleware
const submissionTimes = new Map<string, number[]>();
function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxSubmissions = 15;

  const timestamps = submissionTimes.get(clientIp) || [];
  const recent = timestamps.filter((t) => now - t < windowMs);

  if (recent.length >= maxSubmissions) {
    res.status(429).json({
      error: 'Muitas mensagens enviadas em pouco tempo. Por favor, aguarde um minuto para enviar outra.',
    });
    return;
  }

  recent.push(now);
  submissionTimes.set(clientIp, recent);
  next();
}

// Check if an email belongs to the authorized RH admin
const RH_ADMIN_EMAILS = ['aysla.mendes@querostone.com.br', 'aysla.mendes@querostone.com'];

function isRHEmail(email?: string): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return RH_ADMIN_EMAILS.includes(clean);
}

// Admin authentication middleware - strictly restricted to Aysla Mendes or admin credentials
async function requireAdminAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'] || '';
  const keyHeader = req.headers['x-admin-key'] as string;
  const queryToken = req.query.token as string;

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  // If provided admin token or password
  if (
    token === ADMIN_TOKEN ||
    keyHeader === ADMIN_PASSWORD ||
    token === ADMIN_PASSWORD ||
    queryToken === ADMIN_TOKEN
  ) {
    next();
    return;
  }

  // Check if token belongs to an authenticated collaborator who is Aysla Mendes
  if (token && token.startsWith('collab_')) {
    const parts = token.split('_');
    if (parts.length >= 3) {
      const collabId = parts[1];
      const expected = generateCollabToken(collabId);
      if (token === expected) {
        const collab = await dbManager.findCollaboratorById(collabId);
        if (collab && collab.active && isRHEmail(collab.email)) {
          next();
          return;
        }
      }
    }
  }

  res.status(401).json({ error: 'Acesso restrito: apenas o e-mail de RH aysla.mendes@querostone.com.br possui permissão.' });
}

// ==================== COLLABORATOR AUTH & PROFILE ROUTES ====================

// Collaborator Login using corporate email (@querostone)
app.post(['/api/auth/collaborator/login', '/auth/collaborator/login'], async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.trim()) {
      res.status(400).json({ error: 'Por favor, informe seu e-mail corporativo querostone.' });
      return;
    }

    const trimmed = email.trim().toLowerCase();
    // Validate that it refers to querostone
    if (!trimmed.includes('@querostone') && !trimmed.endsWith('querostone.com') && !trimmed.endsWith('@querostone.com.br')) {
      res.status(400).json({
        error: 'O e-mail deve ser o corporativo da Stone (terminado em @querostone.com).',
      });
      return;
    }

    const collaborator = await dbManager.findCollaboratorByEmail(trimmed);
    if (!collaborator) {
      res.status(404).json({
        error: 'E-mail corporativo não encontrado na lista de colaboradores do Stone SCL. Peça à equipe de RH para cadastrá-lo.',
      });
      return;
    }

    if (!collaborator.active) {
      res.status(403).json({
        error: 'Este perfil de colaborador está inativo no momento. Entre em contato com o RH.',
      });
      return;
    }

    const token = generateCollabToken(collaborator.id);
    const firstName = collaborator.full_name.split(' ')[0];
    const summary = await dbManager.getCollaboratorSummary(collaborator.id);
    const isAdmin = isRHEmail(collaborator.email);
    const adminToken = isAdmin ? ADMIN_TOKEN : undefined;

    res.json({
      success: true,
      token,
      admin_token: adminToken,
      collaborator: {
        id: collaborator.id,
        full_name: collaborator.full_name,
        first_name: firstName,
        email: collaborator.email,
        operation: collaborator.operation,
        role: collaborator.role,
        active: collaborator.active,
        is_admin: isAdmin,
        unread_count: summary.unreadMessages,
        received_count: summary.totalMessages,
      },
    });
  } catch (err: any) {
    console.error('Error during collaborator login:', err);
    res.status(500).json({ error: 'Erro interno ao realizar login.' });
  }
});

// Get current collaborator profile & mailbox summary
app.get(['/api/collaborator/me', '/collaborator/me'], requireCollaboratorAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const col = req.collaborator!;
    const summary = await dbManager.getCollaboratorSummary(col.id);
    const firstName = col.full_name.split(' ')[0];
    const isAdmin = isRHEmail(col.email);

    res.json({
      collaborator: {
        id: col.id,
        full_name: col.full_name,
        first_name: firstName,
        email: col.email,
        operation: col.operation,
        role: col.role,
        active: col.active,
        is_admin: isAdmin,
        unread_count: summary.unreadMessages,
        received_count: summary.totalMessages,
      },
      summary,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao consultar perfil do colaborador.' });
  }
});

// Collaborator inbox: strictly returns received messages without sender identity!
app.get(['/api/collaborator/inbox', '/collaborator/inbox'], requireCollaboratorAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const col = req.collaborator!;
    const messages = await dbManager.getCollaboratorInbox(col.id);
    res.json({ messages });
  } catch (err: any) {
    console.error('Error fetching collaborator inbox:', err);
    res.status(500).json({ error: 'Erro ao carregar sua caixa postal.' });
  }
});

// Collaborator sent messages: returns messages sent by the logged collaborator with feedback
app.get(['/api/collaborator/sent', '/collaborator/sent'], requireCollaboratorAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const col = req.collaborator!;
    const messages = await dbManager.getSentMessages(col.id);
    res.json({ messages });
  } catch (err: any) {
    console.error('Error fetching collaborator sent messages:', err);
    res.status(500).json({ error: 'Erro ao carregar seu histórico de mensagens enviadas.' });
  }
});

// Mark message as read/unread in collaborator inbox
app.patch(['/api/collaborator/messages/:id/read', '/collaborator/messages/:id/read'], requireCollaboratorAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const col = req.collaborator!;
    const { id } = req.params;
    const { isRead = true } = req.body;

    const success = await dbManager.markMessageRead(col.id, id, isRead);
    if (!success) {
      res.status(404).json({ error: 'Mensagem não encontrada na sua caixa postal.' });
      return;
    }

    res.json({ success: true, messageId: id, isRead });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao atualizar status da mensagem.' });
  }
});

// Archive/remove message from collaborator inbox
app.delete(['/api/collaborator/messages/:id', '/collaborator/messages/:id'], requireCollaboratorAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const col = req.collaborator!;
    const { id } = req.params;

    const success = await dbManager.archiveMessageForRecipient(col.id, id);
    if (!success) {
      res.status(404).json({ error: 'Mensagem não encontrada.' });
      return;
    }

    res.json({ success: true, message: 'Mensagem arquivada da sua caixa postal com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao arquivar mensagem.' });
  }
});

// React to a received message
app.patch(['/api/collaborator/messages/:id/react', '/collaborator/messages/:id/react'], requireCollaboratorAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const col = req.collaborator!;
    const { id } = req.params;
    const { reaction } = req.body;

    if (!reaction || typeof reaction !== 'string') {
      res.status(400).json({ error: 'Reação inválida.' });
      return;
    }

    const success = await dbManager.reactToMessage(col.id, id, reaction.trim().slice(0, 10));
    if (!success) {
      res.status(404).json({ error: 'Mensagem não encontrada na sua caixa postal.' });
      return;
    }

    res.json({ success: true, messageId: id, reaction });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao reagir à mensagem.' });
  }
});

// Send thank you note for a received message
app.post(['/api/collaborator/messages/:id/thank', '/collaborator/messages/:id/thank'], requireCollaboratorAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const col = req.collaborator!;
    const { id } = req.params;
    const { note } = req.body;

    if (!note || typeof note !== 'string' || !note.trim()) {
      res.status(400).json({ error: 'Por favor, escreva ou escolha uma mensagem de agradecimento.' });
      return;
    }

    const result = await dbManager.thankMessage(col.id, id, note);
    res.json({ success: true, messageId: id, thank_you_note: result.thank_you_note });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao enviar agradecimento.' });
  }
});

// Collaborator notifications
app.get(['/api/collaborator/notifications', '/collaborator/notifications'], requireCollaboratorAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const col = req.collaborator!;
    const notifications = await dbManager.getNotifications(col.id);
    res.json({ notifications });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao carregar notificações.' });
  }
});

// Mark collaborator notifications as read
app.post(['/api/collaborator/notifications/mark-read', '/collaborator/notifications/mark-read'], requireCollaboratorAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const col = req.collaborator!;
    await dbManager.markNotificationsRead(col.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao atualizar notificações.' });
  }
});

// ==================== PUBLIC & SENDING MESSAGE ROUTES ====================

// Health check
app.get(['/api/health', '/health', '/api'], (_req, res) => {
  res.json({ status: 'ok', campaign: 'Correio Verde Stone SCL', date: '2026-09-18' });
});

// Get active recipients for selection (excluding the sender if logged in)
app.get(['/api/recipients', '/recipients'], optionalCollaboratorAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const excludeId = req.collaborator ? req.collaborator.id : undefined;
    const list = await dbManager.getPublicRecipients(excludeId);
    res.json({ recipients: list });
  } catch (err: any) {
    console.error('Error fetching public recipients:', err);
    res.status(500).json({ error: 'Não foi possível carregar a lista de destinatários.' });
  }
});

// Submit anonymous message (sender must be logged in as required)
app.post(['/api/messages', '/messages'], rateLimitMiddleware, requireCollaboratorAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sender = req.collaborator!;
    const { recipient_id, message, category, confirmedRespectful, reaction, color_theme, gif_url } = req.body;

    if (!recipient_id) {
      res.status(400).json({ error: 'Por favor, selecione quem receberá a mensagem.' });
      return;
    }

    // Sender cannot send to themselves
    if (recipient_id === sender.id) {
      res.status(400).json({ error: 'Você não pode enviar uma mensagem para si mesmo(a).' });
      return;
    }

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Por favor, escreva sua mensagem.' });
      return;
    }

    const trimmed = message.trim();
    if (trimmed.length < 10) {
      res.status(400).json({ error: 'A mensagem deve ter pelo menos 10 caracteres.' });
      return;
    }

    if (trimmed.length > 500) {
      res.status(400).json({ error: 'A mensagem não pode ultrapassar 500 caracteres.' });
      return;
    }

    if (confirmedRespectful !== true) {
      res.status(400).json({
        error: 'É necessário confirmar que a mensagem é respeitosa e tem a intenção de reconhecer ou acolher.',
      });
      return;
    }

    // Save message: sender information is stored in the backend privately for safety/audit,
    // but will NEVER be returned to the recipient.
    const saved = await dbManager.addMessage({
      sender_id: sender.id,
      sender_name: sender.full_name,
      sender_email: sender.email,
      recipient_id,
      message: trimmed,
      category,
      reaction: typeof reaction === 'string' ? reaction.slice(0, 10) : undefined,
      color_theme: typeof color_theme === 'string' ? color_theme.slice(0, 30) : undefined,
      gif_url: typeof gif_url === 'string' && gif_url.trim() ? gif_url.trim() : undefined,
    });

    res.status(201).json({
      success: true,
      data: {
        id: saved.id,
        recipient_name: saved.recipient_name,
        operation: saved.operation,
        category: saved.category,
        reaction: saved.reaction,
        color_theme: saved.color_theme,
        gif_url: saved.gif_url,
        created_at: saved.created_at,
        status: saved.status,
      },
    });
  } catch (err: any) {
    console.error('Error submitting message:', err);
    res.status(400).json({ error: err.message || 'Erro ao enviar a mensagem.' });
  }
});

// ==================== ADMIN API ROUTES ====================

// Admin login
app.post(['/api/admin/auth/login', '/admin/auth/login'], (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: ADMIN_TOKEN });
    return;
  }
  res.status(401).json({ error: 'Senha de acesso do RH incorreta.' });
});

// Admin verify session
app.get(['/api/admin/auth/verify', '/admin/auth/verify'], requireAdminAuth, (_req, res) => {
  res.json({ authenticated: true });
});

// Admin Dashboard stats
app.get(['/api/admin/dashboard', '/admin/dashboard'], requireAdminAuth, async (_req, res) => {
  try {
    const stats = await dbManager.getStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao gerar indicadores da campanha.' });
  }
});

// Admin get messages (with filters)
app.get(['/api/admin/messages', '/admin/messages'], requireAdminAuth, async (req, res) => {
  try {
    const { recipient_id, operation, category, status, search } = req.query;
    const messages = await dbManager.getMessages({
      recipient_id: recipient_id as string,
      operation: operation as string,
      category: category as string,
      status: status as string,
      search: search as string,
    });
    res.json({ messages });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao buscar mensagens.' });
  }
});

// Admin update message status (pending / delivered / archived)
app.patch(['/api/admin/messages/:id/status', '/admin/messages/:id/status'], requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['pending', 'delivered', 'archived'].includes(status)) {
      res.status(400).json({ error: 'Status inválido. Use pending, delivered ou archived.' });
      return;
    }
    const updated = await dbManager.updateMessageStatus(id, status);
    if (!updated) {
      res.status(404).json({ error: 'Mensagem não encontrada.' });
      return;
    }
    res.json({ success: true, message: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao atualizar status da mensagem.' });
  }
});

// Admin delete inappropriate message
app.delete(['/api/admin/messages/:id', '/admin/messages/:id'], requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await dbManager.deleteMessage(id);
    if (!deleted) {
      res.status(404).json({ error: 'Mensagem não encontrada.' });
      return;
    }
    res.json({ success: true, message: 'Mensagem removida com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao remover mensagem.' });
  }
});

// Admin export messages CSV
app.get(['/api/admin/messages/export', '/admin/messages/export'], requireAdminAuth, async (_req, res) => {
  try {
    const csvData = await dbManager.exportMessagesCSV();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="correio_verde_mensagens_${new Date().toISOString().slice(0, 10)}.csv"`
    );
    res.send('\uFEFF' + csvData);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao exportar mensagens.' });
  }
});

// Admin get all recipients (including inactive, with corporate email)
app.get(['/api/admin/recipients', '/admin/recipients'], requireAdminAuth, async (_req, res) => {
  try {
    const list = await dbManager.getAllRecipients();
    res.json({ recipients: list });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao listar colaboradores.' });
  }
});

// Admin add single recipient
app.post(['/api/admin/recipients', '/admin/recipients'], requireAdminAuth, async (req, res) => {
  try {
    const { full_name, email, operation, role, active } = req.body;
    if (!full_name || !full_name.trim()) {
      res.status(400).json({ error: 'Nome completo é obrigatório.' });
      return;
    }
    const created = await dbManager.addRecipient({
      full_name: full_name.trim(),
      email: email ? email.trim() : undefined,
      operation: (operation || '').trim() || 'Stone SCL',
      role,
      active: active !== false,
    });
    res.status(201).json({ success: true, recipient: created });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao cadastrar colaborador.' });
  }
});

// Admin update recipient
app.put(['/api/admin/recipients/:id', '/admin/recipients/:id'], requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, operation, role, active } = req.body;
    const updated = await dbManager.updateRecipient(id, {
      ...(full_name !== undefined && { full_name }),
      ...(email !== undefined && { email }),
      ...(operation !== undefined && { operation }),
      ...(role !== undefined && { role }),
      ...(active !== undefined && { active }),
    });
    if (!updated) {
      res.status(404).json({ error: 'Colaborador não encontrado.' });
      return;
    }
    res.json({ success: true, recipient: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao atualizar colaborador.' });
  }
});

// Admin delete recipient
app.delete(['/api/admin/recipients/:id', '/admin/recipients/:id'], requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await dbManager.deleteRecipient(id);
    if (!deleted) {
      res.status(404).json({ error: 'Colaborador não encontrado.' });
      return;
    }
    res.json({ success: true, message: 'Colaborador removido com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao remover colaborador.' });
  }
});

// Admin import recipients from raw list (Google Forms style)
app.post(['/api/admin/recipients/import-list', '/admin/recipients/import-list'], requireAdminAuth, async (req, res) => {
  try {
    const { rawText, operation } = req.body;
    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      res.status(400).json({ error: 'Nenhum nome fornecido na lista.' });
      return;
    }
    const result = await dbManager.importRecipientsFromList(rawText, operation);
    res.json({
      success: true,
      added: result.added,
      totalProcessed: result.totalProcessed,
      errors: result.errors,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao processar lista de colaboradores.' });
  }
});

// Admin import recipients CSV (supports full_name,email,operation,role,active)
app.post(['/api/admin/recipients/import', '/admin/recipients/import'], requireAdminAuth, async (req, res) => {
  try {
    const { csv } = req.body;
    if (!csv || typeof csv !== 'string') {
      res.status(400).json({ error: 'Conteúdo CSV inválido ou não fornecido.' });
      return;
    }
    const result = await dbManager.importRecipientsFromCSV(csv);
    res.json({
      success: true,
      added: result.added,
      errors: result.errors,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao processar importação do CSV.' });
  }
});

// Admin reset/clear all simulation data
app.post(['/api/admin/clear-all', '/admin/clear-all'], requireAdminAuth, async (req, res) => {
  try {
    const { target } = req.body || {};
    if (target === 'messages') {
      await dbManager.clearMessages();
      res.json({ success: true, message: 'Todas as mensagens foram removidas.' });
    } else if (target === 'recipients') {
      await dbManager.clearRecipients();
      res.json({ success: true, message: 'Todos os destinatários foram removidos.' });
    } else {
      await dbManager.clearAllData();
      res.json({ success: true, message: 'Plataforma totalmente zerada (mensagens e destinatários).' });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao zerar os dados da plataforma.' });
  }
});

export { app };
export default app;
