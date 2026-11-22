import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env';

// Whitelist of supported image mimetypes to file extensions
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const uploadsDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer disk storage for local mode / temporary staging
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = ALLOWED_MIME_TYPES[file.mimetype] || '.jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `file-${uniqueSuffix}${ext}`);
  },
});

const multerInstance = multer({
  storage,
  limits: {
    fileSize: config.upload.maxSizeMb * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES[file.mimetype]) {
      cb(null, true);
    } else {
      const err: any = new Error('INVALID_MIME_TYPE');
      err.code = 'INVALID_MIME_TYPE';
      cb(err, false);
    }
  },
});

/**
 * Configure Cloudinary if CLOUDINARY_URL is present in the environment
 */
const isCloudinaryConfigured = (): boolean => {
  return !!process.env.CLOUDINARY_URL;
};

if (isCloudinaryConfigured()) {
  cloudinary.config(); // Automatically parses CLOUDINARY_URL
}

/**
 * Persists an uploaded file either to Cloudinary (in production/when CLOUDINARY_URL is set)
 * or keeps it in local uploads/.
 * Deletes the local temporary file if uploaded to Cloudinary.
 * Returns the final URL to be stored in the database.
 */
export async function saveUploadedFile(file: Express.Multer.File, folder = 'leafpulse'): Promise<string> {
  if (isCloudinaryConfigured()) {
    try {
      const uploadResult = await cloudinary.uploader.upload(file.path, {
        folder,
        resource_type: 'image',
      });
      // Clean up local temp file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return uploadResult.secure_url;
    } catch (cloudErr) {
      console.warn('[STORAGE] Cloudinary upload failed, falling back to local storage path:', cloudErr);
      return `/uploads/${file.filename}`;
    }
  }

  // Local storage mode: return relative path
  return `/uploads/${file.filename}`;
}

/**
 * Safely removes a replaced or deleted file from local disk or Cloudinary
 */
export async function deleteStoredFile(fileUrl?: string | null): Promise<void> {
  if (!fileUrl) return;

  try {
    if (fileUrl.startsWith('/uploads/')) {
      const filename = path.basename(fileUrl);
      const filePath = path.join(uploadsDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } else if (fileUrl.includes('res.cloudinary.com') && isCloudinaryConfigured()) {
      // Extract public ID from Cloudinary URL
      const parts = fileUrl.split('/');
      const filenameWithExt = parts[parts.length - 1];
      const folderName = parts[parts.length - 2];
      const publicId = `${folderName}/${filenameWithExt.split('.')[0]}`;
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (err) {
    console.warn(`[STORAGE] Could not delete old file ${fileUrl}:`, err);
  }
}

/**
 * Express middleware wrapper that intercepts Multer errors
 * and maps them cleanly to HTTP 413 (Payload Too Large) or 400 (Bad Request).
 */
export function createUploadMiddleware(fieldName: string) {
  const uploadSingle = multerInstance.single(fieldName);

  return (req: Request, res: Response, next: NextFunction) => {
    uploadSingle(req, res, (err: any) => {
      if (!err) {
        return next();
      }

      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: `File too large. Maximum allowed size is ${config.upload.maxSizeMb}MB.`,
        });
      }

      if (err.code === 'INVALID_MIME_TYPE' || err.message === 'INVALID_MIME_TYPE') {
        return res.status(400).json({
          success: false,
          message: 'Only .jpg, .jpeg, .png, and .webp image files are allowed.',
        });
      }

      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      }

      return res.status(400).json({
        success: false,
        message: err.message || 'Error processing uploaded file',
      });
    });
  };
}
