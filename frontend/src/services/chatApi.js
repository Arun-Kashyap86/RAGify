import api from "./api";

const BASE_URL = api.defaults.baseURL || "http://localhost:5000/api";

export async function sendMessage(conversationId, message) {
  const response = await api.post("/chat", {
    conversationId,
    message,
  });

  return response.data;
}

export async function streamMessage(
  conversationId,
  message,
  { onChunk, onTitle, onDone, onError, signal },
) {
  let reader = null;
  try {
    const token = localStorage.getItem("ragify_token");
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (signal?.aborted) {
      onDone?.();
      return;
    }

    const response = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers,
      signal,
      body: JSON.stringify({
        conversationId,
        message,
      }),
    });

    if (!response.ok) {
      let errorMsg = "Failed to send message";
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch {
        // Fallback
      }
      throw new Error(errorMsg);
    }

    reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Streaming is not supported by the browser response");
    }

    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      if (signal?.aborted) {
        try {
          await reader.cancel();
        } catch {
          // Ignore
        }
        onDone?.();
        return;
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;

        const dataStr = trimmed.slice(5).trim();
        if (dataStr === "[DONE]") {
          onDone?.();
          return;
        }

        let parsed;
        try {
          parsed = JSON.parse(dataStr);
        } catch {
          // Malformed chunk or partial JSON
          continue;
        }

        if (parsed.error) {
          throw new Error(parsed.error);
        }
        if (typeof parsed.title === "string") {
          onTitle?.(parsed.title);
        }
        if (typeof parsed.token === "string") {
          onChunk?.(parsed.token);
        }
      }
    }

    onDone?.();
  } catch (error) {
    if (signal?.aborted || error.name === "AbortError") {
      try {
        if (reader) await reader.cancel();
      } catch {
        // Ignore
      }
      onDone?.();
      return;
    }

    if (typeof onError === "function") {
      onError(error);
    } else {
      throw error;
    }
  }
}
