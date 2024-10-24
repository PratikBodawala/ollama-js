import { O as Ollama$1, h as head, p as post } from './shared/ollama.44cb24a8.mjs';
import fs, { promises, createReadStream } from 'fs';
import { resolve, join, dirname } from 'path';
import { createHash } from 'crypto';
import { homedir } from 'os';
import 'node-fetch';

class Ollama extends Ollama$1 {
  async encodeImage(image) {
    if (typeof image !== "string") {
      return Buffer.from(image).toString("base64");
    }
    try {
      if (fs.existsSync(image)) {
        const fileBuffer = await promises.readFile(resolve(image));
        return Buffer.from(fileBuffer).toString("base64");
      }
    } catch {
    }
    return image;
  }
  /**
   * Parse the modelfile and replace the FROM and ADAPTER commands with the corresponding blob hashes.
   * @param modelfile {string} - The modelfile content
   * @param mfDir {string} - The directory of the modelfile
   * @private @internal
   */
  async parseModelfile(modelfile, mfDir = process.cwd()) {
    const out = [];
    const lines = modelfile.split("\n");
    for (const line of lines) {
      const [command, args] = line.split(" ", 2);
      if (["FROM", "ADAPTER"].includes(command.toUpperCase())) {
        const path = this.resolvePath(args.trim(), mfDir);
        if (await this.fileExists(path)) {
          out.push(`${command} @${await this.createBlob(path)}`);
        } else {
          out.push(`${command} ${args}`);
        }
      } else {
        out.push(line);
      }
    }
    return out.join("\n");
  }
  /**
   * Resolve the path to an absolute path.
   * @param inputPath {string} - The input path
   * @param mfDir {string} - The directory of the modelfile
   * @private @internal
   */
  resolvePath(inputPath, mfDir) {
    if (inputPath.startsWith("~")) {
      return join(homedir(), inputPath.slice(1));
    }
    return resolve(mfDir, inputPath);
  }
  /**
   * checks if a file exists
   * @param path {string} - The path to the file
   * @private @internal
   * @returns {Promise<boolean>} - Whether the file exists or not
   */
  async fileExists(path) {
    try {
      await promises.access(path);
      return true;
    } catch {
      return false;
    }
  }
  async createBlob(path) {
    if (typeof ReadableStream === "undefined") {
      throw new Error("Streaming uploads are not supported in this environment.");
    }
    const fileStream = createReadStream(path);
    const sha256sum = await new Promise((resolve2, reject) => {
      const hash = createHash("sha256");
      fileStream.on("data", (data) => hash.update(data));
      fileStream.on("end", () => resolve2(hash.digest("hex")));
      fileStream.on("error", reject);
    });
    const digest = `sha256:${sha256sum}`;
    try {
      await head(this.fetch, `${this.config.host}/api/blobs/${digest}`);
    } catch (e) {
      if (e instanceof Error && e.message.includes("404")) {
        const readableStream = new ReadableStream({
          start(controller) {
            fileStream.on("data", (chunk) => {
              controller.enqueue(chunk);
            });
            fileStream.on("end", () => {
              controller.close();
            });
            fileStream.on("error", (err) => {
              controller.error(err);
            });
          }
        });
        await post(
          this.fetch,
          `${this.config.host}/api/blobs/${digest}`,
          readableStream
        );
      } else {
        throw e;
      }
    }
    return digest;
  }
  async create(request) {
    let modelfileContent = "";
    if (request.path) {
      modelfileContent = await promises.readFile(request.path, { encoding: "utf8" });
      modelfileContent = await this.parseModelfile(
        modelfileContent,
        dirname(request.path)
      );
    } else if (request.modelfile) {
      modelfileContent = await this.parseModelfile(request.modelfile);
    } else {
      throw new Error("Must provide either path or modelfile to create a model");
    }
    request.modelfile = modelfileContent;
    if (request.stream) {
      return super.create(request);
    } else {
      return super.create(request);
    }
  }
}
const index = new Ollama();

export { Ollama, index as default };
