import { Injectable } from '@nestjs/common';
import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';
import path from 'path';

@Injectable()
export class StorageService {
  private readonly defaultDirectory = 'teacher_request_files';

  async uploadFile(
    file: Express.Multer.File,
    directory: string = this.defaultDirectory,
  ): Promise<{ url: string }> {
    const safeOriginalName = path
      .basename(file.originalname)
      .replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${randomUUID()}-${safeOriginalName}`;

    const result = await put(`${directory}/${fileName}`, file.buffer, {
      access: 'public',
    });

    return { url: result.url };
  }
}
