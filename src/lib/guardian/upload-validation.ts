/**
 * File upload validation utility.
 * Validates file type and size before uploading to Supabase Storage.
 */

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
    "application/pdf": [".pdf"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
};

const ALLOWED_EXTENSIONS = Object.values(ALLOWED_MIME_TYPES).flat();

export interface UploadValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * Validates a file before upload.
 * Checks both MIME type and file extension, plus file size.
 */
export function validateUploadFile(file: File): UploadValidationResult {
    // Check file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        return {
            valid: false,
            error: `File is too large (${sizeMB}MB). Maximum allowed size is 10MB.`,
        };
    }

    // Check file size is not zero
    if (file.size === 0) {
        return {
            valid: false,
            error: "File is empty. Please select a valid file.",
        };
    }

    // Check MIME type
    if (!Object.keys(ALLOWED_MIME_TYPES).includes(file.type)) {
        return {
            valid: false,
            error: `File type "${file.type || "unknown"}" is not allowed. Accepted types: PDF, JPG, PNG, DOC, DOCX.`,
        };
    }

    // Check file extension matches MIME type
    const fileName = file.name.toLowerCase();
    const extension = "." + fileName.split(".").pop();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
        return {
            valid: false,
            error: `File extension "${extension}" is not allowed. Accepted: ${ALLOWED_EXTENSIONS.join(", ")}.`,
        };
    }

    // Verify extension matches MIME type (prevent disguised files)
    const expectedExtensions = ALLOWED_MIME_TYPES[file.type];
    if (expectedExtensions && !expectedExtensions.includes(extension)) {
        return {
            valid: false,
            error: `File extension "${extension}" does not match its content type. Please upload a valid file.`,
        };
    }

    return { valid: true };
}
