'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '@/components/ui/Modal';
import { Question } from '@/lib/types';
import { CheckCircle2 } from 'lucide-react';

interface QuestionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    question_text: string;
    options: string[];
    correct_answer: string;
    explanation?: string;
  }) => Promise<void>;
  initialData?: Question | null;
  loading?: boolean;
}

interface FormValues {
  question_text: string;
  option_0: string;
  option_1: string;
  option_2: string;
  option_3: string;
  correct_index: number;
  explanation: string;
}

export function QuestionFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  loading = false,
}: QuestionFormModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      question_text: '',
      option_0: '',
      option_1: '',
      option_2: '',
      option_3: '',
      correct_index: 0,
      explanation: '',
    },
  });

  const selectedCorrectIndex = watch('correct_index');

  useEffect(() => {
    if (initialData) {
      const opts = initialData.options || [];
      const cIndex = opts.findIndex((o) => o === initialData.correct_answer);

      reset({
        question_text: initialData.question_text,
        option_0: opts[0] || '',
        option_1: opts[1] || '',
        option_2: opts[2] || '',
        option_3: opts[3] || '',
        correct_index: cIndex !== -1 ? cIndex : 0,
        explanation: initialData.explanation || '',
      });
    } else {
      reset({
        question_text: '',
        option_0: '',
        option_1: '',
        option_2: '',
        option_3: '',
        correct_index: 0,
        explanation: '',
      });
    }
  }, [initialData, reset, isOpen]);

  const onSubmit = async (values: FormValues) => {
    const options = [
      values.option_0.trim(),
      values.option_1.trim(),
      values.option_2.trim(),
      values.option_3.trim(),
    ].filter(Boolean);

    if (options.length < 2) {
      alert('Please provide at least 2 options for the question.');
      return;
    }

    const cIdx = Number(values.correct_index);
    const correctAnswer = options[cIdx] || options[0];

    await onSave({
      question_text: values.question_text.trim(),
      options,
      correct_answer: correctAnswer,
      explanation: values.explanation.trim() || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Multiple Choice Question' : 'Create Multiple Choice Question'}
      description="Define the question stem, 4 options, the correct answer, and an in-depth explanation."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Question Text */}
        <div className="space-y-1.5">
          <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
            Question Stem *
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Which HTML5 tag is used to specify a footer for a document or section?"
            {...register('question_text', { required: 'Question text is required' })}
            className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground resize-none leading-relaxed"
          />
          {errors.question_text && (
            <p className="text-xs font-mono text-rose-400">{errors.question_text.message}</p>
          )}
        </div>

        {/* 4 Options with Radio Correct Selector */}
        <div className="space-y-2.5">
          <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
            Answer Options (Select the correct radio button) *
          </label>

          {[0, 1, 2, 3].map((idx) => {
            const fieldName = `option_${idx}` as keyof FormValues;
            const letter = String.fromCharCode(65 + idx);
            const isCorrect = Number(selectedCorrectIndex) === idx;

            return (
              <div
                key={idx}
                className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                  isCorrect
                    ? 'border-foreground bg-muted ring-1 ring-foreground'
                    : 'border-border bg-muted/40'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setValue('correct_index', idx)}
                  className={`w-7 h-7 rounded flex items-center justify-center font-mono text-xs font-bold transition-all ${
                    isCorrect
                      ? 'bg-foreground text-background shadow-sm'
                      : 'bg-background border border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {letter}
                </button>

                <input
                  type="text"
                  placeholder={`Option ${letter} text...`}
                  {...register(fieldName, {
                    required: idx < 2 ? `Option ${letter} is required` : false,
                  })}
                  className="flex-1 px-3 py-1.5 bg-transparent border-0 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none"
                />

                {isCorrect && (
                  <span className="font-mono text-[10px] uppercase font-bold text-foreground px-2 py-0.5 rounded border border-border bg-background flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-foreground" />
                    <span>Correct</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Explanation */}
        <div className="space-y-1.5">
          <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
            In-Depth Explanation (Shown in Study Mode & Results)
          </label>
          <textarea
            rows={2}
            placeholder="Explain why the selected option is correct with pedagogical context..."
            {...register('explanation')}
            className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground resize-none leading-relaxed"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border font-mono text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-border bg-muted font-semibold text-foreground hover:bg-border transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-full bg-foreground font-semibold uppercase tracking-wider text-background hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Saving...' : initialData ? 'Update MCQ' : 'Save MCQ'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
