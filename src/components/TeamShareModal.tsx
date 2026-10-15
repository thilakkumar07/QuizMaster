import React from 'react';
import {
  Users,
  Copy,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Share2,
  Sparkles,
  Layers
} from 'lucide-react';
import { Question, WeekConfig, CourseProgress } from '../types.js';
import {
  exportToCSV,
  parseTableOrCSV,
  mergeQuestionBanks
} from '../utils/quizRules.js';
import { exportDataAsJSON, importDataFromJSON } from '../utils/storage.js';

interface TeamShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  weekConfigs: WeekConfig[];
  progress: CourseProgress;
  onMergeQuestions: (merged: Question[]) => void;
  onReplaceQuestions: (questions: Question[]) => void;
}

export const TeamShareModal: React.FC<TeamShareModalProps> = ({
  isOpen,
  onClose,
  questions,
  weekConfigs,
  progress,
  onMergeQuestions,
  onReplaceQuestions
}) => {
  const [activeTab, setActiveTab] = React.useState<'sheets' | 'file' | 'code'>('sheets');
  const [pastedContent, setPastedContent] = React.useState('');
  const [copiedNotification, setCopiedNotification] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  if (!isOpen) return null;

  const showCopied = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  const handleCopyJSON = () => {
    const jsonStr = exportDataAsJSON(questions, weekConfigs);
    navigator.clipboard.writeText(jsonStr);
    showCopied('Questions JSON copied to clipboard!');
  };

  const handleDownloadCSV = () => {
    const csvContent = exportToCSV(questions);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam_practice_team_questions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCSVTemplate = () => {
    const sample = `Week\tQuestionNumber\tTopic\tQuestionText\tOptionA\tOptionB\tOptionC\tOptionD\tCorrectAnswer\tExplanation
1\t1\tGeneral\tSample question text?\tOption 1\tOption 2\tOption 3\tOption 4\tA\tWhy A is right
1\t2\tGeneral\tAnother question?\tFirst\tSecond\tThird\tFourth\tB\tWhy B is right`;
    navigator.clipboard.writeText(sample);
    showCopied('Template format copied! You can paste directly into Google Sheets.');
  };

  const handleProcessPastedData = (mode: 'merge' | 'replace') => {
    if (!pastedContent.trim()) {
      setFeedback({ type: 'error', message: 'Please paste your spreadsheet data or JSON first.' });
      return;
    }

    // Try JSON first
    if (pastedContent.trim().startsWith('{') || pastedContent.trim().startsWith('[')) {
      const res = importDataFromJSON(pastedContent);
      if (res.success && res.questions) {
        if (mode === 'merge') {
          const merged = mergeQuestionBanks(questions, res.questions);
          onMergeQuestions(merged);
          setFeedback({
            type: 'success',
            message: `Successfully merged ${res.questions.length} questions into your question bank!`
          });
        } else {
          onReplaceQuestions(res.questions);
          setFeedback({
            type: 'success',
            message: `Replaced bank with ${res.questions.length} incoming questions.`
          });
        }
        setPastedContent('');
        return;
      }
    }

    // Try Table / CSV / TSV (Google Sheets copy-paste)
    const tableRes = parseTableOrCSV(pastedContent);
    if (tableRes.success && tableRes.questions) {
      if (mode === 'merge') {
        const merged = mergeQuestionBanks(questions, tableRes.questions);
        onMergeQuestions(merged);
        setFeedback({
          type: 'success',
          message: `Successfully imported & merged ${tableRes.questions.length} questions from spreadsheet!`
        });
      } else {
        onReplaceQuestions(tableRes.questions);
        setFeedback({
          type: 'success',
          message: `Successfully loaded ${tableRes.questions.length} questions from spreadsheet!`
        });
      }
      setPastedContent('');
    } else {
      setFeedback({
        type: 'error',
        message: tableRes.errors?.[0] || 'Could not parse data. Ensure columns match the required format.'
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, mode: 'merge' | 'replace') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const text = evt.target?.result as string;
      if (file.name.endsWith('.json')) {
        const res = importDataFromJSON(text);
        if (res.success && res.questions) {
          if (mode === 'merge') {
            const merged = mergeQuestionBanks(questions, res.questions);
            onMergeQuestions(merged);
            setFeedback({
              type: 'success',
              message: `Merged ${res.questions.length} questions from file!`
            });
          } else {
            onReplaceQuestions(res.questions);
            setFeedback({
              type: 'success',
              message: `Replaced with ${res.questions.length} questions from file!`
            });
          }
        } else {
          setFeedback({ type: 'error', message: res.error || 'Failed to load JSON file.' });
        }
      } else {
        // CSV
        const res = parseTableOrCSV(text);
        if (res.success && res.questions) {
          if (mode === 'merge') {
            const merged = mergeQuestionBanks(questions, res.questions);
            onMergeQuestions(merged);
            setFeedback({
              type: 'success',
              message: `Merged ${res.questions.length} questions from CSV file!`
            });
          } else {
            onReplaceQuestions(res.questions);
            setFeedback({
              type: 'success',
              message: `Loaded ${res.questions.length} questions from CSV file!`
            });
          }
        } else {
          setFeedback({ type: 'error', message: res.errors?.[0] || 'Failed to parse CSV file.' });
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F1ECFF] text-[#6C3CE9] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#242236]">Team Question Sharing & Sync</h2>
            <p className="text-xs text-slate-500">
              Collaborate on questions with your team via Google Sheets, file export/import, or smart merge.
            </p>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3.5 rounded-2xl text-xs sm:text-sm flex items-center gap-2.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="flex-1">{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-bold underline ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {copiedNotification && (
          <div className="p-2.5 rounded-xl bg-purple-50 text-[#6C3CE9] border border-purple-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{copiedNotification}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('sheets')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'sheets'
                ? 'bg-white text-[#6C3CE9] shadow-xs'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Google Sheets / Paste</span>
          </button>

          <button
            onClick={() => setActiveTab('file')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'file'
                ? 'bg-white text-[#6C3CE9] shadow-xs'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>File Sync & Merge</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'code'
                ? 'bg-white text-[#6C3CE9] shadow-xs'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Quick Share Code</span>
          </button>
        </div>

        {/* Tab 1: Google Sheets / Excel Collaboration */}
        {activeTab === 'sheets' && (
          <div className="space-y-4">
            <div className="bg-[#FAF8FF] p-4 rounded-2xl border border-purple-100 text-xs text-slate-700 space-y-2">
              <div className="font-bold text-[#6C3CE9] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Recommended Team Workflow (100% Free):</span>
              </div>
              <p className="leading-relaxed">
                1. Create a shared <b>Google Sheet</b> for your team. Each member can write questions for their assigned weeks (e.g. Member A does Weeks 1–4, Member B does Weeks 5–8).
              </p>
              <p className="leading-relaxed">
                2. Copy the cells in Google Sheet (Ctrl+C) and paste below. The app parses it automatically!
              </p>
              <div className="pt-1 flex items-center gap-2">
                <button
                  onClick={handleCopyCSVTemplate}
                  className="px-2.5 py-1 bg-white border border-purple-200 text-[#6C3CE9] rounded-lg text-xs font-semibold hover:bg-[#F1ECFF]"
                >
                  Copy Column Headers
                </button>
                <button
                  onClick={handleDownloadCSV}
                  className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Download Current Bank (.csv)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Paste Google Sheets Rows or CSV text:
              </label>
              <textarea
                rows={5}
                placeholder="Paste rows copied from Google Sheets / Excel or CSV here... (Columns: Week, Question#, Topic, Text, OptA, OptB, OptC, OptD, Answer, Explanation)"
                value={pastedContent}
                onChange={e => setPastedContent(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#6C3CE9]"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
              <button
                onClick={() => handleProcessPastedData('replace')}
                className="w-full sm:w-auto px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors"
              >
                Replace All with Pasted
              </button>
              <button
                onClick={() => handleProcessPastedData('merge')}
                className="w-full sm:w-auto px-5 py-2 bg-[#6C3CE9] hover:bg-[#5A2FD0] text-white rounded-xl text-xs font-bold shadow-md shadow-purple-200 transition-all"
              >
                Merge with Existing Questions
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: File Sync & Merge */}
        {activeTab === 'file' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              When teammates send you their exported <code className="text-[#6C3CE9] font-bold">.json</code> or <code className="text-[#6C3CE9] font-bold">.csv</code> files, you can <b>Smart Merge</b> them. Smart Merge matches week and question slots so nobody loses their written questions.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl border border-purple-200 bg-[#F1ECFF]/40 text-center space-y-3">
                <Download className="w-6 h-6 text-[#6C3CE9] mx-auto" />
                <div>
                  <div className="font-bold text-xs text-[#242236]">Export to Share</div>
                  <div className="text-[11px] text-slate-500">Send this file to your team</div>
                </div>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => {
                      const jsonStr = exportDataAsJSON(questions, weekConfigs);
                      const blob = new Blob([jsonStr], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `exam_questions_master.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3 py-1.5 bg-[#6C3CE9] text-white rounded-lg text-xs font-bold shadow-xs hover:bg-[#5A2FD0]"
                  >
                    Export .JSON
                  </button>
                  <button
                    onClick={handleDownloadCSV}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50"
                  >
                    Export .CSV
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 text-center space-y-3">
                <Upload className="w-6 h-6 text-slate-600 mx-auto" />
                <div>
                  <div className="font-bold text-xs text-[#242236]">Import Teammate File</div>
                  <div className="text-[11px] text-slate-500">Select .json or .csv from team</div>
                </div>
                <div className="flex justify-center gap-2">
                  <label className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-emerald-700 cursor-pointer">
                    <span>Smart Merge File</span>
                    <input
                      type="file"
                      accept=".json,.csv"
                      onChange={e => handleFileUpload(e, 'merge')}
                      className="hidden"
                    />
                  </label>
                  <label className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100 cursor-pointer">
                    <span>Replace All</span>
                    <input
                      type="file"
                      accept=".json,.csv"
                      onChange={e => handleFileUpload(e, 'replace')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Quick Share Code / Raw JSON */}
        {activeTab === 'code' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Copy the full question data to send directly through messaging apps (WhatsApp, Discord, Slack, Email).
            </p>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700">
                Current Question Bank: {questions.length} Questions
              </span>
              <button
                onClick={handleCopyJSON}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#6C3CE9] text-white rounded-lg text-xs font-bold hover:bg-[#5A2FD0] shadow-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Full JSON</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Receive JSON from Teammate:
              </label>
              <textarea
                rows={4}
                placeholder="Paste JSON copied from teammate here..."
                value={pastedContent}
                onChange={e => setPastedContent(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#6C3CE9]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleProcessPastedData('merge')}
                className="px-4 py-2 bg-[#6C3CE9] hover:bg-[#5A2FD0] text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Merge Teammate JSON
              </button>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
