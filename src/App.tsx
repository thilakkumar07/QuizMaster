/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ViewMode, Question, CourseProgress, WeekConfig } from './types.js';
import {
  loadQuestions,
  saveQuestions,
  loadProgress,
  saveProgress,
  loadWeekConfigs,
  saveWeekConfigs,
  resetProgressOnly,
  resetAllToBlankTemplate
} from './utils/storage.js';
import { Header } from './components/Header.js';
import { Dashboard } from './components/Dashboard.js';
import { QuizView } from './components/QuizView.js';
import { QuestionManager } from './components/QuestionManager.js';
import { ReviewMistakesView } from './components/ReviewMistakesView.js';
import { StatisticsView } from './components/StatisticsView.js';
import { ConfirmationModal } from './components/ConfirmationModal.js';
import { WeekCompletionModal } from './components/WeekCompletionModal.js';
import { CourseCompletionModal } from './components/CourseCompletionModal.js';
import {
  calculateOverallProgress,
  reconcileQuestionBankProgress
} from './utils/quizRules.js';

export default function App() {
  const [questions, setQuestions] = React.useState<Question[]>(() => loadQuestions());
  const [progress, setProgress] = React.useState<CourseProgress>(() => loadProgress());
  const [weekConfigs, setWeekConfigs] = React.useState<WeekConfig[]>(() => loadWeekConfigs());

  const [currentView, setCurrentView] = React.useState<ViewMode>('dashboard');
  const [activeWeek, setActiveWeek] = React.useState<number>(() => progress.lastActiveWeek || 1);

  // Modals & Dialogs
  const [completedWeekNumber, setCompletedWeekNumber] = React.useState<number | null>(null);
  const [isCourseCompletionOpen, setIsCourseCompletionOpen] = React.useState<boolean>(false);
  const [isResetProgressConfirmOpen, setIsResetProgressConfirmOpen] = React.useState<boolean>(false);
  const [editingQuestion, setEditingQuestion] = React.useState<Question | null>(null);

  // Auto-persist on state changes
  const handleUpdateProgress = (newProgress: CourseProgress) => {
    setProgress(newProgress);
    saveProgress(newProgress);
  };

  const handleUpdateQuestions = (newQuestions: Question[]) => {
    const reconciledProgress = reconcileQuestionBankProgress(questions, newQuestions, progress);
    setQuestions(newQuestions);
    saveQuestions(newQuestions);
    setProgress(reconciledProgress);
    saveProgress(reconciledProgress);
  };

  const handleUpdateWeekConfigs = (newConfigs: WeekConfig[]) => {
    setWeekConfigs(newConfigs);
    saveWeekConfigs(newConfigs);
  };

  // Handlers for Questions
  const handleSaveQuestion = (savedQ: Question) => {
    const exists = questions.some(q => q.id === savedQ.id);
    let nextQuestions: Question[];
    if (exists) {
      nextQuestions = questions.map(q => (q.id === savedQ.id ? savedQ : q));
    } else {
      nextQuestions = [...questions, savedQ];
    }
    handleUpdateQuestions(nextQuestions);
  };

  const handleDeleteQuestion = (questionId: string) => {
    const nextQuestions = questions.filter(q => q.id !== questionId);
    handleUpdateQuestions(nextQuestions);
  };

  const handleDuplicateQuestion = (q: Question) => {
    const existingInWeek = questions.filter(item => item.weekNumber === q.weekNumber);
    const newQuestion: Question = {
      ...q,
      id: `w${q.weekNumber}-q${Date.now()}`,
      questionNumber: existingInWeek.length + 1,
      text: `${q.text} (Copy)`,
      isDraft: false
    };
    handleUpdateQuestions([...questions, newQuestion]);
  };

  const handleAddEmptySlot = (weekNumber: number) => {
    const existingInWeek = questions.filter(item => item.weekNumber === weekNumber);
    const newQuestion: Question = {
      id: `w${weekNumber}-q${Date.now()}`,
      weekNumber,
      questionNumber: existingInWeek.length + 1,
      text: `Question ${existingInWeek.length + 1} for Week ${weekNumber}`,
      options: {
        A: 'Option A',
        B: 'Option B',
        C: 'Option C',
        D: 'Option D'
      },
      correctAnswer: 'A',
      explanation: '',
      topic: `Topic ${weekNumber}`,
      isDraft: true
    };
    handleUpdateQuestions([...questions, newQuestion]);
  };

  const handleImportQuestions = (imported: Question[]) => {
    handleUpdateQuestions(imported);
  };

  const handleUpdateWeekTitle = (weekNumber: number, title: string) => {
    const updated = weekConfigs.map(c =>
      c.weekNumber === weekNumber ? { ...c, title } : c
    );
    handleUpdateWeekConfigs(updated);
  };

  // Navigation handlers
  const handleStartWeek = (weekNumber: number) => {
    setActiveWeek(weekNumber);
    setCurrentView('quiz');
  };

  const handleManageWeek = (weekNumber: number) => {
    setActiveWeek(weekNumber);
    setCurrentView('management');
  };

  const handleWeekCompleted = (weekNum: number) => {
    setCompletedWeekNumber(weekNum);
    if (weekNum === 12) {
      setTimeout(() => {
        setIsCourseCompletionOpen(true);
      }, 1500);
    }
  };

  const handleContinueNextWeek = (nextWeek: number) => {
    setCompletedWeekNumber(null);
    setActiveWeek(nextWeek);
    setCurrentView('quiz');
  };

  const handlePracticeAgain = (weekNum: number) => {
    setCompletedWeekNumber(null);
    // Reset active question index to 0 for this week
    handleUpdateProgress({
      ...progress,
      lastActiveWeek: weekNum,
      lastActiveQuestionIndex: {
        ...progress.lastActiveQuestionIndex,
        [weekNum]: 0
      }
    });
    setActiveWeek(weekNum);
    setCurrentView('quiz');
  };

  const handlePracticeAllAgain = () => {
    setIsCourseCompletionOpen(false);
    const refreshed = resetProgressOnly();
    handleUpdateProgress(refreshed);
    setActiveWeek(1);
    setCurrentView('quiz');
  };

  const handleConfirmResetProgress = () => {
    const reset = resetProgressOnly();
    handleUpdateProgress(reset);
    setIsResetProgressConfirmOpen(false);
  };

  const handleJumpToMistake = (weekNumber: number, questionIndex: number) => {
    setActiveWeek(weekNumber);
    handleUpdateProgress({
      ...progress,
      lastActiveWeek: weekNumber,
      lastActiveQuestionIndex: {
        ...progress.lastActiveQuestionIndex,
        [weekNumber]: questionIndex
      }
    });
    setCurrentView('quiz');
  };

  // Helper to load sample testing questions if user wants to see demo
  const handleLoadDemoTestingQuestions = () => {
    const sampleQuestions: Question[] = [
      {
        id: 'w1-q1',
        weekNumber: 1,
        questionNumber: 1,
        text: 'What is the primary function of an operating system kernel?',
        options: {
          A: 'Managing hardware resources and system calls',
          B: 'Compiling high-level programming code',
          C: 'Rendering 3D web graphics',
          D: 'Formatting hard drive partitions only'
        },
        correctAnswer: 'A',
        explanation: 'The kernel is the core component that manages CPU, memory, and devices.',
        topic: 'Operating Systems',
        isDraft: false
      },
      {
        id: 'w1-q2',
        weekNumber: 1,
        questionNumber: 2,
        text: 'Which data structure follows the First-In, First-Out (FIFO) principle?',
        options: {
          A: 'Stack',
          B: 'Queue',
          C: 'Binary Search Tree',
          D: 'Hash Map'
        },
        correctAnswer: 'B',
        explanation: 'Queues process elements in the order they arrive (FIFO).',
        topic: 'Data Structures',
        isDraft: false
      },
      {
        id: 'w1-q3',
        weekNumber: 1,
        questionNumber: 3,
        text: 'What is the worst-case time complexity of standard Binary Search on a sorted array of size N?',
        options: {
          A: 'O(1)',
          B: 'O(N)',
          C: 'O(log N)',
          D: 'O(N^2)'
        },
        correctAnswer: 'C',
        explanation: 'Binary search halves the search space each step, giving O(log N).',
        topic: 'Algorithms',
        isDraft: false
      },
      {
        id: 'w1-q4',
        weekNumber: 1,
        questionNumber: 4,
        text: 'In relational databases, what does the ACID acronym stand for?',
        options: {
          A: 'Atomicity, Consistency, Isolation, Durability',
          B: 'Asynchronous, Coherent, Indexed, Distributed',
          C: 'Authentication, Cryptography, Integrity, Decryption',
          D: 'Array, Cursor, Index, Data'
        },
        correctAnswer: 'A',
        explanation: 'ACID guarantees database transactions are processed reliably.',
        topic: 'Databases',
        isDraft: false
      },
      {
        id: 'w1-q5',
        weekNumber: 1,
        questionNumber: 5,
        text: 'Which HTTP status code signifies that a resource was successfully created?',
        options: {
          A: '200 OK',
          B: '201 Created',
          C: '204 No Content',
          D: '304 Not Modified'
        },
        correctAnswer: 'B',
        explanation: 'HTTP 201 Created indicates the request succeeded and led to resource creation.',
        topic: 'Computer Networks',
        isDraft: false
      }
    ];

    // Merge these 5 sample questions into week 1 while keeping rest
    const otherQs = questions.filter(
      q => !(q.weekNumber === 1 && q.questionNumber <= 5)
    );
    const updated = [...sampleQuestions, ...otherQs].sort(
      (a, b) => a.weekNumber - b.weekNumber || a.questionNumber - b.questionNumber
    );
    handleUpdateQuestions(updated);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFD] text-[#242236]">
      {/* Top Header Navigation */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        progress={progress}
        questions={questions}
        onOpenResetConfirm={() => setIsResetProgressConfirmOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {currentView === 'dashboard' && (
          <Dashboard
            questions={questions}
            progress={progress}
            weekConfigs={weekConfigs}
            onStartWeek={handleStartWeek}
            onManageWeek={handleManageWeek}
            onViewChange={setCurrentView}
            onUpdateWeekTitle={handleUpdateWeekTitle}
          />
        )}

        {currentView === 'quiz' && (
          <QuizView
            weekNumber={activeWeek}
            questions={questions}
            progress={progress}
            weekConfigs={weekConfigs}
            onBackToDashboard={() => setCurrentView('dashboard')}
            onUpdateProgress={handleUpdateProgress}
            onEditQuestion={q => {
              setEditingQuestion(q);
              setCurrentView('management');
            }}
            onWeekCompleted={handleWeekCompleted}
            onSelectWeek={w => setActiveWeek(w)}
          />
        )}

        {currentView === 'management' && (
          <QuestionManager
            questions={questions}
            progress={progress}
            weekConfigs={weekConfigs}
            selectedWeek={activeWeek}
            onSelectWeek={setActiveWeek}
            onSaveQuestion={handleSaveQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onDuplicateQuestion={handleDuplicateQuestion}
            onImportQuestions={handleImportQuestions}
            onMergeQuestions={handleUpdateQuestions}
            onAddEmptySlot={handleAddEmptySlot}
            editingQuestion={editingQuestion}
            onSetEditingQuestion={setEditingQuestion}
          />
        )}

        {currentView === 'review_incorrect' && (
          <ReviewMistakesView
            questions={questions}
            progress={progress}
            onJumpToQuestion={handleJumpToMistake}
            onBackToDashboard={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'statistics' && (
          <StatisticsView
            questions={questions}
            progress={progress}
            weekConfigs={weekConfigs}
            onBackToDashboard={() => setCurrentView('dashboard')}
            onStartWeek={handleStartWeek}
          />
        )}
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-bold text-[#6C3CE9]">My Exam Practice</span> • 12-Week Interactive Course Mastery
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLoadDemoTestingQuestions}
              className="text-[#6C3CE9] hover:underline font-semibold"
              title="Load 5 realistic test questions into Week 1 for interactive testing"
            >
              Load Demo Questions (Testing)
            </button>
            <button
              onClick={() => setIsResetProgressConfirmOpen(true)}
              className="text-slate-400 hover:text-rose-600 transition-colors"
            >
              Reset Practice Progress
            </button>
          </div>
        </div>
      </footer>

      {/* Week 100% Mastery Completion Modal */}
      {completedWeekNumber !== null && (
        <WeekCompletionModal
          isOpen={true}
          weekNumber={completedWeekNumber}
          questions={questions}
          progress={progress}
          onClose={() => setCompletedWeekNumber(null)}
          onContinueNextWeek={handleContinueNextWeek}
          onPracticeAgain={handlePracticeAgain}
        />
      )}

      {/* Full 12-Week Course Completion Modal */}
      <CourseCompletionModal
        isOpen={isCourseCompletionOpen}
        questions={questions}
        progress={progress}
        weekConfigs={weekConfigs}
        onClose={() => setIsCourseCompletionOpen(false)}
        onReviewWeek={w => {
          setActiveWeek(w);
          setCurrentView('quiz');
        }}
        onPracticeAllAgain={handlePracticeAllAgain}
      />

      {/* Reset Progress Confirmation Dialog */}
      <ConfirmationModal
        isOpen={isResetProgressConfirmOpen}
        title="Reset All Practice Progress?"
        message="This will reset all your attempts, incorrect attempt counts, and mastery progress back to 0. Your customized questions and week titles will NOT be deleted."
        confirmLabel="Reset Progress"
        cancelLabel="Keep Progress"
        isDestructive={true}
        onConfirm={handleConfirmResetProgress}
        onCancel={() => setIsResetProgressConfirmOpen(false)}
      />
    </div>
  );
}
