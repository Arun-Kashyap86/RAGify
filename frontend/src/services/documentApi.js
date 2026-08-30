import api from "./api";

export async function uploadDocument(conversationId, file, onProgress) {
  const formData = new FormData();

  formData.append("conversationId", conversationId);
  formData.append("pdf", file);

  const response = await api.post("/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (event) => {
      if (!event.total) return;

      const progress = Math.round((event.loaded * 100) / event.total);
      onProgress?.(progress);
    },
  });

  return response.data;
}
