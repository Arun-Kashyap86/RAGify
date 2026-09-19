import { useState, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";

function Message({ role, content, isStreaming }) {
    const [copied, setCopied] = useState(false);
    const isUser = role === "user";

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

    return (
        <div className={`message-row ${isUser ? "user-row" : "assistant-row"}`}>
            <div className="message-content">
                <div className={`message ${isUser ? "user-message" : "assistant-message"}`}>
                    {isUser ? (
                        content
                    ) : !content ? (
                        <div className="thinking-dots">
                            Thinking<span>.</span><span>.</span><span>.</span>
                        </div>
                    ) : (
                        <>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                            {isStreaming && <span className="streaming-cursor" />}
                        </>
                    )}
                </div>

                {content && !isStreaming && (
                    <div className="message-actions">
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