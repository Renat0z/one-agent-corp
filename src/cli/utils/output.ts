import chalk from 'chalk';

export function printHeader(title: string): void {
  const line = '━'.repeat(title.length + 8);
  console.log(chalk.bold.blue(`\n${line}`));
  console.log(chalk.bold.blue(`    ${title}    `));
  console.log(chalk.bold.blue(`${line}\n`));
}

export function printSuccess(msg: string): void {
  console.log(chalk.green('✓'), msg);
}

export function printError(msg: string): void {
  console.log(chalk.red('✗'), msg);
}

export function printWarning(msg: string): void {
  console.log(chalk.yellow('⚠'), msg);
}

export function printInfo(msg: string): void {
  console.log(chalk.cyan('ℹ'), msg);
}

export function printTable(headers: string[], rows: string[][]): void {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] ?? '').length)),
  );

  const separator = widths.map((w) => '─'.repeat(w + 2)).join('┼');
  const headerLine = headers
    .map((h, i) => ` ${chalk.bold(h.padEnd(widths[i] ?? 0))} `)
    .join('│');
  const rowLines = rows.map((r) =>
    r.map((cell, i) => ` ${(cell ?? '').padEnd(widths[i] ?? 0)} `).join('│'),
  );

  console.log(`┌${separator.replace(/┼/g, '┬')}┐`);
  console.log(`│${headerLine}│`);
  console.log(`├${separator}┤`);
  rowLines.forEach((line) => console.log(`│${line}│`));
  console.log(`└${separator.replace(/┼/g, '┴')}┘`);
}

export function printProgressBar(current: number, total: number, label: string): void {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  const filled = Math.round((pct / 100) * 20);
  const bar = chalk.blue('█'.repeat(filled)) + chalk.gray('░'.repeat(20 - filled));
  console.log(`${label.padEnd(20)} [${bar}] ${pct}%`);
}

export function printStageProgress(stages: string[], currentStage: string): void {
  const output = stages
    .map((s) => {
      const idx = stages.indexOf(s);
      const curIdx = stages.indexOf(currentStage);
      if (idx < curIdx) return chalk.green(`✓ ${s}`);
      if (idx === curIdx) return chalk.yellow(`→ ${s}`);
      return chalk.gray(`· ${s}`);
    })
    .join('  ');
  console.log(output);
}

export function printDivider(): void {
  console.log(chalk.gray('─'.repeat(60)));
}
