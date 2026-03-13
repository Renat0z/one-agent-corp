import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DEPARTMENTS = [
  'trends',
  'offer',
  'product',
  'design',
  'engineering',
  'qa',
  'devops',
  'growth',
  'content',
  'data',
  'audience',
  'competitive',
  'operations',
];

export type DepartmentStatus = 'idle' | 'running' | 'done' | 'error';

export interface DepartmentState {
  id: string;
  name: string;
  status: DepartmentStatus;
  lastRun: string | null;
  lastOutput: string | null;
  runCount: number;
}

export async function GET() {
  // Return department statuses — will be replaced with real state from the core engine
  const departments: DepartmentState[] = DEPARTMENTS.map((id) => ({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    status: 'idle' as DepartmentStatus,
    lastRun: null,
    lastOutput: null,
    runCount: 0,
  }));

  return NextResponse.json({ departments });
}
