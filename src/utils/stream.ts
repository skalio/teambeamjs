import { Writable } from "stream";

export function streamPromise(stream: Writable) : Promise<void> {
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
