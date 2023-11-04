import * as fs from 'node:fs/promises';
import { dirname } from 'node:path';

const exists = async (filepath: string) => {
  try {
    await fs.access(filepath);
    return true;
  } catch (_e: unknown) {
    return false;
  }
};

const move = async (oldFilepath: string, newFilepath: string) => {
  try {
    await fs.mkdir(dirname(newFilepath), { recursive: true });
    await fs.rename(oldFilepath, newFilepath);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'EXDEV') {
      const stat = await fs.stat(oldFilepath);
      await fs.copyFile(oldFilepath, newFilepath);
      await fs.utimes(newFilepath, stat.atime, stat.mtime);
      await fs.unlink(oldFilepath);
    } else {
      throw error;
    }
  }
};

const identical = async (filepath1: string, filepath2: string, bufferSize = 64 * 1024): Promise<boolean> => {
  const [stat1, stat2] = await Promise.all([fs.stat(filepath1), fs.stat(filepath2)]);
  if (stat1.size !== stat2.size) {
    return false;
  }

  const buffer1 = Buffer.alloc(bufferSize);
  const buffer2 = Buffer.alloc(bufferSize);

  const [fh1, fh2] = await Promise.all([fs.open(filepath1), fs.open(filepath2)]);
  try {
    for (;;) {
      const [res1, res2] = await Promise.all([fh1.read(buffer1, 0, bufferSize), fh2.read(buffer2, 0, bufferSize)]);

      if (res1.bytesRead !== res2.bytesRead || Buffer.compare(res1.buffer, res2.buffer) !== 0) {
        return false;
      }

      if (res1.bytesRead === null || res1.bytesRead < bufferSize) {
        return true;
      }
    }
  } finally {
    await Promise.all([fh1.close(), fh2.close()]);
  }
};

export const File = {
  exists,
  move,
  identical,
};
