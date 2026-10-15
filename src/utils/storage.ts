import type { Question, CourseProgress, WeekConfig } from '../types.js';
import { createInitialTemplate, createDefaultWeekConfigs, validateQuestion } from './quizRules.js';
import { INITIAL_QUESTIONS } from '../data/initialQuestions.js';

const STORAGE_KEYS = {
  QUESTIONS: 'my_exam_practice_questions_v1',
  PROGRESS: 'my_exam_practice_progress_v1',
  CONFIGS: 'my_exam_practice_configs_v1',
};

export const INITIAL_PROGRESS: CourseProgress = {
  completedWeeks: [],
  unlockedWeeks: [1],
  questionProgress: {},
  lastActiveWeek: 1,
  lastActiveQuestionIndex: { 1: 0 }
};

export function loadQuestions(): Question[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load questions from storage', err);
  }
  const defaultQuestions =
    INITIAL_QUESTIONS.length > 0
      ? INITIAL_QUESTIONS.map(question => ({ ...question, options: { ...question.options } }))
      : createInitialTemplate(12, 10);
  saveQuestions(defaultQuestions);
  return defaultQuestions;
}

export function saveQuestions(questions: Question[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
  } catch (err) {
    console.error('Failed to save questions to storage', err);
  }
}

export function loadProgress(): CourseProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        completedWeeks: parsed.completedWeeks || [],
        unlockedWeeks: parsed.unlockedWeeks || [1],
        questionProgress: parsed.questionProgress || {},
        lastActiveWeek: parsed.lastActiveWeek || 1,
        lastActiveQuestionIndex: parsed.lastActiveQuestionIndex || { 1: 0 }
      };
    }
  } catch (err) {
    console.error('Failed to load progress from storage', err);
  }
  saveProgress(INITIAL_PROGRESS);
  return INITIAL_PROGRESS;
}

export function saveProgress(progress: CourseProgress): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
  } catch (err) {
    console.error('Failed to save progress to storage', err);
  }
}

export function loadWeekConfigs(): WeekConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load week configs from storage', err);
  }
  const defaultConfigs = createDefaultWeekConfigs(12);
  saveWeekConfigs(defaultConfigs);
  return defaultConfigs;
}

export function saveWeekConfigs(configs: WeekConfig[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIGS, JSON.stringify(configs));
  } catch (err) {
    console.error('Failed to save week configs to storage', err);
  }
}

export function resetProgressOnly(): CourseProgress {
  saveProgress(INITIAL_PROGRESS);
  return INITIAL_PROGRESS;
}

export function resetAllToBlankTemplate(): { questions: Question[]; progress: CourseProgress; configs: WeekConfig[] } {
  const blankQuestions = createInitialTemplate(12, 10);
  const defaultConfigs = createDefaultWeekConfigs(12);
  saveQuestions(blankQuestions);
  saveProgress(INITIAL_PROGRESS);
  saveWeekConfigs(defaultConfigs);
  return {
    questions: blankQuestions,
    progress: INITIAL_PROGRESS,
    configs: defaultConfigs
  };
}

export function exportDataAsJSON(questions: Question[], configs: WeekConfig[], progress?: CourseProgress): string {
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      questions,
      configs,
      progress
    },
    null,
    2
  );
}

export function importDataFromJSON(jsonString: string): {
  success: boolean;
  questions?: Question[];
  configs?: WeekConfig[];
  progress?: CourseProgress;
  error?: string;
} {
  try {
    const parsed: unknown = JSON.parse(jsonString);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { success: false, error: 'Invalid JSON: expected an object containing questions.' };
    }

    const data = parsed as Record<string, unknown>;
    if (!Array.isArray(data.questions)) {
      return { success: false, error: 'Invalid JSON: missing questions array.' };
    }

    const validationErrors: string[] = [];
    const questionIds = new Set<string>();
    data.questions.forEach((question, index) => {
      const validation = validateQuestion(question);
      if (!validation.valid) {
        validationErrors.push(`Question ${index + 1}: ${validation.errors.join(' ')}`);
        return;
      }
      const id = (question as Question).id;
      if (questionIds.has(id)) {
        validationErrors.push(`Question ${index + 1}: duplicate question ID "${id}".`);
      } else {
        questionIds.add(id);
      }
    });
    if (validationErrors.length > 0) {
      return { success: false, error: validationErrors.join(' ') };
    }

    return {
      success: true,
      questions: data.questions as Question[],
      configs: Array.isArray(data.configs) ? data.configs : undefined,
      progress: data.progress ? (data.progress as CourseProgress) : undefined
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Invalid JSON format' };
  }
}
