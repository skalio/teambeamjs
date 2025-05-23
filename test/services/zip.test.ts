import * as fs from "fs-extra";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ZipService } from "../../src/services/zip.js";

const BASE_TEST_DIR = path.join(os.tmpdir(), "zip-service-isolated-tests");

class TestZipService extends ZipService {
  protected override async createZip(
    _source: string,
    _target: string
  ): Promise<void> {
    await fs.ensureFile(_target);
  }
}

describe("ZipService.zipDirectory", () => {
  let tmpDir: string;
  let inputDir: string;
  let outputDir: string;

  beforeEach(async () => {
    tmpDir = path.join(BASE_TEST_DIR, Date.now().toString());
    inputDir = path.join(tmpDir, "input");
    outputDir = path.join(tmpDir, "output");

    await fs.ensureDir(inputDir);
    await fs.ensureDir(outputDir);
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it("creates a zip file in temp dir", async () => {
    const service = new TestZipService(outputDir);
    const zipPath = await service.zipDirectory(inputDir);

    expect(path.basename(zipPath)).toBe("input.zip");
    expect(await fs.pathExists(zipPath)).toBe(true);
  });

  it("increments filename on collision", async () => {
    const service = new TestZipService(outputDir);
    const zip1 = await service.zipDirectory(inputDir);
    const zip2 = await service.zipDirectory(inputDir);

    expect(path.basename(zip1)).toBe("input.zip");
    expect(path.basename(zip2)).toBe("input_1.zip");
    expect(zip1).not.toBe(zip2);
  });

  it("cleans up if createZip throws", async () => {
    class FailingService extends ZipService {
      protected override async createZip(
        _source: string,
        target: string
      ): Promise<void> {
        await fs.ensureFile(target);
        throw new Error("zip failed");
      }
    }

    const service = new FailingService(outputDir);

    await expect(service.zipDirectory(inputDir)).rejects.toThrow(Error);

    const leftover = await fs.readdir(outputDir);
    expect(leftover).toEqual([]);
  });
});
