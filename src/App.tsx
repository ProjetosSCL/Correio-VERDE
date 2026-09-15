import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { WelcomeScreen } from './components/WelcomeScreen';
import { LoginScreen } from './components/LoginScreen';
import { CollaboratorHomeScreen } from './components/CollaboratorHomeScreen';
import { InboxScreen } from './components/InboxScreen';
import { CollaboratorProfileModal } from './components/CollaboratorProfileModal';
import { RecipientSelectScreen } from './components/RecipientSelectScreen';
import { WriteMessageScreen } from './components/WriteMessageScreen';
import { ConfirmationScreen } from './components/ConfirmationScreen';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { PublicRecipient, CollaboratorProfile, CollaboratorSession } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<
    'welcome' | 'login' | 'collab-home' | 'inbox' | 'select-recipient' | 'write-message' | 'confirmation' | 'admin'
  >('welcome');

  // Collaborator auth & profile state
  const [collabToken, setCollabToken] = useState<string | null>(() => {
    return localStorage.getItem('stone_collab_token');
  });
  const [collaborator, setCollaborator] = useState<CollaboratorProfile | null>(null);
  const [unreadInboxCount, setUnreadInboxCount] = useState<number>(0);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Recipient list for public / collaborator flow
  const [recipients, setRecipients] = useState<PublicRecipient[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<PublicRecipient | null>(null);

  // Confirmation screen state
  const [confirmationData, setConfirmationData] = useState<{
    recipientName: string;
    operation: string;
    category?: string;
  } | null>(null);

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin authentication state
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return sessionStorage.getItem('stone_scl_admin_token');
  });
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  // Fetch recipients list
  const loadRecipients = useCallback(async () => {
    setIsLoadingRecipients(true);
    try {
      const res = await fetch('/api/recipients');
      if (res.ok) {
        const data = await res.json();
        setRecipients(data.recipients || []);
      }
    } catch (err) {
      console.error('Error loading recipients:', err);
    } finally {
      setIsLoadingRecipients(false);
    }
  }, []);

  useEffect(() => {
    loadRecipients();
  }, [loadRecipients]);

  // Fetch / verify collaborator profile on token change
  const refreshCollaboratorProfile = useCallback(async (tokenToVerify?: string) => {
    const token = tokenToVerify || collabToken;
    if (!token) {
      setCollaborator(null);
      setUnreadInboxCount(0);
      return;
    }

    try {
      const res = await fetch('/api/collaborator/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setCollaborator(data.collaborator);
        setUnreadInboxCount(data.collaborator.unread_count || 0);
      } else if (res.status === 401) {
        // Expired or invalid token
        localStorage.removeItem('stone_collab_token');
        setCollabToken(null);
        setCollaborator(null);
        setUnreadInboxCount(0);
      }
    } catch (err) {
      console.error('Error verifying collaborator session:', err);
    }
  }, [collabToken]);

  useEffect(() => {
    if (collabToken) {
      refreshCollaboratorProfile(collabToken);
    }
  }, [collabToken, refreshCollaboratorProfile]);

  // Check admin token validity on mount
  useEffect(() => {
    if (adminToken) {
      fetch('/api/admin/auth/verify', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
        .then((res) => {
          if (!res.ok) {
            sessionStorage.removeItem('stone_scl_admin_token');
            setAdminToken(null);
          }
        })
        .catch(() => {
          // ignore network error
        });
    }
  }, [adminToken]);

  // Handle message submission
  const handleSendMessage = async (payload: {
    recipient_id: string;
    message: string;
    category?: string;
    confirmedRespectful: boolean;
  }) => {
    setIsSubmitting(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (collabToken) {
        headers['Authorization'] = `Bearer ${collabToken}`;
      }

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Erro ao enviar a mensagem.');
      }

      setConfirmationData({
        recipientName: json.data.recipient_name,
        operation: json.data.operation,
        category: json.data.category,
      });

      // Refresh collaborator profile if logged in
      if (collabToken) {
        refreshCollaboratorProfile();
      }

      // Clear selection and go to confirmation
      setSelectedRecipient(null);
      setCurrentView('confirmation');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Collaborator Login Success Handler
  const handleCollaboratorLoginSuccess = (session: CollaboratorSession) => {
    setCollabToken(session.token);
    setCollaborator(session.collaborator);
    setUnreadInboxCount(session.collaborator.unread_count || 0);
    localStorage.setItem('stone_collab_token', session.token);
    setCurrentView('collab-home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Collaborator Logout
  const handleCollaboratorLogout = () => {
    localStorage.removeItem('stone_collab_token');
    setCollabToken(null);
    setCollaborator(null);
    setUnreadInboxCount(0);
    setIsProfileModalOpen(false);
    setCurrentView('welcome');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigation handlers
  const handleStartMessage = () => {
    loadRecipients();
    setCurrentView('select-recipient');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContinueToMessage = () => {
    if (selectedRecipient) {
      setCurrentView('write-message');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBackToSelect = () => {
    setCurrentView('select-recipient');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    setSelectedRecipient(null);
    if (collaborator) {
      setCurrentView('collab-home');
    } else {
      setCurrentView('welcome');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSendAnother = () => {
    setConfirmationData(null);
    setSelectedRecipient(null);
    loadRecipients();
    setCurrentView('select-recipient');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToInbox = () => {
    if (collaborator && collabToken) {
      setCurrentView('inbox');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setCurrentView('login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSendReplyFromInbox = (recipientId: string) => {
    const found = recipients.find((r) => r.id === recipientId);
    if (found) {
      setSelectedRecipient(found);
      setCurrentView('write-message');
    } else {
      loadRecipients();
      setCurrentView('select-recipient');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Admin access
  const handleOpenAdmin = () => {
    if (adminToken) {
      setCurrentView('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  const handleAdminLoginSuccess = (token: string) => {
    setAdminToken(token);
    sessionStorage.setItem('stone_scl_admin_token', token);
    setCurrentView('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    sessionStorage.removeItem('stone_scl_admin_token');
    handleBackToHome();
  };

  return (
    <div className="min-h-screen bg-stone-pattern flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* App Header */}
      <Header
        currentView={currentView}
        onNavigateHome={handleBackToHome}
        onOpenAdmin={handleOpenAdmin}
        isAdminAuthenticated={!!adminToken}
        collaborator={collaborator}
        unreadInboxCount={unreadInboxCount}
        onNavigateToInbox={handleNavigateToInbox}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onLogout={handleCollaboratorLogout}
        onNavigateToLogin={() => {
          setCurrentView('login');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Screen Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6">
        {/* Welcome View (Logged Out) */}
        {currentView === 'welcome' && (
          <WelcomeScreen
            onStartMessage={handleStartMessage}
            onOpenLogin={() => {
              setCurrentView('login');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            collaborator={collaborator}
            onOpenInbox={handleNavigateToInbox}
          />
        )}

        {/* Corporate Email Login */}
        {currentView === 'login' && (
          <LoginScreen
            onLoginSuccess={handleCollaboratorLoginSuccess}
            onOpenAdmin={handleOpenAdmin}
            onCancel={handleBackToHome}
          />
        )}

        {/* Collaborator Dashboard (Logged In) */}
        {currentView === 'collab-home' && collaborator && (
          <CollaboratorHomeScreen
            collaborator={collaborator}
            onNavigateToInbox={handleNavigateToInbox}
            onStartSendMessage={handleStartMessage}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onLogout={handleCollaboratorLogout}
          />
        )}

        {/* Collaborator Inbox (Read Messages) */}
        {currentView === 'inbox' && collaborator && collabToken && (
          <InboxScreen
            token={collabToken}
            collaborator={collaborator}
            onBackToHome={handleBackToHome}
            onSendReply={handleSendReplyFromInbox}
          />
        )}

        {/* Step 1: Select Recipient */}
        {currentView === 'select-recipient' && (
          <RecipientSelectScreen
            recipients={recipients}
            selectedRecipient={selectedRecipient}
            onSelectRecipient={setSelectedRecipient}
            onContinue={handleContinueToMessage}
            onBack={handleBackToHome}
            isLoading={isLoadingRecipients}
            currentCollaboratorId={collaborator?.id}
          />
        )}

        {/* Step 2: Write Message */}
        {currentView === 'write-message' && selectedRecipient && (
          <WriteMessageScreen
            recipient={selectedRecipient}
            onSendMessage={handleSendMessage}
            onChangeRecipient={handleBackToSelect}
            onBack={handleBackToSelect}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Step 3: Confirmation */}
        {currentView === 'confirmation' && confirmationData && (
          <ConfirmationScreen
            recipientName={confirmationData.recipientName}
            operation={confirmationData.operation}
            category={confirmationData.category}
            onSendAnother={handleSendAnother}
            onBackHome={handleBackToHome}
            onOpenInbox={collaborator ? handleNavigateToInbox : undefined}
            hasCollaborator={!!collaborator}
          />
        )}

        {/* RH Admin Dashboard */}
        {currentView === 'admin' && adminToken && (
          <AdminDashboard
            adminToken={adminToken}
            onLogout={handleAdminLogout}
            onNavigateHome={handleBackToHome}
          />
        )}
      </main>

      {/* App Footer */}
      <Footer />

      {/* Collaborator Profile Modal */}
      <CollaboratorProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        collaborator={collaborator}
        onLogout={handleCollaboratorLogout}
        onNavigateToInbox={() => {
          setIsProfileModalOpen(false);
          handleNavigateToInbox();
        }}
      />

      {/* Admin Login Dialog */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />
    </div>
  );
}
