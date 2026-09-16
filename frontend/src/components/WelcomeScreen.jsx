import { useState, memo } from "react";
import { LogOut, User } from "lucide-react";

function WelcomeScreen({ user, onNewChat, creating, onLogout, onOpenSidebar }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <main className="welcome-screen">
      <header className="welcome-header">
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
    </main>
  );
}

export default memo(WelcomeScreen);
