export type OptionKey = 'A' | 'B' | 'C' | 'D';

export interface Question {
  id: string;
  weekNumber: number; // 1 - 12
  questionNumber: number;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: OptionKey;
  explanation?: string;
  topic?: string;
  isDraft?: boolean; // true if this is an empty template slot waiting for user content
}

export interface QuestionProgress {
  questionId: string;
  attempts: number;
  incorrectAttempts: number;
  isMastered: boolean;
  lastSelectedAnswer?: OptionKey;
  lastAttemptDate?: string;
}

export interface WeekConfig {
  weekNumber: number;
  title: string;
  description?: string;
}

export interface CourseProgress {
  completedWeeks: number[];
  unlockedWeeks: number[];
  questionProgress: Record<string, QuestionProgress>;
  lastActiveWeek: number;
  lastActiveQuestionIndex: Record<number, number>; // weekNumber -> question index
}

export type ViewMode =
  | 'dashboard'
  | 'quiz'
  | 'management'
  | 'review_incorrect'
  | 'statistics'
  | 'course_completion';
