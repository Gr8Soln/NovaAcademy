export interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: string;
  order: number;
}

export interface Quiz {
  id: string;
  user_id: string;
  document_id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  total_questions: number;
  created_at: string;
}

export interface Flashcard {
  front: string;
  back: string;
}
