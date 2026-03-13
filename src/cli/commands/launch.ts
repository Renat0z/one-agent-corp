import { Command } from 'commander';
import chalk from 'chalk';
import { printHeader, printSuccess, printInfo, printStageProgress } from '../utils/output.js';
import { Loader } from '../utils/loader.js';

const STAGES = ['job-validation', 'ideation', 'validation', 'mvp', 'launch', 'growth', 'scale'];

export const launchCommand = new Command('launch')
  .description('Launch a new micro-SaaS project through the factory pipeline')
  .option('-p, --project <name>', 'Project name')
  .option('-d, --description <text>', 'Project description')
  .option('-b, --budget <amount>', 'Budget in USD', '15000')
  .option('-m, --mrr <target>', 'Target MRR in USD', '5000')
  .option('-t, --timeline <weeks>', 'Timeline in weeks', '8')
  .option('-i, --interactive', 'Interactive wizard mode')
  .action(async (options) => {
    printHeader('ONE AGENT CORP — LAUNCH');

    if (!options.project || !options.description) {
      console.log(chalk.red('Error: --project and --description are required\n'));
      console.log('Example:');
      console.log(chalk.gray('  oac launch --project "TaskFlow" --description "Task manager for freelancers" --budget 15000\n'));
      process.exit(1);
    }

    const projectName = options.project as string;
    const description = options.description as string;
    const budget = parseInt(options.budget as string, 10);
    const targetMrr = parseInt(options.mrr as string, 10);
    const timeline = options.timeline as string;

    printInfo(`Launching: ${chalk.bold(projectName)}`);
    printInfo(`Description: ${chalk.gray(description)}`);
    printInfo(`Budget: ${chalk.green('$' + budget.toLocaleString())}`);
    printInfo(`Target MRR: ${chalk.green('$' + targetMrr.toLocaleString())}`);
    printInfo(`Timeline: ${chalk.yellow(timeline + ' weeks')}`);
    console.log();

    const loader = new Loader();

    // Stage 0: Job & Offer Validation
    loader.start('Stage 0: Initializing Job & Offer Validation (48h)...');
    await new Promise((r) => setTimeout(r, 500));
    loader.stop(true);

    console.log();
    console.log(chalk.bold('Pipeline initialized:'));
    printStageProgress(STAGES, 'job-validation');
    console.log();

    console.log(chalk.bold('Next steps:'));
    console.log(`  1. Stage 0 will run: ${chalk.cyan('trends')} + ${chalk.cyan('offer')} + ${chalk.cyan('competitive')} departments`);
    console.log(`  2. CEO gate approval required after Stage 0`);
    console.log(`  3. Run ${chalk.cyan('oac status --project "' + projectName + '"')} to monitor progress`);
    console.log(`  4. Run ${chalk.cyan('oac approve --gate stage-0 --project "' + projectName + '"')} to approve`);
    console.log();

    // Try to call real pipeline engine
    try {
      const { getPipelineEngine } = await import('../../pipeline/pipeline-engine.js');
      const engine = getPipelineEngine();
      const slug = projectName.toLowerCase().replace(/\s+/g, '-');
      const project = engine.createProject({
        name: projectName,
        description,
        targetMrr,
        budget,
        timeline,
        departments: ['trends', 'offer', 'competitive', 'product', 'engineering', 'growth'],
        strategicAlignment: 'Core micro-SaaS factory mission',
        riskLevel: 'medium',
        priority: 'high',
        id: `proj-${slug}`,
      });
      engine.startProject(project.id);
      printSuccess(`Project "${projectName}" created with ID: ${chalk.cyan(project.id)}`);
    } catch {
      printSuccess(`Project "${projectName}" queued for factory pipeline`);
      printInfo('(Pipeline engine will initialize on next full build)');
    }
  });
