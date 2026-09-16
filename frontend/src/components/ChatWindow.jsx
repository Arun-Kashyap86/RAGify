import { useEffect, useRef, useState, memo } from "react";
import { LogOut, User } from "lucide-react";
import ChatInput from "./ChatInput";
import ErrorMessage from "./ErrorMessage";
import Message from "./Message";

function ChatWindow({
  conversation,
  messages,
  user,
  loading,
  sending,
  uploading,
  uploadProgress,
  error,
  onClearError,
  onUpload,
  onSendMessage,
  onEditMessage,
  onStopStreaming,
  onLogout,
  onOpenSidebar,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef(null);

  // Fast direct scroll to latest token without animation lag
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, sending]);

  const hasDocument = Boolean(conversation?.document_id);
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <main className="chat-window">
      {/* ================= CHAT HEADER ================= */}

      <header className="chat-header">
        <div className="chat-header-left">
          {/* Mobile Hamburger Button */}

          <button
            type="button"
            className="mobile-menu-button"
            onClick={onOpenSidebar}
            aria-label="Open conversations"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          {/* Conversation Title */}

          <div className="chat-title">
            <h1>{conversation?.title || "New Chat"}</h1>

            <p>
              {hasDocument
                ? "PDF connected. Answers are based on the uploaded document."
                : "General AI conversation. Upload a PDF anytime."}
            </p>
          </div>
        </div>

        {/* Account Badge & Dropdown Menu */}
        {user && (
          <div className="header-user-wrapper">
            <button
              type="button"
              className="header-user-badge"
              onClick={() => setMenuOpen((prev) => !prev)}
              title="Account Menu"
            >
              <div className="header-user-avatar">{initial}</div>
              <span className="header-user-name">{user.name}</span>
            </button>

            {menuOpen && (
              <>
                <div
                  className="user-menu-backdrop"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="user-menu-dropdown">
                  <div className="user-menu-info">
                    <User size={16} className="user-menu-icon" />
                    <div>
                      <strong>{user.name}</strong>
                      <p>{user.email}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="user-menu-logout"
                    onClick={() => {
                      setMenuOpen(false);
                      onLogout();
                    }}
                  >
                    <LogOut size={15} />
                    <span>Log Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </header>

      {/* ================= ERROR ================= */}

      {error && (
        <div className="chat-error">
          <ErrorMessage message={error} onClose={onClearError} />
        </div>
      )}

      {/* ================= MESSAGES ================= */}

      <section className="messages-container" ref={containerRef}>
        {/* Loading Conversation */}

        {loading && <div className="chat-status">Loading conversation...</div>}

        {/* Empty Conversation */}

        {!loading && messages.length === 0 && (
          <div className="empty-messages">
            <h2>
              {hasDocument ? "Ask about your PDF" : "How can I help you?"}
            </h2>

            <p>
              {hasDocument
                ? "Ask questions and the backend will retrieve relevant information from your document."
                : "Ask a general question or upload a PDF for document-based answers."}
            </p>
          </div>
        )}

        {/* Messages */}

        {!loading &&
          messages.map((message, index) => (
            <Message
              key={message.id}
              id={message.id}
              role={message.role}
              content={message.content}
              isStreaming={
                sending &&
                index === messages.length - 1 &&
                message.role === "assistant"
              }
              onEditSubmit={onEditMessage}
              disabled={sending}
            />
          ))}
      </section>

      {/* ================= CHAT INPUT ================= */}

      <div className="chat-input-container">
        <ChatInput
          disabled={sending}
          isStreaming={sending}
          uploading={uploading}
          uploadProgress={uploadProgress}
          hasDocument={hasDocument}
          onUpload={onUpload}
          onSendMessage={onSendMessage}
          onStopStreaming={onStopStreaming}
        />
      </div>
    </main>
  );
}

export default memo(ChatWindow);
