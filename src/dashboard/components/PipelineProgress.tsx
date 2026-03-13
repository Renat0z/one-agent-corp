import type { PipelineStage, ProjectSummary } from '../app/api/projects/route';

const STAGES: PipelineStage[] = [
  'ideation',
  'validation',
  'mvp',
  'launch',
  'growth',
  'scale',
  'completed',
];

const STAGE_SHORT: Record<PipelineStage, string> = {
  ideation: 'Idea',
  validation: 'Valid.',
  mvp: 'MVP',
  launch: 'Launch',
  growth: 'Growth',
  scale: 'Scale',
  completed: 'Done',
};

const STATUS_BADGE: Record<ProjectSummary['status'], string> = {
  'in-progress': 'badge badge-info',
  'awaiting-gate': 'badge badge-warning',
  completed: 'badge badge-success',
  paused: 'badge badge-idle',
};

const STATUS_LABEL: Record<ProjectSummary['status'], string> = {
  'in-progress': 'In Progress',
  'awaiting-gate': 'Gate Pending',
  completed: 'Completed',
  paused: 'Paused',
};

interface PipelineProgressProps {
  project: ProjectSummary;
}

function formatMrr(mrr: number): string {
  if (mrr >= 1000) return `$${(mrr / 1000).toFixed(1)}k`;
  return `$${mrr}`;
}

export function PipelineProgress({ project }: PipelineProgressProps) {
  const currentStageIndex = STAGES.indexOf(project.stage);

  return (
    <div className="card">
      {/* Project header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
            {project.name}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
            MRR: <span style={{ color: 'var(--success)', fontWeight: 600 }}>{formatMrr(project.mrr)}</span>
          </div>
        </div>
        <span className={STATUS_BADGE[project.status]}>{STATUS_LABEL[project.status]}</span>
      </div>

      {/* Overall progress bar */}
      <div style={{ marginBottom: '10px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '4px',
            fontSize: '11px',
            color: 'var(--muted)',
          }}
        >
          <span>Pipeline Progress</span>
          <span>{project.progress}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Stage indicators */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`,
          gap: '2px',
        }}
      >
        {STAGES.map((stage, index) => {
          const isPast = index < currentStageIndex;
          const isCurrent = index === currentStageIndex;
          const isFuture = index > currentStageIndex;

          return (
            <div
              key={stage}
              title={stage}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              {/* Stage dot */}
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isPast
                    ? 'var(--success)'
                    : isCurrent
                    ? 'var(--accent)'
                    : 'var(--border)',
                  boxShadow: isCurrent ? '0 0 0 2px rgba(59,130,246,0.25)' : 'none',
                  transition: 'background-color 0.2s ease',
                }}
              />
              {/* Stage label */}
              <span
                style={{
                  fontSize: '9px',
                  color: isPast
                    ? 'var(--success)'
                    : isCurrent
                    ? 'var(--accent)'
                    : isFuture
                    ? '#404040'
                    : 'var(--muted)',
                  textAlign: 'center',
                  fontWeight: isCurrent ? 700 : 400,
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}
              >
                {STAGE_SHORT[stage]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
