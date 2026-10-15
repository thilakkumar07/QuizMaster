import React from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Award, CheckCircle2, RotateCcw, ArrowRight, X, Sparkles, BookOpen } from 'lucide-react';
import { Question, CourseProgress, WeekConfig } from '../types.js';
import { calculateOverallProgress, calculateWeekMastery } from '../utils/quizRules.js';

interface CourseCompletionModalProps {
  isOpen: boolean;
  questions: Question[];
  progress: CourseProgress;
  weekConfigs: WeekConfig[];
  onClose: () => void;
  onReviewWeek: (weekNumber: number) => void;
  onPracticeAllAgain: () => void;
}

export const CourseCompletionModal: React.FC<CourseCompletionModalProps> = ({
  isOpen,
  questions,
  progress,
  weekConfigs,
  onClose,
  onReviewWeek,
  onPracticeAllAgain
}) => {
  React.useEffect(() => {
    if (isOpen) {
      try {
        const end = Date.now() + 2 * 1000;
        const interval: any = setInterval(() => {
          if (Date.now() > end) {
            return clearInterval(interval);
          }
          confetti({
            startVelocity: 30,
            spread: 360,
            ticks: 60,
            origin: { x: Math.random(), y: Math.random() - 0.2 },
            colors: ['#6C3CE9', '#10B981', '#F59E0B', '#EC4899', '#3B82F6']
          });
        }, 300);
        return () => clearInterval(interval);
      } catch (e) {
        // Fallback
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const overall = calculateOverallProgress(questions, progress.questionProgress);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-xl shadow-amber-100">
            <Trophy className="w-10 h-10 animate-bounce" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Course Complete • 100% Mastery</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#242236] tracking-tight">
            Congratulations! Exam Ready!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            You have successfully mastered all 12 weeks of course questions with 100% mastery. You are fully prepared for your 100-mark final examination.
          </p>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <div className="bg-[#F1ECFF] p-3.5 rounded-2xl text-center">
            <div className="text-[10px] text-[#6C3CE9] font-bold uppercase">Course Status</div>
            <div className="text-lg font-black text-[#6C3CE9] mt-0.5">100%</div>
          </div>
          <div className="bg-emerald-50 p-3.5 rounded-2xl text-center">
            <div className="text-[10px] text-emerald-700 font-bold uppercase">Mastered Qs</div>
            <div className="text-lg font-black text-emerald-700 mt-0.5">
              {overall.masteredQuestions} / {overall.totalQuestions}
            </div>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-2xl text-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Total Attempts</div>
            <div className="text-lg font-black text-slate-800 mt-0.5">{overall.totalAttempts}</div>
          </div>
          <div className="bg-rose-50 p-3.5 rounded-2xl text-center">
            <div className="text-[10px] text-rose-700 font-bold uppercase">Errors Overcome</div>
            <div className="text-lg font-black text-rose-700 mt-0.5">{overall.totalIncorrect}</div>
          </div>
        </div>

        {/* Week-by-Week Summary Grid */}
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Week-by-Week Completion Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
            {weekConfigs.map(config => {
              const w = config.weekNumber;
              const weekQs = questions.filter(q => q.weekNumber === w);
              const mastery = calculateWeekMastery(weekQs, progress.questionProgress);

              return (
                <div
                  key={w}
                  onClick={() => {
                    onClose();
                    onReviewWeek(w);
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-[#F1ECFF] hover:border-purple-300 transition-colors cursor-pointer flex items-center justify-between"
                  title="Click to review this week"
                >
                  <div>
                    <div className="text-xs font-bold text-[#242236]">Week {w}</div>
                    <div className="text-[10px] text-slate-500">
                      {mastery.masteredCount}/{mastery.totalCount} Qs
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onPracticeAllAgain}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Practice All Questions Again</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onReviewWeek(1);
            }}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#6C3CE9] hover:bg-[#5A2FD0] text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-200 transition-all active:scale-98"
          >
            <BookOpen className="w-4 h-4" />
            <span>Review From Week 1</span>
          </button>
        </div>
      </div>
    </div>
  );
};
