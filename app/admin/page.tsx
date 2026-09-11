'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  BookOpen,
  Layers,
  HelpCircle,
  Upload,
  ArrowRight,
  Database,
  CheckCircle2,
  ExternalLink,
  Download,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Zap,
  Clock,
  Search,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  getAdminStats,
  getCourses,
  getModules,
  getCurriculumTree,
  exportFullCurriculumJSON,
  autoGenerateCourseModules,
  isPostgresConfigured,
  checkPostgresHealth,
  PostgresHealthStatus,
} from '@/lib/db';
import { Course, Module, CurriculumTreeNode, CurriculumStats } from '@/lib/types';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<CurriculumStats | null>(null);
  const [treeData, setTreeData] = useState<CurriculumTreeNode[]>([]);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [modulesList, setModulesList] = useState<Module[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [generatingForCourseId, setGeneratingForCourseId] = useState<string | null>(null);
  const [dbHealth, setDbHealth] = useState<PostgresHealthStatus | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  const postgresActive = isPostgresConfigured();

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      const [st, tree, crss, mods, health] = await Promise.all([
        getAdminStats(),
        getCurriculumTree(),
        getCourses(),
        getModules(),
        checkPostgresHealth(),
      ]);
      setStats(st);
      setTreeData(tree);
      setCoursesList(crss);
      setModulesList(mods);
      setDbHealth(health);

      // Auto-expand first program
      if (tree.length > 0) {
        setExpandedNodes((prev) => ({
          ...prev,
          [tree[0].id]: true,
          [`${tree[0].id}-sem-1`]: true,
        }));
      }
    } catch (err) {
      console.error('Failed loading dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    const traverse = (nodes: CurriculumTreeNode[]) => {
      nodes.forEach((n) => {
        allExpanded[n.id] = true;
        if (n.children) traverse(n.children);
      });
    };
    traverse(treeData);
    setExpandedNodes(allExpanded);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  const handleExportBackup = async () => {
    try {
      const jsonStr = await exportFullCurriculumJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `exam-practice-portal-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    }
  };

  const handleCopySqlSchema = async () => {
    try {
      const res = await fetch('/api/admin/schema-sql');
      let sql = '';
      if (res.ok) {
        const data = await res.json();
        sql = data.sql;
      }
      await navigator.clipboard.writeText(sql);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
    } catch {
      alert('Copied schema text to clipboard');
    }
  };

  const handleAutoGenerate4Modules = async (courseId: string, courseName: string) => {
    try {
      setGeneratingForCourseId(courseId);
      await autoGenerateCourseModules(courseId, courseName);
      await loadDashboardData();
    } catch (err: any) {
      alert(`Failed to generate module parts: ${err.message}`);
    } finally {
      setGeneratingForCourseId(null);
    }
  };

  const filteredCourses = coursesList.filter((c) =>
    c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (c.code && c.code.toLowerCase().includes(searchFilter.toLowerCase())) ||
    (c.programs?.name && c.programs.name.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl border border-border bg-card p-6 sm:p-10 space-y-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${dbHealth?.hasTables ? 'bg-emerald-500 animate-pulse' : dbHealth?.isConnected ? 'bg-amber-500' : 'bg-blue-500'}`} />
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {dbHealth?.hasTables
                ? 'PostgreSQL Database Connected & Live'
                : dbHealth?.isConnected
                ? 'PostgreSQL Connected (Schema Pending)'
                : 'Local High-Speed Session'}
            </span>
          </div>

          <button
            onClick={loadDashboardData}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-4 py-1.5 font-mono text-xs text-foreground hover:bg-border transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync Live</span>
          </button>
        </div>

        <div className="space-y-2 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Exam Practice Portal — Command Center
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Centralized operations to manage academic tracks, modules across Semesters 1 to 4, Module Parts 1 to 4, and 3,546+ MCQ practice exam test banks with live Supabase & PostgreSQL synchronization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/admin/questions"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-background transition-opacity hover:opacity-90 shadow-xs"
          >
            <Upload className="w-4 h-4" />
            <span>Bulk Upload MCQs</span>
          </Link>

          <button
            onClick={handleExportBackup}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-foreground transition-colors hover:bg-border"
          >
            <Download className="w-4 h-4" />
            <span>Backup JSON</span>
          </button>

          <button
            onClick={() => setShowSqlGuide(!showSqlGuide)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2.5 font-mono text-xs font-semibold text-foreground hover:bg-border transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-emerald-500" />
            <span>PostgreSQL Setup</span>
          </button>

          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Student Portal</span>
          </Link>
        </div>
      </div>

      {/* PostgreSQL Database Setup & Health Assistant */}
      {(!dbHealth?.hasTables || showSqlGuide) && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mt-0.5">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <span>Native PostgreSQL Database & Schema Setup</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold uppercase">
                    {dbHealth?.hasTables ? 'Active' : 'Ready to Run'}
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Database: <code className="font-mono text-foreground font-semibold">examportal</code> | Host: <code className="font-mono text-foreground font-semibold">localhost:5432 / 77.237.245.123</code> | User: <code className="font-mono text-foreground font-semibold">examroot</code>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:self-center font-mono text-xs">
              <button
                onClick={handleCopySqlSchema}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background font-semibold hover:opacity-90 transition-opacity"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>SQL Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Migration SQL (1.5MB)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-card font-mono text-[11px] space-y-1.5 text-muted-foreground">
            <p className="font-semibold text-foreground">VPS / Local Terminal Migration Command:</p>
            <div className="p-2.5 rounded-lg bg-muted text-foreground select-all font-mono text-xs border border-border">
              psql -U examroot -d examportal -f scripts/setup_postgres.sql
            </div>
            <p className="pt-1">All tables (programs, courses, modules, questions) and all 3,546 Semesters 1-4 MCQs are pre-bundled in the script.</p>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              title="Programs"
              value={stats?.totalPrograms ?? 0}
              icon={GraduationCap}
              description="Academic tracks & batches"
            />
            <StatCard
              title="Modules"
              value={stats?.totalCourses ?? 0}
              icon={BookOpen}
              description="Subjects in Semesters 1 to 6"
            />
            <StatCard
              title="Module Parts"
              value={stats?.totalModules ?? 0}
              icon={Layers}
              description="Module Parts 1 to 4 tracks"
            />
            <StatCard
              title="Question Bank"
              value={stats?.totalQuestions ?? 0}
              icon={HelpCircle}
              description="Verified multiple choice"
            />
          </>
        )}
      </div>

      {/* Interactive Curriculum Tree Explorer */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-foreground" />
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Tree View
              </span>
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground mt-1">
              Curriculum Hierarchy Explorer
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 rounded-full border border-border bg-muted font-mono text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 rounded-full border border-border bg-muted font-mono text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Tree Rendering */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : treeData.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-border rounded-xl font-mono text-xs text-muted-foreground">
            No curriculum programs found. Create your first program from the Programs tab.
          </div>
        ) : (
          <div className="space-y-4">
            {treeData.map((prog) => {
              const isProgExpanded = expandedNodes[prog.id];

              return (
                <div
                  key={prog.id}
                  className="border border-border rounded-xl bg-muted/40 overflow-hidden transition-colors"
                >
                  {/* Program Level Header */}
                  <div
                    onClick={() => toggleNode(prog.id)}
                    className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-muted transition-colors select-none"
                  >
                    <div className="flex items-center gap-3">
                      {isProgExpanded ? (
                        <ChevronDown className="w-4 h-4 text-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                      <GraduationCap className="w-4 h-4 text-foreground" />
                      <span className="font-semibold text-sm sm:text-base text-foreground">
                        {prog.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-xs">
                      <span className="text-muted-foreground hidden sm:inline">
                        {prog.count ?? (prog.children?.length || 0)} Modules
                      </span>
                      <Link
                        href={`/admin/courses?programId=${prog.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-md border border-border bg-card px-2.5 py-1 text-foreground hover:bg-muted transition-colors text-[11px] font-semibold"
                      >
                        + Module
                      </Link>
                    </div>
                  </div>

                  {/* Program Semesters & Modules List */}
                  {isProgExpanded && prog.children && (
                    <div className="border-t border-border bg-card/60 p-4 space-y-4">
                      {prog.children.map((semNode) => {
                        const isSemExpanded = expandedNodes[semNode.id];

                        return (
                          <div key={semNode.id} className="space-y-2 pl-2 sm:pl-6 border-l-2 border-border">
                            {/* Semester Header */}
                            <div
                              onClick={() => toggleNode(semNode.id)}
                              className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-muted/80 cursor-pointer text-xs font-mono select-none"
                            >
                              <div className="flex items-center gap-2">
                                {isSemExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-foreground" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                                )}
                                <span className="font-semibold text-foreground">{semNode.name}</span>
                              </div>
                              <span className="text-muted-foreground">
                                {semNode.children?.length || 0} Module(s)
                              </span>
                            </div>

                            {/* Modules in this semester */}
                            {isSemExpanded && semNode.children && (
                              <div className="space-y-2 pl-4 sm:pl-6 pt-1">
                                {semNode.children.map((courseNode) => {
                                  const isCourseExpanded = expandedNodes[courseNode.id];
                                  const hasModules = (courseNode.children?.length || 0) > 0;

                                  return (
                                    <div
                                      key={courseNode.id}
                                      className="rounded-xl border border-border bg-card p-3 sm:p-4 space-y-3"
                                    >
                                      {/* Module Row */}
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div
                                          onClick={() => toggleNode(courseNode.id)}
                                          className="flex items-center gap-2 cursor-pointer select-none"
                                        >
                                          {hasModules && (
                                            isCourseExpanded ? (
                                              <ChevronDown className="w-3.5 h-3.5 text-foreground" />
                                            ) : (
                                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                                            )
                                          )}
                                          <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                                          <span className="font-semibold text-xs sm:text-sm text-foreground">
                                            {courseNode.name}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-2 font-mono text-xs">
                                          {!hasModules && (
                                            <button
                                              onClick={() => handleAutoGenerate4Modules(courseNode.id, courseNode.name)}
                                              disabled={generatingForCourseId === courseNode.id}
                                              className="px-2 py-0.5 rounded border border-border bg-muted hover:bg-border text-foreground text-[10px] uppercase font-semibold cursor-pointer"
                                            >
                                              {generatingForCourseId === courseNode.id ? 'Generating...' : '+ Auto 4 Parts'}
                                            </button>
                                          )}
                                          <Link
                                            href={`/admin/modules?courseId=${courseNode.id}`}
                                            className="px-2.5 py-1 rounded-md border border-border bg-muted hover:bg-border text-foreground text-[11px] font-semibold"
                                          >
                                            Manage Parts
                                          </Link>
                                        </div>
                                      </div>

                                      {/* Module Parts List */}
                                      {isCourseExpanded && courseNode.children && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border">
                                          {courseNode.children.map((modNode) => (
                                            <div
                                              key={modNode.id}
                                              className="p-2.5 rounded-lg border border-border bg-muted/60 flex items-center justify-between gap-2"
                                            >
                                              <div className="truncate">
                                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-border bg-card mr-2 text-foreground font-bold">
                                                  Module Part {modNode.data?.module_number || 1}
                                                </span>
                                                <span className="text-xs text-foreground truncate font-medium">
                                                  {modNode.name}
                                                </span>
                                              </div>

                                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                                <Link
                                                  href={`/admin/questions?moduleId=${modNode.id}`}
                                                  className="font-mono text-[10px] px-2.5 py-1 rounded-md bg-foreground text-background hover:opacity-90 font-semibold"
                                                >
                                                  MCQs ({modNode.count ?? 0})
                                                </Link>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Module Readiness Table */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-foreground" />
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Readiness Matrix
              </span>
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground mt-1">
              Module Readiness & MCQ Coverage
            </h2>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search module name or code..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-full font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground transition-colors"
            />
          </div>
        </div>

        {/* Matrix List */}
        <div className="space-y-3">
          {filteredCourses.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-border rounded-xl font-mono text-xs text-muted-foreground">
              No matching modules found.
            </div>
          ) : (
            filteredCourses.map((c) => {
              const courseMods = modulesList.filter((m) => m.course_id === c.id);
              const has4Parts = courseMods.length === 4;

              return (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-border bg-muted/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded border border-border bg-card text-foreground font-bold">
                        {c.code || 'MOD'}
                      </span>
                      <span className="font-semibold text-sm text-foreground">
                        {c.name}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        (Sem {c.semester || 1})
                      </span>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">
                      {c.programs?.name} • {courseMods.length} of 4 Module Parts Active
                    </p>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    {!has4Parts && (
                      <button
                        onClick={() => handleAutoGenerate4Modules(c.id, c.name)}
                        disabled={generatingForCourseId === c.id}
                        className="px-3 py-1.5 rounded-full border border-border bg-muted hover:bg-border text-foreground text-xs uppercase font-semibold cursor-pointer"
                      >
                        + Auto 4 Parts
                      </button>
                    )}
                    <Link
                      href={`/admin/modules?courseId=${c.id}`}
                      className="px-3.5 py-1.5 rounded-full bg-foreground text-background font-semibold hover:opacity-90 transition-opacity"
                    >
                      Module Parts →
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
