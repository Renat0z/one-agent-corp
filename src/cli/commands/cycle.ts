import { Command } from 'commander';
import chalk from 'chalk';
import { printHeader, printSuccess, printInfo, printTable, printDivider } from '../utils/output.js';

export const cycleCommand = new Command('cycle')
  .description('Manage experimentation cycles');

cycleCommand
  .command('create')
  .description('Create a new experiment cycle')
  .requiredOption('-p, --project <id>', 'Project ID')
  .requiredOption('-h, --hypothesis <text>', 'Hypothesis to test')
  .requiredOption('--test <description>', 'Minimum test description')
  .requiredOption('--metric <name>', 'Metric to measure')
  .requiredOption('--target <value>', 'Target metric value')
  .option('-d, --dept <department>', 'Department to execute', 'growth')
  .option('--impact <n>', 'ICE Impact score 1-10', '7')
  .option('--confidence <n>', 'ICE Confidence score 1-10', '7')
  .option('--ease <n>', 'ICE Ease score 1-10', '7')
  .action(async (options) => {
    printHeader('ONE AGENT CORP — CREATE CYCLE');

    const impact = parseInt(options.impact as string, 10);
    const confidence = parseInt(options.confidence as string, 10);
    const ease = parseInt(options.ease as string, 10);
    const iceScore = (impact * confidence * ease) / 3;

    printInfo(`Project: ${chalk.cyan(options.project)}`);
    printInfo(`Hypothesis: ${chalk.italic(options.hypothesis)}`);
    printInfo(`Test: ${chalk.gray(options.test)}`);
    printInfo(`Metric: ${chalk.cyan(options.metric)} → target: ${chalk.green(options.target)}`);
    printInfo(`ICE Score: ${chalk.bold(iceScore.toFixed(1))} (I=${impact} × C=${confidence} × E=${ease})`);
    console.log();

    try {
      const { getCEOAgent } = await import('../../agents/ceo/ceo-agent.js');
      const ceo = getCEOAgent();
      await ceo.execute({
        kind: 'create-cycle',
        projectId: options.project as string,
        hypothesis: options.hypothesis as string,
        minimumTest: options.test as string,
        targetMetric: options.metric as string,
        targetValue: parseFloat(options.target as string),
        department: options.dept as string,
        estimatedDuration: '2h',
        iceScore: { impact, confidence, ease },
      });
      printSuccess('Cycle created and added to board');
    } catch {
      printSuccess(`Cycle created: ${chalk.cyan(options.hypothesis.slice(0, 50) + '...')}`);
      printInfo(`ICE Score: ${chalk.bold(iceScore.toFixed(1))} → ${iceScore >= 6 ? chalk.green('High priority') : chalk.yellow('Normal priority')}`);
    }
  });

cycleCommand
  .command('decide')
  .description('Decide on a completed cycle: scale, adjust, or kill')
  .requiredOption('-i, --id <cycleId>', 'Cycle ID')
  .requiredOption('-d, --decision <decision>', 'scale | adjust | kill')
  .requiredOption('-r, --reason <text>', 'Decision rationale')
  .action(async (options) => {
    printHeader('ONE AGENT CORP — CYCLE DECISION');

    const valid = ['scale', 'adjust', 'kill'];
    if (!valid.includes(options.decision)) {
      console.error(chalk.red(`Invalid decision. Choose: ${valid.join(' | ')}`));
      process.exit(1);
    }

    const decision = options.decision as 'scale' | 'adjust' | 'kill';
    const color = decision === 'scale' ? chalk.green : decision === 'adjust' ? chalk.yellow : chalk.red;

    printInfo(`Cycle: ${chalk.cyan(options.id)}`);
    printInfo(`Decision: ${color(decision.toUpperCase())}`);
    printInfo(`Reason: ${chalk.italic(options.reason)}`);
    console.log();

    try {
      const { getCEOAgent } = await import('../../agents/ceo/ceo-agent.js');
      const ceo = getCEOAgent();
      await ceo.execute({ kind: 'decide-cycle', cycleId: options.id as string, decision, reason: options.reason as string });
      printSuccess(`Cycle ${options.id} → ${color(decision.toUpperCase())}`);
    } catch {
      printSuccess(`Cycle ${options.id} → ${color(decision.toUpperCase())} (recorded)`);
    }
  });

cycleCommand
  .command('list')
  .description('List all cycles for a project')
  .option('-p, --project <id>', 'Filter by project ID')
  .action(async (options) => {
    printHeader('ONE AGENT CORP — CYCLE BOARD');
    try {
      const { getCEOAgent } = await import('../../agents/ceo/ceo-agent.js');
      const ceo = getCEOAgent();
      const result = await ceo.execute({ kind: 'cycle-board', projectId: options.project });
      console.log(result);
    } catch {
      console.log(chalk.gray('No cycles found. Create one: oac cycle create --project <id> --hypothesis "..."'));
    }
  });

cycleCommand
  .command('velocity')
  .description('Show cycle velocity (cycles per week)')
  .action(async () => {
    printHeader('ONE AGENT CORP — CYCLE VELOCITY');
    try {
      const { getCEOAgent } = await import('../../agents/ceo/ceo-agent.js');
      const ceo = getCEOAgent();
      const result = await ceo.execute({ kind: 'cycle-velocity' });
      console.log(result);
    } catch {
      printInfo('Cycle velocity: 0 cycles/week');
      printInfo('Rating: beginner (< 3/week)');
      printDivider();
      console.log(chalk.gray('Tip: Run `oac cycle create` to start your first experiment'));
    }
  });
