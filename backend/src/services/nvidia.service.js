const axios = require("axios");
const https = require("https");
const config = require("../config/env");

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  keepAliveMsecs: 60000,
});

const client = axios.create({
  baseURL: NVIDIA_BASE_URL,
  httpsAgent,
  timeout: 60000,
  headers: {
    Authorization: `Bearer ${config.nvidiaApiKey}`,
    "Content-Type": "application/json",
  },
});

async function generateAnswer(messages, options = {}) {
  const response = await client.post("/chat/completions", {
    model: options.model || config.llmModel,
    messages,
    temperature: options.temperature ?? 0.2,
    max_tokens: options.max_tokens || 4096,
  });

  return response.data?.choices?.[0]?.message?.content || "";
}

async function generateAnswerStream(messages, onChunk, options = {}) {
  if (options.signal?.aborted) {
    return "";
  }

  const response = await client.post(
    "/chat/completions",
    {
      model: options.model || config.llmModel,
      messages,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.max_tokens || 4096,
      stream: true,
    },
    {
      responseType: "stream",
      signal: options.signal,
    },
  );

  return new Promise((resolve, reject) => {
    let fullText = "";
    let buffer = "";
    let isSettled = false;
    let inactivityTimer = null;

    const resetInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        console.warn("NVIDIA stream inactive for 35s. Halting stream.");
        try {
          response.data.destroy();
        } catch (_) {}
        safeResolve(fullText);
      }, 35000);
    };

    const cleanup = () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
      }
      if (options.signal && onAbort) {
        options.signal.removeEventListener("abort", onAbort);
      }
    };

    const safeResolve = (val) => {
      if (isSettled) return;
      isSettled = true;
      cleanup();
      resolve(val);
    };

    const safeReject = (err) => {
      if (isSettled) return;
      isSettled = true;
      cleanup();
      reject(err);
    };

    resetInactivityTimer();

    const onAbort = () => {
      try {
        response.data.destroy();
      } catch (_) {}
      safeResolve(fullText);
    };

    if (options.signal) {
      if (options.signal.aborted) {
        onAbort();
        return;
      }
      options.signal.addEventListener("abort", onAbort, { once: true });
    }

    response.data.on("data", (chunk) => {
      resetInactivityTimer();

      if (options.signal?.aborted) {
        onAbort();
        return;
      }

      buffer += chunk.toString("utf-8");
      const lines = buffer.split("\n");
      // Keep the last segment (might be incomplete line)
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;

        const dataStr = trimmed.slice(5).trim();
        if (dataStr === "[DONE]") {
          continue;
        }

        try {
          const parsed = JSON.parse(dataStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullText += content;
            if (typeof onChunk === "function") {
              onChunk(content);
            }
          }
        } catch (err) {
          // Incomplete or non-JSON chunk; ignore
        }
      }
    });

    response.data.on("end", () => {
      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith("data:")) {
          const dataStr = trimmed.slice(5).trim();
          if (dataStr !== "[DONE]") {
            try {
              const parsed = JSON.parse(dataStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullText += content;
                if (typeof onChunk === "function") {
                  onChunk(content);
                }
              }
            } catch (err) {
              // Ignore
            }
          }
        }
      }
      safeResolve(fullText);
    });

    response.data.on("error", (error) => {
      if (
        options.signal?.aborted ||
        error.code === "ERR_CANCELED" ||
        error.message === "canceled"
      ) {
        safeResolve(fullText);
      } else {
        safeReject(error);
      }
    });
  });
}

module.exports = {
  generateAnswer,
  generateAnswerStream,
};
