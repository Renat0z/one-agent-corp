'use client';

export type DepartmentStatus = 'idle' | 'running' | 'done' | 'error';

interface DepartmentCardProps {
  id: string;
  name: string;
  status: DepartmentStatus;
  lastRun: string | null;
  lastOutput: string | null;
  runCount: number;
  selected?: boolean;
  onSelect: (id: string) => void;
}

const STATUS_LABEL: Record<DepartmentStatus, string> = {
  idle: 'Idle',
  running: 'Running',
  done: 'Done',
  error: 'Error',
};

const STATUS_BADGE_CLASS: Record<DepartmentStatus, string> = {
  idle: 'badge badge-idle',
  running: 'badge badge-info',
  done: 'badge badge-success',
  error: 'badge badge-error',
};

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return 'Never';
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function DepartmentCard({
  id,
  name,
  status,
  lastRun,
  lastOutput,
  runCount,
  selected = false,
  onSelect,
}: DepartmentCardProps) {
  const preview = lastOutput
    ? lastOutput.slice(0, 50) + (lastOutput.length > 50 ? '...' : '')
    : null;

  return (
    <div
      className={`card clickable${selected ? ' selected' : ''}`}
      onClick={() => onSelect(id)}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(id);
        }
      }}
      style={{ userSelect: 'none' }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: '13px',
            color: 'var(--text)',
            textTransform: 'capitalize',
          }}
        >
          {name}
        </span>
        <span
          className={STATUS_BADGE_CLASS[status]}
          style={status === 'running' ? { animation: 'pulse 2s ease-in-out infinite' } : {}}
        >
          {STATUS_LABEL[status]}
        </span>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
          Last run: {formatRelativeTime(lastRun)}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
          Runs: {runCount}
        </span>
      </div>

      {/* Output preview */}
      {preview ? (
        <div
          style={{
            fontSize: '11px',
            color: 'var(--muted)',
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            backgroundColor: '#050505',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '6px 8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {preview}
        </div>
      ) : (
        <div
          style={{
            fontSize: '11px',
            color: '#404040',
            fontStyle: 'italic',
          }}
        >
          No output yet
        </div>
      )}

      {/* Dept ID */}
      <div style={{ marginTop: '8px' }}>
        <span
          style={{
            fontSize: '10px',
            color: '#404040',
            fontFamily: 'Menlo, Monaco, monospace',
            letterSpacing: '0.05em',
          }}
        >
          {id}
        </span>
      </div>
    </div>
  );
}
