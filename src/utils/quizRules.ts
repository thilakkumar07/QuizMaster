import type {
  Question,
  QuestionProgress,
  WeekConfig,
  OptionKey,
  CourseProgress
} from '../types.js';

export function createDefaultWeekConfigs(weeksCount: number = 12): WeekConfig[] {
  const configs: WeekConfig[] = [];
  for (let i = 1; i <= weeksCount; i++) {
    configs.push({
      weekNumber: i,
      title: `Week ${i}: Syllabus Module ${i}`,
      description: `Practice questions covering Week ${i} topics.`
    });
  }
  return configs;
}

export function createInitialTemplate(weeksCount: number = 12, questionsPerWeek: number = 10): Question[] {
  const questions: Question[] = [];
  for (let w = 1; w <= weeksCount; w++) {
    for (let q = 1; q <= questionsPerWeek; q++) {
      questions.push({
        id: `w${w}-q${q}`,
        weekNumber: w,
        questionNumber: q,
        text: `Question ${q} for Week ${w}`,
        options: {
          A: 'Option A description',
          B: 'Option B description',
          C: 'Option C description',
          D: 'Option D description'
        },
        correctAnswer: 'A',
        explanation: '',
        topic: `Week ${w} General`,
        isDraft: true // Marked as template slot ready for user customization
      });
    }
  }
  return questions;
}

export function validateQuestion(q: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const question =
    typeof q === 'object' && q !== null && !Array.isArray(q)
      ? (q as Record<string, unknown>)
      : {};

  if (typeof question.text !== 'string' || question.text.trim().length === 0) {
    errors.push('Question text cannot be empty.');
  }

  const options =
    typeof question.options === 'object' &&
    question.options !== null &&
    !Array.isArray(question.options)
      ? (question.options as Record<string, unknown>)
      : null;

  if (!options) {
    errors.push('All 4 options (A, B, C, D) must be provided.');
  } else {
    const keys: OptionKey[] = ['A', 'B', 'C', 'D'];
    for (const key of keys) {
      if (typeof options[key] !== 'string' || options[key].trim().length === 0) {
        errors.push(`Option ${key} cannot be empty.`);
      }
    }
  }

  if (
    typeof question.correctAnswer !== 'string' ||
    !['A', 'B', 'C', 'D'].includes(question.correctAnswer)
  ) {
    errors.push('A valid correct answer (A, B, C, or D) must be selected.');
  }

  if (
    !Number.isInteger(question.weekNumber) ||
    (question.weekNumber as number) < 1 ||
    (question.weekNumber as number) > 12
  ) {
    errors.push('Week number must be between 1 and 12.');
  }

  if (!Number.isInteger(question.questionNumber) || (question.questionNumber as number) < 1) {
    errors.push('Question number must be a positive integer.');
  }

  if (typeof question.id !== 'string' || question.id.trim().length === 0) {
    errors.push('Question ID cannot be empty.');
  }

  if (
    (question.explanation !== undefined && typeof question.explanation !== 'string') ||
    (question.topic !== undefined && typeof question.topic !== 'string') ||
    (question.isDraft !== undefined && typeof question.isDraft !== 'boolean')
  ) {
    errors.push('Optional question fields have invalid types.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function reconcileQuestionBankProgress(
  previousQuestions: Question[],
  nextQuestions: Question[],
  progress: CourseProgress
): CourseProgress {
  const previousById = new Map(previousQuestions.map(question => [question.id, question]));
  const nextIds = new Set(nextQuestions.map(question => question.id));
  const questionProgress = { ...progress.questionProgress };

  for (const question of nextQuestions) {
    const previous = previousById.get(question.id);
    if (
      !previous ||
      previous.weekNumber !== question.weekNumber ||
      previous.text !== question.text ||
      previous.options.A !== question.options.A ||
      previous.options.B !== question.options.B ||
      previous.options.C !== question.options.C ||
      previous.options.D !== question.options.D ||
      previous.correctAnswer !== question.correctAnswer ||
      previous.explanation !== question.explanation ||
      previous.topic !== question.topic ||
      previous.isDraft !== question.isDraft
    ) {
      delete questionProgress[question.id];
    }
  }

  for (const questionId of Object.keys(questionProgress)) {
    if (!nextIds.has(questionId)) {
      delete questionProgress[questionId];
    }
  }

  const completedWeeks = Array.from({ length: 12 }, (_, index) => index + 1).filter(weekNumber =>
    calculateWeekMastery(
      nextQuestions.filter(question => question.weekNumber === weekNumber),
      questionProgress
    ).isCompleted
  );
  const unlockedWeeks = [1];
  for (let weekNumber = 1; weekNumber < 12 && completedWeeks.includes(weekNumber); weekNumber++) {
    unlockedWeeks.push(weekNumber + 1);
  }

  return {
    ...progress,
    questionProgress,
    completedWeeks,
    unlockedWeeks
  };
}

export function calculateWeekMastery(
  questionsInWeek: Question[],
  progressMap: Record<string, QuestionProgress>
): {
  masteredCount: number;
  totalCount: number;
  percentage: number;
  isCompleted: boolean;
  incorrectAttemptsCount: number;
} {
  const totalCount = questionsInWeek.length;
  if (totalCount === 0) {
    return {
      masteredCount: 0,
      totalCount: 0,
      percentage: 0,
      isCompleted: false,
      incorrectAttemptsCount: 0
    };
  }

  let masteredCount = 0;
  let incorrectAttemptsCount = 0;

  for (const q of questionsInWeek) {
    const p = progressMap[q.id];
    if (p) {
      if (p.isMastered) {
        masteredCount++;
      }
      incorrectAttemptsCount += p.incorrectAttempts || 0;
    }
  }

  const percentage = Math.round((masteredCount / totalCount) * 100);
  const isCompleted = masteredCount === totalCount;

  return {
    masteredCount,
    totalCount,
    percentage,
    isCompleted,
    incorrectAttemptsCount
  };
}

export function calculateOverallProgress(
  allQuestions: Question[],
  progressMap: Record<string, QuestionProgress>
): {
  totalQuestions: number;
  masteredQuestions: number;
  percentage: number;
  totalAttempts: number;
  totalIncorrect: number;
  accuracyPercentage: number;
  questionsNeedingPractice: number;
} {
  const totalQuestions = allQuestions.length;
  if (totalQuestions === 0) {
    return {
      totalQuestions: 0,
      masteredQuestions: 0,
      percentage: 0,
      totalAttempts: 0,
      totalIncorrect: 0,
      accuracyPercentage: 0,
      questionsNeedingPractice: 0
    };
  }

  let masteredQuestions = 0;
  let totalAttempts = 0;
  let totalIncorrect = 0;
  let questionsNeedingPractice = 0;

  for (const q of allQuestions) {
    const p = progressMap[q.id];
    if (p) {
      if (p.isMastered) {
        masteredQuestions++;
      }
      totalAttempts += p.attempts || 0;
      totalIncorrect += p.incorrectAttempts || 0;
      if (p.incorrectAttempts > 0) {
        questionsNeedingPractice++;
      }
    }
  }

  const percentage = Math.round((masteredQuestions / totalQuestions) * 100);
  const correctAttempts = totalAttempts - totalIncorrect;
  const accuracyPercentage =
    totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

  return {
    totalQuestions,
    masteredQuestions,
    percentage,
    totalAttempts,
    totalIncorrect,
    accuracyPercentage: Math.max(0, accuracyPercentage),
    questionsNeedingPractice
  };
}

export function isWeekUnlocked(
  weekNumber: number,
  unlockedWeeks: number[],
  completedWeeks: number[]
): boolean {
  if (weekNumber === 1) return true;
  if (unlockedWeeks.includes(weekNumber)) return true;
  // A week N (N > 1) is unlocked strictly if week N - 1 is completed
  return completedWeeks.includes(weekNumber - 1);
}

export function canAdvanceToNextQuestion(
  isCurrentQuestionMastered: boolean,
  isCurrentAnswerSubmittedAndCorrect: boolean
): boolean {
  // Strict rule: Next Question button becomes available only after the current answer is correct
  // or if the question was already previously mastered.
  return isCurrentQuestionMastered || isCurrentAnswerSubmittedAndCorrect;
}

export function recordAnswerAttempt(
  existingProgress: QuestionProgress | undefined,
  questionId: string,
  selectedAnswer: OptionKey,
  isCorrect: boolean
): QuestionProgress {
  const attempts = (existingProgress?.attempts || 0) + 1;
  const incorrectAttempts = (existingProgress?.incorrectAttempts || 0) + (isCorrect ? 0 : 1);
  const isMastered = isCorrect || (existingProgress?.isMastered ?? false);

  return {
    questionId,
    attempts,
    incorrectAttempts,
    isMastered,
    lastSelectedAnswer: selectedAnswer,
    lastAttemptDate: new Date().toISOString()
  };
}

export function mergeQuestionBanks(existing: Question[], incoming: Question[]): Question[] {
  const result = [...existing];

  for (const inc of incoming) {
    // Look for matching slot by (weekNumber, questionNumber) or id
    const matchIdx = result.findIndex(
      q => q.id === inc.id || (q.weekNumber === inc.weekNumber && q.questionNumber === inc.questionNumber)
    );

    if (matchIdx !== -1) {
      // If incoming has content, overwrite or update that slot
      result[matchIdx] = {
        ...result[matchIdx],
        ...inc,
        id: result[matchIdx].id // preserve existing ID so progress isn't orphaned
      };
    } else {
      result.push(inc);
    }
  }

  // Sort by week then question number
  return result.sort((a, b) => a.weekNumber - b.weekNumber || a.questionNumber - b.questionNumber);
}

export function exportToCSV(questions: Question[]): string {
  const header = ['Week', 'QuestionNumber', 'Topic', 'QuestionText', 'OptionA', 'OptionB', 'OptionC', 'OptionD', 'CorrectAnswer', 'Explanation'];
  const rows = questions.map(q => {
    const fields = [
      q.weekNumber,
      q.questionNumber,
      `"${(q.topic || '').replace(/"/g, '""')}"`,
      `"${q.text.replace(/"/g, '""')}"`,
      `"${q.options.A.replace(/"/g, '""')}"`,
      `"${q.options.B.replace(/"/g, '""')}"`,
      `"${q.options.C.replace(/"/g, '""')}"`,
      `"${q.options.D.replace(/"/g, '""')}"`,
      q.correctAnswer,
      `"${(q.explanation || '').replace(/"/g, '""')}"`
    ];
    return fields.join(',');
  });

  return [header.join(','), ...rows].join('\n');
}

export function parseTableOrCSV(rawText: string): { success: boolean; questions?: Question[]; errors?: string[] } {
  const lines = rawText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) {
    return { success: false, errors: ['Input is empty.'] };
  }

  // Detect delimiter: tab (Google Sheets copy) vs comma (CSV)
  const firstLine = lines[0];
  const isTSV = firstLine.includes('\t');
  const delimiter = isTSV ? '\t' : ',';

  // Check if first line is header
  let startIdx = 0;
  if (/week|question/i.test(firstLine)) {
    startIdx = 1;
  }

  const parsedQuestions: Question[] = [];
  const errors: string[] = [];

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    let parts: string[];

    if (isTSV) {
      parts = line.split('\t').map(s => s.trim());
    } else {
      // Basic CSV splitter handling quotes
      const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g;
      parts = [];
      let match;
      while ((match = regex.exec(line)) !== null) {
        let field = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
        parts.push(field.trim());
        if (regex.lastIndex === line.length) break;
      }
    }

    if (parts.length < 9) {
      errors.push(`Row ${i + 1}: Expected at least 9 columns, found ${parts.length}.`);
      continue;
    }

    const weekNum = parseInt(parts[0], 10);
    const qNum = parseInt(parts[1], 10);
    const topic = parts[2];
    const text = parts[3];
    const optA = parts[4];
    const optB = parts[5];
    const optC = parts[6];
    const optD = parts[7];
    const rawAns = parts[8].toUpperCase().trim();
    const explanation = parts[9] || '';

    if (isNaN(weekNum) || weekNum < 1 || weekNum > 12) {
      errors.push(`Row ${i + 1}: Invalid week number "${parts[0]}". Must be 1–12.`);
      continue;
    }

    if (!['A', 'B', 'C', 'D'].includes(rawAns)) {
      errors.push(`Row ${i + 1}: Invalid correct answer "${parts[8]}". Must be A, B, C, or D.`);
      continue;
    }

    parsedQuestions.push({
      id: `w${weekNum}-q${qNum || i + 1}-${Date.now()}`,
      weekNumber: weekNum,
      questionNumber: qNum || i + 1,
      topic: topic || undefined,
      text: text,
      options: {
        A: optA,
        B: optB,
        C: optC,
        D: optD
      },
      correctAnswer: rawAns as OptionKey,
      explanation: explanation || undefined,
      isDraft: false
    });
  }

  if (parsedQuestions.length === 0) {
    return { success: false, errors: errors.length > 0 ? errors : ['No valid questions could be parsed.'] };
  }

  return { success: true, questions: parsedQuestions, errors };
}
