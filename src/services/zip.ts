import archiver from "archiver";
import { createWriteStream } from "fs";
import * as fs from "fs-extra";
import * as path from "path";
import { getTmpDir } from "../utils/tmpDir.js";

export class ZipService {
  private readonly tmpDir: string;

  constructor(overrideTmpDir?: string) {
    this.tmpDir = overrideTmpDir ?? getTmpDir();
  }

  /**
   * Zips the contents of the given directory and stores the archive
   * in the temp/teambeamjs directory with a unique name.
   * @param dirPath Path to the directory to zip
   * @returns The full path to the created zip file
   */
  async zipDirectory(dirPath: string): Promise<string> {
    await fs.ensureDir(this.tmpDir);

    const dirName = path.basename(dirPath);
    let zipPath = path.join(this.tmpDir, `${dirName}.zip`);

    // Handle filename collisions
    let counter = 1;
    while (await fs.pathExists(zipPath)) {
      zipPath = path.join(this.tmpDir, `${dirName}_${counter++}.zip`);
    }

    try {
      await this.createZip(dirPath, zipPath);
      return zipPath;
    } catch (error) {
      // Clean up if creation fails
      await fs.remove(zipPath).catch(() => {});
      throw new Error(`Failed to create zip: ${(error as Error).message}`);
    }
  }

  protected async createZip(sourceDir: string, outPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = createWriteStream(outPath);
      const archive = archiver("zip", { zlib: { level: 0 } }); // No compression

      output.on("close", () => resolve());
      output.on("error", (err) => reject(err));
      archive.on("error", (err) => reject(err));

      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
    });
  }
}
