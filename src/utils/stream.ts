import { WriteStream } from "fs";

export function streamPromise(stream: WriteStream) : Promise<void> {
  return new Promise((resolve, reject) => {
    stream.on("end", () => {
      resolve();
    });
    stream.on("finish", () => {
      resolve();
    });
    stream.on("error", (error) => {
      reject(error);
    });
  });
}
