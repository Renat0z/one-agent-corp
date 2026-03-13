#!/usr/bin/env -S npx tsx
import { Command } from 'commander';
import { statusCommand } from '../src/cli/commands/status.js';
import { launchCommand } from '../src/cli/commands/launch.js';
import { approveCommand } from '../src/cli/commands/approve.js';
import { deployCommand } from '../src/cli/commands/deploy.js';
import { cycleCommand } from '../src/cli/commands/cycle.js';
import { boardCommand } from '../src/cli/commands/board.js';

const program = new Command();

program
  .name('oac')
  .description('One Agent Corp — Virtual micro-SaaS factory CLI')
  .version('1.0.0')
  .addHelpText('after', `
Examples:
  $ oac board                          CEO dashboard
  $ oac status                         All departments + projects
  $ oac launch --project "TaskFlow" --description "Task manager"
  $ oac approve --gate stage-0 --project taskflow
  $ oac cycle create --project taskflow --hypothesis "..."
  $ oac deploy --project taskflow --env production
`);

program.addCommand(statusCommand);
program.addCommand(launchCommand);
program.addCommand(approveCommand);
program.addCommand(deployCommand);
program.addCommand(cycleCommand);
program.addCommand(boardCommand);

program.parse(process.argv);
