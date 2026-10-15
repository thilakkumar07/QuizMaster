import React from 'react';
import { CourseProgress, Question, WeekConfig, ViewMode } from '../types.js';
import {
  calculateOverallProgress,
  calculateWeekMastery,
  isWeekUnlocked
} from '../utils/quizRules.js';
import {
  Trophy,
  CheckCircle2,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Settings,
  ArrowRight,
  BookOpen,
  Edit2,
  Check,
  X
} from 'lucide-react';

interface DashboardProps {
  questions: Question[];
  progress: CourseProgress;
  weekConfigs: WeekConfig[];
  onStartWeek: (weekNumber: number) => void;
  onManageWeek: (weekNumber: number) => void;
  onViewChange: (view: ViewMode) => void;
  onUpdateWeekTitle: (weekNumber: number, title: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  questions,
  progress,
  weekConfigs,
  onStartWeek,
  onManageWeek,
  onViewChange,
  onUpdateWeekTitle
}) => {
  const overall = calculateOverallProgress(questions, progress.questionProgress);
  const totalWeeks = 12;
  const completedWeeksCount = progress.completedWeeks.length;

  const [editingWeekNum, setEditingWeekNum] = React.useState<number | null>(null);
  const [editedTitle, setEditedTitle] = React.useState('');

  const handleStartEdit = (weekNumber: number, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingWeekNum(weekNumber);
    setEditedTitle(currentTitle);
  };

  const handleSaveTitle = (weekNumber: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editedTitle.trim()) {
      onUpdateWeekTitle(weekNumber, editedTitle.trim());
    }
    setEditingWeekNum(null);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingWeekNum(null);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Hero Course Progress Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#6C3CE9] via-[#5D2EDD] to-[#451BA8] text-white p-6 sm:p-8 shadow-xl shadow-purple-200">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-purple-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-purple-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Final Exam Prep • 100 Marks Target</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              My Exam Practice
            </h1>
            <p className="text-purple-100 text-sm sm:text-base leading-relaxed">
              Master every syllabus question with strict 100% mastery rules. Each week must be completely mastered before unlocking the next.
            </p>
          </div>

          {/* Large Progress Dial Card */}
          <div className="flex items-center gap-5 bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/15 shrink-0">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-20 h-20 -rotate-90 transform" viewBox="0 0 36 36">
                <path
                  className="text-white/20"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-amber-300 transition-all duration-700 ease-out"
                  strokeDasharray={`${overall.percentage}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black leading-none">{overall.percentage}%</span>
                <span className="text-[9px] uppercase tracking-wider text-purple-200 mt-0.5">
                  Mastery
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-purple-200">Questions Mastered</div>
              <div className="text-lg font-bold">
                {overall.masteredQuestions} / {overall.totalQuestions}
              </div>
              <div className="text-xs text-purple-200">
                {completedWeeksCount} of {totalWeeks} weeks completed
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Bar inside Hero */}
        <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onStartWeek(progress.lastActiveWeek || 1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#6C3CE9] hover:bg-purple-50 font-bold text-sm shadow-md transition-all active:scale-98"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume Week {progress.lastActiveWeek || 1}</span>
            </button>

            <button
              onClick={() => onViewChange('management')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/20 text-white font-medium text-sm transition-all"
            >
              <BookOpen className="w-4 h-4" />
              <span>Manage Questions</span>
            </button>
          </div>

          <div className="text-xs text-purple-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Progress automatically saved</span>
          </div>
        </div>
      </div>

      {/* 6 Key Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Total Questions</div>
          <div className="text-xl sm:text-2xl font-bold text-[#242236] mt-1">
            {overall.totalQuestions}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Course total</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Answered Correctly</div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">
            {overall.masteredQuestions}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">100% mastered</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Total Attempts</div>
          <div className="text-xl sm:text-2xl font-bold text-[#6C3CE9] mt-1">
            {overall.totalAttempts}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Practice attempts</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Needs Practice</div>
          <div className="text-xl sm:text-2xl font-bold text-amber-600 mt-1">
            {overall.questionsNeedingPractice}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Had mistakes</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Weeks Complete</div>
          <div className="text-xl sm:text-2xl font-bold text-[#242236] mt-1">
            {completedWeeksCount} / {totalWeeks}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Mastered weeks</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Overall Accuracy</div>
          <div className="text-xl sm:text-2xl font-bold text-indigo-600 mt-1">
            {overall.accuracyPercentage}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Attempt ratio</div>
        </div>
      </div>

      {/* Week Cards Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h2 className="text-xl font-bold text-[#242236]">12-Week Syllabus Modules</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Click any available week to practice. You must achieve 100% mastery to unlock the next week.
          </p>
        </div>

        <button
          onClick={() => onViewChange('management')}
          className="self-start sm:self-auto inline-flex items-center gap-2 text-xs font-semibold text-[#6C3CE9] hover:text-[#5A2FD0] bg-[#F1ECFF] px-3.5 py-2 rounded-xl transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Edit Questions & Titles</span>
        </button>
      </div>

      {/* 12 Week Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {weekConfigs.map(config => {
          const wNum = config.weekNumber;
          const questionsInWeek = questions.filter(q => q.weekNumber === wNum);
          const mastery = calculateWeekMastery(questionsInWeek, progress.questionProgress);
          const isUnlocked = isWeekUnlocked(wNum, progress.unlockedWeeks, progress.completedWeeks);
          const isCompleted = mastery.isCompleted && mastery.totalCount > 0;
          const isInProgress = isUnlocked && !isCompleted && mastery.masteredCount > 0;
          const isAvailable = isUnlocked && !isCompleted && mastery.masteredCount === 0;

          // Status Badge styling
          let statusLabel = 'Locked';
          let statusBadgeClass = 'bg-slate-100 text-slate-500 border-slate-200';
          let StatusIcon = Lock;

          if (isCompleted) {
            statusLabel = 'Completed (100%)';
            statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            StatusIcon = CheckCircle2;
          } else if (isInProgress) {
            statusLabel = 'In Progress';
            statusBadgeClass = 'bg-[#F1ECFF] text-[#6C3CE9] border-purple-200';
            StatusIcon = Play;
          } else if (isAvailable) {
            statusLabel = 'Available';
            statusBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
            StatusIcon = Play;
          }

          const isCurrentlyEditing = editingWeekNum === wNum;

          return (
            <div
              key={wNum}
              className={`relative bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                isCompleted
                  ? 'border-emerald-200 shadow-xs'
                  : isUnlocked
                  ? 'border-slate-200 hover:border-purple-300 shadow-sm hover:shadow-md'
                  : 'border-slate-200/80 bg-slate-50/50 opacity-80'
              }`}
            >
              <div className="p-5 space-y-4">
                {/* Header: Week Pill & Status */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm px-2.5 py-1 rounded-lg bg-slate-100 text-[#242236]">
                    Week {wNum}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadgeClass}`}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span>{statusLabel}</span>
                  </span>
                </div>

                {/* Week Title & Inline Editing */}
                <div>
                  {isCurrentlyEditing ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={e => setEditedTitle(e.target.value)}
                        className="w-full text-sm font-semibold text-[#242236] border border-purple-300 rounded-lg px-2.5 py-1 focus:outline-hidden focus:ring-2 focus:ring-[#6C3CE9]"
                        autoFocus
                      />
                      <button
                        onClick={e => handleSaveTitle(wNum, e)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md"
                        title="Save title"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="group flex items-start justify-between gap-2 mt-1">
                      <h3 className="font-bold text-base text-[#242236] line-clamp-1">
                        {config.title}
                      </h3>
                      <button
                        onClick={e => handleStartEdit(wNum, config.title, e)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-[#6C3CE9] p-1 rounded-md transition-opacity"
                        title="Rename Week"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                    {config.description || `${questionsInWeek.length} questions`}
                  </p>
                </div>

                {/* Progress Bar & Percentage */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-600">Mastery Progress</span>
                    <span className="font-bold text-[#6C3CE9]">{mastery.percentage}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted
                          ? 'bg-emerald-500'
                          : mastery.percentage > 0
                          ? 'bg-[#6C3CE9]'
                          : 'bg-transparent'
                      }`}
                      style={{ width: `${mastery.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Question Stats Grid */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <div className="text-[10px] text-slate-400 font-medium">Questions</div>
                    <div className="text-sm font-bold text-[#242236]">{mastery.totalCount}</div>
                  </div>
                  <div className="bg-emerald-50/60 p-2 rounded-xl">
                    <div className="text-[10px] text-emerald-600 font-medium">Mastered</div>
                    <div className="text-sm font-bold text-emerald-700">
                      {mastery.masteredCount}
                    </div>
                  </div>
                  <div className="bg-rose-50/60 p-2 rounded-xl">
                    <div className="text-[10px] text-rose-600 font-medium">Incorrect</div>
                    <div className="text-sm font-bold text-rose-700">
                      {mastery.incorrectAttemptsCount}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-4 bg-slate-50/50 border-t border-slate-100 rounded-b-2xl flex items-center gap-2">
                {isUnlocked ? (
                  <button
                    onClick={() => onStartWeek(wNum)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all shadow-xs ${
                      isCompleted
                        ? 'bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50'
                        : 'bg-[#6C3CE9] text-white hover:bg-[#5A2FD0] active:scale-98'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        <span>Practice Again</span>
                      </>
                    ) : isInProgress ? (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>Continue Week</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>Start Week</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-slate-100 text-slate-400 cursor-not-allowed">
                    <Lock className="w-4 h-4" />
                    <span>Complete Week {wNum - 1} first</span>
                  </div>
                )}

                <button
                  onClick={() => onManageWeek(wNum)}
                  title={`Edit Questions for Week ${wNum}`}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-[#6C3CE9] hover:border-purple-200 transition-colors"
                  aria-label={`Edit Questions for Week ${wNum}`}
                >
                  <BookOpen className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
