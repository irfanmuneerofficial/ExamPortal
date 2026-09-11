'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
  loading?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  loading = false,
}: DeleteConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="text-center py-4 space-y-3">
        <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center mx-auto text-foreground">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-sm text-foreground">
          Are you sure you want to permanently delete{' '}
          <strong className="font-semibold underline">"{itemName}"</strong>?
        </p>
        <p className="font-mono text-xs text-muted-foreground">
          This action will cascade to all associated records and cannot be undone.
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border font-mono text-xs">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 rounded-full border border-border bg-muted font-semibold text-foreground hover:bg-border transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="px-5 py-2 rounded-full font-semibold uppercase tracking-wider text-background bg-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              <span>Deleting...</span>
            </>
          ) : (
            <span>Confirm Delete</span>
          )}
        </button>
      </div>
    </Modal>
  );
}
