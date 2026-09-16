import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { dbManager, normalizeEmail } from './db';
import { Collaborator } from './types';

dotenv.config();

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
