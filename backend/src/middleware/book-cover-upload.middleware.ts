import { randomUUID } from "node:crypto";
import { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "node:path";
import { ApiError } from "./error.middleware";
import {
  coverUploadUrlPrefix,
  coversDirectory,
  ensureCoverDirectory,
} from "../utils/book-cover-storage";

const extensionByMimeType: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      void ensureCoverDirectory().then(
        () => callback(null, coversDirectory),
        (error: Error) => callback(error, coversDirectory)
      );
    },
    filename: (_req, file, callback) => {
      const extension = extensionByMimeType[file.mimetype];
      callback(null, `book-${Date.now()}-${randomUUID()}${extension}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const expectedExtension = extensionByMimeType[file.mimetype];
    const validJpegExtension =
      file.mimetype === "image/jpeg" && [".jpg", ".jpeg"].includes(extension);
    const validOtherExtension = expectedExtension === extension;

    if (!expectedExtension || (!validJpegExtension && !validOtherExtension)) {
      callback(
        new ApiError(
          400,
          "Cover must be a JPG, JPEG, PNG, or WebP image with a matching file type."
        )
      );
      return;
    }

    callback(null, true);
  },
});

export function uploadBookCover(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  upload.single("cover")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(new ApiError(413, "Cover image must be 2 MB or smaller."));
      return;
    }
    if (error instanceof multer.MulterError) {
      next(
        new ApiError(
          400,
          error.code === "LIMIT_UNEXPECTED_FILE"
            ? "Upload one cover image using the 'cover' file field."
            : "The cover image upload could not be accepted."
        )
      );
      return;
    }
    next(error);
  });
}

export function getUploadedCoverUrl(req: Request): string | null {
  return req.file ? `${coverUploadUrlPrefix}${req.file.filename}` : null;
}
