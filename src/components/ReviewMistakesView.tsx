import React from 'react';
import { Question, CourseProgress, OptionKey } from '../types.js';
import { AlertCircle, CheckCircle2, RotateCcw, ArrowRight, ArrowLeft } from 'lucide-react';

interface ReviewMistakesViewProps {
  questions: Question[];
  progress: CourseProgress;
  onJumpToQuestion: (weekNumber: number, questionIndex: number) => void;
  onBackToDashboard: () => void;
}

export const ReviewMistakesView: React.FC<ReviewMistakesViewProps> = ({
  questions,
  progress,
  onJumpToQuestion,
  onBackToDashboard
}) => {
  // Find all questions that have had incorrect attempts recorded
  const mistakeQuestions = React.useMemo(() => {
    return questions
      .filter(q => {
        const p = progress.questionProgress[q.id];
        return p && (p.incorrectAttempts || 0) > 0;
      })
      .sort((a, b) => {
        const pA = progress.questionProgress[a.id]?.incorrectAttempts || 0;
        const pB = progress.questionProgress[b.id]?.incorrectAttempts || 0;
        return pB - pA; // most missed first
      });
  }, [questions, progress]);

  const [activeReviewIdx, setActiveReviewIdx] = React.useState<number | null>(null);
  const [selectedReviewOption, setSelectedReviewOption] = React.useState<OptionKey | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = React.useState<boolean>(false);

  const activeQuestion = activeReviewIdx !== null ? mistakeQuestions[activeReviewIdx] : null;

  const handleStartReview = (index: number) => {
    setActiveReviewIdx(index);
    setSelectedReviewOption(null);
    setIsAnswerRevealed(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#242236]">
                Review Incorrect Questions
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                {mistakeQuestions.length} Questions
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Reinforce questions where you previously made incorrect attempts to ensure 100% retention.
            </p>
          </div>
        </div>
      </div>

      {mistakeQuestions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#242236]">No Incorrect Questions Recorded!</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            You currently have no recorded incorrect attempts. As you practice questions in the quiz, any mistakes will automatically appear here for focused review.
          </p>
          <button
            onClick={onBackToDashboard}
            className="px-5 py-2.5 bg-[#6C3CE9] hover:bg-[#5A2FD0] text-white rounded-xl text-xs font-bold shadow-xs"
          >
            Back to Dashboard
          </button>
        </div>
      ) : activeQuestion ? (
        /* Focused Practice Mode for Mistakes */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                Week {activeQuestion.weekNumber} • #{activeQuestion.questionNumber}
              </span>
              {activeQuestion.topic && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-[#6C3CE9] font-semibold">
                  {activeQuestion.topic}
                </span>
              )}
            </div>
            <button
              onClick={() => setActiveReviewIdx(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Close Practice
            </button>
          </div>

          <h3 className="text-lg font-bold text-[#242236]">{activeQuestion.text}</h3>

          <div className="space-y-3">
            {(['A', 'B', 'C', 'D'] as OptionKey[]).map(key => {
              const isSelected = selectedReviewOption === key;
              const isCorrect = key === activeQuestion.correctAnswer;

              let style = 'border-slate-200 bg-white hover:border-purple-300';
              if (isSelected && !isAnswerRevealed) {
                style = 'border-[#6C3CE9] bg-[#F1ECFF] text-[#6C3CE9]';
              }
              if (isAnswerRevealed) {
                if (isCorrect) {
                  style = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                } else if (isSelected && !isCorrect) {
                  style = 'border-rose-500 bg-rose-50 text-rose-900';
                } else {
                  style = 'border-slate-100 opacity-50 bg-slate-50';
                }
              }

              return (
                <button
                  key={key}
                  disabled={isAnswerRevealed}
                  onClick={() => setSelectedReviewOption(key)}
                  className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all flex items-center gap-3 ${style}`}
                >
                  <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold">
                    {key}
                  </span>
                  <span className="text-sm flex-1">{activeQuestion.options[key]}</span>
                  {isAnswerRevealed && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  )}
                </button>
              );
            })}
          </div>

          {isAnswerRevealed && activeQuestion.explanation && (
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900">
              <span className="font-bold">Explanation: </span>
              {activeQuestion.explanation}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                if (activeReviewIdx !== null) {
                  const nextIdx = (activeReviewIdx + 1) % mistakeQuestions.length;
                  handleStartReview(nextIdx);
                }
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Skip to Next
            </button>

            {!isAnswerRevealed ? (
              <button
                disabled={!selectedReviewOption}
                onClick={() => setIsAnswerRevealed(true)}
                className="px-5 py-2.5 bg-[#6C3CE9] hover:bg-[#5A2FD0] disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={() => {
                  if (activeReviewIdx !== null && activeReviewIdx < mistakeQuestions.length - 1) {
                    handleStartReview(activeReviewIdx + 1);
                  } else {
                    setActiveReviewIdx(null);
                  }
                }}
                className="px-5 py-2.5 bg-[#6C3CE9] hover:bg-[#5A2FD0] text-white rounded-xl text-xs font-bold shadow-xs"
              >
                {activeReviewIdx !== null && activeReviewIdx < mistakeQuestions.length - 1
                  ? 'Next Review Question'
                  : 'Done Reviewing'}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* List of Questions with Mistakes */
        <div className="space-y-3">
          {mistakeQuestions.map((q, idx) => {
            const p = progress.questionProgress[q.id];
            const incorrectCount = p?.incorrectAttempts || 0;
            const isCurrentlyMastered = !!p?.isMastered;

            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-purple-200 transition-all"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      Week {q.weekNumber} • #{q.questionNumber}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                      {incorrectCount} {incorrectCount === 1 ? 'mistake' : 'mistakes'} recorded
                    </span>
                    {isCurrentlyMastered && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        ✓ Mastered
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-[#242236] leading-snug">{q.text}</h4>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleStartReview(idx)}
                    className="px-3.5 py-2 rounded-xl bg-[#F1ECFF] text-[#6C3CE9] hover:bg-[#6C3CE9] hover:text-white font-bold text-xs transition-colors"
                  >
                    Quick Practice
                  </button>
                  <button
                    onClick={() => {
                      const weekQs = questions
                        .filter(item => item.weekNumber === q.weekNumber)
                        .sort((a, b) => a.questionNumber - b.questionNumber);
                      const qIndex = weekQs.findIndex(item => item.id === q.id);
                      onJumpToQuestion(q.weekNumber, qIndex >= 0 ? qIndex : 0);
                    }}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-[#6C3CE9] hover:border-purple-200 text-xs font-semibold"
                    title="Jump to Quiz"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
