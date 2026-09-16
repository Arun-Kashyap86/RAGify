import { useState, useEffect, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, Pencil } from "lucide-react";

function Message({ id, role, content, isStreaming, onEditSubmit, disabled }) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(content || "");
  const isUser = role === "user";

  // Keep editText in sync if content changes externally
  useEffect(() => {
    setEditText(content || "");
  }, [content]);

  async function handleCopy() {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error("Failed to copy message:", error);
    }
  }

  function handleStartEdit() {
    if (disabled || isStreaming) return;
    setEditText(content || "");
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setEditText(content || "");
    setIsEditing(false);
  }

  function handleSaveEdit() {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === content || disabled) {
      setIsEditing(false);
      return;
    }
    setIsEditing(false);
    if (typeof onEditSubmit === "function") {
      onEditSubmit(id, trimmed);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  }

  return (
    <div className={`message-row ${isUser ? "user-row" : "assistant-row"}`}>
      <div className="message-content">
        {isEditing ? (
          <div className="message-edit-container">
            <textarea
              className="message-edit-textarea"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              rows={Math.min(8, Math.max(2, editText.split("\n").length))}
            />
            <div className="message-edit-actions">
              <button
                type="button"
                className="message-edit-cancel"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
              <button
                type="button"
                className="message-edit-save"
                onClick={handleSaveEdit}
                disabled={!editText.trim() || disabled}
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`message ${isUser ? "user-message" : "assistant-message"}`}
          >
            {isUser ? (
              content
            ) : !content ? (
              <div className="thinking-dots">
                Thinking<span>.</span>
                <span>.</span>
                <span>.</span>
              </div>
            ) : (
              <>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
                {isStreaming && <span className="streaming-cursor" />}
              </>
            )}
          </div>
        )}

        {content && !isStreaming && !isEditing && (
          <div className="message-actions">
            {isUser && onEditSubmit && (
              <button
                type="button"
                className="message-action-button"
                onClick={handleStartEdit}
                title="Edit message"
                aria-label="Edit message"
                disabled={disabled}
              >
                <Pencil size={15} />
              </button>
            )}
            <button
              type="button"
              className="message-action-button"
              onClick={handleCopy}
              title={copied ? "Copied" : "Copy"}
              aria-label={copied ? "Copied" : "Copy message"}
            >
              {copied ? <Check size={17} /> : <Copy size={17} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(Message);
