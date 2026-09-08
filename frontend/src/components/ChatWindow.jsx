import { useEffect, useRef, memo } from "react";
import ChatInput from "./ChatInput";
import ErrorMessage from "./ErrorMessage";
import Message from "./Message";

function ChatWindow({
  conversation,
  messages,
  loading,
  sending,
  uploading,
  error,
  onClearError,
  onUpload,
  onSendMessage,
  onStopGenerating,
  onOpenSidebar,
}) {
  const containerRef = useRef(null);

  // Fast direct scroll to latest token without animation lag
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, sending]);

  const hasDocument = Boolean(conversation?.document_id);

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
              role={message.role}
              content={message.content}
              isStreaming={
                sending &&
                index === messages.length - 1 &&
                message.role === "assistant"
              }
            />
          ))}
      </section>

      {/* ================= CHAT INPUT ================= */}

      <div className="chat-input-container">
        <ChatInput
          disabled={sending}
          sending={sending}
          uploading={uploading}
          hasDocument={hasDocument}
          onUpload={onUpload}
          onSendMessage={onSendMessage}
          onStopGenerating={onStopGenerating}
        />
      </div>
    </main>
  );
}

export default memo(ChatWindow);
