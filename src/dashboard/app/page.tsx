'use client';

import { useEffect, useState, useCallback } from 'react';
import { DepartmentCard } from '../components/DepartmentCard';
import { StreamViewer } from '../components/StreamViewer';
import { PipelineProgress } from '../components/PipelineProgress';
import type { DepartmentStatus } from '../components/DepartmentCard';
import type { ProjectSummary } from './api/projects/route';

interface DepartmentState {
  id: string;
  name: string;
  status: DepartmentStatus;
  lastRun: string | null;
  lastOutput: string | null;
  runCount: number;
}

export default function DashboardPage() {
  const [departments, setDepartments] = useState<DepartmentState[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [deptRes, projRes] = await Promise.all([
        fetch('/api/departments'),
        fetch('/api/projects'),
      ]);

      if (deptRes.ok) {
        const { departments: data } = await deptRes.json() as { departments: DepartmentState[] };
        setDepartments(data);
      }

      if (projRes.ok) {
        const { projects: data } = await projRes.json() as { projects: ProjectSummary[] };
        setProjects(data);
      }

      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + auto-refresh every 30 seconds
  useEffect(() => {
    void fetchData();
    const interval = setInterval(() => void fetchData(), 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleSelectDept = (id: string) => {
    setSelectedDept((prev) => (prev === id ? null : id));
  };

  const runningCount = departments.filter((d) => d.status === 'running').length;
  const doneCount = departments.filter((d) => d.status === 'done').length;
  const errorCount = departments.filter((d) => d.status === 'error').length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      {/* Top nav */}
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '56px',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.05em',
              }}
            >
              O
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>
                One Agent Corp
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>CEO Dashboard</div>
            </div>
          </div>

          {/* Status summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {runningCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent)',
                    display: 'inline-block',
                    animation: 'pulse 2s ease-in-out infinite',
                  }}
                />
                <span style={{ color: 'var(--accent)' }}>{runningCount} running</span>
              </div>
            )}
            {errorCount > 0 && (
              <span style={{ fontSize: '12px', color: 'var(--error)' }}>
                {errorCount} error{errorCount !== 1 ? 's' : ''}
              </span>
            )}
            {lastRefresh && (
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                Refreshed {lastRefresh.toLocaleTimeString()}
              </span>
            )}
            <button className="btn btn-sm" onClick={() => void fetchData()}>
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="container" style={{ padding: '24px' }}>
        {/* Metric strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          {[
            {
              label: 'Total Departments',
              value: departments.length,
              color: 'var(--text)',
            },
            {
              label: 'Running',
              value: runningCount,
              color: 'var(--accent)',
            },
            {
              label: 'Completed',
              value: doneCount,
              color: 'var(--success)',
            },
            {
              label: 'Errors',
              value: errorCount,
              color: errorCount > 0 ? 'var(--error)' : 'var(--muted)',
            },
          ].map((m) => (
            <div key={m.label} className="card">
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>
                {m.label}
              </div>
              <div
                style={{ fontSize: '28px', fontWeight: 700, color: m.color, lineHeight: 1 }}
              >
                {loading ? '—' : m.value}
              </div>
            </div>
          ))}
        </div>

        {/* Department grid + Stream viewer */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 360px',
            gap: '24px',
            marginBottom: '24px',
            alignItems: 'start',
          }}
        >
          {/* Departments */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <h2 className="section-title" style={{ margin: 0 }}>
                Departments
              </h2>
              {selectedDept && (
                <button
                  className="btn btn-sm"
                  onClick={() => setSelectedDept(null)}
                >
                  Clear selection
                </button>
              )}
            </div>

            {loading ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '12px',
                }}
              >
                {Array.from({ length: 13 }).map((_, i) => (
                  <div
                    key={i}
                    className="card"
                    style={{ height: '110px', opacity: 0.4, backgroundColor: 'var(--surface)' }}
                  />
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '12px',
                }}
              >
                {departments.map((dept) => (
                  <DepartmentCard
                    key={dept.id}
                    {...dept}
                    selected={selectedDept === dept.id}
                    onSelect={handleSelectDept}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Stream viewer */}
          <div style={{ position: 'sticky', top: '72px' }}>
            <h2 className="section-title">Live Stream</h2>
            <StreamViewer department={selectedDept} />
            {!selectedDept && (
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--muted)',
                  marginTop: '8px',
                  textAlign: 'center',
                }}
              >
                Click a department card to view its output stream.
              </p>
            )}
          </div>
        </div>

        {/* Pipeline overview */}
        <div style={{ marginBottom: '24px' }}>
          <h2 className="section-title">Pipeline Overview</h2>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
              <div className="card" style={{ height: '120px', opacity: 0.4 }} />
            </div>
          ) : projects.length === 0 ? (
            <div
              className="card"
              style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px' }}
            >
              No active pipeline projects.
              <br />
              <span style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Use <code style={{ color: 'var(--accent)' }}>ceo.execute({'{'} kind: &apos;launch-project&apos;, ... {'}'})</code> to start one.
              </span>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '12px',
              }}
            >
              {projects.map((project) => (
                <PipelineProgress key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div style={{ marginBottom: '24px' }}>
          <h2 className="section-title">Quick Actions</h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              className="btn"
              onClick={() => {
                if (selectedDept) {
                  alert(`Run department: ${selectedDept}\n\nIn production, this triggers the department agent via the OAC core engine.`);
                } else {
                  alert('Select a department first by clicking its card.');
                }
              }}
            >
              Run Department
            </button>
            <button
              className="btn"
              onClick={() => void fetchData()}
            >
              Check Status
            </button>
            <button
              className="btn"
              onClick={() => {
                window.open('https://github.com', '_blank');
              }}
            >
              View Artifacts
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                alert('Launch new project via:\nceo.execute({ kind: "launch-project", ... })\n\nSee CLAUDE.md for full command reference.');
              }}
            >
              + Launch Project
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          padding: '16px 0',
          marginTop: '40px',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
            One Agent Corp &mdash; Virtual Micro-SaaS Factory
          </span>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
            {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </footer>
    </div>
  );
}
