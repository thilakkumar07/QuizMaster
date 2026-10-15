import React from 'react';
import { ViewMode, CourseProgress, Question } from '../types.js';
import {
  LayoutDashboard,
  BookOpen,
  Edit3,
  AlertCircle,
  BarChart2,
  RotateCcw,
  GraduationCap,
  Menu,
  X
} from 'lucide-react';
import { calculateOverallProgress } from '../utils/quizRules.js';

interface HeaderProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  progress: CourseProgress;
  questions: Question[];
  onOpenResetConfirm: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  progress,
  questions,
  onOpenResetConfirm
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const overall = calculateOverallProgress(questions, progress.questionProgress);

  const navItems = [
    { id: 'dashboard' as ViewMode, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'quiz' as ViewMode, label: 'Quiz', icon: BookOpen },
    { id: 'management' as ViewMode, label: 'Manage Questions', icon: Edit3 },
    {
      id: 'review_incorrect' as ViewMode,
      label: 'Review Mistakes',
      icon: AlertCircle,
      badge: overall.questionsNeedingPractice > 0 ? overall.questionsNeedingPractice : undefined
    },
    { id: 'statistics' as ViewMode, label: 'Statistics', icon: BarChart2 }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none min-w-0"
            onClick={() => onViewChange('dashboard')}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#6C3CE9] text-white flex items-center justify-center shadow-md shadow-purple-200 shrink-0">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg text-[#242236] tracking-tight whitespace-nowrap">
                  My Exam Practice
                </span>
                <span className="hidden sm:inline-block text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#F1ECFF] text-[#6C3CE9] whitespace-nowrap">
                  100% Mastery
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block whitespace-nowrap">
                12-Week Course Syllabus • 120 Questions
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#F1ECFF] text-[#6C3CE9] shadow-xs'
                      : 'text-slate-600 hover:text-[#242236] hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs font-bold bg-rose-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Overall Mastery Pill & Reset */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500">Mastery:</span>
              <span className="font-bold text-[#6C3CE9]">{overall.percentage}%</span>
              <span className="text-slate-400">
                ({overall.masteredQuestions}/{overall.totalQuestions})
              </span>
            </div>

            <button
              onClick={onOpenResetConfirm}
              title="Reset Progress"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
              aria-label="Reset Progress"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={onOpenResetConfirm}
              title="Reset Progress"
              className="p-2 text-slate-400 hover:text-rose-600 rounded-lg"
              aria-label="Reset Progress"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          <div className="px-3 py-2 mb-2 bg-[#F1ECFF] rounded-lg text-xs flex justify-between items-center text-[#6C3CE9]">
            <span className="font-semibold">Mastery Progress:</span>
            <span className="font-bold">
              {overall.percentage}% ({overall.masteredQuestions}/{overall.totalQuestions})
            </span>
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#F1ECFF] text-[#6C3CE9] font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
