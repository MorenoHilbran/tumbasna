import React, { useState, useRef, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonIcon,
  IonList,
  IonButtons
} from '@ionic/react';
import {
  arrowBackOutline,
  logoWhatsapp,
  sendOutline,
  checkmark,
  checkmarkDone,
  shieldCheckmarkOutline,
  sparkles
} from 'ionicons/icons';
import { useApp, ChatThread } from '../context/AppContext';
import './Chat.css';

// Helper to format markdown-like syntax for messages (bold, italic, newlines)
const parseInline = (text: string): React.ReactNode[] => {
  if (!text) return [];
  // Regex to match **bold**, *bold*, __italic__, _italic_
  const regex = /(\*\*.*?\*\*|\*.*?\*|__.*?__|_+?_)/g;
  const tokens = text.split(regex);
  
  return tokens.map((token, i) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={i}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith('*') && token.endsWith('*')) {
      return <strong key={i}>{token.slice(1, -1)}</strong>;
    }
    if (token.startsWith('__') && token.endsWith('__')) {
      return <strong key={i}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith('_') && token.endsWith('_')) {
      return <em key={i}>{token.slice(1, -1)}</em>;
    }
    return token;
  });
};

const formatMessageText = (text: string): React.ReactNode => {
  if (!text) return '';
  const lines = text.split('\n');
  return lines.map((line, index) => (
    <React.Fragment key={index}>
      {parseInline(line)}
      {index < lines.length - 1 && <br />}
    </React.Fragment>
  ));
};

const stripMarkdown = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1');
};

interface ChatProps {
  initialPartner?: string | null;
  initialPartnerPhone?: string | null;
  onClearInitialPartner?: () => void;
}

const Chat: React.FC<ChatProps> = ({ initialPartner, initialPartnerPhone, onClearInitialPartner }) => {
  const { chats, sendMessage } = useApp();
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [typedMessage, setTypedMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedThread, chats]);

  // Handle initial partner navigation from external trigger
  useEffect(() => {
    if (initialPartner) {
      const thread = chats.find((c) => c.supplierName === initialPartner);
      if (thread) {
        setSelectedThread(thread);
      } else {
        // If thread doesn't exist yet, create a temporary one for the view
        // It will be added to the global state once a message is sent
        setSelectedThread({
          supplierName: initialPartner,
          supplierPhone: initialPartnerPhone || undefined,
          lastMessage: '',
          lastTime: '',
          unreadCount: 0,
          messages: []
        });
      }
      if (onClearInitialPartner) {
        onClearInitialPartner();
      }
    }
  }, [initialPartner, chats, onClearInitialPartner]);

  // Sync active thread reference when the global chats state changes
  const activeThread = selectedThread
    ? chats.find((c) => c.supplierName === selectedThread.supplierName) || selectedThread
    : null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activeThread) return;

    sendMessage(activeThread.supplierName, typedMessage.trim(), activeThread.supplierPhone);
    setTypedMessage('');
  };

  const isAiPartner = activeThread?.supplierName === 'Tumbasna AI Pintar';

  return (
    <IonPage>
      {/* HEADER: Dynamic depending on view */}
      <IonHeader className="ion-no-border">
        <IonToolbar className="chat-toolbar">
          {activeThread ? (
            /* CONVERSATION HEADER */
            <div className="active-chat-header">
              <IonButtons slot="start">
                <button className="chat-back-btn" onClick={() => setSelectedThread(null)}>
                  <IonIcon icon={arrowBackOutline} />
                </button>
              </IonButtons>
              <div className="active-chat-user-info">
                {isAiPartner ? (
                  <div className="chat-avatar-mini ai-avatar-glow">
                    <IonIcon icon={sparkles} />
                  </div>
                ) : (
                  <div className="chat-avatar-mini">
                    {activeThread.supplierName.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="chat-recipient-name">{activeThread.supplierName}</h3>
                  {isAiPartner ? (
                    <div className="chat-sync-status ai-status-green">
                      <IonIcon icon={sparkles} />
                      <span>Asisten AI Aktif</span>
                    </div>
                  ) : (
                    <div className="chat-sync-status">
                      <IonIcon icon={logoWhatsapp} className="wa-green" />
                      <span>WhatsApp Terintegrasi</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* LIST THREADS HEADER */
            <div className="chat-toolbar-inner">
              <div className="chat-logo-row">
                <img src="/logo.png" alt="Tumbasna" className="chat-header-logo-only" />
              </div>
            </div>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent className="chat-content">
        {!activeThread ? (
          /* THREAD LIST VIEW */
          <div className="threads-list-wrapper">
            <div className="whatsapp-info-banner">
              <IonIcon icon={shieldCheckmarkOutline} />
              <span>Gunakan asisten AI Pintar atau hubungi supplier via WhatsApp secara terintegrasi.</span>
            </div>

            <IonList className="chat-threads-list" lines="none">
              {chats.map((thread, index) => {
                const isAi = thread.supplierName === 'Tumbasna AI Pintar';
                return (
                  <div
                    key={index}
                    className={`thread-item-card ${isAi ? 'thread-item-ai' : ''}`}
                    onClick={() => setSelectedThread(thread)}
                  >
                    {isAi ? (
                      <div className="thread-avatar ai-list-avatar-glow">
                        <IonIcon icon={sparkles} />
                        <span className="wa-badge-corner ai-badge-corner">
                          <IonIcon icon={sparkles} />
                        </span>
                      </div>
                    ) : (
                      <div className="thread-avatar">
                        {thread.supplierName.charAt(0)}
                        <span className="wa-badge-corner">
                          <IonIcon icon={logoWhatsapp} />
                        </span>
                      </div>
                    )}
                    
                    <div className="thread-preview-info">
                      <div className="thread-header-row">
                        <h4 className="thread-supplier-name">
                          {thread.supplierName}
                          {isAi && <span className="thread-ai-lbl">PINTAR</span>}
                        </h4>
                        <span className="thread-time">{thread.lastTime}</span>
                      </div>
                      
                      <div className="thread-message-row">
                        <p className="thread-last-msg">{stripMarkdown(thread.lastMessage)}</p>
                        {thread.unreadCount > 0 && (
                          <span className="thread-unread-badge">{thread.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </IonList>
          </div>
        ) : (
          /* CONVERSATION MESSAGES VIEW */
          <div className="conversation-container">
            <div className="messages-scroller">
              {isAiPartner ? (
                <div className="sync-disclaimer ai-disclaimer-glow">
                  <IonIcon icon={sparkles} />
                  <span>Tumbasna AI Pintar menganalisis tren & rantai pasok secara real-time</span>
                </div>
              ) : (
                <div className="sync-disclaimer">
                  <IonIcon icon={logoWhatsapp} />
                  <span>Percakapan terhubung otomatis dengan WhatsApp Supplier</span>
                </div>
              )}

              {activeThread.messages.map((msg) => {
                const isBuyer = msg.sender === 'buyer';
                return (
                  <div
                    key={msg.id}
                    className={`message-bubble-wrapper ${isBuyer ? 'sent' : 'received'}`}
                  >
                    {!isBuyer && (
                      <div className="bubble-sender-name">
                        {isAiPartner ? (
                          <>Tumbasna AI <span className="via-wa via-ai-txt">Asisten Pintar</span></>
                        ) : (
                          <>{activeThread.supplierName} <span className="via-wa">via WhatsApp</span></>
                        )}
                      </div>
                    )}
                    
                    <div className={`message-bubble ${isAiPartner && !isBuyer ? 'ai-message-bubble' : ''}`}>
                      <p className="message-text">{formatMessageText(msg.text)}</p>
                      <div className="message-meta">
                        <span className="message-time">{msg.timestamp}</span>
                        {isBuyer && (
                          <IonIcon
                            icon={msg.status === 'read' ? checkmarkDone : checkmark}
                            className={`msg-status-icon ${msg.status === 'read' ? 'read' : ''}`}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef}></div>
            </div>

            {/* Message Input Panel */}
            <form onSubmit={handleSend} className="chat-input-bar">
              <input
                type="text"
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                placeholder={isAiPartner ? "Tanyakan tren harga, rekomendasi supplier..." : "Tulis pesan ke supplier..."}
                className="chat-text-input"
              />
              <button type="submit" className="chat-send-btn">
                <IonIcon icon={sendOutline} />
              </button>
            </form>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Chat;
