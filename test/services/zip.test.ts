import * as fs from 'fs-extra';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ZipService } from '../../src/services/zip.js';
import { getTmpDir } from '../../src/utils/tmpDir.js';

const TEST_DIR = path.join(getTmpDir(), 'zip-service-test');

class TestZipService extends ZipService {
  protected override async createZip(_source: string, _target: string): Promise<void> {
    // just create an empty file to simulate success
    await fs.ensureFile(_target);
  }
}

beforeEach(async () => {
  await fs.ensureDir(TEST_DIR);
});

afterEach(async () => {
  await fs.remove(TEST_DIR);
});

describe('ZipService.zipDirectory', () => {
  it('creates a zip file in temp dir', async () => {
    const testDir = path.join(TEST_DIR, 'my-folder');
    await fs.ensureDir(testDir);

    const service = new TestZipService();
    const zipPath = await service.zipDirectory(testDir);

    expect(zipPath).toMatch(/my-folder\.zip$/);
    expect(await fs.pathExists(zipPath)).toBe(true);
  });

  it('increments filename on collision', async () => {
    const testDir = path.join(TEST_DIR, 'dupe');
    await fs.ensureDir(testDir);

    const service = new TestZipService();
    const zip1 = await service.zipDirectory(testDir);
    const zip2 = await service.zipDirectory(testDir);

    expect(zip1).toMatch(/dupe\.zip$/);
    expect(zip2).toMatch(/dupe_1\.zip$/);
    expect(zip1).not.toBe(zip2);
  });

  it('cleans up if createZip throws', async () => {
    class FailingService extends ZipService {
      protected override async createZip(): Promise<void> {
        throw new Error('zip failed');
      }
    }

    const testDir = path.join(TEST_DIR, 'fail');
    await fs.ensureDir(testDir);

    const service = new FailingService();

    await expect(service.zipDirectory(testDir)).rejects.toThrow('Failed to create zip');

    const leftoverFiles = await fs.readdir(getTmpDir());
    const hasZip = leftoverFiles.some((f) => f.includes('fail'));
    expect(hasZip).toBe(false);
  });
});