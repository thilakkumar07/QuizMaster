import React from 'react';
import { Question, OptionKey, CourseProgress, WeekConfig } from '../types.js';
import { validateQuestion } from '../utils/quizRules.js';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Filter,
  Check,
  Sparkles,
  Users
} from 'lucide-react';
import { exportDataAsJSON, importDataFromJSON } from '../utils/storage.js';
import { TeamShareModal } from './TeamShareModal.js';

interface QuestionManagerProps {
  questions: Question[];
  progress: CourseProgress;
  weekConfigs: WeekConfig[];
  selectedWeek: number;
  onSelectWeek: (w: number) => void;
  onSaveQuestion: (question: Question) => void;
  onDeleteQuestion: (questionId: string) => void;
  onDuplicateQuestion: (question: Question) => void;
  onImportQuestions: (imported: Question[]) => void;
  onMergeQuestions: (merged: Question[]) => void;
  onAddEmptySlot: (weekNumber: number) => void;
  editingQuestion: Question | null;
  onSetEditingQuestion: (question: Question | null) => void;
}

export const QuestionManager: React.FC<QuestionManagerProps> = ({
  questions,
  progress,
  weekConfigs,
  selectedWeek,
  onSelectWeek,
  onSaveQuestion,
  onDeleteQuestion,
  onDuplicateQuestion,
  onImportQuestions,
  onMergeQuestions,
  onAddEmptySlot,
  editingQuestion,
  onSetEditingQuestion
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [topicFilter, setTopicFilter] = React.useState<string>('all');
  const [deleteCandidate, setDeleteCandidate] = React.useState<Question | null>(null);
  const [isTeamShareOpen, setIsTeamShareOpen] = React.useState(false);

  // Form state for Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [formData, setFormData] = React.useState<Partial<Question>>({
    weekNumber: selectedWeek,
    questionNumber: 1,
    text: '',
    options: { A: '', B: '', C: '', D: '' },
    correctAnswer: 'A',
    explanation: '',
    topic: ''
  });
  const [formErrors, setFormErrors] = React.useState<string[]>([]);
  const [importError, setImportError] = React.useState<string | null>(null);
  const [importSuccess, setImportSuccess] = React.useState<string | null>(null);

  // When editingQuestion prop changes externally (e.g. from QuizView "Edit Question" button)
  React.useEffect(() => {
    if (editingQuestion) {
      setFormData({
        id: editingQuestion.id,
        weekNumber: editingQuestion.weekNumber,
        questionNumber: editingQuestion.questionNumber,
        text: editingQuestion.text,
        options: { ...editingQuestion.options },
        correctAnswer: editingQuestion.correctAnswer,
        explanation: editingQuestion.explanation || '',
        topic: editingQuestion.topic || ''
      });
      setFormErrors([]);
      setIsModalOpen(true);
    }
  }, [editingQuestion]);

  const openNewQuestionModal = () => {
    const existingInWeek = questions.filter(q => q.weekNumber === selectedWeek);
    const nextQNum = existingInWeek.length + 1;
    setFormData({
      id: undefined,
      weekNumber: selectedWeek,
      questionNumber: nextQNum,
      text: '',
      options: { A: '', B: '', C: '', D: '' },
      correctAnswer: 'A',
      explanation: '',
      topic: `Topic ${selectedWeek}`
    });
    setFormErrors([]);
    setIsModalOpen(true);
  };

  const handleEditClick = (q: Question) => {
    onSetEditingQuestion(q);
    setFormData({
      id: q.id,
      weekNumber: q.weekNumber,
      questionNumber: q.questionNumber,
      text: q.text,
      options: { ...q.options },
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
      topic: q.topic || ''
    });
    setFormErrors([]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    onSetEditingQuestion(null);
    setFormErrors([]);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateQuestion(formData);
    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }

    const questionToSave: Question = {
      id: formData.id || `w${formData.weekNumber}-q${Date.now()}`,
      weekNumber: Number(formData.weekNumber),
      questionNumber: Number(formData.questionNumber),
      text: formData.text!.trim(),
      options: {
        A: formData.options!.A.trim(),
        B: formData.options!.B.trim(),
        C: formData.options!.C.trim(),
        D: formData.options!.D.trim()
      },
      correctAnswer: formData.correctAnswer as OptionKey,
      explanation: formData.explanation?.trim() || undefined,
      topic: formData.topic?.trim() || undefined,
      isDraft: false
    };

    onSaveQuestion(questionToSave);
    handleCloseModal();
  };

  const handleExportJSON = () => {
    const jsonStr = exportDataAsJSON(questions, weekConfigs, progress);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my_exam_practice_questions_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      const res = importDataFromJSON(content);
      if (res.success && res.questions) {
        onImportQuestions(res.questions);
        setImportSuccess(`Successfully imported ${res.questions.length} questions!`);
        setImportError(null);
        setTimeout(() => setImportSuccess(null), 4000);
      } else {
        setImportError(res.error || 'Failed to import JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filter questions for the selected week and search query
  const weekQuestions = React.useMemo(() => {
    return questions.filter(q => q.weekNumber === selectedWeek);
  }, [questions, selectedWeek]);

  const uniqueTopics = React.useMemo(() => {
    const set = new Set<string>();
    weekQuestions.forEach(q => {
      if (q.topic) set.add(q.topic);
    });
    return Array.from(set);
  }, [weekQuestions]);

  const filteredQuestions = React.useMemo(() => {
    return weekQuestions.filter(q => {
      const matchesSearch =
        searchQuery === '' ||
        q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.options.A.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.options.B.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.options.C.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.options.D.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.topic && q.topic.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTopic = topicFilter === 'all' || q.topic === topicFilter;

      return matchesSearch && matchesTopic;
    });
  }, [weekQuestions, searchQuery, topicFilter]);

  const currentConfig = weekConfigs.find(c => c.weekNumber === selectedWeek);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#242236]">Question Management</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#F1ECFF] text-[#6C3CE9] text-xs font-bold">
              {questions.length} Questions Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Add, edit, duplicate, and organize your syllabus questions. Changes persist automatically.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsTeamShareOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F1ECFF] hover:bg-purple-100 text-[#6C3CE9] font-bold text-xs sm:text-sm border border-purple-200 transition-all active:scale-98 shadow-xs"
          >
            <Users className="w-4 h-4" />
            <span>Team Share & Sync</span>
          </button>

          <button
            onClick={openNewQuestionModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6C3CE9] hover:bg-[#5A2FD0] text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Add Question</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            title="Download JSON Backup"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>

          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Import JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Notifications */}
      {importSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{importSuccess}</span>
        </div>
      )}
      {importError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{importError}</span>
        </div>
      )}

      {/* 12 Week Horizontal Selector Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(w => {
            const count = questions.filter(q => q.weekNumber === w).length;
            const isSelected = selectedWeek === w;
            return (
              <button
                key={w}
                onClick={() => onSelectWeek(w)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#6C3CE9] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>Week {w}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Week Header & Search / Filter Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-[#242236]">
                Week {selectedWeek}: {currentConfig?.title || `Module ${selectedWeek}`}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-purple-100 text-[#6C3CE9] text-xs font-bold">
                {weekQuestions.length} Questions
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Configured practice slots for this week.
            </p>
          </div>

          <button
            onClick={() => onAddEmptySlot(selectedWeek)}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 text-[#6C3CE9] hover:bg-[#F1ECFF] text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Slot to Week {selectedWeek}</span>
          </button>
        </div>

        {/* Search & Topic Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search question text, options, or topic..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#6C3CE9]"
            />
          </div>

          {uniqueTopics.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={topicFilter}
                onChange={e => setTopicFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#6C3CE9]"
              >
                <option value="all">All Topics ({weekQuestions.length})</option>
                {uniqueTopics.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-[#242236]">No questions found</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? 'No questions matched your search query.'
                : `Week ${selectedWeek} has no questions yet.`}
            </p>
            <button
              onClick={openNewQuestionModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6C3CE9] text-white text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Question</span>
            </button>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const p = progress.questionProgress[q.id];
            const isMastered = !!p?.isMastered;
            const optionKeys: OptionKey[] = ['A', 'B', 'C', 'D'];

            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-purple-200 transition-all shadow-xs p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-xs px-2.5 py-1 rounded-md bg-slate-100 text-[#242236]">
                      #{q.questionNumber}
                    </span>
                    {q.topic && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F1ECFF] text-[#6C3CE9] font-semibold">
                        {q.topic}
                      </span>
                    )}
                    {q.isDraft ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                        Draft Slot
                      </span>
                    ) : isMastered ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                        <Check className="w-3.5 h-3.5" />
                        <span>Mastered</span>
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        Unattempted
                      </span>
                    )}
                  </div>

                  {/* Actions for Question */}
                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    <button
                      onClick={() => handleEditClick(q)}
                      className="p-1.5 text-slate-600 hover:text-[#6C3CE9] hover:bg-[#F1ECFF] rounded-lg transition-colors"
                      title="Edit Question"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDuplicateQuestion(q)}
                      className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Duplicate Question"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteCandidate(q)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <h4 className="text-base font-bold text-[#242236] leading-snug">{q.text}</h4>

                {/* 4 Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                  {optionKeys.map(key => {
                    const isCorrect = key === q.correctAnswer;
                    return (
                      <div
                        key={key}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                          isCorrect
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {key}
                        </span>
                        <span className="truncate flex-1">{q.options[key]}</span>
                        {isCorrect && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-sm">
                            Correct
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation preview if any */}
                {q.explanation && (
                  <div className="text-xs bg-slate-50 p-2.5 rounded-xl text-slate-600 border border-slate-100">
                    <span className="font-bold text-slate-800">Explanation: </span>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Question Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
            <button
              onClick={handleCloseModal}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-[#242236]">
              {formData.id ? 'Edit Question' : 'Add New Question'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your question text, 4 options, and select the correct answer.
            </p>

            {formErrors.length > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
                <div className="font-bold">Please resolve the following:</div>
                <ul className="list-disc list-inside">
                  {formErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleSaveForm} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Week Number (1–12) *
                  </label>
                  <select
                    value={formData.weekNumber || selectedWeek}
                    onChange={e =>
                      setFormData({ ...formData, weekNumber: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#6C3CE9]"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(w => (
                      <option key={w} value={w}>
                        Week {w}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Question Slot # *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.questionNumber || 1}
                    onChange={e =>
                      setFormData({ ...formData, questionNumber: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#6C3CE9]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Topic / Syllabus Section (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kinematics, Thermodynamics, Chapter 3"
                  value={formData.topic || ''}
                  onChange={e => setFormData({ ...formData, topic: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#6C3CE9]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Question Text *
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter the full exam practice question text..."
                  value={formData.text || ''}
                  onChange={e => setFormData({ ...formData, text: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#6C3CE9]"
                  required
                />
              </div>

              {/* 4 Options & Correct Answer Radio */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Answer Options & Correct Answer *
                </label>
                {(['A', 'B', 'C', 'D'] as OptionKey[]).map(key => {
                  const isCorrect = formData.correctAnswer === key;
                  return (
                    <div
                      key={key}
                      className={`p-2.5 rounded-xl border flex items-center gap-3 transition-colors ${
                        isCorrect
                          ? 'border-emerald-400 bg-emerald-50/50'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, correctAnswer: key })}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isCorrect
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                        title={`Select ${key} as correct answer`}
                      >
                        {key}
                      </button>

                      <input
                        type="text"
                        placeholder={`Option ${key} text...`}
                        value={formData.options?.[key] || ''}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            options: { ...formData.options!, [key]: e.target.value }
                          })
                        }
                        className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-slate-800 focus:outline-hidden"
                        required
                      />

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, correctAnswer: key })}
                        className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-colors ${
                          isCorrect
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {isCorrect ? '✓ Correct Answer' : 'Set as Correct'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Explanation (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain why the correct answer is right, formula, or textbook reference..."
                  value={formData.explanation || ''}
                  onChange={e => setFormData({ ...formData, explanation: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#6C3CE9]"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#6C3CE9] hover:bg-[#5A2FD0] text-white text-xs sm:text-sm font-bold shadow-md transition-colors"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Question Confirmation Dialog */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-rose-600">Delete Question?</h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Are you sure you want to delete Question #{deleteCandidate.questionNumber} (&ldquo;
              {deleteCandidate.text.slice(0, 50)}...&rdquo;)?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteQuestion(deleteCandidate.id);
                  setDeleteCandidate(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Share & Sync Modal */}
      <TeamShareModal
        isOpen={isTeamShareOpen}
        onClose={() => setIsTeamShareOpen(false)}
        questions={questions}
        weekConfigs={weekConfigs}
        progress={progress}
        onMergeQuestions={merged => {
          onMergeQuestions(merged);
        }}
        onReplaceQuestions={replaced => {
          onImportQuestions(replaced);
        }}
      />
    </div>
  );
};
