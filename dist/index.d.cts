import { O as Ollama$1, C as CreateRequest, A as AbortableAsyncIterator, P as ProgressResponse } from './shared/ollama.51f6cea9.cjs';
export { d as ChatRequest, j as ChatResponse, a as Config, g as CopyRequest, D as DeleteRequest, E as EmbedRequest, k as EmbedResponse, h as EmbeddingsRequest, l as EmbeddingsResponse, p as ErrorResponse, F as Fetch, G as GenerateRequest, i as GenerateResponse, L as ListResponse, M as Message, n as ModelDetails, m as ModelResponse, b as Options, e as PullRequest, f as PushRequest, S as ShowRequest, o as ShowResponse, q as StatusResponse, c as Tool, T as ToolCall } from './shared/ollama.51f6cea9.cjs';

declare class Ollama extends Ollama$1 {
    encodeImage(image: Uint8Array | Buffer | string): Promise<string>;
    /**
     * Parse the modelfile and replace the FROM and ADAPTER commands with the corresponding blob hashes.
     * @param modelfile {string} - The modelfile content
     * @param mfDir {string} - The directory of the modelfile
     * @private @internal
     */
    private parseModelfile;
    /**
     * Resolve the path to an absolute path.
     * @param inputPath {string} - The input path
     * @param mfDir {string} - The directory of the modelfile
     * @private @internal
     */
    private resolvePath;
    /**
     * checks if a file exists
     * @param path {string} - The path to the file
     * @private @internal
     * @returns {Promise<boolean>} - Whether the file exists or not
     */
    private fileExists;
    private createBlob;
    create(request: CreateRequest & {
        stream: true;
    }): Promise<AbortableAsyncIterator<ProgressResponse>>;
    create(request: CreateRequest & {
        stream?: false;
    }): Promise<ProgressResponse>;
}
declare const _default: Ollama;

export { CreateRequest, Ollama, ProgressResponse, _default as default };
