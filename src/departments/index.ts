export { BaseMachineDepartment } from './base-machine-department.js';

export { RedTeamDepartment, redTeamDepartment } from './red-team/RedTeamDepartment.js';
export { StrategyDepartment, strategyDepartment } from './strategy/StrategyDepartment.js';
export { CoreInfraDepartment, coreInfraDepartment } from './core-infra/CoreInfraDepartment.js';
export { TrendsDepartment, trendsDepartment } from './trends/TrendsDepartment.js';
export { OfferDepartment, offerDepartment } from './offer/OfferDepartment.js';
export { ProductDepartment, productDepartment } from './product/ProductDepartment.js';
export { DesignDepartment, designDepartment } from './design/DesignDepartment.js';
export { EngineeringDepartment, engineeringDepartment } from './engineering/EngineeringDepartment.js';
export { QADepartment, qaDepartment } from './qa/QADepartment.js';
export { DevOpsDepartment, devopsDepartment } from './devops/DevOpsDepartment.js';
export { GrowthDepartment, growthDepartment } from './growth/GrowthDepartment.js';
export { ContentDepartment, contentDepartment } from './content/ContentDepartment.js';
export { DataDepartment, dataDepartment } from './data/DataDepartment.js';
export { AudienceDepartment, audienceDepartment } from './audience/AudienceDepartment.js';
export { CompetitiveDepartment, competitiveDepartment } from './competitive/CompetitiveDepartment.js';
export { OperationsDepartment, operationsDepartment } from './operations/OperationsDepartment.js';

export type MachineDepartmentId =
  | 'core-infra'
  | 'strategy'
  | 'red-team'
  | 'trends'
  | 'offer'
  | 'product'
  | 'design'
  | 'engineering'
  | 'qa'
  | 'devops'
  | 'growth'
  | 'content'
  | 'data'
  | 'audience'
  | 'competitive'
  | 'operations';

import { BaseMachineDepartment } from './base-machine-department.js';
import { redTeamDepartment } from './red-team/RedTeamDepartment.js';
import { strategyDepartment } from './strategy/StrategyDepartment.js';
import { coreInfraDepartment } from './core-infra/CoreInfraDepartment.js';
import { trendsDepartment } from './trends/TrendsDepartment.js';
import { offerDepartment } from './offer/OfferDepartment.js';
import { productDepartment } from './product/ProductDepartment.js';
import { designDepartment } from './design/DesignDepartment.js';
import { engineeringDepartment } from './engineering/EngineeringDepartment.js';
import { qaDepartment } from './qa/QADepartment.js';
import { devopsDepartment } from './devops/DevOpsDepartment.js';
import { growthDepartment } from './growth/GrowthDepartment.js';
import { contentDepartment } from './content/ContentDepartment.js';
import { dataDepartment } from './data/DataDepartment.js';
import { audienceDepartment } from './audience/AudienceDepartment.js';
import { competitiveDepartment } from './competitive/CompetitiveDepartment.js';
import { operationsDepartment } from './operations/OperationsDepartment.js';

export const ALL_MACHINE_DEPARTMENTS: BaseMachineDepartment[] = [
  strategyDepartment,
  coreInfraDepartment,
  redTeamDepartment,
  trendsDepartment,
  offerDepartment,
  productDepartment,
  designDepartment,
  engineeringDepartment,
  qaDepartment,
  devopsDepartment,
  growthDepartment,
  contentDepartment,
  dataDepartment,
  audienceDepartment,
  competitiveDepartment,
  operationsDepartment,
];

export function getMachineDepartment(id: MachineDepartmentId): BaseMachineDepartment {
  const dept = ALL_MACHINE_DEPARTMENTS.find((d) => d.departmentId === id);
  if (!dept) throw new Error(`Machine department '${id}' not found`);
  return dept;
}
