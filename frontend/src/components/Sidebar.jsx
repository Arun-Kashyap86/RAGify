import { memo } from "react";
import { LogOut } from "lucide-react";

function Sidebar({
  conversations,
  activeConversationId,
  loading,
  creating,
  sidebarOpen,
  user,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onLogout,
  onClose,
}) {
  return (
    <>
      {sidebarOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <div className="sidebar-header">
            <div className="brand">
              <div className="brand-logo">R</div>
              <span>RAGify</span>
            </div>

            <button
              className="mobile-sidebar-close"
              onClick={onClose}
              type="button"
              aria-label="Close conversations"
            >
              ×
            </button>
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
            <p className="sidebar-status">Loading conversations...</p>
          )}

          {!loading && conversations.length === 0 && (
            <p className="sidebar-status">No conversations yet</p>
          )}

          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`conversation-item ${
                activeConversationId === conversation.id ? "active" : ""
              }`}
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
                  <span className="document-indicator">PDF</span>
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

        {user && (
          <div className="sidebar-footer">
            <div className="user-profile">
              <div className="user-avatar">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-email">{user.email}</span>
              </div>
            </div>

            <button
              type="button"
              className="logout-button"
              onClick={onLogout}
              title="Log Out"
              aria-label="Log Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

export default memo(Sidebar);
