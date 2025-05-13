import ora from "ora";
import delay from "./delay.js"; // adjust import path as needed
import { logTime } from "./output.js"; // adjust import path as needed

/**
 * Runs the given function either once or repeatedly based on the interval.
 * @param interval Interval in seconds. If undefined, runs only once.
 * @param fn The async function to execute.
 */
export async function runWithOptionalInterval(
  interval: number | undefined,
  fn: () => Promise<void>
): Promise<void> {
  const watch = interval !== undefined;

  do {
    if (watch) {
      logTime();
    }

    await fn();

    if (watch) {
      const spinner = ora(`Next run in ${interval}s...`).start();
      await delay(interval!);
      spinner.stop();
    }
  } while (watch);
}