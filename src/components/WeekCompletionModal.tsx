import React from 'react';
import confetti from 'canvas-confetti';
import { Trophy, CheckCircle2, ArrowRight, RotateCcw, X, Sparkles } from 'lucide-react';
import { Question, CourseProgress } from '../types.js';
import { calculateWeekMastery } from '../utils/quizRules.js';

interface WeekCompletionModalProps {
  isOpen: boolean;
  weekNumber: number;
  questions: Question[];
  progress: CourseProgress;
  onClose: () => void;
  onContinueNextWeek: (nextWeek: number) => void;
  onPracticeAgain: (weekNumber: number) => void;
}

export const WeekCompletionModal: React.FC<WeekCompletionModalProps> = ({
  isOpen,
  weekNumber,
  questions,
  progress,
  onClose,
  onContinueNextWeek,
  onPracticeAgain
}) => {
  React.useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6C3CE9', '#A78BFA', '#10B981', '#F59E0B']
        });
      } catch (e) {
        // Safe fallback if canvas-confetti is blocked
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const weekQs = questions.filter(q => q.weekNumber === weekNumber);
  const mastery = calculateWeekMastery(weekQs, progress.questionProgress);
  const isFinalWeek = weekNumber >= 12;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration Trophy Badge */}
        <div className="w-20 h-20 rounded-3xl bg-[#F1ECFF] text-[#6C3CE9] flex items-center justify-center mx-auto shadow-lg shadow-purple-100 mb-4">
          <Trophy className="w-10 h-10 animate-bounce" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>100% Mastery Achieved</span>
        </div>

        <h2 className="text-2xl font-black text-[#242236] tracking-tight">
          Week {weekNumber} Completed!
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-sm mx-auto">
          Every question in this module has been answered correctly at least once. Strict mastery rule satisfied!
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 my-6 text-center">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Questions</div>
            <div className="text-base font-bold text-[#242236] mt-0.5">
              {mastery.totalCount} / {mastery.totalCount}
            </div>
          </div>
          <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
            <div className="text-[10px] text-emerald-600 font-semibold uppercase">Mastery</div>
            <div className="text-base font-bold text-emerald-700 mt-0.5">100%</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-2xl border border-purple-100">
            <div className="text-[10px] text-[#6C3CE9] font-semibold uppercase">Errors Overcome</div>
            <div className="text-base font-bold text-[#6C3CE9] mt-0.5">
              {mastery.incorrectAttemptsCount}
            </div>
          </div>
        </div>

        {!isFinalWeek ? (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-[#6C3CE9] font-semibold mb-6 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Week {weekNumber + 1} has now been automatically unlocked!</span>
          </div>
        ) : (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold mb-6 flex items-center justify-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-600" />
            <span>Final Week 12 complete! Course 100% finished!</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => onPracticeAgain(weekNumber)}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Practice Again</span>
          </button>

          {!isFinalWeek ? (
            <button
              onClick={() => onContinueNextWeek(weekNumber + 1)}
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#6C3CE9] hover:bg-[#5A2FD0] text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-200 transition-all active:scale-98"
            >
              <span>Unlock Week {weekNumber + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-98"
            >
              <span>View Final Diploma</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
