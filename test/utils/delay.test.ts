import { describe, expect, it } from "vitest";
import delay from "../../src/utils/delay.js";

describe("delay", () => {
  it("waits at least the given number of seconds", async () => {
    const before = Date.now();
    await delay(1);
    const after = Date.now();
    expect(after - before).toBeGreaterThanOrEqual(1);
  });
});
