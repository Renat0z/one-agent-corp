import { Command } from 'commander';
import chalk from 'chalk';
import { printTable, printProgressBar, printDivider } from '../utils/output.js';

const DEPARTMENTS = [
  { id: 'trends', name: 'Trends & Intel', status: 'idle' },
  { id: 'offer', name: 'Offer & Monetize', status: 'idle' },
  { id: 'product', name: 'Product', status: 'idle' },
  { id: 'design', name: 'Design', status: 'idle' },
  { id: 'engineering', name: 'Engineering', status: 'idle' },
  { id: 'qa', name: 'QA', status: 'idle' },
  { id: 'devops', name: 'DevOps', status: 'idle' },
  { id: 'growth', name: 'Growth', status: 'idle' },
  { id: 'content', name: 'Content', status: 'idle' },
  { id: 'data', name: 'Data', status: 'idle' },
  { id: 'audience', name: 'Audience', status: 'idle' },
  { id: 'competitive', name: 'Competitive Intel', status: 'idle' },
  { id: 'operations', name: 'Operations', status: 'idle' },
];

const STAGES = ['job-validation', 'ideation', 'validation', 'mvp', 'launch', 'growth', 'scale'];

function renderAsciiHeader(): void {
  console.log(chalk.bold.blue([
    '  ╔═══════════════════════════════════════════════════╗',
    '  ║           ONE AGENT CORP — CEO BOARD              ║',
    '  ║       Virtual micro-SaaS Factory Dashboard        ║',
    '  ╚═══════════════════════════════════════════════════╝',
  ].join('\n')));
  console.log();
}

function renderKPIs(): void {
  console.log(chalk.bold('  KEY METRICS'));
  printDivider();
  const kpis = [
    ['MRR', '$0', 'Target: $5,000'],
    ['Cycle Velocity', '0/week', 'Target: 3+/week'],
    ['Active Projects', '0', '—'],
    ['Pending Gates', '0', '—'],
  ];
  kpis.forEach(([label, value, note]) => {
    console.log(`  ${label.padEnd(20)} ${chalk.bold(value?.padEnd(15) ?? '')} ${chalk.gray(note ?? '')}`);
  });
  console.log();
}

function renderDepartments(): void {
  console.log(chalk.bold('  DEPARTMENTS (13 Machine Departments)'));
  printDivider();
  const rows = DEPARTMENTS.map((d) => [
    d.name,
    d.status === 'running' ? chalk.yellow('running') :
    d.status === 'done' ? chalk.green('done') :
    d.status === 'error' ? chalk.red('error') :
    chalk.gray('idle'),
    chalk.gray('—'),
  ]);
  printTable(['Department', 'Status', 'Last Output'], rows);
  console.log();
}

function renderPipeline(projectFilter?: string): void {
  console.log(chalk.bold('  PIPELINE'));
  printDivider();
  console.log(chalk.gray('  No active projects.'));
  console.log();
  console.log(`  Stages: ${STAGES.map((s) => chalk.gray('· ' + s)).join('  ')}`);
  console.log();
}

function renderActions(): void {
  console.log(chalk.bold('  QUICK ACTIONS'));
  printDivider();
  console.log(chalk.gray('  oac launch --project "Name" --description "..."   Launch new micro-SaaS'));
  console.log(chalk.gray('  oac cycle create --project <id> --hypothesis "..."  Start experiment'));
  console.log(chalk.gray('  oac deploy --project <id> --env staging              Deploy to VPS'));
  console.log(chalk.gray('  oac status --live                                     Live status monitor'));
  console.log();
  console.log(chalk.gray(`  Dashboard: ${chalk.underline('http://localhost:3001')}  (run: cd src/dashboard && npm run dev)`));
}

export const boardCommand = new Command('board')
  .description('CEO Dashboard — full factory overview in terminal')
  .option('-d, --dept', 'Focus on department view')
  .option('-p, --pipeline', 'Focus on pipeline view')
  .option('--project <id>', 'Filter pipeline by project')
  .action((options) => {
    console.clear();
    renderAsciiHeader();
    console.log(`  ${chalk.gray('Date:')} ${chalk.white(new Date().toLocaleString())}`);
    console.log();

    if (options.dept) {
      renderDepartments();
    } else if (options.pipeline) {
      renderPipeline(options.project);
    } else {
      renderKPIs();
      renderDepartments();
      renderPipeline();
      renderActions();
    }

    printDivider();
    console.log(chalk.gray(`  One Agent Corp v1.0 | ${chalk.underline('https://github.com/one-agent-corp')}`));
  });
