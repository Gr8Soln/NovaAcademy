import { useAuthStore } from "@/stores";
import api, { BASE_URL } from "./api";

export const aiApi = {
  askStream: (documentId: string, question: string, topK = 5) => {
    const token = useAuthStore.getState().accessToken;
    return fetch(`${BASE_URL}/ai/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        document_id: documentId,
        question,
        top_k: topK,
      }),
    });
  },

  summaryStream: (documentId: string) => {
    const token = useAuthStore.getState().accessToken;
    return fetch(`${BASE_URL}/ai/summary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ document_id: documentId }),
    });
  },

  generateQuiz: (documentId: string, numQuestions = 10) =>
    api("/ai/quiz", {
      method: "POST",
      body: JSON.stringify({
        document_id: documentId,
        num_questions: numQuestions,
      }),
    }),

  generateFlashcards: (documentId: string, numCards = 20) =>
    api("/ai/flashcards", {
      method: "POST",
      body: JSON.stringify({
        document_id: documentId,
        num_cards: numCards,
      }),
    }),
};
