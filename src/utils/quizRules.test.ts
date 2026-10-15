import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialTemplate,
  validateQuestion,
  calculateWeekMastery,
  calculateOverallProgress,
  isWeekUnlocked,
  canAdvanceToNextQuestion,
  recordAnswerAttempt,
  mergeQuestionBanks,
  parseTableOrCSV,
  reconcileQuestionBankProgress
} from './quizRules.ts';
import type { Question, QuestionProgress } from '../types.ts';
import { importDataFromJSON } from './storage.ts';

test('createInitialTemplate creates exactly 12 weeks with 10 questions each by default', () => {
  const template = createInitialTemplate(12, 10);
  assert.equal(template.length, 120);

  const week1Questions = template.filter(q => q.weekNumber === 1);
  assert.equal(week1Questions.length, 10);

  const week12Questions = template.filter(q => q.weekNumber === 12);
  assert.equal(week12Questions.length, 10);
});

test('validateQuestion detects invalid question fields', () => {
  const invalidEmpty: Partial<Question> = {
    text: '',
    weekNumber: 1
  };
  const res1 = validateQuestion(invalidEmpty);
  assert.equal(res1.valid, false);
  assert.ok(res1.errors.some(e => e.includes('Question text')));

  const validQuestion: Question = {
    id: 'w1-q1',
    weekNumber: 1,
    questionNumber: 1,
    text: 'What is the speed of light?',
    options: {
      A: '3 x 10^8 m/s',
      B: '3 x 10^6 m/s',
      C: '1.5 x 10^8 m/s',
      D: 'None of the above'
    },
    correctAnswer: 'A'
  };
  const res2 = validateQuestion(validQuestion);
  assert.equal(res2.valid, true);
  assert.equal(res2.errors.length, 0);
});

test('validateQuestion rejects malformed imported fields without throwing', () => {
  const result = validateQuestion({
    id: 'broken-question',
    weekNumber: 1,
    questionNumber: 1,
    text: 'Question?',
    options: { A: 5, B: 'B', C: 'C', D: 'D' },
    correctAnswer: 'A'
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes('Option A')));
});

test('importDataFromJSON rejects malformed and duplicate questions', () => {
  const malformed = importDataFromJSON(
    JSON.stringify({ questions: [{ id: 'broken', options: null }] })
  );
  assert.equal(malformed.success, false);
  assert.match(malformed.error || '', /Question 1:/);

  const duplicateIds = importDataFromJSON(
    JSON.stringify({
      questions: [
        {
          id: 'duplicate',
          weekNumber: 1,
          questionNumber: 1,
          text: 'First',
          options: { A: 'A', B: 'B', C: 'C', D: 'D' },
          correctAnswer: 'A'
        },
        {
          id: 'duplicate',
          weekNumber: 1,
          questionNumber: 2,
          text: 'Second',
          options: { A: 'A', B: 'B', C: 'C', D: 'D' },
          correctAnswer: 'A'
        }
      ]
    })
  );
  assert.equal(duplicateIds.success, false);
  assert.match(duplicateIds.error || '', /duplicate question ID/);
});

test('reconcileQuestionBankProgress clears changed mastery and relocks later weeks', () => {
  const previousQuestions: Question[] = [
    {
      id: 'w1-q1',
      weekNumber: 1,
      questionNumber: 1,
      text: 'Original question',
      options: { A: '1', B: '2', C: '3', D: '4' },
      correctAnswer: 'A'
    }
  ];
  const progress: import('../types.ts').CourseProgress = {
    completedWeeks: [1, 2],
    unlockedWeeks: [1, 2, 3],
    questionProgress: {
      'w1-q1': {
        questionId: 'w1-q1',
        attempts: 1,
        incorrectAttempts: 0,
        isMastered: true
      }
    },
    lastActiveWeek: 2,
    lastActiveQuestionIndex: { 1: 0, 2: 0 }
  };

  const reconciled = reconcileQuestionBankProgress(
    previousQuestions,
    [{ ...previousQuestions[0], text: 'Changed question' }],
    progress
  );

  assert.equal(reconciled.questionProgress['w1-q1'], undefined);
  assert.deepEqual(reconciled.completedWeeks, []);
  assert.deepEqual(reconciled.unlockedWeeks, [1]);
});

test('calculateWeekMastery enforces strict 100% completion requirement', () => {
  const questions: Question[] = [
    {
      id: 'q1',
      weekNumber: 1,
      questionNumber: 1,
      text: 'Q1',
      options: { A: '1', B: '2', C: '3', D: '4' },
      correctAnswer: 'A'
    },
    {
      id: 'q2',
      weekNumber: 1,
      questionNumber: 2,
      text: 'Q2',
      options: { A: '1', B: '2', C: '3', D: '4' },
      correctAnswer: 'B'
    }
  ];

  // Only 1 question mastered
  const progressMap1: Record<string, QuestionProgress> = {
    q1: { questionId: 'q1', attempts: 2, incorrectAttempts: 1, isMastered: true },
    q2: { questionId: 'q2', attempts: 1, incorrectAttempts: 1, isMastered: false }
  };

  const mastery1 = calculateWeekMastery(questions, progressMap1);
  assert.equal(mastery1.masteredCount, 1);
  assert.equal(mastery1.totalCount, 2);
  assert.equal(mastery1.percentage, 50);
  assert.equal(mastery1.isCompleted, false);
  assert.equal(mastery1.incorrectAttemptsCount, 2);

  // Both mastered
  const progressMap2: Record<string, QuestionProgress> = {
    ...progressMap1,
    q2: { questionId: 'q2', attempts: 2, incorrectAttempts: 1, isMastered: true }
  };

  const mastery2 = calculateWeekMastery(questions, progressMap2);
  assert.equal(mastery2.masteredCount, 2);
  assert.equal(mastery2.percentage, 100);
  assert.equal(mastery2.isCompleted, true);
});

test('isWeekUnlocked strictly locks Week N until Week N-1 is completed', () => {
  // Week 1 is always unlocked
  assert.equal(isWeekUnlocked(1, [1], []), true);

  // Week 2 is locked if Week 1 is not completed
  assert.equal(isWeekUnlocked(2, [1], []), false);

  // Week 2 is unlocked when Week 1 is in completedWeeks
  assert.equal(isWeekUnlocked(2, [1, 2], [1]), true);

  // Week 3 is locked if Week 2 is not completed
  assert.equal(isWeekUnlocked(3, [1, 2], [1]), false);
  assert.equal(isWeekUnlocked(3, [1, 2, 3], [1, 2]), true);
});

test('canAdvanceToNextQuestion blocks advancing on incorrect attempt', () => {
  // Not previously mastered, not currently answered correctly
  assert.equal(canAdvanceToNextQuestion(false, false), false);

  // Answered correctly now
  assert.equal(canAdvanceToNextQuestion(false, true), true);

  // Previously mastered
  assert.equal(canAdvanceToNextQuestion(true, false), true);
});

test('recordAnswerAttempt tracks attempts, errors, and mastery correctly', () => {
  const qId = 'test-q';
  
  // First attempt is wrong
  const p1 = recordAnswerAttempt(undefined, qId, 'B', false);
  assert.equal(p1.attempts, 1);
  assert.equal(p1.incorrectAttempts, 1);
  assert.equal(p1.isMastered, false);
  assert.equal(p1.lastSelectedAnswer, 'B');

  // Second attempt is also wrong
  const p2 = recordAnswerAttempt(p1, qId, 'C', false);
  assert.equal(p2.attempts, 2);
  assert.equal(p2.incorrectAttempts, 2);
  assert.equal(p2.isMastered, false);

  // Third attempt is correct
  const p3 = recordAnswerAttempt(p2, qId, 'A', true);
  assert.equal(p3.attempts, 3);
  assert.equal(p3.incorrectAttempts, 2);
  assert.equal(p3.isMastered, true);
  assert.equal(p3.lastSelectedAnswer, 'A');
});

test('calculateOverallProgress accurately aggregates course metrics', () => {
  const questions: Question[] = [
    { id: '1', weekNumber: 1, questionNumber: 1, text: '', options: { A:'', B:'', C:'', D:'' }, correctAnswer: 'A' },
    { id: '2', weekNumber: 1, questionNumber: 2, text: '', options: { A:'', B:'', C:'', D:'' }, correctAnswer: 'A' },
    { id: '3', weekNumber: 2, questionNumber: 1, text: '', options: { A:'', B:'', C:'', D:'' }, correctAnswer: 'A' },
    { id: '4', weekNumber: 2, questionNumber: 2, text: '', options: { A:'', B:'', C:'', D:'' }, correctAnswer: 'A' }
  ];

  const progress: Record<string, QuestionProgress> = {
    '1': { questionId: '1', attempts: 1, incorrectAttempts: 0, isMastered: true },
    '2': { questionId: '2', attempts: 3, incorrectAttempts: 2, isMastered: true },
    '3': { questionId: '3', attempts: 2, incorrectAttempts: 2, isMastered: false }
  };

  const res = calculateOverallProgress(questions, progress);
  assert.equal(res.totalQuestions, 4);
  assert.equal(res.masteredQuestions, 2);
  assert.equal(res.percentage, 50); // 2/4 = 50%
  assert.equal(res.totalAttempts, 6); // 1 + 3 + 2
  assert.equal(res.totalIncorrect, 4); // 0 + 2 + 2
  assert.equal(res.questionsNeedingPractice, 2); // '2' and '3' had incorrect attempts
  assert.equal(res.accuracyPercentage, 33); // (6 - 4) / 6 = 2/6 = 33%
});

test('mergeQuestionBanks combines questions without overwriting unaffected weeks', () => {
  const existing: Question[] = [
    { id: 'w1-q1', weekNumber: 1, questionNumber: 1, text: 'Old Q1', options: { A:'1', B:'2', C:'3', D:'4' }, correctAnswer: 'A' },
    { id: 'w2-q1', weekNumber: 2, questionNumber: 1, text: 'Old Week 2', options: { A:'1', B:'2', C:'3', D:'4' }, correctAnswer: 'A' }
  ];

  const incoming: Question[] = [
    { id: 'new-id', weekNumber: 1, questionNumber: 1, text: 'Teammate Updated Q1', options: { A:'10', B:'20', C:'30', D:'40' }, correctAnswer: 'B' },
    { id: 'w3-q1', weekNumber: 3, questionNumber: 1, text: 'Teammate Added Week 3', options: { A:'a', B:'b', C:'c', D:'d' }, correctAnswer: 'C' }
  ];

  const merged = mergeQuestionBanks(existing, incoming);
  assert.equal(merged.length, 3);
  // Week 1 Q1 updated
  assert.equal(merged[0].text, 'Teammate Updated Q1');
  assert.equal(merged[0].correctAnswer, 'B');
  // Week 2 Q1 preserved
  assert.equal(merged[1].text, 'Old Week 2');
  // Week 3 Q1 added
  assert.equal(merged[2].text, 'Teammate Added Week 3');
});

test('parseTableOrCSV correctly parses TSV rows copied from Google Sheets', () => {
  const tsvData = `Week\tQuestion\tTopic\tQuestionText\tOptA\tOptB\tOptC\tOptD\tAnswer\tExplanation
1\t1\tPhysics\tWhat is G?\t9.8\t10\t8.9\t12\tA\tGravity
1\t2\tChemistry\tWater formula\tCO2\tH2O\tO2\tNaCl\tB\tDihydrogen monoxide`;

  const res = parseTableOrCSV(tsvData);
  assert.equal(res.success, true);
  assert.equal(res.questions?.length, 2);
  assert.equal(res.questions?.[0].correctAnswer, 'A');
  assert.equal(res.questions?.[0].options.A, '9.8');
  assert.equal(res.questions?.[1].correctAnswer, 'B');
  assert.equal(res.questions?.[1].options.B, 'H2O');
});
