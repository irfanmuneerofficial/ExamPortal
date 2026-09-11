'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Search,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { TableSkeleton } from '@/components/ui/Skeleton';
import {
  getModules,
  getCourses,
  getPrograms,
  createModule,
  updateModule,
  deleteModule,
} from '@/lib/db';
import { Module, Course, Program } from '@/lib/types';
import Link from 'next/link';

interface ModuleFormData {
  course_id: string;
  title: string;
  module_number: number;
}

function ModulesContent() {
  const searchParams = useSearchParams();
  const initialCourseFilter = searchParams.get('courseId') || 'ALL';

  const [modules, setModules] = useState<Module[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>('ALL');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>(initialCourseFilter);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingModule, setDeletingModule] = useState<Module | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ModuleFormData>();

  const loadData = async () => {
    try {
      setLoading(true);
      const [modulesData, coursesData, programsData] = await Promise.all([
        getModules(),
        getCourses(),
        getPrograms(),
      ]);
      setModules(modulesData);
      setCourses(coursesData);
      setPrograms(programsData);
    } catch (err) {
      console.error('Failed to load module parts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingModule(null);
    reset({
      course_id: selectedCourseFilter !== 'ALL' ? selectedCourseFilter : courses[0]?.id || '',
      title: '',
      module_number: 1,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (m: Module) => {
    setEditingModule(m);
    reset({
      course_id: m.course_id,
      title: m.title,
      module_number: m.module_number,
    });
    setIsFormOpen(true);
  };

  const handleOpenDelete = (m: Module) => {
    setDeletingModule(m);
    setIsDeleteOpen(true);
  };

  const onSubmit = async (data: ModuleFormData) => {
    try {
      setActionLoading(true);
      if (editingModule) {
        await updateModule(
          editingModule.id,
          data.course_id,
          data.title,
          Number(data.module_number)
        );
      } else {
        await createModule(
          data.course_id,
          data.title,
          Number(data.module_number)
        );
      }
      setIsFormOpen(false);
      await loadData();
    } catch (err: any) {
      alert(`Error saving module part: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!deletingModule) return;
    try {
      setActionLoading(true);
      await deleteModule(deletingModule.id);
      setIsDeleteOpen(false);
      await loadData();
    } catch (err: any) {
      alert(`Error deleting module part: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const availableCoursesForProgram =
    selectedProgramFilter === 'ALL'
      ? courses
      : courses.filter((c) => c.program_id === selectedProgramFilter);

  const filteredModules = modules.filter((m) => {
    const parentCourse = courses.find((c) => c.id === m.course_id);

    const matchesProgram =
      selectedProgramFilter === 'ALL' ||
      (parentCourse && parentCourse.program_id === selectedProgramFilter);

    const matchesCourse =
      selectedCourseFilter === 'ALL' || m.course_id === selectedCourseFilter;

    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (parentCourse?.name &&
        parentCourse.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesProgram && matchesCourse && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-foreground" />
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              4-Part Exam Tracks
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Module Parts Management
          </h1>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-background hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Module Part</span>
        </button>
      </div>

      {/* Filter Scaffolding */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search module part title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-muted border border-border rounded-xl font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground transition-colors"
            />
          </div>

          <div>
            <select
              value={selectedProgramFilter}
              onChange={(e) => {
                setSelectedProgramFilter(e.target.value);
                setSelectedCourseFilter('ALL');
              }}
              className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl font-mono text-xs text-foreground focus:outline-none focus:border-foreground"
            >
              <option value="ALL">All Academic Tracks</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl font-mono text-xs text-foreground focus:outline-none focus:border-foreground"
            >
              <option value="ALL">All Modules ({availableCoursesForProgram.length})</option>
              {availableCoursesForProgram.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Sem {c.semester || 1})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border font-mono text-xs text-muted-foreground">
          <span>Showing {filteredModules.length} of {modules.length} module parts</span>
        </div>
      </div>

      {/* Module Parts Cards Grid */}
      {loading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : filteredModules.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card space-y-3 shadow-xs">
          <Layers className="w-10 h-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-semibold text-foreground">No Module Parts Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Create module parts under your modules or auto-generate 4 standard parts from the Modules tab.
          </p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-background hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Module Part</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map((m) => {
            const parentCourse = courses.find((c) => c.id === m.course_id);

            return (
              <div
                key={m.id}
                className="p-6 rounded-2xl border border-border bg-card hover:border-foreground/40 transition-colors flex flex-col justify-between space-y-4 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded border border-border bg-muted text-foreground font-bold">
                      Module Part {m.module_number}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit Module Part"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(m)}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-rose-500 transition-colors"
                        title="Delete Module Part"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-foreground tracking-tight line-clamp-2">
                    {m.title}
                  </h3>
                  <p className="font-mono text-xs text-muted-foreground mt-1 truncate">
                    Module: {parentCourse?.name || 'Unassigned'}
                  </p>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between font-mono text-xs">
                  <Link
                    href={`/portal/${m.id}?mode=study`}
                    target="_blank"
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </Link>

                  <Link
                    href={`/admin/questions?moduleId=${m.id}`}
                    className="px-3.5 py-1.5 rounded-full bg-foreground text-background font-semibold hover:opacity-90 transition-opacity text-[11px]"
                  >
                    MCQs →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingModule ? 'Edit Module Part' : 'Create New Module Part'}
        description="Configure unit title, module part number (1-4), and parent module assignment."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
              Target Module *
            </label>
            <select
              {...register('course_id', { required: 'Please select a module' })}
              className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-foreground"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Sem {c.semester || 1})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                Part Number *
              </label>
              <select
                {...register('module_number', { valueAsNumber: true })}
                className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-foreground font-mono font-bold"
              >
                {[1, 2, 3, 4].map((num) => (
                  <option key={num} value={num}>
                    Module Part {num}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2 space-y-1.5">
              <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                Part Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Core Syntax & Fundamentals"
                {...register('title', { required: 'Title is required' })}
                className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-foreground"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded-full border border-border bg-muted font-mono text-xs font-semibold text-foreground hover:bg-border transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 rounded-full bg-foreground font-mono text-xs font-semibold uppercase tracking-wider text-background hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {actionLoading ? 'Saving...' : editingModule ? 'Save Changes' : 'Create Module Part'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={onConfirmDelete}
        title="Delete Module Part"
        itemName={deletingModule?.title || 'this module part'}
        loading={actionLoading}
      />
    </div>
  );
}

export default function AdminModulesPage() {
  return (
    <React.Suspense fallback={<TableSkeleton rows={5} cols={4} />}>
      <ModulesContent />
    </React.Suspense>
  );
}
