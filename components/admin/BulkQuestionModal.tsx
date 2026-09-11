'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { BulkQuestionInput } from '@/lib/types';
import { SAMPLE_JSON_QUESTIONS_TEMPLATE, SAMPLE_TEXT_QUESTIONS_TEMPLATE } from '@/lib/sample-data';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  Eye,
  FileCode2,
} from 'lucide-react';

interface BulkQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBulkInsert: (questions: BulkQuestionInput[]) => Promise<void>;
  moduleTitle?: string;
  loading?: boolean;
}

export function BulkQuestionModal({
  isOpen,
  onClose,
  onBulkInsert,
  moduleTitle = 'Selected Module',
  loading = false,
}: BulkQuestionModalProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'json'>('text');
  const [rawText, setRawText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<BulkQuestionInput[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Smart Plain-Text Parser for Word/Text document formats
  const parsePlainText = (text: string): BulkQuestionInput[] => {
    const questions: BulkQuestionInput[] = [];
    const blocks = text
      .split(/\n\s*(?:(?:\d+[\.\)]|Q(?:uestion)?\s*\d+[\.:\)]))\s*/i)
      .map((b) => b.trim())
      .filter(Boolean);

    for (const block of blocks) {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) continue;

      let questionText = '';
      const options: string[] = [];
      let correctAnswer = '';
      let explanation = '';

      let optionMap: Record<string, string> = {};

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const optMatch = line.match(/^([A-Da-d])[\.\)\:\-]\s*(.*)$/);
        const ansMatch = line.match(/^(?:Ans(?:wer)?|Correct(?:\s*Answer)?)\s*[\:\-]\s*([A-Da-d]|.+)$/i);
        const expMatch = line.match(/^(?:Exp(?:lanation)?|Why|Reason)\s*[\:\-]\s*(.*)$/i);

        if (ansMatch) {
          const rawAns = ansMatch[1].trim();
          const singleLetter = rawAns.toUpperCase();
          if (['A', 'B', 'C', 'D'].includes(singleLetter) && optionMap[singleLetter]) {
            correctAnswer = optionMap[singleLetter];
          } else {
            correctAnswer = rawAns;
          }
        } else if (expMatch) {
          explanation = expMatch[1].trim();
        } else if (optMatch) {
          const letter = optMatch[1].toUpperCase();
          const optValue = optMatch[2].trim();
          optionMap[letter] = optValue;
          options.push(optValue);
        } else {
          if (options.length === 0) {
            questionText += (questionText ? ' ' : '') + line;
          }
        }
      }

      if (questionText && options.length >= 2) {
        if (!correctAnswer || !options.includes(correctAnswer)) {
          correctAnswer = options[0];
        }

        questions.push({
          question_text: questionText.replace(/^[\d\.\)\:\s]+/, '').trim(),
          options,
          correct_answer: correctAnswer,
          explanation: explanation || undefined,
        });
      }
    }

    return questions;
  };

  const handleValidateAndParse = () => {
    setValidationError(null);
    setParsedQuestions([]);

    if (!rawText.trim()) {
      setValidationError('Please enter or paste your question bank first.');
      return;
    }

    if (activeTab === 'json') {
      try {
        const data = JSON.parse(rawText);
        if (!Array.isArray(data)) {
          setValidationError('JSON root must be an array of question objects.');
          return;
        }

        const validQuestions: BulkQuestionInput[] = [];
        for (let i = 0; i < data.length; i++) {
          const item = data[i];
          if (!item.question_text || typeof item.question_text !== 'string') {
            setValidationError(`Question #${i + 1} is missing a valid "question_text".`);
            return;
          }
          if (!Array.isArray(item.options) || item.options.length < 2) {
            setValidationError(`Question #${i + 1} must have at least 2 "options".`);
            return;
          }
          if (!item.correct_answer || !item.options.includes(item.correct_answer)) {
            setValidationError(
              `Question #${i + 1} "correct_answer" must match one of the exact strings in options array.`
            );
            return;
          }

          validQuestions.push({
            question_text: item.question_text.trim(),
            options: item.options.map((o: any) => String(o).trim()),
            correct_answer: String(item.correct_answer).trim(),
            explanation: item.explanation ? String(item.explanation).trim() : undefined,
          });
        }

        setParsedQuestions(validQuestions);
        setPreviewOpen(true);
      } catch (err: any) {
        setValidationError(`Invalid JSON syntax: ${err.message}`);
      }
    } else {
      const parsed = parsePlainText(rawText);
      if (parsed.length === 0) {
        setValidationError(
          'Could not detect valid questions. Make sure format is "1. Question?\\nA) Option 1\\nB) Option 2\\nAnswer: A".'
        );
        return;
      }
      setParsedQuestions(parsed);
      setPreviewOpen(true);
    }
  };

  const handleLoadSampleText = () => {
    setActiveTab('text');
    setRawText(SAMPLE_TEXT_QUESTIONS_TEMPLATE);
    setValidationError(null);
  };

  const handleLoadSampleJSON = () => {
    setActiveTab('json');
    setRawText(SAMPLE_JSON_QUESTIONS_TEMPLATE);
    setValidationError(null);
  };

  const handleClear = () => {
    setRawText('');
    setParsedQuestions([]);
    setValidationError(null);
    setPreviewOpen(false);
  };

  const handleSubmit = async () => {
    if (parsedQuestions.length === 0) return;
    await onBulkInsert(parsedQuestions);
    handleClear();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Question Importer"
      description={`Import questions into ${moduleTitle}`}
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {/* Tab Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-1.5 rounded-full bg-muted p-1 border border-border">
            <button
              type="button"
              onClick={() => {
                setActiveTab('text');
                setValidationError(null);
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-mono text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'text'
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Smart Plain-Text / Word</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('json');
                setValidationError(null);
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-mono text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'json'
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>JSON Array</span>
            </button>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={activeTab === 'text' ? handleLoadSampleText : handleLoadSampleJSON}
              className="text-foreground underline hover:text-muted-foreground"
            >
              Load Sample Format
            </button>
            {rawText && (
              <button
                type="button"
                onClick={handleClear}
                className="text-muted-foreground hover:text-rose-400 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Text Input Area */}
        <div className="space-y-2">
          <textarea
            rows={9}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={
              activeTab === 'text'
                ? `1. What is HTML?\nA) HyperText Markup Language\nB) HighText Machine Language\nAnswer: A\nExplanation: HTML defines the standard markup structure.\n\n2. Next Question...`
                : `[\n  {\n    "question_text": "What is HTML?",\n    "options": ["HyperText Markup Language", "HighText Machine Language"],\n    "correct_answer": "HyperText Markup Language",\n    "explanation": "HTML stands for HyperText Markup Language."\n  }\n]`
            }
            className="w-full p-4 bg-muted border border-border rounded-xl font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground resize-none leading-relaxed"
          />
        </div>

        {/* Error Alert */}
        {validationError && (
          <div className="p-3 rounded-xl border border-border bg-muted text-xs text-foreground flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="font-mono">{validationError}</p>
          </div>
        )}

        {/* Action button to parse */}
        {parsedQuestions.length === 0 ? (
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-border bg-muted font-mono text-xs font-semibold text-foreground hover:bg-border transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleValidateAndParse}
              className="px-5 py-2 rounded-full bg-foreground font-mono text-xs font-semibold uppercase tracking-wider text-background hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Validate & Preview</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4 pt-2 border-t border-border">
            {/* Success Summary Banner */}
            <div className="p-4 rounded-xl border border-border bg-muted flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-foreground" />
                <div>
                  <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider font-mono">
                    {parsedQuestions.length} Questions Ready to Insert
                  </h4>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    Target: {moduleTitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewOpen(!previewOpen)}
                className="font-mono text-xs text-foreground underline hover:text-muted-foreground"
              >
                {previewOpen ? 'Collapse Preview' : 'Show Preview'}
              </button>
            </div>

            {/* Questions Preview List */}
            {previewOpen && (
              <div className="max-h-60 overflow-y-auto space-y-2.5 p-3 rounded-xl border border-border bg-card">
                {parsedQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-border bg-muted/60 text-xs space-y-2"
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border border-border bg-background">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-foreground">
                        {q.question_text}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pl-6 font-mono text-[11px]">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-1.5 rounded border ${
                            opt === q.correct_answer
                              ? 'border-foreground bg-foreground text-background font-semibold'
                              : 'border-border bg-card text-muted-foreground'
                          }`}
                        >
                          {String.fromCharCode(65 + oIdx)}) {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Final Submission Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setParsedQuestions([]);
                  setPreviewOpen(false);
                }}
                className="font-mono text-xs text-muted-foreground hover:text-foreground"
              >
                ← Back to Edit
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-full border border-border bg-muted font-mono text-xs font-semibold text-foreground hover:bg-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-5 py-2 rounded-full bg-foreground font-mono text-xs font-semibold uppercase tracking-wider text-background hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Confirm & Bulk Import</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
