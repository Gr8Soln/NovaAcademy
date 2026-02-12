import api from "./api";

export const documentsApi = {
  list: (offset = 0, limit = 20) =>
    api(`/documents/?offset=${offset}&limit=${limit}`),

  get: (id: string) => api(`/documents/${id}`),

  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api("/documents/", { method: "POST", body: form });
  },
};
