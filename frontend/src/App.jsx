import { useEffect, useState, useRef } from "react";
import AuthModal from "./components/AuthModal";
import ChatWindow from "./components/ChatWindow";
import ErrorMessage from "./components/ErrorMessage";
import Sidebar from "./components/Sidebar";
import WelcomeScreen from "./components/WelcomeScreen";
import { getMe } from "./services/authApi";
import { streamMessage } from "./services/chatApi";
import {
  createConversation,
  deleteConversation,
  getConversation,
  getConversations,
} from "./services/conversationApi";
import { uploadDocument } from "./services/documentApi";

function App() {
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const abortControllerRef = useRef(null);

  useEffect(() => {
    function handleAuthExpired() {
      handleLogout();
      setError("Your session has expired. Please log in again.");
    }

    window.addEventListener("ragify_auth_expired", handleAuthExpired);
    return () => {
      window.removeEventListener("ragify_auth_expired", handleAuthExpired);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("ragify_token");
    if (token) {
      getMe()
        .then((data) => {
          if (data.user) {
            setUser(data.user);
            loadConversations();
          } else {
            localStorage.removeItem("ragify_token");
          }
        })
        .catch(() => {
          localStorage.removeItem("ragify_token");
        })
        .finally(() => {
          setAuthChecking(false);
        });
    } else {
      setAuthChecking(false);
    }
  }, []);

  function handleAuthSuccess(userData) {
    setUser(userData);
    setError("");
    loadConversations();
  }

  function handleLogout() {
    handleStopStreaming();
    localStorage.removeItem("ragify_token");
    setUser(null);
    setConversations([]);
    setActiveConversation(null);
    setMessages([]);
    setError("");
  }

  function getErrorMessage(error) {
    return (
      error.response?.data?.message ||
      error.message ||
      "Something went wrong. Please try again."
    );
  }

  async function loadConversations() {
    try {
      setConversationsLoading(true);
      setError("");

      const data = await getConversations();

      setConversations(data);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setConversationsLoading(false);
    }
  }

  async function handleNewChat() {
    try {
      handleStopStreaming();
      setCreating(true);
      setError("");

      const conversation = await createConversation();

      setConversations((current) => [conversation, ...current]);

      setActiveConversation(conversation);
      setMessages([]);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setCreating(false);
    }
  }

  async function handleSelectConversation(id) {
    if (activeConversation?.id === id) return;

    try {
      handleStopStreaming();
      setLoading(true);
      setError("");

      const data = await getConversation(id);

      setActiveConversation(data.conversation);
      setMessages(data.messages || []);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(file) {
    if (!activeConversation) return;

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please select a valid PDF file.");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError("");

      await uploadDocument(activeConversation.id, file, (progress) => {
        setUploadProgress(progress);
      });

      const data = await getConversation(activeConversation.id);

      setActiveConversation(data.conversation);
      setMessages(data.messages || []);

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === activeConversation.id
            ? data.conversation
            : conversation,
        ),
      );
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function refreshConversationTitle(conversationId) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const data = await getConversation(conversationId);
      if (data.conversation?.title && data.conversation.title !== "New Chat") {
        setActiveConversation((current) =>
          current?.id === conversationId ? data.conversation : current,
        );
        setConversations((current) =>
          current.map((c) => (c.id === conversationId ? data.conversation : c)),
        );
      }
    } catch {
      // Ignore background title check error
    }
  }

  function handleStopStreaming() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setSending(false);
  }

  async function handleSendMessage(message) {
    if (!activeConversation || sending) return;

    const conversationId = activeConversation.id;
    const shouldGenerateTitle = activeConversation.title === "New Chat";

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
    };

    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantPlaceholder = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
    };

    let pendingChunk = "";
    let rafHandle = null;

    const flushBuffer = () => {
      if (pendingChunk) {
        const chunkToAppend = pendingChunk;
        pendingChunk = "";
        setMessages((current) =>
          current.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: msg.content + chunkToAppend }
              : msg,
          ),
        );
      }
      rafHandle = null;
    };

    try {
      setError("");

      setMessages((current) => [...current, userMessage, assistantPlaceholder]);

      setSending(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      await streamMessage(conversationId, message, {
        signal: controller.signal,
        onChunk: (token) => {
          pendingChunk += token;
          if (!rafHandle) {
            rafHandle = requestAnimationFrame(flushBuffer);
          }
        },
        onTitle: (newTitle) => {
          if (!newTitle) return;
          setActiveConversation((current) =>
            current?.id === conversationId
              ? { ...current, title: newTitle }
              : current,
          );
          setConversations((current) =>
            current.map((c) =>
              c.id === conversationId ? { ...c, title: newTitle } : c,
            ),
          );
        },
        onDone: () => {
          if (rafHandle) {
            cancelAnimationFrame(rafHandle);
          }
          flushBuffer();
          // If stopped before any token arrived, clean up empty assistant placeholder
          setMessages((current) => {
            const assistantMsg = current.find(
              (m) => m.id === assistantMessageId,
            );
            if (
              assistantMsg &&
              !assistantMsg.content.trim() &&
              !pendingChunk.trim()
            ) {
              return current.filter((m) => m.id !== assistantMessageId);
            }
            return current;
          });
          if (shouldGenerateTitle) {
            refreshConversationTitle(conversationId);
          }
        },
        onError: (err) => {
          if (rafHandle) {
            cancelAnimationFrame(rafHandle);
          }
          flushBuffer();
          setError(err.message || "Failed to generate response.");
          // Clean up empty assistant placeholder so it doesn't stay stuck in "Thinking..."
          setMessages((current) => {
            const assistantMsg = current.find(
              (m) => m.id === assistantMessageId,
            );
            if (assistantMsg && !assistantMsg.content.trim()) {
              return current.filter(
                (item) =>
                  item.id !== userMessage.id && item.id !== assistantMessageId,
              );
            }
            return current;
          });
        },
      });
    } catch (error) {
      if (rafHandle) {
        cancelAnimationFrame(rafHandle);
      }
      setError(getErrorMessage(error));

      setMessages((current) =>
        current.filter(
          (item) =>
            item.id !== userMessage.id && item.id !== assistantMessageId,
        ),
      );
    } finally {
      abortControllerRef.current = null;
      setSending(false);
    }
  }

  async function handleDeleteConversation(id) {
    try {
      if (activeConversation?.id === id) {
        handleStopStreaming();
      }
      setError("");

      await deleteConversation(id);

      setConversations((current) =>
        current.filter((conversation) => conversation.id !== id),
      );

      if (activeConversation?.id === id) {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch (error) {
      setError(getErrorMessage(error));
    }
  }

  if (authChecking) {
    return (
      <div className="auth-loading-screen">
        <div className="brand-logo auth-loading-logo">R</div>
        <p>Loading RAGify...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthModal onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversation?.id}
        loading={conversationsLoading}
        creating={creating}
        sidebarOpen={sidebarOpen}
        user={user}
        onNewChat={handleNewChat}
        onSelectConversation={(id) => {
          handleSelectConversation(id);
          setSidebarOpen(false);
        }}
        onDeleteConversation={handleDeleteConversation}
        onLogout={handleLogout}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-content">
        {!activeConversation && error && (
          <div className="global-error">
            <ErrorMessage message={error} onClose={() => setError("")} />
          </div>
        )}

        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            messages={messages}
            loading={loading}
            sending={sending}
            uploading={uploading}
            uploadProgress={uploadProgress}
            error={error}
            onClearError={() => setError("")}
            onUpload={handleUpload}
            onSendMessage={handleSendMessage}
            onStopStreaming={handleStopStreaming}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        ) : (
          <WelcomeScreen onNewChat={handleNewChat} creating={creating} />
        )}
      </div>
    </div>
  );
}

export default App;
