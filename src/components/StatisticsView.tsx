import React from 'react';
import { Question, CourseProgress, WeekConfig } from '../types.js';
import { calculateOverallProgress, calculateWeekMastery } from '../utils/quizRules.js';
import {
  BarChart3,
  Award,
  CheckCircle2,
  Clock,
  RotateCcw,
  BookOpen,
  ArrowLeft
} from 'lucide-react';

interface StatisticsViewProps {
  questions: Question[];
  progress: CourseProgress;
  weekConfigs: WeekConfig[];
  onBackToDashboard: () => void;
  onStartWeek: (weekNumber: number) => void;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({
  questions,
  progress,
  weekConfigs,
  onBackToDashboard,
  onStartWeek
}) => {
  const overall = calculateOverallProgress(questions, progress.questionProgress);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
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
            <h1 className="text-xl sm:text-2xl font-bold text-[#242236]">Exam Practice Statistics</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Complete analytics and mastery report across all 12 syllabus modules.
            </p>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">Overall Course Progress</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#6C3CE9]">
            {overall.percentage}%
          </div>
          <div className="text-xs text-slate-400">
            {overall.masteredQuestions} / {overall.totalQuestions} questions mastered
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">Total Practice Attempts</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#242236]">
            {overall.totalAttempts}
          </div>
          <div className="text-xs text-slate-400">Recorded across all sessions</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">Total Incorrect Attempts</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600">
            {overall.totalIncorrect}
          </div>
          <div className="text-xs text-slate-400">
            {overall.questionsNeedingPractice} questions needed retry
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">Overall Accuracy Rate</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
            {overall.accuracyPercentage}%
          </div>
          <div className="text-xs text-slate-400">Correct vs total attempts</div>
        </div>
      </div>

      {/* Week-by-Week Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#242236]">Week-by-Week Syllabus Breakdown</h2>
          <span className="text-xs text-slate-500 font-medium">12 Modules</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Week</th>
                <th className="px-5 py-3">Module Title</th>
                <th className="px-5 py-3 text-center">Questions</th>
                <th className="px-5 py-3 text-center">Mastered</th>
                <th className="px-5 py-3 text-center">Mistakes</th>
                <th className="px-5 py-3 text-center">Mastery %</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {weekConfigs.map(config => {
                const w = config.weekNumber;
                const weekQs = questions.filter(q => q.weekNumber === w);
                const mastery = calculateWeekMastery(weekQs, progress.questionProgress);
                const isUnlocked = progress.unlockedWeeks.includes(w) || w === 1;

                return (
                  <tr key={w} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 font-bold text-[#242236]">Week {w}</td>
                    <td className="px-5 py-4 font-medium text-slate-700">{config.title}</td>
                    <td className="px-5 py-4 text-center text-slate-600">{mastery.totalCount}</td>
                    <td className="px-5 py-4 text-center font-bold text-emerald-600">
                      {mastery.masteredCount}
                    </td>
                    <td className="px-5 py-4 text-center font-semibold text-rose-600">
                      {mastery.incorrectAttemptsCount}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-bold text-[#6C3CE9]">{mastery.percentage}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {mastery.isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>100%</span>
                        </span>
                      ) : isUnlocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F1ECFF] text-[#6C3CE9] text-xs font-semibold">
                          <span>In Progress</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-400 text-xs">
                          <span>Locked</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {isUnlocked && (
                        <button
                          onClick={() => onStartWeek(w)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#F1ECFF] text-slate-700 hover:text-[#6C3CE9] font-semibold text-xs transition-colors"
                        >
                          {mastery.isCompleted ? 'Practice' : 'Continue'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
