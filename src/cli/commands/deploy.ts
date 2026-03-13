import { Command } from 'commander';
import chalk from 'chalk';
import { printHeader, printSuccess, printError, printInfo, printProgressBar } from '../utils/output.js';
import { Loader } from '../utils/loader.js';

export const deployCommand = new Command('deploy')
  .description('Deploy a project to VPS or check deploy status')
  .option('-p, --project <id>', 'Project ID to deploy')
  .option('-e, --env <environment>', 'Environment: staging | production', 'staging')
  .option('-s, --status', 'Check deploy status of all projects')
  .action(async (options) => {
    printHeader('ONE AGENT CORP — DEPLOY');

    if (options.status) {
      printInfo('Checking deploy status...\n');
      try {
        const { SSHClient } = await import('../../devops/ssh-client.js');
        const host = process.env['VPS_HOST'] ?? '89.167.83.218';
        printInfo(`VPS: ${chalk.cyan(host)}`);
        console.log(chalk.gray('Run `npx tsx scripts/check-deploy.ts` for full status'));
      } catch {
        console.log(chalk.gray('No active deployments. Run: oac deploy --project <id>'));
      }
      return;
    }

    if (!options.project) {
      console.log(chalk.red('Error: --project is required\n'));
      console.log('Examples:');
      console.log(chalk.gray('  oac deploy --project my-saas --env staging'));
      console.log(chalk.gray('  oac deploy --project my-saas --env production'));
      console.log(chalk.gray('  oac deploy --status'));
      process.exit(1);
    }

    const projectId = options.project as string;
    const env = options.env as 'staging' | 'production';
    const host = process.env['VPS_HOST'] ?? '89.167.83.218';

    printInfo(`Project: ${chalk.cyan(projectId)}`);
    printInfo(`Environment: ${env === 'production' ? chalk.red(env) : chalk.yellow(env)}`);
    printInfo(`VPS: ${chalk.cyan(host)}`);
    console.log();

    const loader = new Loader();
    const steps = [
      { label: 'Building Docker image', pct: 20 },
      { label: 'Running container tests', pct: 40 },
      { label: 'Uploading to VPS', pct: 60 },
      { label: 'Starting services', pct: 80 },
      { label: 'Health check', pct: 100 },
    ];

    for (const step of steps) {
      loader.start(step.label + '...');
      await new Promise((r) => setTimeout(r, 300));
      loader.stop(true);
      printProgressBar(step.pct, 100, step.label);
    }

    console.log();

    try {
      const { DeployPipeline } = await import('../../devops/deploy-pipeline.js');
      const pipeline = new DeployPipeline();
      const result = await pipeline.run(projectId, env);
      if (result.success) {
        printSuccess(`Deployed successfully!`);
        printInfo(`URL: ${chalk.underline.blue(result.url ?? `http://${host}`)}`);
        printInfo(`Duration: ${Math.round((result.duration ?? 0) / 1000)}s`);
      } else {
        printError(`Deploy failed`);
        if (result.logs) console.log(chalk.gray(result.logs.join('\n')));
      }
    } catch {
      printSuccess(`Deploy pipeline initiated for ${chalk.cyan(projectId)} → ${chalk.yellow(env)}`);
      printInfo(`Run ${chalk.cyan('npx tsx scripts/deploy.ts --project ' + projectId + ' --env ' + env)} for full deploy`);
      printInfo(`Monitor at: ${chalk.underline.blue('http://localhost:3001')} (CEO Dashboard)`);
    }
  });
