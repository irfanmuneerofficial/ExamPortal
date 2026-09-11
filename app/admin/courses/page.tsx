'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Search,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { TableSkeleton } from '@/components/ui/Skeleton';
import {
  getCourses,
  getPrograms,
  createCourse,
  updateCourse,
  deleteCourse,
  autoGenerateCourseModules,
} from '@/lib/db';
import { Course, Program } from '@/lib/types';
import Link from 'next/link';

interface CourseFormData {
  program_id: string;
  name: string;
  code: string;
  semester: number;
}

function CoursesContent() {
  const searchParams = useSearchParams();
  const initialProgramFilter = searchParams.get('programId') || 'ALL';

  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>(initialProgramFilter);
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [generatingForCourseId, setGeneratingForCourseId] = useState<string | null>(null);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CourseFormData>();

  const loadData = async () => {
    try {
      setLoading(true);
      const [coursesData, programsData] = await Promise.all([
        getCourses(),
        getPrograms(),
      ]);
      setCourses(coursesData);
      setPrograms(programsData);
    } catch (err) {
      console.error('Failed to load modules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingCourse(null);
    reset({
      program_id: selectedProgramFilter !== 'ALL' ? selectedProgramFilter : programs[0]?.id || '',
      name: '',
      code: '',
      semester: 1,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (c: Course) => {
    setEditingCourse(c);
    reset({
      program_id: c.program_id,
      name: c.name,
      code: c.code || '',
      semester: c.semester || 1,
    });
    setIsFormOpen(true);
  };

  const handleOpenDelete = (c: Course) => {
    setDeletingCourse(c);
    setIsDeleteOpen(true);
  };

  const onSubmit = async (data: CourseFormData) => {
    try {
      setActionLoading(true);
      if (editingCourse) {
        await updateCourse(
          editingCourse.id,
          data.program_id,
          data.name,
          data.code,
          Number(data.semester)
        );
      } else {
        await createCourse(
          data.program_id,
          data.name,
          data.code,
          Number(data.semester)
        );
      }
      setIsFormOpen(false);
      await loadData();
    } catch (err: any) {
      alert(`Error saving module: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!deletingCourse) return;
    try {
      setActionLoading(true);
      await deleteCourse(deletingCourse.id);
      setIsDeleteOpen(false);
      await loadData();
    } catch (err: any) {
      alert(`Error deleting module: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAutoGenerate4Modules = async (courseId: string, courseName: string) => {
    try {
      setGeneratingForCourseId(courseId);
      await autoGenerateCourseModules(courseId, courseName);
      await loadData();
    } catch (err: any) {
      alert(`Failed to generate module parts: ${err.message}`);
    } finally {
      setGeneratingForCourseId(null);
    }
  };

  const filteredCourses = courses.filter((c) => {
    const matchesProgram =
      selectedProgramFilter === 'ALL' || c.program_id === selectedProgramFilter;
    const matchesSemester =
      selectedSemesterFilter === 'ALL' ||
      (c.semester || 1) === Number(selectedSemesterFilter);
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.code && c.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.programs?.name && c.programs.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesProgram && matchesSemester && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-foreground" />
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Curriculum Architecture
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Modules Catalog
          </h1>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-background hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Module</span>
        </button>
      </div>

      {/* Filter Scaffolding Card */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search module title or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-muted border border-border rounded-xl font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground transition-colors"
            />
          </div>

          <div>
            <select
              value={selectedProgramFilter}
              onChange={(e) => setSelectedProgramFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl font-mono text-xs text-foreground focus:outline-none focus:border-foreground"
            >
              <option value="ALL">All Academic Tracks ({programs.length})</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedSemesterFilter}
              onChange={(e) => setSelectedSemesterFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl font-mono text-xs text-foreground focus:outline-none focus:border-foreground"
            >
              <option value="ALL">All Semesters (1 to 6)</option>
              {[1, 2, 3, 4, 5, 6].map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border font-mono text-xs text-muted-foreground">
          <span>Showing {filteredCourses.length} of {courses.length} modules</span>
        </div>
      </div>

      {/* Module List */}
      {loading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : filteredCourses.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card space-y-3 shadow-xs">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-semibold text-foreground">No Modules Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Create a module under one of your academic tracks or adjust your filter selection above.
          </p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-background hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Module</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCourses.map((c) => (
            <div
              key={c.id}
              className="p-6 rounded-2xl border border-border bg-card hover:border-foreground/40 transition-colors flex flex-col justify-between space-y-4 shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded border border-border bg-muted text-foreground font-bold">
                      {c.code || 'MOD'}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      Sem {c.semester || 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit Module"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(c)}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-rose-500 transition-colors"
                      title="Delete Module"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-foreground tracking-tight">
                  {c.name}
                </h3>
                <p className="font-mono text-xs text-muted-foreground mt-1">
                  Track: {c.programs?.name || 'Unassigned'}
                </p>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between font-mono text-xs">
                <button
                  onClick={() => handleAutoGenerate4Modules(c.id, c.name)}
                  disabled={generatingForCourseId === c.id}
                  className="px-3 py-1 rounded-full border border-border bg-muted hover:bg-border text-foreground text-[11px] font-semibold uppercase tracking-wider cursor-pointer"
                >
                  {generatingForCourseId === c.id ? 'Generating...' : '+ Auto 4 Parts'}
                </button>

                <Link
                  href={`/admin/modules?courseId=${c.id}`}
                  className="px-3.5 py-1 rounded-full bg-foreground text-background font-semibold hover:opacity-90 transition-opacity text-[11px]"
                >
                  Module Parts →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingCourse ? 'Edit Module' : 'Create New Module'}
        description="Configure academic module name, code, semester and program track association."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
              Target Academic Track *
            </label>
            <select
              {...register('program_id', { required: 'Please select a program' })}
              className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-foreground"
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
              Module Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Responsive Web Design (HTML5 & CSS3)"
              {...register('name', { required: 'Module name is required' })}
              className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                Module Code *
              </label>
              <input
                type="text"
                placeholder="e.g. ACCP-101"
                {...register('code', { required: 'Code is required' })}
                className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-foreground uppercase font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                Semester (1-6) *
              </label>
              <select
                {...register('semester', { valueAsNumber: true })}
                className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-foreground"
              >
                {[1, 2, 3, 4, 5, 6].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
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
              {actionLoading ? 'Saving...' : editingCourse ? 'Save Changes' : 'Create Module'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={onConfirmDelete}
        title="Delete Module"
        itemName={deletingCourse?.name || 'this module'}
        loading={actionLoading}
      />
    </div>
  );
}

export default function AdminCoursesPage() {
  return (
    <React.Suspense fallback={<TableSkeleton rows={5} cols={4} />}>
      <CoursesContent />
    </React.Suspense>
  );
}
