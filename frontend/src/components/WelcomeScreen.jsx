import { LogOut } from "lucide-react";

function WelcomeScreen({ user, onNewChat, creating, onOpenSidebar, onLogout }) {
  return (
    <main className="welcome-screen">
      <header className="welcome-header">
        <div className="welcome-header-brand">
          <div className="brand-logo">R</div>
          <span>RAGify</span>
        </div>
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

        {user && (
          <div className="chat-header-right">
            <div
              className="header-user-badge"
              title={`${user.name || "User"} (${user.email || ""})`}
            >
              <div className="header-user-avatar">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="header-user-name">{user.name}</span>
            </div>

            <button
              type="button"
              className="header-logout-button"
              onClick={onLogout}
              title="Log Out"
              aria-label="Log Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </header>

      <div className="welcome-content-wrapper">
        <div className="welcome-content">
          <div className="welcome-logo">R</div>

          <h1>Start a new conversation</h1>

          <p>
            Ask general questions or upload a PDF to ask questions based on a
            document.
          </p>

          <button
            className="welcome-button"
            onClick={onNewChat}
            disabled={creating}
          >
            {creating ? "Creating chat..." : "New Chat"}
          </button>
        </div>
      </div>
    </main>
  );
}

export default WelcomeScreen;
