import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export type PipelineStage =
  | 'ideation'
  | 'validation'
  | 'mvp'
  | 'launch'
  | 'growth'
  | 'scale'
  | 'completed';

export interface ProjectSummary {
  id: string;
  name: string;
  stage: PipelineStage;
  progress: number; // 0-100
  mrr: number;
  status: 'in-progress' | 'awaiting-gate' | 'completed' | 'paused';
  startedAt: string;
}

const STAGE_PROGRESS: Record<PipelineStage, number> = {
  ideation: 10,
  validation: 25,
  mvp: 45,
  launch: 60,
  growth: 78,
  scale: 92,
  completed: 100,
};

// Stub data — will be replaced with live PipelineEngine state
const MOCK_PROJECTS: ProjectSummary[] = [
  {
    id: 'proj-ai-report-generator',
    name: 'AI Report Generator',
    stage: 'completed',
    progress: STAGE_PROGRESS['completed'],
    mrr: 8940,
    status: 'completed',
    startedAt: '2026-01-10T09:00:00.000Z',
  },
];

export async function GET() {
  return NextResponse.json({ projects: MOCK_PROJECTS });
}
