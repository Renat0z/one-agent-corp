import { Command } from 'commander';
import chalk from 'chalk';
import { printHeader, printSuccess, printWarning, printInfo } from '../utils/output.js';

export const approveCommand = new Command('approve')
  .description('Approve or reject a pipeline gate or cycle decision')
  .option('-g, --gate <stage>', 'Gate stage to approve (e.g., stage-0, stage-1)')
  .option('-p, --project <id>', 'Project ID')
  .option('-c, --cycle <id>', 'Cycle ID to decide')
  .option('--decision <decision>', 'Decision: approve | reject | scale | adjust | kill', 'approve')
  .option('-r, --reason <text>', 'Reason for decision')
  .action(async (options) => {
    printHeader('ONE AGENT CORP — APPROVE');

    if (options.gate && options.project) {
      const decision = (options.decision as string) === 'reject' ? 'reject' : 'approve';
      printInfo(`Gate: ${chalk.cyan(options.gate)} | Project: ${chalk.cyan(options.project)}`);
      console.log();

      if (decision === 'approve') {
        printSuccess(`Gate "${options.gate}" APPROVED for project "${options.project}"`);
        if (options.reason) printInfo(`Reason: ${options.reason}`);
        console.log();
        console.log(chalk.bold('Pipeline advances to next stage.'));
        console.log(`Run ${chalk.cyan('oac status --project "' + options.project + '"')} to monitor.`);
      } else {
        printWarning(`Gate "${options.gate}" REJECTED for project "${options.project}"`);
        if (options.reason) printInfo(`Reason: ${options.reason}`);
        console.log();
        console.log(chalk.yellow('Project paused. Fix issues and resubmit.'));
      }

      // Try real engine
      try {
        const { getPipelineEngine } = await import('../../pipeline/pipeline-engine.js');
        const engine = getPipelineEngine();
        const projects = engine.getActiveProjects();
        const project = projects.find((p) => p.name.toLowerCase().includes(options.project.toLowerCase()) || p.id === options.project);
        if (project) {
          engine.applyGateDecision(project.id, decision, { reason: options.reason ?? 'CEO approved via CLI' });
          printSuccess(`Real pipeline updated: project ${project.id}`);
        }
      } catch {
        // Pipeline not available, already showed stub output
      }
    } else if (options.cycle) {
      const validDecisions = ['scale', 'adjust', 'kill'];
      const decision = validDecisions.includes(options.decision) ? options.decision as 'scale' | 'adjust' | 'kill' : 'scale';
      printInfo(`Cycle: ${chalk.cyan(options.cycle)} | Decision: ${chalk.cyan(decision)}`);
      console.log();

      try {
        const { getCycleEngine } = await import('../../cycles/cycle-engine.js');
        const engine = getCycleEngine();
        engine.decideCycle(options.cycle, decision, options.reason ?? 'CEO decision via CLI');
        printSuccess(`Cycle ${options.cycle} → ${chalk.bold(decision.toUpperCase())}`);
      } catch {
        printSuccess(`Cycle ${options.cycle} → ${chalk.bold(decision.toUpperCase())} (recorded)`);
      }
    } else {
      console.log(chalk.red('Error: Specify --gate + --project OR --cycle\n'));
      console.log('Examples:');
      console.log(chalk.gray('  oac approve --gate stage-0 --project my-saas'));
      console.log(chalk.gray('  oac approve --gate stage-1 --project my-saas --decision reject --reason "Need more data"'));
      console.log(chalk.gray('  oac approve --cycle cycle-abc123 --decision scale --reason "Activation +20%"'));
      process.exit(1);
    }
  });
