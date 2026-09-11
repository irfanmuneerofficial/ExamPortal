'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  HelpCircle,
  Plus,
  Upload,
  Edit2,
  Trash2,
  CheckCircle2,
  Search,
  BookOpen,
  Layers,
  GraduationCap,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
} from 'lucide-react';
import { QuestionFormModal } from '@/components/admin/QuestionFormModal';
import { BulkQuestionModal } from '@/components/admin/BulkQuestionModal';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { TableSkeleton } from '@/components/ui/Skeleton';
import {
  getPrograms,
  getCourses,
  getModules,
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkInsertQuestions,
  clearModuleQuestions,
  exportModuleQuestions,
} from '@/lib/db';
import { Program, Course, Module, Question, BulkQuestionInput } from '@/lib/types';
import Link from 'next/link';

function QuestionsContent() {
  const searchParams = useSearchParams();
  const initialModuleId = searchParams.get('moduleId') || '';

  // Hierarchy selection state
  const [programs, setPrograms] = useState<Program[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedModuleId, setSelectedModuleId] = useState<string>(initialModuleId);

  const [loading, setLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showExplanations, setShowExplanations] = useState(true);

  // Modals state
  const [isSingleFormOpen, setIsSingleFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Initial load
  useEffect(() => {
    async function loadHierarchy() {
      try {
        setLoading(true);
        const [progs, crss, mods] = await Promise.all([
          getPrograms(),
          getCourses(),
          getModules(),
        ]);
        setPrograms(progs);
        setCourses(crss);
        setModules(mods);

        if (initialModuleId) {
          const targetMod = mods.find((m) => m.id === initialModuleId);
          if (targetMod) {
            setSelectedModuleId(targetMod.id);
            setSelectedCourseId(targetMod.course_id);
            const targetCourse = crss.find((c) => c.id === targetMod.course_id);
            if (targetCourse) {
              setSelectedProgramId(targetCourse.program_id);
            }
          }
        } else if (progs.length > 0) {
          const firstProg = progs[0];
          setSelectedProgramId(firstProg.id);

          const matchingCourses = crss.filter((c) => c.program_id === firstProg.id);
          if (matchingCourses.length > 0) {
            const firstCourse = matchingCourses[0];
            setSelectedCourseId(firstCourse.id);

            const matchingMods = mods.filter((m) => m.course_id === firstCourse.id);
            if (matchingMods.length > 0) {
              setSelectedModuleId(matchingMods[0].id);
            }
          }
        }
      } catch (err) {
        console.error('Failed hierarchy load:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHierarchy();
  }, [initialModuleId]);

  const loadQuestionsList = async () => {
    if (!selectedModuleId) {
      setQuestions([]);
      return;
    }

    try {
      setQuestionsLoading(true);
      const data = await getQuestions(selectedModuleId);
      setQuestions(data);
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setQuestionsLoading(false);
    }
  };

  useEffect(() => {
    loadQuestionsList();
  }, [selectedModuleId]);

  const handleProgramChange = (progId: string) => {
    setSelectedProgramId(progId);
    const matchingCourses = courses.filter((c) => c.program_id === progId);
    if (matchingCourses.length > 0) {
      const firstC = matchingCourses[0];
      setSelectedCourseId(firstC.id);
      const matchingM = modules.filter((m) => m.course_id === firstC.id);
      setSelectedModuleId(matchingM.length > 0 ? matchingM[0].id : '');
    } else {
      setSelectedCourseId('');
      setSelectedModuleId('');
    }
  };

  const handleCourseChange = (crsId: string) => {
    setSelectedCourseId(crsId);
    const matchingM = modules.filter((m) => m.course_id === crsId);
    setSelectedModuleId(matchingM.length > 0 ? matchingM[0].id : '');
  };

  const handleOpenCreateSingle = () => {
    setEditingQuestion(null);
    setIsSingleFormOpen(true);
  };

  const handleOpenEditSingle = (q: Question) => {
    setEditingQuestion(q);
    setIsSingleFormOpen(true);
  };

  const handleOpenDelete = (q: Question) => {
    setDeletingQuestion(q);
    setIsDeleteOpen(true);
  };

  const onSaveSingle = async (data: {
    question_text: string;
    options: string[];
    correct_answer: string;
    explanation?: string;
  }) => {
    if (!selectedModuleId) {
      alert('Please select a target module part first');
      return;
    }

    try {
      setActionLoading(true);
      if (editingQuestion) {
        await updateQuestion(
          editingQuestion.id,
          selectedModuleId,
          data.question_text,
          data.options,
          data.correct_answer,
          data.explanation
        );
      } else {
        await createQuestion(
          selectedModuleId,
          data.question_text,
          data.options,
          data.correct_answer,
          data.explanation
        );
      }
      setIsSingleFormOpen(false);
      await loadQuestionsList();
    } catch (err: any) {
      alert(`Error saving question: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const onBulkInsert = async (incomingQuestions: BulkQuestionInput[]) => {
    if (!selectedModuleId) {
      alert('Please select a target module part first');
      return;
    }

    try {
      setActionLoading(true);
      await bulkInsertQuestions(selectedModuleId, incomingQuestions);
      await loadQuestionsList();
    } catch (err: any) {
      alert(`Bulk insert failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!deletingQuestion) return;
    try {
      setActionLoading(true);
      await deleteQuestion(deletingQuestion.id);
      setIsDeleteOpen(false);
      await loadQuestionsList();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportJSON = async () => {
    if (!selectedModuleId) return;
    try {
      const jsonStr = await exportModuleQuestions(selectedModuleId);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `questions-${selectedModule?.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'module_part'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    }
  };

  const currentProgram = programs.find((p) => p.id === selectedProgramId);
  const currentCourse = courses.find((c) => c.id === selectedCourseId);
  const selectedModule = modules.find((m) => m.id === selectedModuleId);

  const matchingCourses = courses.filter((c) => c.program_id === selectedProgramId);
  const matchingModules = modules.filter((m) => m.course_id === selectedCourseId);

  const filteredQuestions = questions.filter((q) => {
    const query = searchQuery.toLowerCase();
    const matchText = q.question_text.toLowerCase().includes(query);
    const matchAns = q.correct_answer.toLowerCase().includes(query);
    const matchExp = (q.explanation || '').toLowerCase().includes(query);
    const matchOpts = q.options.some((o) => o.toLowerCase().includes(query));
    return matchText || matchAns || matchExp || matchOpts;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-foreground" />
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Question Banks
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            MCQ Authoring & Bulk Importer
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            disabled={!selectedModuleId}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-foreground hover:bg-border transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Bulk Import (Text/JSON)</span>
          </button>

          <button
            onClick={handleOpenCreateSingle}
            disabled={!selectedModuleId}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-background hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Single MCQ</span>
          </button>
        </div>
      </div>

      {/* Cascading Target Selector */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3 font-mono text-xs">
          <span className="font-bold uppercase tracking-wider text-foreground">
            Target Module Part Selection
          </span>
          {selectedModule && (
            <Link
              href={`/portal/${selectedModule.id}?mode=study`}
              target="_blank"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Student View</span>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block font-mono text-xs text-muted-foreground font-semibold">
              01 Academic Track
            </label>
            <select
              value={selectedProgramId}
              onChange={(e) => handleProgramChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl font-mono text-xs text-foreground focus:outline-none focus:border-foreground"
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block font-mono text-xs text-muted-foreground font-semibold">
              02 Module
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              disabled={matchingCourses.length === 0}
              className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl font-mono text-xs text-foreground focus:outline-none focus:border-foreground disabled:opacity-40"
            >
              {matchingCourses.length === 0 ? (
                <option value="">No modules available</option>
              ) : (
                matchingCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Sem {c.semester || 1})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block font-mono text-xs text-muted-foreground font-semibold">
              03 Module Part (1-4)
            </label>
            <select
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              disabled={matchingModules.length === 0}
              className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl font-mono text-xs text-foreground focus:outline-none focus:border-foreground disabled:opacity-40 font-bold"
            >
              {matchingModules.length === 0 ? (
                <option value="">No module parts available</option>
              ) : (
                matchingModules.map((m) => (
                  <option key={m.id} value={m.id}>
                    Module Part {m.module_number}: {m.title}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search questions in this module part..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-full font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end font-mono text-xs">
          <button
            type="button"
            onClick={() => setShowExplanations(!showExplanations)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-muted text-foreground hover:bg-border transition-colors cursor-pointer"
          >
            {showExplanations ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Hide Explanations</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Show Explanations</span>
              </>
            )}
          </button>

          {questions.length > 0 && (
            <button
              onClick={handleExportJSON}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-muted text-foreground hover:bg-border transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          )}

          <span className="text-muted-foreground font-semibold">
            {filteredQuestions.length} of {questions.length} MCQs
          </span>
        </div>
      </div>

      {/* Questions List */}
      {questionsLoading ? (
        <TableSkeleton rows={4} cols={2} />
      ) : filteredQuestions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card space-y-4 shadow-xs">
          <HelpCircle className="w-10 h-10 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-base font-semibold text-foreground">No Questions in this Module Part</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Add individual MCQs with custom options or paste your text notes using the bulk importer.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-background hover:opacity-90 transition-opacity"
            >
              <Upload className="w-4 h-4" />
              <span>Bulk Import Questions</span>
            </button>
            <button
              onClick={handleOpenCreateSingle}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2 font-mono text-xs font-semibold text-foreground hover:bg-border transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Single MCQ</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="p-6 rounded-2xl border border-border bg-card hover:border-foreground/40 transition-colors space-y-4 group shadow-xs"
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-muted font-mono text-xs font-bold text-foreground flex-shrink-0 mt-0.5">
                    {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                  </span>
                  <h3 className="text-sm sm:text-base font-medium text-foreground leading-relaxed">
                    {q.question_text}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleOpenEditSingle(q)}
                    title="Edit MCQ"
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenDelete(q)}
                    title="Delete MCQ"
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {q.options.map((opt, optIdx) => {
                  const isCorrect = opt === q.correct_answer;

                  return (
                    <div
                      key={optIdx}
                      className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 transition-all ${
                        isCorrect
                          ? 'border-foreground bg-muted font-bold text-foreground'
                          : 'border-border bg-muted/40 text-muted-foreground'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[10px] font-bold ${
                          isCorrect
                            ? 'bg-foreground text-background'
                            : 'bg-card border border-border text-muted-foreground'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-foreground flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation section */}
              {showExplanations && q.explanation && (
                <div className="p-3.5 rounded-xl border border-border bg-muted/50 text-xs text-muted-foreground flex items-start gap-2.5">
                  <HelpCircle className="w-4 h-4 text-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-mono font-bold text-foreground uppercase tracking-wider">Explanation: </span>
                    <span>{q.explanation}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <QuestionFormModal
        isOpen={isSingleFormOpen}
        onClose={() => setIsSingleFormOpen(false)}
        onSave={onSaveSingle}
        initialData={editingQuestion}
        loading={actionLoading}
      />

      <BulkQuestionModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onBulkInsert={onBulkInsert}
        moduleTitle={selectedModule?.title || 'Selected Module Part'}
        loading={actionLoading}
      />

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={onConfirmDelete}
        title="Delete Question"
        itemName={deletingQuestion ? `"${deletingQuestion.question_text.slice(0, 40)}..."` : 'this question'}
        loading={actionLoading}
      />
    </div>
  );
}

export default function AdminQuestionsPage() {
  return (
    <React.Suspense fallback={<TableSkeleton rows={6} cols={4} />}>
      <QuestionsContent />
    </React.Suspense>
  );
}
