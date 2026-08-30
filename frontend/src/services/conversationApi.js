import api from "./api";

export async function createConversation(title = "New Chat") {
  const response = await api.post("/conversations", { title });
  return response.data;
}

export async function getConversations() {
  const response = await api.get("/conversations");
  return response.data;
}

export async function getConversation(id) {
  const response = await api.get(`/conversations/${id}`);
  return response.data;
}

export async function deleteConversation(id) {
  const response = await api.delete(`/conversations/${id}`);
  return response.data;
}
