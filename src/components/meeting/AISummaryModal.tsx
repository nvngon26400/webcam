import React, { useState } from 'react';
import { useMeeting } from '../../context/MeetingContext';
import { useI18n } from '../../context/I18nContext';
import {
  Sparkles,
  X,
  CheckCircle2,
  ListTodo,
  FileText,
  Download,
  Copy,
  Check,
  RefreshCw,
  BrainCircuit,
} from 'lucide-react';

interface AISummaryModalProps {
  onClose: () => void;
}

export const AISummaryModal: React.FC<AISummaryModalProps> = ({ onClose }) => {
  const { t } = useI18n();
  const { aiSummary, isGeneratingAI, generateAIMinutes, activeMeeting } = useMeeting();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!aiSummary) return;
    const text = `# ${aiSummary.meetingTitle} — AI Meeting Summary\n\n## Executive Summary\n${
      aiSummary.executiveSummary
    }\n\n## Key Decisions\n${aiSummary.keyDecisions
      .map((d) => `- ${d}`)
      .join('\n')}\n\n## Action Items\n${aiSummary.actionItems
      .map((a) => `- [ ] **${a.task}** (Assignee: ${a.assignee}, Priority: ${a.priority.toUpperCase()})`)
      .join('\n')}\n\n## Topics Discussed\n${aiSummary.keyTopics.join(', ')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!aiSummary) return;
    const text = `# ${aiSummary.meetingTitle} — AI Meeting Summary\n\n## Executive Summary\n${
      aiSummary.executiveSummary
    }\n\n## Key Decisions\n${aiSummary.keyDecisions
      .map((d) => `- ${d}`)
      .join('\n')}\n\n## Action Items\n${aiSummary.actionItems
      .map((a) => `- [ ] **${a.task}** (Assignee: ${a.assignee}, Priority: ${a.priority.toUpperCase()})`)
      .join('\n')}\n\n## Topics Discussed\n${aiSummary.keyTopics.join(', ')}`;

    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Meeting_Summary_${activeMeeting?.id || 'session'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <BrainCircuit className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {t.ai.title}
              </h2>
              <p className="text-xs text-slate-400">
                Powered by Gemini 2.5 Flash Enterprise Intelligence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!aiSummary && !isGeneratingAI && (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-8 h-8 text-indigo-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white">Generate Executive Meeting Minutes</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Automatically synthesize chat messages, decisions, and discussions into a structured executive brief with prioritized action items.
                </p>
              </div>
              <button
                onClick={generateAIMinutes}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{t.ai.generateSummary}</span>
              </button>
            </div>
          )}

          {isGeneratingAI && (
            <div className="text-center py-12 space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
              <p className="text-sm font-medium text-slate-200">{t.ai.processing}</p>
              <p className="text-xs text-slate-500">Extracting topics, key decisions, and assigning tasks...</p>
            </div>
          )}

          {aiSummary && !isGeneratingAI && (
            <div className="space-y-6">
              {/* Executive Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  <FileText className="w-4 h-4" />
                  <span>{t.ai.executiveSummary}</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-200">
                  {aiSummary.executiveSummary}
                </p>
              </div>

              {/* Key Decisions */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t.ai.keyDecisions}</span>
                </div>
                <div className="grid gap-2">
                  {aiSummary.keyDecisions.map((decision, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs text-slate-200 flex items-start gap-2.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span>{decision}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Items */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  <ListTodo className="w-4 h-4" />
                  <span>{t.ai.actionItems}</span>
                </div>
                <div className="space-y-2">
                  {aiSummary.actionItems.map((item, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-medium text-slate-200">{item.task}</div>
                        <div className="text-[11px] text-slate-400">
                          Assignee: <span className="text-slate-300 font-semibold">{item.assignee}</span> · Due: {item.dueDate || 'Next Sprint'}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          item.priority === 'high'
                            ? 'bg-rose-950/60 text-rose-400 border border-rose-800/50'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.priority.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Topics Covered */}
              <div className="pt-2 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400">Topics:</span>
                {aiSummary.keyTopics.map((topic, i) => (
                  <span
                    key={i}
                    className="text-[11px] bg-slate-800/90 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/60"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {aiSummary && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
            <button
              onClick={generateAIMinutes}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerate with Gemini</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t.ai.copied : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/25 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.ai.downloadReport}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
