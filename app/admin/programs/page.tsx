'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  Search,
  BookOpen,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { getPrograms, createProgram, updateProgram, deleteProgram } from '@/lib/db';
import { Program } from '@/lib/types';
import Link from 'next/link';

interface ProgramFormData {
  name: string;
  description: string;
}

export default function AdminProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingProgram, setDeletingProgram] = useState<Program | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProgramFormData>();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getPrograms();
      setPrograms(data);
    } catch (err) {
      console.error('Failed to load programs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingProgram(null);
    reset({ name: '', description: '' });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: Program) => {
    setEditingProgram(p);
    reset({
      name: p.name,
      description: p.description || '',
    });
    setIsFormOpen(true);
  };

  const handleOpenDelete = (p: Program) => {
    setDeletingProgram(p);
    setIsDeleteOpen(true);
  };

  const onSubmit = async (data: ProgramFormData) => {
    try {
      setActionLoading(true);
      if (editingProgram) {
        await updateProgram(editingProgram.id, data.name, data.description);
      } else {
        await createProgram(data.name, data.description);
      }
      setIsFormOpen(false);
      await loadData();
    } catch (err: any) {
      alert(`Error saving program: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!deletingProgram) return;
    try {
      setActionLoading(true);
      await deleteProgram(deletingProgram.id);
      setIsDeleteOpen(false);
      await loadData();
    } catch (err: any) {
      alert(`Error deleting program: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPrograms = programs.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-foreground" />
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Academic Tracks
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
            Programs & Batches
          </h1>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-background hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          <span>New Track</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search academic tracks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-full font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground"
          />
        </div>

        <span className="font-mono text-xs text-muted-foreground">
          {filteredPrograms.length} Tracks
        </span>
      </div>

      {/* Programs Grid */}
      {loading ? (
        <TableSkeleton rows={3} cols={3} />
      ) : filteredPrograms.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card space-y-3">
          <GraduationCap className="w-10 h-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-semibold text-foreground">No Academic Programs Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Get started by adding your first educational track (e.g. ACCP PRO, ACCP AI).
          </p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-background hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Track</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrograms.map((p) => (
            <div
              key={p.id}
              className="p-6 rounded-2xl border border-border bg-card hover:border-foreground/40 transition-colors flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-border bg-muted text-foreground font-semibold">
                    Track
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit Track"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(p)}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-rose-400 transition-colors"
                      title="Delete Track"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-foreground tracking-tight">
                  {p.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                  {p.description || 'Full semester curriculum track'}
                </p>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between font-mono text-xs">
                <span className="text-muted-foreground">
                  Semesters 1 to 6
                </span>

                <Link
                  href={`/admin/courses?programId=${p.id}`}
                  className="px-3 py-1 rounded-full bg-foreground text-background font-semibold hover:opacity-90 transition-opacity text-[11px]"
                >
                  Courses →
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
        title={editingProgram ? 'Edit Academic Track' : 'Create Academic Track'}
        description="Configure program name and curriculum details."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
              Track Name *
            </label>
            <input
              type="text"
              placeholder="e.g. ACCP PRO (Software Engineering)"
              {...register('name', { required: 'Program name is required' })}
              className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Overview of the curriculum, semesters, and scope..."
              {...register('description')}
              className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-foreground resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded-full border border-border bg-muted font-mono text-xs font-semibold text-foreground hover:bg-border transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 rounded-full bg-foreground font-mono text-xs font-semibold uppercase tracking-wider text-background hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : editingProgram ? 'Save Changes' : 'Create Track'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={onConfirmDelete}
        title="Delete Academic Track"
        itemName={deletingProgram?.name || 'this track'}
        loading={actionLoading}
      />
    </div>
  );
}
