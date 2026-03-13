// One Agent Corp — Organizational Types
// Domain D-1: Structural foundation for the entire virtual enterprise

export type CommunicationStyle = 'direct' | 'collaborative' | 'analytical' | 'visionary' | 'pragmatic';

export type InteractionFrequency = 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'on-demand';

export type KPIUnit = 'percentage' | 'count' | 'currency_usd' | 'days' | 'hours' | 'ratio' | 'score';

export type DepartmentId =
  | 'product'
  | 'engineering'
  | 'growth'
  | 'sales'
  | 'data'
  | 'operations';

export interface Persona {
  name: string;
  title: string;
  role: string;
  communication_style: CommunicationStyle;
  objectives: string[];
  strengths: string[];
  decision_bias: string;
}

export interface KPI {
  id: string;
  name: string;
  formula: string;
  target: number;
  unit: KPIUnit;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  owner: DepartmentId;
  shared_with?: DepartmentId[];
}

export interface DepartmentInteraction {
  from: DepartmentId;
  to: DepartmentId;
  type: 'dependency' | 'collaboration' | 'reporting' | 'advisory';
  frequency: InteractionFrequency;
  topics: string[];
  escalation_path: string;
}

export interface Department {
  id: DepartmentId;
  name: string;
  mission: string;
  persona: Persona;
  responsibilities: string[];
  kpis: KPI[];
  interactions: DepartmentInteraction[];
  escalation_path: string;
  tools: string[];
  autonomy_level: 'full' | 'high' | 'medium' | 'low';
}

export interface Organization {
  name: string;
  mission: string;
  vision: string;
  model: string;
  departments: Record<DepartmentId, Department>;
  interaction_matrix: DepartmentInteraction[];
  created_at: string;
  version: string;
}

export interface OrganizationConfig {
  organization: Organization;
  getDepartment: (id: DepartmentId) => Department | undefined;
  getInteractions: (id: DepartmentId) => DepartmentInteraction[];
  getKPIs: (id: DepartmentId) => KPI[];
  validateKPI: (kpi: KPI, currentValue: number) => boolean;
}
