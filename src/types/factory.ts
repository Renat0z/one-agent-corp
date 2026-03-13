// One Agent Corp — Factory Types
// Real execution layer types for micro-SaaS factory

/** Represents a file or content artifact produced by a department during project execution. */
export interface ProjectArtifact {
  id: string;
  projectName: string;
  departmentId: string;
  artifactType: 'code' | 'config' | 'template' | 'report' | 'copy' | 'design';
  filePath: string;
  content?: string;
  createdAt: string;
  evaluationScore?: number;
}

/** Records a single department's full execution context for a project stage. */
export interface DepartmentExecution {
  departmentId: string;
  projectName: string;
  stage: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  artifacts: ProjectArtifact[];
  claudeModel: string;
  promptVersion: string;
  evaluationScore?: number;
  executionLog: string[];
}

/** Generic result returned by any department or pipeline executor. */
export interface ExecutionResult {
  success: boolean;
  output: string;
  artifacts: ProjectArtifact[];
  duration: number;
  error?: string;
}

/** Persisted entry in a department's knowledge base for self-improvement loops. */
export interface KnowledgeBaseEntry {
  id: string;
  departmentId: string;
  outputSample: string;
  evaluationScore: number;
  feedback: string;
  promptVersion: string;
  createdAt: string;
  projectName: string;
}

/** Structured evaluation of a department's output by the self-evaluation loop. */
export interface EvaluationResult {
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  verdict: 'excellent' | 'good' | 'needs-improvement' | 'poor';
}

/** Context passed into each department's executeReal() call. */
export interface ProjectContext {
  projectName: string;
  description: string;
  targetMarket: string;
  stage: string;
  budget: number;
  previousArtifacts?: ProjectArtifact[];
  iceScore?: { impact: number; confidence: number; ease: number };
}
