import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Check, Copy } from "lucide-react";

function Message({ role, content }) {
    const [copied, setCopied] = useState(false);
    const isUser = role === "user";

    async function handleCopy() {
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
                    {isUser ? content : <ReactMarkdown>{content}</ReactMarkdown>}
                </div>

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
            </div>
        </div>
    );
}

export default Message;