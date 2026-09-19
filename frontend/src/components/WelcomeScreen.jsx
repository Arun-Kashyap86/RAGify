function WelcomeScreen({ onNewChat, creating }) {
    return (
        <main className="welcome-screen">
            <div className="welcome-content">
                <div className="welcome-logo">R</div>

                <h1>Start a new conversation</h1>

                <p>
                    Ask general questions or upload a PDF to ask questions based
                    on a document.
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

export default WelcomeScreen;