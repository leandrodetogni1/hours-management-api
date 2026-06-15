export const MAX_ACTIVITY_FILE_SIZE = 5 * 1024 * 1024;

export const ALLOWED_ACTIVITY_FILE_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
] as const;

export const ALLOWED_ACTIVITY_FILE_MIME_TYPE_REGEX =
  /^(application\/pdf|image\/(png|jpeg))$/;

export interface UploadedActivityFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}
