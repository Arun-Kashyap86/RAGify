import api from "./api";

export async function sendMessage(conversationId, message) {
  const response = await api.post("/chat", {
    conversationId,
    message,
  });

  return response.data;
}
