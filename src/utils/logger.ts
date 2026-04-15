import chalk from "chalk";
import ora, { Ora } from "ora";

const PREFIX = chalk.hex("#a855f7").bold("⚡ mage");

export function info(message: string): void {
  console.log(`${PREFIX} ${chalk.white(message)}`);
}

export function success(message: string): void {
  console.log(`${PREFIX} ${chalk.green("✔")} ${chalk.white(message)}`);
}

export function warn(message: string): void {
  console.log(`${PREFIX} ${chalk.yellow("⚠")} ${chalk.yellow(message)}`);
}

export function error(message: string): void {
  console.log(`${PREFIX} ${chalk.red("✖")} ${chalk.red(message)}`);
}

export function dim(message: string): void {
  console.log(`${PREFIX} ${chalk.dim(message)}`);
}

export function header(message: string): void {
  console.log();
  console.log(`${PREFIX} ${chalk.hex("#a855f7").bold(message)}`);
  console.log(chalk.dim("─".repeat(50)));
}

export function keyValue(key: string, value: string): void {
  console.log(`  ${chalk.dim(key + ":")} ${chalk.white(value)}`);
}

export function spinner(message: string): Ora {
  return ora({
    text: `${message}`,
    prefixText: PREFIX,
    color: "magenta",
  }).start();
}
