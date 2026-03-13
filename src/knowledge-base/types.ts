// One Agent Corp — Knowledge Base Types

export interface KnowledgeBaseEntry {
  id: string;
  department: string;
  inputHash: string;
  output: string;
  score: number; // 0-10
  feedback: string;
  promptVersion: string;
  createdAt: string;
  tags: string[];
}

export interface EvaluationResult {
  score: number; // 0-10
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  suggestion: string;
}

export interface PromptVersion {
  version: string;
  content: string;
  createdAt: string;
  avgScore: number;
  sampleCount: number;
}

export interface KnowledgeBaseStats {
  totalEntries: number;
  avgScore: number;
  promptVersions: number;
  lastUpdated: string;
}
