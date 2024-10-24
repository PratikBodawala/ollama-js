'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const browser = require('./shared/ollama.a893dbf5.cjs');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
require('node-fetch');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const fs__default = /*#__PURE__*/_interopDefaultCompat(fs);

class Ollama extends browser.Ollama {
  async encodeImage(image) {
    if (typeof image !== "string") {
      return Buffer.from(image).toString("base64");
    }
    try {
      if (fs__default.existsSync(image)) {
        const fileBuffer = await fs.promises.readFile(path.resolve(image));
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
      return path.join(os.homedir(), inputPath.slice(1));
    }
    return path.resolve(mfDir, inputPath);
  }
  /**
   * checks if a file exists
   * @param path {string} - The path to the file
   * @private @internal
   * @returns {Promise<boolean>} - Whether the file exists or not
   */
  async fileExists(path) {
    try {
      await fs.promises.access(path);
      return true;
    } catch {
      return false;
    }
  }
  async createBlob(path) {
    if (typeof ReadableStream === "undefined") {
      throw new Error("Streaming uploads are not supported in this environment.");
    }
    const fileStream = fs.createReadStream(path);
    const sha256sum = await new Promise((resolve2, reject) => {
      const hash = crypto.createHash("sha256");
      fileStream.on("data", (data) => hash.update(data));
      fileStream.on("end", () => resolve2(hash.digest("hex")));
      fileStream.on("error", reject);
    });
    const digest = `sha256:${sha256sum}`;
    try {
      await browser.head(this.fetch, `${this.config.host}/api/blobs/${digest}`);
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
        await browser.post(
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
      modelfileContent = await fs.promises.readFile(request.path, { encoding: "utf8" });
      modelfileContent = await this.parseModelfile(
        modelfileContent,
        path.dirname(request.path)
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

exports.Ollama = Ollama;
exports.default = index;
