import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: StatCardProps) {
  return (
    <div className="p-6 rounded-2xl border border-border bg-card flex flex-col justify-between space-y-4 hover:border-foreground/40 transition-colors">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {title}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted text-foreground">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div>
        <p className="font-mono text-3xl font-bold tracking-tight text-foreground">
          {value}
        </p>
        {description && (
          <p className="font-mono text-xs text-muted-foreground mt-1.5">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
