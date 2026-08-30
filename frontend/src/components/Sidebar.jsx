import { memo } from "react";

function Sidebar({
    conversations,
    activeConversationId,
    loading,
    creating,
    onNewChat,
    onSelectConversation,
    onDeleteConversation
}) {
    return (
        <aside className="sidebar">
            <div className="sidebar-top">
                <div className="brand">
                    <div className="brand-logo">R</div>
                    <span>RAGify</span>
                        
                </div>

                <button
                    className="new-chat-button"
                    onClick={onNewChat}
                    disabled={creating}
                >
                    {creating ? "Creating..." : "New Chat"}
                </button>
            </div>

            <div className="conversation-list">
                <p className="sidebar-label">Conversations</p>

                {loading && (
                    <p className="sidebar-status">
                        Loading chats...
                    </p>
                )}

                {!loading && conversations.length === 0 && (
                    <p className="sidebar-status">
                        No conversations yet
                    </p>
                )}

                {conversations.map((conversation) => (
                    <div
                        key={conversation.id}
                        className={`conversation-item ${activeConversationId === conversation.id ? "active" : ""}`}
                    >
                        <button
                            className="conversation-button"
                            onClick={() => onSelectConversation(conversation.id)}
                        >
                            <span
                                key={conversation.title}
                                className="conversation-title title-change"
                            >
                                {conversation.title}
                            </span>

                            {conversation.document_id && (
                                <span className="document-indicator">
                                    PDF
                                </span>
                            )}
                        </button>

                        <button
                            className="delete-button"
                            onClick={() => onDeleteConversation(conversation.id)}
                            aria-label="Delete conversation"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </aside>
    );
}

export default memo(Sidebar);