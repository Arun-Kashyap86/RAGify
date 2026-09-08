import { useRef, useState, memo } from "react";
import { Square } from "lucide-react";

function ChatInput({
  disabled,
  sending,
  uploading,
  uploadProgress,
  hasDocument,
  onSendMessage,
  onUpload,
  onStopGenerating,
}) {
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);

  function submitMessage() {
    const text = message.trim();

    if (!text || disabled || uploading) return;

    onSendMessage(text);
    setMessage("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    submitMessage();
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitMessage();
    }
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    onUpload(file);
    event.target.value = "";
  }

  function openFileSelector() {
    fileInputRef.current?.click();
  }

  const isProcessing = uploading && uploadProgress >= 100;

  return (
    <div className="input-wrapper">
      {uploading && (
        <div className="upload-status">
          <div className="upload-status-header">
            <span>
              {isProcessing ? "Processing document..." : "Uploading PDF..."}
            </span>
            {!isProcessing && <span>{uploadProgress}%</span>}
          </div>

          {!isProcessing ? (
            <div className="upload-progress-track">
              <div
                className="upload-progress-bar"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          ) : (
            <div className="processing-loader">
              <div className="processing-bar" />
            </div>
          )}

          {isProcessing && (
            <p className="processing-text">
              Extracting text, creating embeddings and storing document data...
            </p>
          )}
        </div>
      )}

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          hidden
        />

        {!hasDocument && (
          <button
            type="button"
            className="upload-icon-button"
            disabled={disabled || uploading}
            onClick={openFileSelector}
            title="Upload PDF"
          >
            +
          </button>
        )}

        <textarea
          value={message}
          rows="1"
          disabled={disabled || uploading}
          placeholder={
            uploading ? "Please wait..." : "Ask anything or upload a PDF..."
          }
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
        />

        {sending ? (
          <button
            type="button"
            className="stop-button"
            onClick={onStopGenerating}
            title="Stop generating"
            aria-label="Stop generating"
          >
            <Square size={13} fill="currentColor" />
          </button>
        ) : (
          <button
            type="submit"
            className="send-button"
            disabled={disabled || uploading || !message.trim()}
            title="Send message"
            aria-label="Send message"
          >
            ➤
          </button>
        )}
      </form>
    </div>
  );
}

export default memo(ChatInput);
