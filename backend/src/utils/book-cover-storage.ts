import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { appRoot } from "../config/app-root";

export const uploadsDirectory = path.join(appRoot, "uploads");
export const coversDirectory = path.join(uploadsDirectory, "covers");
export const coverUploadUrlPrefix = "/uploads/covers/";

export async function ensureCoverDirectory(): Promise<void> {
  await mkdir(coversDirectory, { recursive: true });
}

export async function removeLocalCover(coverUrl: string | null | undefined): Promise<void> {
  if (!coverUrl?.startsWith(coverUploadUrlPrefix)) return;

  const fileName = coverUrl.slice(coverUploadUrlPrefix.length);
  if (
    !/^book-\d+-[a-f0-9-]+\.(jpg|png|webp)$/i.test(fileName) ||
    path.basename(fileName) !== fileName
  ) {
    return;
  }

  const filePath = path.resolve(coversDirectory, fileName);
  if (path.dirname(filePath) !== coversDirectory) return;

  try {
    await unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
