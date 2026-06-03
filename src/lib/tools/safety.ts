/**
 * Shared safety + error-handling helpers for the 90+ browser-based tools at
 * /tools/*. Centralises:
 *
 * - data: URL → bytes conversion that works in every browser (don't use
 *   `fetch(dataUrl)` — Safari + strict CSP can refuse it, producing the
 *   infamous "Failed to fetch" with no stack trace)
 * - file reader + image loader wrappers that always reject on error
 *   (raw FileReader silently hangs if `onerror` isn't wired)
 * - explicit file-size / MIME validation so a 100MB PNG doesn't OOM the tab
 * - friendlyError() turns raw exceptions into copy that a non-developer
 *   user actually understands
 *
 * Every tool that handles user-provided files should run inputs through
 * `validateImageFile()` or `validateFile()` before processing, and surface
 * caught errors via `friendlyError()`.
 */

// ── Limits (revisit per-tool if a specific tool genuinely needs more) ─

export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;     // 25 MB
export const MAX_FILE_BYTES = 100 * 1024 * 1024;     // 100 MB (PDFs, archives, audio)
export const MAX_BATCH_FILES = 50;                   // never let users queue more than this

// ── Data URL handling ─────────────────────────────────────────────────

/**
 * Decode a `data:` URL to a Uint8Array. Replaces the `fetch(dataUrl)` +
 * `.arrayBuffer()` pattern, which is blocked by some browsers' CSP and
 * fails intermittently in Safari.
 *
 * Throws with an actionable message if the URL isn't a valid data URL.
 */
export function dataUrlToBytes(dataUrl: string): Uint8Array {
    if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
        throw new Error("Not a data URL");
    }

    const commaIdx = dataUrl.indexOf(",");
    if (commaIdx === -1) {
        throw new Error("Malformed data URL — missing comma separator");
    }

    const header = dataUrl.slice(0, commaIdx);
    const payload = dataUrl.slice(commaIdx + 1);

    if (header.includes(";base64")) {
        // atob is widely supported; we wrap to convert binary string to bytes
        const binary = atob(payload);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
    }

    // URL-encoded payload (rare for binary data but valid per RFC 2397)
    const decoded = decodeURIComponent(payload);
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
    return bytes;
}

// ── File validation ───────────────────────────────────────────────────

export class ToolInputError extends Error {
    constructor(message: string, public readonly userFacing: string = message) {
        super(message);
        this.name = "ToolInputError";
    }
}

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|bmp|avif|heic|heif|svg)$/i;

export function validateImageFile(file: File, maxBytes = MAX_IMAGE_BYTES): void {
    if (!file) throw new ToolInputError("No file provided");
    if (file.size === 0) {
        throw new ToolInputError(`${file.name} is empty`, "That file is empty. Please choose a different image.");
    }
    if (file.size > maxBytes) {
        const mb = Math.round(file.size / (1024 * 1024));
        const maxMb = Math.round(maxBytes / (1024 * 1024));
        throw new ToolInputError(
            `${file.name} is ${mb}MB (max ${maxMb}MB)`,
            `That image is too big (${mb}MB). Please use one under ${maxMb}MB.`
        );
    }
    const looksLikeImage = file.type.startsWith("image/") || IMAGE_EXTENSIONS.test(file.name);
    if (!looksLikeImage) {
        throw new ToolInputError(
            `${file.name} is not an image (${file.type || "no type"})`,
            "That doesn't look like an image. Try a JPG, PNG, or WebP file."
        );
    }
}

export function validateFile(file: File, maxBytes = MAX_FILE_BYTES): void {
    if (!file) throw new ToolInputError("No file provided");
    if (file.size === 0) {
        throw new ToolInputError(`${file.name} is empty`, "That file is empty. Please choose a different one.");
    }
    if (file.size > maxBytes) {
        const mb = Math.round(file.size / (1024 * 1024));
        const maxMb = Math.round(maxBytes / (1024 * 1024));
        throw new ToolInputError(
            `${file.name} is ${mb}MB (max ${maxMb}MB)`,
            `That file is too big (${mb}MB). The limit is ${maxMb}MB.`
        );
    }
}

// ── Reader + loader wrappers ──────────────────────────────────────────

/** Read a file as a base64 data URL with proper error rejection. */
export function readAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result !== "string") {
                reject(new Error("FileReader produced non-string result"));
                return;
            }
            resolve(result);
        };
        reader.onerror = () => reject(reader.error ?? new Error("FileReader failed"));
        reader.onabort = () => reject(new Error("File read aborted"));
        try {
            reader.readAsDataURL(file);
        } catch (e) {
            reject(e);
        }
    });
}

/** Read a file as an ArrayBuffer with proper error rejection. */
export function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (!(result instanceof ArrayBuffer)) {
                reject(new Error("FileReader produced non-buffer result"));
                return;
            }
            resolve(result);
        };
        reader.onerror = () => reject(reader.error ?? new Error("FileReader failed"));
        reader.onabort = () => reject(new Error("File read aborted"));
        try {
            reader.readAsArrayBuffer(file);
        } catch (e) {
            reject(e);
        }
    });
}

/** Read a file as text (UTF-8 default) with proper error rejection. */
export function readAsText(file: File, encoding = "utf-8"): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result !== "string") {
                reject(new Error("FileReader produced non-string result"));
                return;
            }
            resolve(result);
        };
        reader.onerror = () => reject(reader.error ?? new Error("FileReader failed"));
        reader.onabort = () => reject(new Error("File read aborted"));
        try {
            reader.readAsText(file, encoding);
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * Load an HTMLImageElement from a data URL or blob URL with proper error
 * handling. Returns the image element once it has `naturalWidth > 0`.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                reject(new Error("Image loaded with zero dimensions — file may be corrupted"));
                return;
            }
            resolve(img);
        };
        img.onerror = () => reject(new Error("Image failed to load — file may be corrupted or unsupported"));
        img.src = src;
    });
}

// ── Friendly error formatter ──────────────────────────────────────────

/**
 * Turn any caught exception into a one-line message a non-developer user
 * can act on. Logs the raw error to the console for ourselves.
 */
export function friendlyError(e: unknown, fallback = "Something went wrong. Please try again."): string {
    console.error("[tool] error:", e);

    if (e instanceof ToolInputError) return e.userFacing;

    if (e instanceof Error) {
        const msg = e.message || "";
        // Common patterns we can translate
        if (/Failed to fetch|NetworkError|net::ERR/.test(msg)) {
            return "Couldn't process that file. Try a different image, or refresh the page and try again.";
        }
        if (/out of memory|maximum call stack|QuotaExceeded/i.test(msg)) {
            return "Browser ran out of memory. Try a smaller file, or refresh and start over.";
        }
        if (/aborted|cancelled/i.test(msg)) {
            return "Operation was cancelled.";
        }
        // Trim very long messages — tool errors are usually short
        if (msg.length < 200) return msg;
    }

    return fallback;
}
