import chalk from 'chalk';

export class Loader {
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private interval?: ReturnType<typeof setInterval>;
  private message = '';
  private frameIdx = 0;

  start(message: string): void {
    this.message = message;
    this.frameIdx = 0;
    process.stdout.write('\x1B[?25l'); // hide cursor
    this.interval = setInterval(() => {
      const frame = chalk.cyan(this.frames[this.frameIdx % this.frames.length] ?? '⠋');
      process.stdout.write(`\r${frame} ${this.message}`);
      this.frameIdx++;
    }, 80);
  }

  stop(success?: boolean): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
    const icon = success === false ? chalk.red('✗') : chalk.green('✓');
    process.stdout.write(`\r${icon} ${this.message}\n`);
    process.stdout.write('\x1B[?25h'); // show cursor
  }

  update(message: string): void {
    this.message = message;
  }
}
