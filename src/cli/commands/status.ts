import { Command } from 'commander';
import chalk from 'chalk';
import { printHeader, printTable, printDivider, printWarning } from '../utils/output.js';

const DEPARTMENTS = [
  'trends', 'offer', 'product', 'design', 'engineering',
  'qa', 'devops', 'growth', 'content', 'data',
  'audience', 'competitive', 'operations',
];

const PIPELINE_STAGES = ['job-validation', 'ideation', 'validation', 'mvp', 'launch', 'growth', 'scale'];

function getStatusColor(status: string): string {
  switch (status) {
    case 'running': return chalk.yellow(status);
    case 'done': return chalk.green(status);
    case 'error': return chalk.red(status);
    default: return chalk.gray(status);
  }
}

async function showStatus(options: { dept?: string; project?: string; live?: boolean }): Promise<void> {
  if (options.live) {
    printWarning('Live mode: refreshing every 5s. Press Ctrl+C to exit.\n');
    const refresh = async () => {
      console.clear();
      await showStatus({ dept: options.dept, project: options.project });
    };
    await refresh();
    setInterval(refresh, 5000);
    return;
  }

  printHeader('ONE AGENT CORP — STATUS');

  if (!options.dept && !options.project) {
    // All departments
    console.log(chalk.bold('Departments:\n'));
    const rows = DEPARTMENTS.map((id) => [
      id,
      getStatusColor('idle'),
      chalk.gray('never'),
      chalk.gray('—'),
    ]);
    printTable(['Department', 'Status', 'Last Run', 'Last Output'], rows);

    console.log();
    console.log(chalk.bold('Active Projects:\n'));
    console.log(chalk.gray('  No active projects. Run: oac launch --project "Name" --description "..."'));

    console.log();
    console.log(chalk.bold('CEO Dashboard:\n'));
    console.log(`  Cycle Velocity: ${chalk.yellow('0')} cycles/week`);
    console.log(`  Pending Gates:  ${chalk.gray('none')}`);
    console.log(`  MRR:            ${chalk.green('$0')}`);
    printDivider();
    console.log(chalk.gray('\nTip: Run `oac board` for the full CEO dashboard'));
  } else if (options.dept) {
    console.log(chalk.bold(`Department: ${chalk.cyan(options.dept)}\n`));
    console.log(`  Status:       ${getStatusColor('idle')}`);
    console.log(`  Capabilities: ${chalk.gray('see src/departments/' + options.dept)}`);
    console.log(`  Knowledge base: ${chalk.gray('src/departments/' + options.dept + '/knowledge-base/')}`);
  } else if (options.project) {
    console.log(chalk.bold(`Project: ${chalk.cyan(options.project)}\n`));
    console.log(`  Stage:    ${chalk.gray('not started')}`);
    console.log(`  Pipeline: ${PIPELINE_STAGES.map((s) => chalk.gray('· ' + s)).join('  ')}`);
  }
}

export const statusCommand = new Command('status')
  .description('Show status of departments, projects, and factory metrics')
  .option('-d, --dept <id>', 'Show single department status')
  .option('-p, --project <name>', 'Show single project pipeline status')
  .option('-l, --live', 'Watch mode — refresh every 5s')
  .action(async (options) => {
    await showStatus(options).catch((err: unknown) => {
      console.error(chalk.red('Error:'), err instanceof Error ? err.message : String(err));
      process.exit(1);
    });
  });
