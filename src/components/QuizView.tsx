import React from 'react';
import { Question, CourseProgress, WeekConfig, OptionKey, ViewMode } from '../types.js';
import {
  canAdvanceToNextQuestion,
  recordAnswerAttempt,
  calculateWeekMastery
} from '../utils/quizRules.js';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Edit3,
  ListFilter,
  Check,
  ChevronLeft,
  ChevronRight,
  Trophy
} from 'lucide-react';

interface QuizViewProps {
  weekNumber: number;
  questions: Question[];
  progress: CourseProgress;
  weekConfigs: WeekConfig[];
  onBackToDashboard: () => void;
  onUpdateProgress: (newProgress: CourseProgress) => void;
  onEditQuestion: (question: Question) => void;
  onWeekCompleted: (weekNumber: number) => void;
  onSelectWeek: (weekNumber: number) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  weekNumber,
  questions,
  progress,
  weekConfigs,
  onBackToDashboard,
  onUpdateProgress,
  onEditQuestion,
  onWeekCompleted,
  onSelectWeek
}) => {
  const weekQuestions = React.useMemo(() => {
    return questions
      .filter(q => q.weekNumber === weekNumber)
      .sort((a, b) => a.questionNumber - b.questionNumber);
  }, [questions, weekNumber]);

  const currentConfig = weekConfigs.find(c => c.weekNumber === weekNumber) || {
    weekNumber,
    title: `Week ${weekNumber}`,
    description: ''
  };

  // Resume question index for this week if saved
  const initialIndex = progress.lastActiveQuestionIndex[weekNumber] ?? 0;
  const [currentIndex, setCurrentIndex] = React.useState<number>(
    Math.min(initialIndex, Math.max(0, weekQuestions.length - 1))
  );

  const currentQuestion = weekQuestions[currentIndex];
  const questionProgress = currentQuestion
    ? progress.questionProgress[currentQuestion.id]
    : undefined;

  // Local state for the current active question
  const [selectedOption, setSelectedOption] = React.useState<OptionKey | null>(null);
  const [isSubmitted, setIsSubmitted] = React.useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = React.useState<'correct' | 'incorrect' | null>(
    null
  );

  // Sync selection when moving between questions
  React.useEffect(() => {
    if (!currentQuestion) return;
    const p = progress.questionProgress[currentQuestion.id];
    if (p && p.isMastered) {
      // Question already mastered
      setSelectedOption(p.lastSelectedAnswer || currentQuestion.correctAnswer);
      setIsSubmitted(true);
      setSubmissionResult('correct');
    } else {
      setSelectedOption(null);
      setIsSubmitted(false);
      setSubmissionResult(null);
    }
  }, [currentIndex, currentQuestion?.id]);

  // Keep last active question index persisted
  const updateActiveIndex = (newIndex: number) => {
    setCurrentIndex(newIndex);
    const updated: CourseProgress = {
      ...progress,
      lastActiveWeek: weekNumber,
      lastActiveQuestionIndex: {
        ...progress.lastActiveQuestionIndex,
        [weekNumber]: newIndex
      }
    };
    onUpdateProgress(updated);
  };

  // Keyboard navigation support
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key) && !isSubmitted) {
        setSelectedOption(key as OptionKey);
      } else if (['1', '2', '3', '4'].includes(e.key) && !isSubmitted) {
        const map: Record<string, OptionKey> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
        setSelectedOption(map[e.key]);
      } else if (e.key === 'Enter') {
        if (!isSubmitted && selectedOption) {
          handleSubmitAnswer();
        } else if (isSubmitted && submissionResult === 'correct') {
          handleNextQuestion();
        } else if (isSubmitted && submissionResult === 'incorrect') {
          handleRetry();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitted, selectedOption, submissionResult, currentIndex]);

  if (!currentQuestion) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <HelpCircle className="w-12 h-12 text-slate-400 mx-auto" />
          <h2 className="text-xl font-bold text-[#242236]">No questions found for Week {weekNumber}</h2>
          <p className="text-sm text-slate-500">
            Please add questions or configure the template for this week.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={onBackToDashboard}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isCurrentMastered = !!questionProgress?.isMastered;
  const canAdvance = canAdvanceToNextQuestion(isCurrentMastered, submissionResult === 'correct');

  const handleSubmitAnswer = () => {
    if (!selectedOption || !currentQuestion) return;

    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    const updatedItemProgress = recordAnswerAttempt(
      questionProgress,
      currentQuestion.id,
      selectedOption,
      isCorrect
    );

    const updatedQuestionProgressMap = {
      ...progress.questionProgress,
      [currentQuestion.id]: updatedItemProgress
    };

    setIsSubmitted(true);
    setSubmissionResult(isCorrect ? 'correct' : 'incorrect');

    // Check if the entire week is now 100% mastered
    const weekMastery = calculateWeekMastery(weekQuestions, updatedQuestionProgressMap);
    let updatedCompletedWeeks = [...progress.completedWeeks];
    let updatedUnlockedWeeks = [...progress.unlockedWeeks];

    if (weekMastery.isCompleted && !updatedCompletedWeeks.includes(weekNumber)) {
      updatedCompletedWeeks.push(weekNumber);
      if (weekNumber < 12 && !updatedUnlockedWeeks.includes(weekNumber + 1)) {
        updatedUnlockedWeeks.push(weekNumber + 1);
      }
      onWeekCompleted(weekNumber);
    }

    const nextProgress: CourseProgress = {
      ...progress,
      completedWeeks: updatedCompletedWeeks,
      unlockedWeeks: updatedUnlockedWeeks,
      questionProgress: updatedQuestionProgressMap,
      lastActiveWeek: weekNumber,
      lastActiveQuestionIndex: {
        ...progress.lastActiveQuestionIndex,
        [weekNumber]: currentIndex
      }
    };

    onUpdateProgress(nextProgress);
  };

  const handleRetry = () => {
    setIsSubmitted(false);
    setSelectedOption(null);
    setSubmissionResult(null);
  };

  const handleNextQuestion = () => {
    if (currentIndex < weekQuestions.length - 1) {
      updateActiveIndex(currentIndex + 1);
    } else {
      // Reached end of questions. Check if all questions are mastered
      const weekMastery = calculateWeekMastery(weekQuestions, progress.questionProgress);
      if (weekMastery.isCompleted) {
        onWeekCompleted(weekNumber);
      } else {
        // Find first unmastered question
        const firstUnmasteredIndex = weekQuestions.findIndex(
          q => !progress.questionProgress[q.id]?.isMastered
        );
        if (firstUnmasteredIndex !== -1) {
          updateActiveIndex(firstUnmasteredIndex);
        }
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentIndex > 0) {
      updateActiveIndex(currentIndex - 1);
    }
  };

  const currentMastery = calculateWeekMastery(weekQuestions, progress.questionProgress);
  const optionsKeys: OptionKey[] = ['A', 'B', 'C', 'D'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Navigation & Week Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="Back to Dashboard"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-[#F1ECFF] text-[#6C3CE9] text-xs font-bold">
                Week {weekNumber}
              </span>
              <h2 className="text-base font-bold text-[#242236] line-clamp-1">
                {currentConfig.title}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Mastery: {currentMastery.masteredCount} of {currentMastery.totalCount} questions (
              {currentMastery.percentage}%)
            </p>
          </div>
        </div>

        {/* Week Selector Dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <label htmlFor="week-select" className="text-xs text-slate-500 font-medium">
            Jump to:
          </label>
          <select
            id="week-select"
            value={weekNumber}
            onChange={e => onSelectWeek(Number(e.target.value))}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#6C3CE9]"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(w => {
              const isUnlocked = progress.unlockedWeeks.includes(w) || w === 1;
              const isComp = progress.completedWeeks.includes(w);
              return (
                <option key={w} value={w} disabled={!isUnlocked}>
                  Week {w} {isComp ? '✓ (100%)' : !isUnlocked ? '🔒' : ''}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Progress Dots Bar across all questions in the week */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-600">
            Question {currentIndex + 1} of {weekQuestions.length}
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px] text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Mastered
            </span>
            <span className="flex items-center gap-1 text-[11px] text-rose-500">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Retrying
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-200" />
              Pending
            </span>
          </div>
        </div>

        {/* Question Bubbles / Grid */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {weekQuestions.map((q, idx) => {
            const p = progress.questionProgress[q.id];
            const isQMastered = !!p?.isMastered;
            const hadMistakes = (p?.incorrectAttempts || 0) > 0 && !isQMastered;
            const isCurrent = idx === currentIndex;

            let bubbleClass = 'bg-slate-100 text-slate-600 hover:bg-slate-200';
            if (isQMastered) {
              bubbleClass = 'bg-emerald-500 text-white font-bold';
            } else if (hadMistakes) {
              bubbleClass = 'bg-rose-500 text-white font-bold';
            }

            if (isCurrent) {
              bubbleClass += ' ring-2 ring-[#6C3CE9] ring-offset-2 scale-105';
            }

            return (
              <button
                key={q.id}
                onClick={() => {
                  // Only allow jumping if question is already mastered or if it's the current active flow
                  updateActiveIndex(idx);
                }}
                className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${bubbleClass}`}
                title={`Question ${idx + 1}: ${
                  isQMastered ? 'Mastered' : hadMistakes ? 'Incorrect attempt recorded' : 'Pending'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Question Topic & Meta Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
              Q{currentIndex + 1}
            </span>
            {currentQuestion.topic && (
              <span className="px-3 py-1 rounded-full bg-[#F1ECFF] text-[#6C3CE9] text-xs font-semibold">
                {currentQuestion.topic}
              </span>
            )}
            {isCurrentMastered && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Mastered</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {questionProgress && questionProgress.attempts > 0 && (
              <span className="text-xs text-slate-500">
                Attempts: <b className="text-slate-800">{questionProgress.attempts}</b>
                {questionProgress.incorrectAttempts > 0 && (
                  <span className="text-rose-600 ml-1">
                    ({questionProgress.incorrectAttempts} incorrect)
                  </span>
                )}
              </span>
            )}
            <button
              onClick={() => onEditQuestion(currentQuestion)}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-500 hover:text-[#6C3CE9] hover:bg-[#F1ECFF] rounded-lg transition-colors border border-slate-200"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Question</span>
            </button>
          </div>
        </div>

        {/* Empty Draft Warning Prompt */}
        {currentQuestion.isDraft && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Reusable Template Slot #{currentQuestion.questionNumber}</p>
              <p className="text-amber-800 leading-relaxed">
                This question is currently a placeholder slot. Click the &ldquo;Edit Question&rdquo;
                button to enter your own syllabus question, 4 options, and correct answer.
              </p>
            </div>
          </div>
        )}

        {/* Question Text */}
        <div className="space-y-2">
          <h3 className="text-lg sm:text-xl font-bold text-[#242236] leading-relaxed">
            {currentQuestion.text}
          </h3>
        </div>

        {/* 4 Options Buttons Grid */}
        <div className="space-y-3 pt-2">
          {optionsKeys.map(key => {
            const optionText = currentQuestion.options[key];
            const isSelected = selectedOption === key;

            // Highlight rules after submission
            let optionStyles =
              'border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 text-slate-700 bg-white';
            let badgeStyles = 'bg-slate-100 text-slate-600 group-hover:bg-purple-100 group-hover:text-[#6C3CE9]';

            if (isSelected && !isSubmitted) {
              optionStyles =
                'border-[#6C3CE9] bg-[#F1ECFF] text-[#242236] ring-2 ring-[#6C3CE9]/20';
              badgeStyles = 'bg-[#6C3CE9] text-white';
            }

            if (isSubmitted) {
              const isCorrectAnswer = key === currentQuestion.correctAnswer;
              if (isCorrectAnswer) {
                optionStyles =
                  'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20';
                badgeStyles = 'bg-emerald-600 text-white';
              } else if (isSelected && !isCorrectAnswer) {
                optionStyles =
                  'border-rose-500 bg-rose-50 text-rose-950 ring-2 ring-rose-500/20';
                badgeStyles = 'bg-rose-600 text-white';
              } else {
                optionStyles = 'border-slate-200 bg-slate-50/60 text-slate-400 opacity-60';
                badgeStyles = 'bg-slate-200 text-slate-400';
              }
            }

            return (
              <button
                key={key}
                disabled={isSubmitted}
                onClick={() => setSelectedOption(key)}
                className={`w-full group text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${optionStyles} ${
                  isSubmitted ? 'cursor-default' : 'cursor-pointer active:scale-99'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${badgeStyles}`}
                >
                  {key}
                </div>
                <div className="text-sm sm:text-base font-medium flex-1 leading-snug">
                  {optionText}
                </div>
                {isSubmitted && key === currentQuestion.correctAnswer && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                {isSubmitted && isSelected && key !== currentQuestion.correctAnswer && (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback Banner after Submission */}
        {isSubmitted && (
          <div
            className={`p-4 sm:p-5 rounded-2xl border animate-in fade-in slide-in-from-top-2 duration-200 ${
              submissionResult === 'correct'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-start gap-3">
              {submissionResult === 'correct' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1.5 flex-1">
                <div className="font-bold text-base">
                  {submissionResult === 'correct'
                    ? 'Correct! Question Mastered.'
                    : 'Incorrect Answer. Strict Mastery Rule Applies.'}
                </div>
                <p className="text-xs sm:text-sm leading-relaxed opacity-90">
                  {submissionResult === 'correct'
                    ? 'You answered correctly! You may now advance to the next question or complete this week.'
                    : 'You must answer this question correctly to proceed. Click "Try Again" to select another option.'}
                </p>

                {/* Optional Explanation */}
                {currentQuestion.explanation && (
                  <div className="mt-3 pt-3 border-t border-current/15 text-xs sm:text-sm">
                    <span className="font-bold">Explanation: </span>
                    <span>{currentQuestion.explanation}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quiz Controls & Actions Footer */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentIndex === 0}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {!isSubmitted ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={!selectedOption}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#6C3CE9] hover:bg-[#5A2FD0] text-white font-bold text-sm shadow-md shadow-purple-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-98"
              >
                <span>Submit Answer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : submissionResult === 'incorrect' ? (
              <button
                onClick={handleRetry}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition-all active:scale-98"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                disabled={!canAdvance}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#6C3CE9] hover:bg-[#5A2FD0] text-white font-bold text-sm shadow-md shadow-purple-200 transition-all active:scale-98"
              >
                <span>
                  {currentIndex === weekQuestions.length - 1
                    ? 'Check Week Mastery'
                    : 'Next Question'}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
