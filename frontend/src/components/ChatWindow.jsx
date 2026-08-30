import { useEffect, useRef } from "react";
import ChatInput from "./ChatInput";
import ErrorMessage from "./ErrorMessage";
import Message from "./Message";

function ChatWindow({
    conversation,
    messages,
    loading,
    sending,
    uploading,
    uploadProgress,
    error,
    onClearError,
    onUpload,
    onSendMessage
}) {
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [messages, sending]);

    const hasDocument = Boolean(conversation.document_id);

    return (
        <main className="chat-window">
            <header className="chat-header">
                <div className="chat-title">
                    <h1>{conversation.title}</h1>

                    <p>
                        {hasDocument
                            ? "PDF connected. Answers are based on the uploaded document."
                            : "General AI conversation. Upload a PDF anytime."}
                    </p>
                </div>

            </header>

            {error && (
                <div className="chat-error">
                    <ErrorMessage
                        message={error}
                        onClose={onClearError}
                    />
                </div>
            )}

            <section className="messages-container">
                {loading && (
                    <div className="chat-status">
                        Loading conversation...
                    </div>
                )}

                {!loading && messages.length === 0 && (
                    <div className="empty-messages">
                        <h2>
                            {hasDocument
                                ? "Ask about your PDF"
                                : "How can I help you?"}
                        </h2>

                        <p>
                            {hasDocument
                                ? "Ask questions and the backend will retrieve relevant information from your document."
                                : "Ask a general question or upload a PDF for document-based answers."}
                        </p>
                    </div>
                )}

                {!loading && messages.map((message, index) => (
                    <Message
                        key={message.id}
                        role={message.role}
                        content={message.content}
                        isStreaming={sending && index === messages.length - 1 && message.role === "assistant"}
                    />
                ))}

                <div ref={bottomRef} />
            </section>

            <div className="chat-input-container">
                <ChatInput
                    disabled={sending}
                    uploading={uploading}
                    uploadProgress={uploadProgress}
                    hasDocument={hasDocument}
                    onUpload={onUpload}
                    onSendMessage={onSendMessage}
                />
            </div>
        </main>
    );
}

export default ChatWindow;