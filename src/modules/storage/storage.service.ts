import { Injectable } from '@nestjs/common';
import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';
import path from 'path';

@Injectable()
export class StorageService {
  async uploadFile(file: Express.Multer.File) {
    const directory = 'teacher_request_files';

    const safeOriginalName = path
      .basename(file.originalname)
      .replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${randomUUID()}-${safeOriginalName}`;
    return await put(`${directory}/${fileName}`, file.buffer, {
      access: 'public',
    });
  }
}
